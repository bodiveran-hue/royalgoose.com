import { createSeed } from "./seed";
import type { AppState, AuditEntry } from "./types";

const KEY = "rg_state_v1";

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed?.users?.length && parsed?.clubs?.length) return parsed;
    }
  } catch {
    /* reset */
  }
  const seed = createSeed();
  saveState(seed);
  return seed;
}

export function saveState(state: AppState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetState(): AppState {
  const seed = createSeed();
  saveState(seed);
  return seed;
}

export function audit(state: AppState, user: string, action: string, entity: string): AppState {
  const entry: AuditEntry = {
    id: `au_${Date.now()}`,
    at: new Date().toISOString(),
    user,
    action,
    entity,
  };
  return { ...state, audit: [entry, ...state.audit].slice(0, 200) };
}
