import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import { createSeed } from "../src/lib/seed";
import type { AppState, User } from "../src/lib/types";
import { hashPassword, signToken, verifyPassword, verifyToken } from "./crypto";
import { googleOAuthUrl, integrationStatus, sendEmail, stripeCheckout, googleCalendarSync } from "./integrations";
import { mergeState, publicUser, visibleTo } from "./scope";
import { chatReply, designIdea, monthlyNarrative, negotiateDeal, scoutRecommendation, tacticalBriefing, videoNote } from "./ai";
import { chatbotPublicConfig } from "./ai-provider";

const PORT = Number(process.env.PORT || process.env.API_PORT || 8787);
const DB = path.resolve("data/db.json");
const DIST = path.resolve("dist");
const DEMO_IDS = ["u_super", "u_admin", "u_coach", "u_staff", "u_player"];

function ensureDir() {
  fs.mkdirSync(path.dirname(DB), { recursive: true });
}

function hashUsers(state: AppState): AppState {
  return {
    ...state,
    users: state.users.map((u) => {
      if (u.passwordHash?.startsWith("scrypt$")) return { ...u, password: undefined };
      const plain = u.password || "Temp123!";
      return { ...u, passwordHash: hashPassword(plain), password: undefined };
    }),
  };
}

function migrateIdentity(state: AppState): AppState {
  return {
    ...state,
    users: state.users.map((u) =>
      u.id === "u_super" ? { ...u, name: "Bodi Awono", email: "emma.t@example.net", avatar: "BA" } : u,
    ),
    audit: (state.audit || []).map((a) => (a.user === "Amina Ngo" ? { ...a, user: "Bodi Awono" } : a)),
  };
}

function usableDb(state: unknown): state is AppState {
  if (!state || typeof state !== "object") return false;
  const s = state as AppState;
  return Array.isArray(s.users) && Array.isArray(s.clubs);
}

function seedDb(): AppState {
  const seeded = hashUsers(createSeed());
  fs.writeFileSync(DB, JSON.stringify(seeded, null, 2));
  return seeded;
}

/** Restore missing seed/demo accounts on a persisted volume without wiping existing data. */
function ensureDemoUsers(state: AppState): AppState {
  const seeded = createSeed().users;
  const have = new Set(state.users.map((u) => u.id));
  const missing = seeded.filter((u) => !have.has(u.id));
  if (!missing.length) return state;
  return hashUsers({ ...state, users: [...state.users, ...missing] });
}

function loadDb(): AppState {
  ensureDir();
  if (!fs.existsSync(DB)) return seedDb();
  try {
    const raw = JSON.parse(fs.readFileSync(DB, "utf8")) as AppState;
    if (!usableDb(raw) || raw.users.length === 0) return seedDb();
    const migrated = hashUsers(migrateIdentity(raw));
    const next = ensureDemoUsers(migrated);
    if (JSON.stringify(raw) !== JSON.stringify(next)) fs.writeFileSync(DB, JSON.stringify(next, null, 2));
    return next;
  } catch {
    return seedDb();
  }
}

function saveDb(state: AppState) {
  ensureDir();
  fs.writeFileSync(DB, JSON.stringify(state, null, 2));
}

function staffEmails(state: AppState, clubId: string | null) {
  return state.users
    .filter((u) => u.status === "active" && (u.role === "staff" || u.role === "coach" || u.role === "club_admin") && (!clubId || u.clubId === clubId))
    .map((u) => u.email);
}

