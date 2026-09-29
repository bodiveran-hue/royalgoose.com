import type { AppState, Role, User } from "../src/lib/types";

export function publicUser(u: User): User {
  const { password, passwordHash, ...rest } = u;
  return rest;
}

export function stripSecrets(state: AppState): AppState {
  return { ...state, users: state.users.map(publicUser) };
}

function playerClub(state: AppState, playerId?: string) {
  return state.players.find((p) => p.id === playerId)?.clubId;
}

function channelClub(state: AppState, channelId?: string) {
  return state.channels.find((c) => c.id === channelId)?.clubId;
}

function matchClub(state: AppState, matchId?: string) {
  return state.matches.find((m) => m.id === matchId)?.clubId;
}

export function visibleTo(state: AppState, user: User): AppState {
  if (user.role === "super_admin") return stripSecrets(state);
  const clubId = user.clubId;
  const players = state.players.filter((p) => p.clubId === clubId);
  const playerIds = new Set(players.map((p) => p.id));
  if (user.role === "player" && user.playerId) {
    playerIds.clear();
    playerIds.add(user.playerId);
  }
  const matches = state.matches.filter((m) => m.clubId === clubId);
  const matchIds = new Set(matches.map((m) => m.id));
  const channels = state.channels.filter((c) => c.clubId === clubId);
  const channelIds = new Set(channels.map((c) => c.id));

  return stripSecrets({
    ...state,
    clubs: state.clubs.filter((c) => c.id === clubId),
    users: state.users.filter((u) => u.clubId === clubId || u.id === user.id),
    players: state.players.filter((p) => playerIds.has(p.id) || (user.role !== "player" && p.clubId === clubId)),
    contracts: state.contracts.filter((c) => c.clubId === clubId && (user.role !== "player" || c.playerId === user.playerId)),
    matches,
    videos: state.videos.filter((v) => (v.clubId || matchClub(state, v.matchId)) === clubId && matchIds.has(v.matchId)),
    medical: state.medical.filter((m) => playerIds.has(m.playerId)),
    loads: state.loads.filter((l) => playerIds.has(l.playerId)),
    events: state.events.filter((e) => e.clubId === clubId),
    channels,
    messages: state.messages.filter((m) => channelIds.has(m.channelId)),
    statuses: state.statuses.filter((s) => state.users.find((u) => u.id === s.userId)?.clubId === clubId),
    scouts: state.scouts.filter((s) => s.clubId === clubId),
    transfers: state.transfers.filter((t) => t.clubId === clubId),
    tasks: state.tasks.filter((t) => t.clubId === clubId),
    alerts: state.alerts.filter((a) => a.clubId === clubId),
    briefings: state.briefings.filter((b) => (b.clubId || matchClub(state, b.matchId)) === clubId),
    designs: state.designs.filter((d) => d.clubId === clubId),
    reports: state.reports.filter((r) => r.clubId === clubId),
    subscriptions: state.subscriptions.filter((s) => s.clubId === clubId),
    audit:
      user.role === "club_admin"
        ? state.audit.filter((a) => a.clubId === clubId || state.users.some((u) => u.name === a.user && u.clubId === clubId)).slice(0, 80)
        : [],
  });
}

const WRITE: Record<Role, Set<string>> = {
  super_admin: new Set([
    "users", "clubs", "players", "contracts", "matches", "videos", "medical", "loads", "events",
    "channels", "messages", "statuses", "scouts", "transfers", "tasks", "alerts", "agents",
    "agentLogs", "briefings", "designs", "reports", "audit", "subscriptions",
  ]),
  club_admin: new Set([
    "users", "players", "contracts", "matches", "videos", "medical", "loads", "events",
    "channels", "messages", "statuses", "scouts", "transfers", "tasks", "alerts",
    "agentLogs", "briefings", "designs", "reports", "subscriptions", "audit",
  ]),
  coach: new Set([
    "players", "matches", "videos", "loads", "events", "channels", "messages", "statuses",
    "scouts", "tasks", "alerts", "briefings", "designs", "reports", "agentLogs", "audit",
  ]),
  staff: new Set([
    "medical", "events", "messages", "statuses", "tasks", "alerts", "loads", "reports", "agentLogs", "audit",
  ]),
  player: new Set(["messages", "statuses"]),
};

function clubOf(state: AppState, key: string, rec: Record<string, unknown>): string | undefined {
  if (typeof rec.clubId === "string") return rec.clubId;
  if (typeof rec.clubId === "object" && rec.clubId === null && key === "audit") return undefined;
  if (key === "medical" || key === "loads" || key === "contracts") return playerClub(state, rec.playerId as string);
  if (key === "messages") return channelClub(state, rec.channelId as string);
  if (key === "videos" || key === "briefings") return matchClub(state, rec.matchId as string);
  return undefined;
}

export function mergeState(current: AppState, incoming: AppState, user: User): AppState {
  const allowed = WRITE[user.role];
  const next: AppState = { ...current };
  const keys = Object.keys(current) as (keyof AppState)[];
  for (const key of keys) {
    if (!allowed.has(key)) continue;
    const curArr = current[key] as unknown[];
    const incArr = incoming[key] as unknown[];
    if (!Array.isArray(curArr) || !Array.isArray(incArr)) continue;

    if (user.role === "super_admin") {
      (next[key] as unknown) = incArr;
      continue;
    }

    const keep = (curArr as Record<string, unknown>[]).filter((r) => {
      const c = clubOf(current, key, r);
      if (key === "users") return (r as User).clubId !== user.clubId;
      if (key === "agents") return true;
      return c !== user.clubId;
    });

    const own = (incArr as Record<string, unknown>[])
      .filter((r) => {
        if (key === "users") {
          const u = r as User;
          return u.clubId === user.clubId || u.id === user.id;
        }
        if (key === "agents") return false;
        const c = clubOf({ ...current, [key]: incArr } as AppState, key, r) || user.clubId;
        if (user.role === "player") {
          if (key === "messages") return r.fromId === user.id;
          if (key === "statuses") return r.userId === user.id;
          return false;
        }
        return !c || c === user.clubId;
      })
      .map((r) => {
        const copy = { ...r };
        if ("clubId" in copy && !copy.clubId && user.clubId) copy.clubId = user.clubId;
        if (key === "users") {
          const prev = current.users.find((u) => u.id === copy.id);
          copy.passwordHash = prev?.passwordHash;
          delete copy.password;
          if ((copy as User).role === "super_admin" && user.role !== "super_admin") {
            copy.role = prev?.role || "staff";
          }
        }
        return copy;
      });

    (next[key] as unknown) = [...keep, ...own];
  }

  next.users = next.users.map((u) => {
    const prev = current.users.find((p) => p.id === u.id);
    if (!prev) {
      if (u.password && !u.passwordHash) {
        return u;
      }
      return { ...u, passwordHash: u.passwordHash || prev?.passwordHash };
    }
    return { ...u, passwordHash: prev.passwordHash, password: undefined };
  });
  next.clubs = user.role === "super_admin" ? incoming.clubs : current.clubs;
  next.agents = user.role === "super_admin" ? incoming.agents : current.agents;
  return next;
}
