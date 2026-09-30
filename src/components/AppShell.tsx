import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  Bell,
  Brain,
  CalendarDays,
  ClipboardList,
  Cpu,
  CreditCard,
  Flag,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Palette,
  Radar,
  ScrollText,
  Search,
  Settings,
  Shield,
  Sparkles,
  Users,
  Video,
  Bot,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { canAccess, useApp } from "../context/AppContext";
import { Wordmark } from "./Logo";
import { Badge, Button } from "./ui";
import { ChatbotDock } from "../pages/Chatbot";

const NAV = [
  { to: "/app", icon: LayoutDashboard, key: "dashboard" as const, end: true },
  { to: "/app/chat", icon: Bot, key: "chat" as const },
  { to: "/app/players", icon: Users, key: "players" as const },
  { to: "/app/tactics", icon: Brain, key: "tactics" as const },
  { to: "/app/video", icon: Video, key: "video" as const },
  { to: "/app/scouting", icon: Radar, key: "scouting" as const },
  { to: "/app/transfers", icon: Flag, key: "transfers" as const },
  { to: "/app/medical", icon: HeartPulse, key: "medical" as const },
  { to: "/app/performance", icon: Activity, key: "performance" as const },
  { to: "/app/calendar", icon: CalendarDays, key: "calendar" as const },
  { to: "/app/messages", icon: MessageSquare, key: "messages" as const },
  { to: "/app/design", icon: Palette, key: "design" as const },
  { to: "/app/control", icon: Cpu, key: "control" as const },
  { to: "/app/agents", icon: Sparkles, key: "agents" as const },
  { to: "/app/tasks", icon: ClipboardList, key: "tasks" as const },
  { to: "/app/reports", icon: ScrollText, key: "reports" as const },
  { to: "/app/admin", icon: Shield, key: "admin" as const },
  { to: "/app/audit", icon: Shield, key: "audit" as const },
  { to: "/app/billing", icon: CreditCard, key: "billing" as const },
  { to: "/app/settings", icon: Settings, key: "settings" as const },
];

export function AppShell() {
  const { user, t, logout, locale, setLocale, state, setState, integrations, apiOnline } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const unread = state.alerts.filter((a) => !a.read && (user?.role === "super_admin" || a.clubId === user?.clubId)).length;
  const club = state.clubs.find((c) => c.id === user?.clubId);

  const items = NAV.filter((n) => user && canAccess(user.role, n.to));

  const results = useMemo(() => {
    if (q.length < 2) return [];
    const needle = q.toLowerCase();
    return state.players
      .filter((p) => (user?.role === "super_admin" || p.clubId === user?.clubId) && p.name.toLowerCase().includes(needle))
      .filter((p) => user?.role !== "player" || p.id === user.playerId)
      .slice(0, 6);
  }, [q, state.players, user]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside
        className={`fixed inset-y-0 z-40 w-64 border-r border-emerald-900/40 bg-[#052e16] text-emerald-50 transition lg:static ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <button onClick={() => navigate("/")} className="text-left">
            <Wordmark light />
          </button>
          <button className="lg:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="h-[calc(100vh-4rem)] space-y-0.5 overflow-y-auto px-3 pb-8">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                  isActive ? "bg-white/15 text-white" : "text-emerald-100/80 hover:bg-white/10"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {t.nav[item.key]}
              {item.key === "chat" ? (
                <span
                  className={`ml-auto h-2 w-2 rounded-full ${
                    integrations?.ai.connected || (integrations?.ai.mode && integrations.ai.mode !== "local")
                      ? "bg-emerald-400"
                      : "bg-amber-400"
                  }`}
                  title={integrations?.ai.label}
                />
              ) : null}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur">
          <button className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.search}
              className="h-9 w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:ring-4 focus:ring-emerald-600/20"
            />
            {results.length > 0 && (
              <div className="absolute top-10 z-20 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                {results.map((p) => (
                  <button
                    key={p.id}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
                    onClick={() => {
                      setQ("");
                      navigate(`/app/players/${p.id}`);
                    }}
                  >
                    {p.name} · {p.position} #{p.number}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setState((s) => ({
                ...s,
                alerts: s.alerts.map((a) =>
                  user?.role === "super_admin" || a.clubId === user?.clubId ? { ...a, read: true } : a,
                ),
              }));
              navigate("/app");
            }}
            className="relative"
          >
            <Bell className="h-5 w-5 text-slate-600" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-red-600 text-[10px] text-white">
                {unread}
              </span>
            )}
          </button>
          <button
            className="rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold"
            onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
          >
            {locale.toUpperCase()}
          </button>
          <div className="hidden items-center gap-2 sm:flex">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-700 text-xs font-bold text-white">
              {user?.avatar}
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">{user?.name}</div>
              <div className="text-[11px] text-slate-500">
                {t.roles[user!.role]} {club ? `· ${club.shortName}` : ""}
              </div>
            </div>
          </div>
          <Button variant="ghost" className="text-slate-600" onClick={() => { logout(); navigate("/"); }}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        {location.pathname === "/app" && unread > 0 && (
          <div className="bg-amber-50 px-4 py-2 text-sm text-amber-900">
            {unread} {locale === "fr" ? "alerte(s) non lues — fatigue, contrats ou tâches." : "unread alert(s) — fatigue, contracts or tasks."}
          </div>
        )}
        {!apiOnline && (
          <div className="bg-red-50 px-4 py-2 text-sm text-red-800">
            {locale === "fr" ? "API hors ligne. Lancez npm run dev (Vite + Express :8787)." : "API offline. Start npm run dev (Vite + Express :8787)."}
          </div>
        )}
        {integrations && (
          <div
            className={`px-4 py-1 text-[11px] ${
              integrations.ai.connected || integrations.ai.mode !== "local"
                ? "bg-emerald-50 text-emerald-900"
                : "bg-amber-50 text-amber-900"
            }`}
          >
            {integrations.ai.connected || integrations.ai.mode !== "local"
              ? locale === "fr"
                ? "Agent IA activé"
                : "AI agent on"
              : locale === "fr"
                ? "Agent IA hors ligne"
                : "AI agent offline"}
            {" · "}
            {integrations.ai.label} · {integrations.stripe.label} · {integrations.email.label}
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
        {location.pathname !== "/app/chat" && location.pathname !== "/app/agents" ? <ChatbotDock /> : null}
        <footer className="border-t border-slate-200 px-6 py-3 text-center text-xs text-slate-400">
          © 2026 Royal Goose Elite Platform — {club?.name ?? "Multi-clubs"}
        </footer>
      </div>
    </div>
  );
}