function runAutomation(state: AppState): AppState {
  let next = { ...state, alerts: [...state.alerts], agentLogs: [...state.agentLogs], audit: [...state.audit] };
  const now = new Date().toISOString();
  for (const p of state.players) {
    if (p.fatigue < 75) continue;
    const recent = next.alerts.some(
      (a) => a.type === "fatigue" && a.playerId === p.id && Date.now() - new Date(a.at).getTime() < 12 * 3600000,
    );
    if (recent) continue;
    next.alerts.unshift({
      id: `al_${Date.now()}_${p.id}`,
      clubId: p.clubId,
      type: "fatigue",
      severity: "critical",
      title: `Alerte fatigue — ${p.name} ${p.fatigue}`,
      body: "Seuil 75 dépassé. Email staff généré.",
      at: now,
      read: false,
      playerId: p.id,
    });
    next.agentLogs.unshift({
      id: `lg_${Date.now()}_${p.id}`,
      agentId: "ag_super",
      action: `Alerte fatigue ${p.name} dispatchée`,
      at: now,
      level: "warn",
    });
    void sendEmail(staffEmails(state, p.clubId), `[Royal Goose] Fatigue ${p.name}`, `${p.name} fatigue ${p.fatigue}. Repos relatif 48h.`);
    const taskTitle = `Plan de charge ${p.name}`;
    if (!next.tasks.some((t) => t.title === taskTitle && t.status !== "done")) {
      next.tasks.unshift({
        id: `tk_fat_${p.id}`,
        clubId: p.clubId,
        title: taskTitle,
        assignee: "Staff médical",
        role: "staff",
        urgent: true,
        status: "open",
        due: now.slice(0, 10),
      });
    }
  }
  for (const c of state.contracts) {
    const days = Math.round((new Date(c.end).getTime() - Date.now()) / 86400000);
    if (days > 30 || days < -1) continue;
    const recent = next.alerts.some((a) => a.type === "contrat" && a.body.includes(c.playerId) && Date.now() - new Date(a.at).getTime() < 24 * 3600000);
    if (recent) continue;
    const player = state.players.find((p) => p.id === c.playerId);
    next.alerts.unshift({
      id: `al_ct_${Date.now()}_${c.id}`,
      clubId: c.clubId,
      type: "contrat",
      severity: "warn",
      title: `Renouvellement J-${Math.max(days, 0)} — ${player?.name || c.playerId}`,
      body: `Contrat ${c.playerId} expire ${c.end}`,
      at: now,
      read: false,
      playerId: c.playerId,
    });
  }
  const month = now.slice(0, 7);
  for (const club of state.clubs) {
    if (next.reports.some((r) => r.clubId === club.id && r.month === month)) continue;
    const roster = state.players.filter((p) => p.clubId === club.id);
    const fatigueAvg = Math.round(roster.reduce((s, p) => s + p.fatigue, 0) / Math.max(roster.length, 1));
    next.reports.unshift({
      id: `rp_auto_${club.id}_${month}`,
      clubId: club.id,
      month,
      sent: false,
      kpis: [
        { label: "Joueurs", value: String(roster.length) },
        { label: "Fatigue moy.", value: String(fatigueAvg) },
      ],
      narrative: `Rapport auto ${month} — ${club.shortName}. Fatigue moyenne ${fatigueAvg}. Prêt à l'envoi staff.`,
    });
    next.alerts.unshift({
      id: `al_rp_${club.id}_${month}`,
      clubId: club.id,
      type: "rapport",
      severity: "info",
      title: `Rapport mensuel ${month} prêt`,
      body: "Génération automatique. Envoi staff en attente.",
      at: now,
      read: false,
    });
  }
  return next;
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "8mb" }));

function auth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const payload = token ? verifyToken(token) : null;
  if (!payload) return res.status(401).json({ error: "Unauthorized" });
  const db = loadDb();
  const user = db.users.find((u) => u.id === payload.sub);
  if (!user || user.status !== "active") return res.status(401).json({ error: "Unauthorized" });
  (req as express.Request & { user: User; db: AppState }).user = user;
  (req as express.Request & { user: User; db: AppState }).db = db;
  next();
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, integrations: integrationStatus() });
});

app.get("/api/integrations", (_req, res) => {
  res.json(integrationStatus());
});

app.get("/api/chatbot/config", (_req, res) => {
  res.json(chatbotPublicConfig());
});

app.get("/api/auth/demo-users", (_req, res) => {
  const db = loadDb();
  const order = new Map(DEMO_IDS.map((id, i) => [id, i]));
  const users = db.users
    .filter((u) => DEMO_IDS.includes(u.id))
    .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99))
    .map(publicUser);
  res.json(users);
});

function issue(user: User, extra: Record<string, unknown> = {}) {
  const token = signToken({ sub: user.id, role: user.role, clubId: user.clubId });
  const db = loadDb();
  db.users = db.users.map((u) => (u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u));
      db.audit.unshift({
        id: `au_${Date.now()}`,
        at: new Date().toISOString(),
        user: user.name,
        action: "Connexion",
        entity: "Auth",
        clubId: user.clubId,
      });
  saveDb(db);
  return { token, user: publicUser({ ...user, lastLogin: new Date().toISOString() }), ...extra };
}

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const db = loadDb();
  const user = db.users.find((u) => u.email.toLowerCase() === String(email || "").toLowerCase());
  if (!user || user.status !== "active" || !verifyPassword(String(password || ""), user.passwordHash)) {
    return res.status(401).json({ error: "invalid" });
  }
  res.json(issue(user));
});

