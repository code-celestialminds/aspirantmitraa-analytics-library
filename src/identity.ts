import { ID_PREFIX, STORAGE_KEYS } from "./constants";
import { isBrowser, storageGet, storageRemove, storageSet } from "./storage";
import type { SessionState } from "./types";

function randomId(prefix: string): string {
  let uuid: string;
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      uuid = crypto.randomUUID();
    } else if (
      typeof crypto !== "undefined" &&
      typeof crypto.getRandomValues === "function"
    ) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      uuid = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    } else {
      uuid = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
    }
  } catch {
    uuid = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
  }
  return `${prefix}${uuid}`;
}

export function getOrCreateAnonymousId(): string {
  if (!isBrowser()) return `${ID_PREFIX.anonymous}ssr`;
  const existing = storageGet(STORAGE_KEYS.anonymousId);
  if (existing) return existing;
  const id = randomId(ID_PREFIX.anonymous);
  storageSet(STORAGE_KEYS.anonymousId, id);
  return id;
}

function readSession(): SessionState | null {
  const raw = storageGet(STORAGE_KEYS.session);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionState;
    if (
      typeof parsed?.id === "string" &&
      typeof parsed?.lastActivity === "number"
    ) {
      return parsed;
    }
  } catch {
    // ignore corrupt session
  }
  return null;
}

function writeSession(session: SessionState): void {
  storageSet(STORAGE_KEYS.session, JSON.stringify(session));
}

export function getOrCreateSessionId(timeoutMs: number): string {
  if (!isBrowser()) return `${ID_PREFIX.session}ssr`;
  const now = Date.now();
  const existing = readSession();
  if (existing && now - existing.lastActivity < timeoutMs) {
    writeSession({ id: existing.id, lastActivity: now });
    return existing.id;
  }
  const id = randomId(ID_PREFIX.session);
  writeSession({ id, lastActivity: now });
  return id;
}

export function touchSession(timeoutMs: number): string {
  return getOrCreateSessionId(timeoutMs);
}

export function rotateSession(): string {
  const id = randomId(ID_PREFIX.session);
  writeSession({ id, lastActivity: Date.now() });
  return id;
}

export function clearSessionStorage(): void {
  storageRemove(STORAGE_KEYS.session);
}
