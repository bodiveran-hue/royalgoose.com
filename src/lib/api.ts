import type { AppState, IntegrationsStatus, User } from "./types";

const TOKEN_KEY = "rg_jwt";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function uidFromToken(token: string) {
  try {
    const json = atob(token.split(".")[0].replace(/-/g, "+").replace(/_/g, "/"));
    return (JSON.parse(json) as { sub?: string }).sub ?? null;
  } catch {
    return null;
  }
}

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  return data as T;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(path, { ...init, headers });
  if (res.status === 401) setToken(null);
  return parse<T>(res);
}

export function fetchHealth() {
  return api<{ ok: boolean; integrations: IntegrationsStatus }>("/api/health");
}

export function fetchIntegrations() {
  return api<IntegrationsStatus>("/api/integrations");
}

export function fetchDemoUsers() {
  return api<User[]>("/api/auth/demo-users");
}

export function loginRequest(email: string, password: string) {
  return api<{ token: string; user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function demoLoginRequest(id: string) {
  return api<{ token: string; user: User; mode?: string }>("/api/auth/demo", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export function googleAuthRequest() {
  return api<{ mode: string; url?: string; token?: string; user?: User; notice?: string }>("/api/auth/google", {
    method: "POST",
  });
}

export function fetchState() {
  return api<{ state: AppState; integrations: IntegrationsStatus }>("/api/state");
}

export function putState(state: AppState) {
  return api<{ state: AppState }>("/api/state", { method: "PUT", body: JSON.stringify({ state }) });
}

export function resetRequest() {
  return api<{ ok: boolean }>("/api/reset", { method: "POST" });
}

export function aiPost<T>(path: string, body: unknown) {
  return api<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function billingCheckout(plan: string) {
  return api<{ mode: "stripe" | "local"; url?: string | null; plan: string; label?: string }>("/api/billing/checkout", {
    method: "POST",
    body: JSON.stringify({ plan }),
  });
}

export function calendarSync() {
  return api<{ mode: string; synced: number; label: string }>("/api/calendar/sync", { method: "POST" });
}

export function sendReport(id: string) {
  return api<{ ok: boolean; mail?: { mode: string } }>(`/api/reports/${id}/send`, { method: "POST" });
}

export function sendChat(message: string, locale: string, history: { role: "user" | "assistant"; content: string }[]) {
  return api<{ text: string; mode?: string; provider?: string }>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message, locale, history }),
  });
}

export function fetchOutbox() {
  return api<{ id: string; at: string; to: string[]; subject: string; body: string; mode: string }[]>("/api/outbox");
}