app.post("/api/auth/demo", (req, res) => {
  if (process.env.DEMO_LOGIN === "false") return res.status(403).json({ error: "demo_disabled" });
  const { id } = req.body as { id?: string };
  const db = loadDb();
  const user = db.users.find((u) => u.id === id && DEMO_IDS.includes(u.id) && u.status === "active");
  if (!user) return res.status(401).json({ error: "invalid" });
  res.json(issue(user, { mode: "demo" }));
});

app.post("/api/auth/google", (_req, res) => {
  const url = googleOAuthUrl();
  if (url) return res.json({ mode: "oauth", url });
  if (process.env.DEMO_LOGIN === "false") return res.status(501).json({ error: "google_unconfigured" });
  const db = loadDb();
  const user = db.users.find((u) => u.id === "u_admin")!;
  res.json(issue(user, { mode: "local", notice: "GOOGLE_CLIENT_ID absent — connexion Google en mode local (club admin)." }));
});

app.get("/api/auth/google/callback", async (req, res) => {
  const code = String(req.query.code || "");
  const origin = process.env.APP_ORIGIN || "http://localhost:5173";
  if (!code || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${origin}/login?google=error`);
  }
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:8787/api/auth/google/callback",
    grant_type: "authorization_code",
  });
  const tok = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const tokens = (await tok.json()) as { access_token?: string };
  const me = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = (await me.json()) as { email?: string };
  const db = loadDb();
  let user = db.users.find((u) => u.email.toLowerCase() === String(profile.email || "").toLowerCase());
  if (!user && profile.email) {
    user = {
      id: `u_g_${Date.now()}`,
      email: profile.email,
      name: profile.email.split("@")[0],
      role: "staff",
      clubId: "club_coton",
      avatar: "G",
      status: "active",
      lastLogin: "",
      passwordHash: hashPassword(cryptoRandom()),
    };
    db.users.push(user);
    saveDb(db);
  }
  if (!user) return res.redirect(`${origin}/login?google=error`);
  const { token } = issue(user);
  res.redirect(`${origin}/login?token=${token}`);
});

function cryptoRandom() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

app.get("/api/state", auth, (req, res) => {
  const { user } = req as express.Request & { user: User };
  let db = runAutomation(loadDb());
  saveDb(db);
  res.json({ state: visibleTo(db, user), integrations: integrationStatus() });
});

app.put("/api/state", auth, (req, res) => {
  const { user } = req as express.Request & { user: User };
  const incoming = req.body?.state as AppState | undefined;
  if (!incoming?.users) return res.status(400).json({ error: "invalid_state" });
  const current = loadDb();
  incoming.users = incoming.users.map((u) => {
    const prev = current.users.find((p) => p.id === u.id);
    if (u.password && !u.passwordHash) return { ...u, passwordHash: hashPassword(u.password), password: undefined };
    return { ...u, passwordHash: prev?.passwordHash || u.passwordHash, password: undefined };
  });
  let merged = mergeState(current, incoming, user);
  merged = runAutomation(merged);
  saveDb(merged);
  res.json({ state: visibleTo(merged, user) });
});

app.post("/api/reset", auth, (req, res) => {
  const { user } = req as express.Request & { user: User };
  if (user.role !== "super_admin" && user.role !== "club_admin") return res.status(403).json({ error: "forbidden" });
  const seeded = hashUsers(createSeed());
  saveDb(seeded);
  res.json({ ok: true });
});

app.post("/api/ai/briefing", auth, async (req, res) => {
  const { user } = req as express.Request & { user: User };
  const out = await tacticalBriefing(req.body);
  const db = loadDb();
  db.agentLogs.unshift({
    id: `lg_${Date.now()}`,
    agentId: "ag_tactique",
    action: `Briefing ${req.body.formation} (${out.mode})`,
    at: new Date().toISOString(),
    level: "success",
  });
  saveDb(db);
  res.json({ ...out, clubId: user.clubId });
});

app.post("/api/ai/negotiate", auth, async (req, res) => {
  const out = await negotiateDeal(req.body);
  res.json(out);
});

app.post("/api/ai/report", auth, async (req, res) => {
  const { user } = req as express.Request & { user: User };
  const db = loadDb();
  const clubId = user.clubId || db.clubs[0].id;
  const players = db.players.filter((p) => p.clubId === clubId);
  const fatigueAvg = Math.round(players.reduce((s, p) => s + p.fatigue, 0) / Math.max(players.length, 1));
  const alerts = db.alerts.filter((a) => a.clubId === clubId && !a.read).length;
  const out = await monthlyNarrative({ locale: req.body.locale || "fr", fatigueAvg, players: players.length, alerts });
  res.json({
    ...out,
    kpis: [
      { label: "Joueurs", value: String(players.length) },
      { label: "Fatigue moy.", value: String(fatigueAvg) },
      { label: "Alertes", value: String(alerts) },
    ],
  });
});

app.post("/api/ai/design", auth, async (req, res) => {
  res.json(await designIdea(req.body));
});

app.post("/api/ai/video", auth, async (req, res) => {
  res.json(await videoNote(req.body));
});

app.post("/api/ai/scout", auth, async (req, res) => {
  res.json(await scoutRecommendation(req.body));
});

app.post("/api/chat", auth, async (req, res) => {
  const message = String((req.body as { message?: string })?.message || "").trim();
  if (!message) return res.status(400).json({ error: "empty" });
  const history = Array.isArray((req.body as { history?: unknown }).history)
    ? ((req.body as { history: { role?: string; content?: string }[] }).history || [])
        .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content as string }))
    : [];
  const locale = String((req.body as { locale?: string })?.locale || "fr");
  const out = await chatReply({ message, locale, history });
  res.json(out);
});

app.post("/api/billing/checkout", auth, async (req, res) => {
  const { user } = req as express.Request & { user: User };
  if (user.role === "player" || user.role === "staff" || user.role === "coach") {
    return res.status(403).json({ error: "forbidden" });
  }
  const plan = req.body.plan as "starter" | "elite" | "continent";
  const clubId = user.clubId || loadDb().clubs[0].id;
  try {
    const out = await stripeCheckout(plan, clubId);
    if (out.mode === "local") {
      const db = loadDb();
      db.subscriptions = db.subscriptions.map((s) =>
        s.clubId === clubId ? { ...s, plan, status: "active", renews: "2027-09-29" } : s,
      );
      db.audit.unshift({
        id: `au_${Date.now()}`,
        at: new Date().toISOString(),
        user: user.name,
        action: `Checkout local ${plan}`,
        entity: clubId,
        clubId,
      });
      saveDb(db);
    }
    res.json(out);
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

app.post("/api/calendar/sync", auth, async (req, res) => {
  const { user } = req as express.Request & { user: User };
  const db = loadDb();
  const events = db.events.filter((e) => user.role === "super_admin" || e.clubId === user.clubId);
  const out = await googleCalendarSync(events.map((e) => ({ title: e.title, start: e.start })));
  db.events = db.events.map((e) =>
    user.role === "super_admin" || e.clubId === user.clubId ? { ...e, googleSynced: true } : e,
  );
  db.agentLogs.unshift({
    id: `lg_${Date.now()}`,
    agentId: "ag_plan",
    action: `Calendar sync ${out.mode} (${out.synced})`,
    at: new Date().toISOString(),
    level: "info",
  });
  saveDb(db);
  res.json(out);
});

app.post("/api/reports/:id/send", auth, async (req, res) => {
  const { user } = req as express.Request & { user: User };
  const db = loadDb();
  const report = db.reports.find((r) => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: "not_found" });
  if (user.role !== "super_admin" && report.clubId !== user.clubId) return res.status(403).json({ error: "forbidden" });
  const mail = await sendEmail(
    staffEmails(db, report.clubId),
    `[Royal Goose] Rapport ${report.month}`,
    report.narrative,
  );
  db.reports = db.reports.map((r) => (r.id === report.id ? { ...r, sent: true } : r));
  saveDb(db);
  res.json({ ok: true, mail });
});

app.get("/api/outbox", auth, (req, res) => {
  const { user } = req as express.Request & { user: User };
  if (user.role !== "super_admin" && user.role !== "club_admin") return res.status(403).json({ error: "forbidden" });
  const file = path.resolve("data/outbox.json");
  const rows = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];
  res.json(rows);
});

const hasFrontend = fs.existsSync(path.join(DIST, "index.html"));
if (hasFrontend) {
  app.use(express.static(DIST));
}

app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return res.status(404).json({ error: "not_found" });
  if (hasFrontend && (req.method === "GET" || req.method === "HEAD")) {
    return res.sendFile(path.join(DIST, "index.html"));
  }
  next();
});

app.listen(PORT, "0.0.0.0", () => {
  loadDb();
  console.log(`Royal Goose ${hasFrontend ? "app" : "API"} http://0.0.0.0:${PORT}`);
  if (!hasFrontend) console.warn("dist/ missing — run npm run build to serve the frontend from this process");
  if (!process.env.JWT_SECRET) console.warn("JWT_SECRET unset — using dev default");
});
