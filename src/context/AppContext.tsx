import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AppState, IntegrationsStatus, Locale, Role, User } from "../lib/types";
import { dict, type Dict } from "../lib/i18n";
import {
  demoLoginRequest,
  fetchDemoUsers,
  fetchHealth,
  fetchIntegrations,
  fetchState,
  getToken,
  googleAuthRequest,
  loginRequest,
  putState,
  resetRequest,
  uidFromToken,
  setToken,
} from "../lib/api";
import { createSeed } from "../lib/seed";

const LOCALE = "rg_locale";

type Ctx = {
  state: AppState;
  setState: (updater: (s: AppState) => AppState) => void;
  user: User | null;
  login: (email: string, password: string) => Promise<string | null>;
  loginAs: (userId: string) => Promise<boolean>;
  loginGoogle: () => Promise<{ notice?: string } | string | null>;
  logout: () => void;
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dict;
  log: (action: string, entity: string) => void;
  reset: () => Promise<void>;
  integrations: IntegrationsStatus | null;
  apiOnline: boolean;
  demoUsers: User[];
  persistNow: () => Promise<void>;
  ready: boolean;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<AppState>(() => createSeed());
  const [user, setUser] = useState<User | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationsStatus | null>(null);
  const [apiOnline, setApiOnline] = useState(true);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [ready, setReady] = useState(false);
  const [locale, setLocaleState] = useState<Locale>(
    () => (localStorage.getItem(LOCALE) as Locale) || "fr",
  );
  const stateRef = useRef(state);
  stateRef.current = state;
  const persistTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const hydrate = useCallback(async () => {
    try {
      for (let i = 0; i < 10; i++) {
        try {
          const health = await fetchHealth();
          setApiOnline(true);
          setIntegrations(health.integrations);
          const demos = await fetchDemoUsers();
          setDemoUsers(demos);
          if (!getToken()) {
            const q = new URLSearchParams(window.location.search);
            const t = q.get("token");
            if (t) {
              setToken(t);
              const uid = uidFromToken(t);
              if (uid) sessionStorage.setItem("rg_uid", uid);
              sessionStorage.setItem("rg_go", "1");
              window.history.replaceState({}, "", window.location.pathname);
            } else {
              return;
            }
          }
          const payload = await fetchState();
          setStateRaw(payload.state);
          setIntegrations(payload.integrations);
          const savedId = sessionStorage.getItem("rg_uid") || uidFromToken(getToken() || "");
          const found = payload.state.users.find((u) => u.id === savedId);
          if (found) setUser(found);
          return;
        } catch {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
      setApiOnline(false);
      setIntegrations(await fetchIntegrations().catch(() => null));
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const persistNow = useCallback(async () => {
    if (!getToken()) return;
    try {
      const res = await putState(stateRef.current);
      setStateRaw(res.state);
      setApiOnline(true);
    } catch {
      setApiOnline(false);
    }
  }, []);

  const setState = useCallback((updater: (s: AppState) => AppState) => {
    setStateRaw((prev) => {
      const next = updater(prev);
      stateRef.current = next;
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(() => {
        void persistNow();
      }, 350);
      return next;
    });
  }, [persistNow]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await loginRequest(email, password);
      setToken(res.token);
      sessionStorage.setItem("rg_uid", res.user.id);
      setUser(res.user);
      try {
        const payload = await fetchState();
        setStateRaw(payload.state);
        setIntegrations(payload.integrations);
      } catch {
        return locale === "fr"
          ? "Session ouverte, mais les données n'ont pas pu être chargées."
          : "Signed in, but app data failed to load.";
      }
      return null;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "invalid") return locale === "fr" ? "Identifiants invalides" : "Invalid credentials";
      return locale === "fr" ? "Connexion impossible (API)." : "Login failed (API).";
    }
  }, [locale]);

  const loginAs = useCallback(async (userId: string) => {
    try {
      const res = await demoLoginRequest(userId);
      setToken(res.token);
      sessionStorage.setItem("rg_uid", res.user.id);
      setUser(res.user);
      const payload = await fetchState();
      setStateRaw(payload.state);
      setIntegrations(payload.integrations);
      return true;
    } catch {
      return false;
    }
  }, []);

  const loginGoogle = useCallback(async () => {
    try {
      const res = await googleAuthRequest();
      if (res.url) {
        window.location.href = res.url;
        return res.url;
      }
      if (res.token && res.user) {
        setToken(res.token);
        sessionStorage.setItem("rg_uid", res.user.id);
        setUser(res.user);
        const payload = await fetchState();
        setStateRaw(payload.state);
        setIntegrations(payload.integrations);
        return { notice: res.notice };
      }
      return locale === "fr" ? "Google indisponible" : "Google unavailable";
    } catch {
      return locale === "fr" ? "Google indisponible" : "Google unavailable";
    }
  }, [locale]);

  const logout = useCallback(() => {
    setToken(null);
    sessionStorage.removeItem("rg_uid");
    setUser(null);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem(LOCALE, l);
    setLocaleState(l);
  }, []);

  const log = useCallback(
    (action: string, entity: string) => {
      const name = user?.name ?? "Système";
      setState((s) => ({
        ...s,
        audit: [
          { id: `au_${Date.now()}`, at: new Date().toISOString(), user: name, action, entity, clubId: user?.clubId ?? null },
          ...s.audit,
        ].slice(0, 200),
      }));
    },
    [setState, user],
  );

  const reset = useCallback(async () => {
    await resetRequest().catch(() => undefined);
    setToken(null);
    sessionStorage.removeItem("rg_uid");
    setUser(null);
    setStateRaw(createSeed());
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      setState,
      user,
      login,
      loginAs,
      loginGoogle,
      logout,
      locale,
      setLocale,
      t: dict[locale],
      log,
      reset,
      integrations,
      apiOnline,
      demoUsers,
      persistNow,
      ready,
    }),
    [state, setState, user, login, loginAs, loginGoogle, logout, locale, setLocale, log, reset, integrations, apiOnline, demoUsers, persistNow, ready],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp outside provider");
  return ctx;
}

export function canAccess(role: Role, path: string) {
  if (role === "super_admin") return true;
  const adminOnly = ["/app/admin"];
  const audit = ["/app/audit"];
  const billing = ["/app/billing"];
  if (role === "player") {
    return (
      path === "/app" ||
      path.startsWith("/app/calendar") ||
      path.startsWith("/app/messages") ||
      path.startsWith("/app/chat") ||
      path.startsWith("/app/agents") ||
      path.startsWith("/app/performance") ||
      path.startsWith("/app/settings") ||
      path.startsWith("/app/players") ||
      path.startsWith("/app/reports")
    );
  }
  if (role === "staff") {
    if ([...adminOnly, ...audit, ...billing].some((p) => path.startsWith(p))) return false;
    if (path.startsWith("/app/tactics") || path.startsWith("/app/transfers")) return false;
  }
  if (role === "coach" && [...adminOnly, ...audit, ...billing].some((p) => path.startsWith(p))) return false;
  if (role === "club_admin" && adminOnly.some((p) => path.startsWith(p))) return false;
  return true;
}
