const memoryStore = new Map<string, string>();

export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function canUseLocalStorage(): boolean {
  if (!isBrowser()) return false;
  try {
    const key = "__am_analytics_test__";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function storageGet(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    if (canUseLocalStorage()) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // fall through to memory
  }
  return memoryStore.get(key) ?? null;
}

export function storageSet(key: string, value: string): void {
  if (!isBrowser()) return;
  memoryStore.set(key, value);
  try {
    if (canUseLocalStorage()) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // memory already set
  }
}

export function storageRemove(key: string): void {
  if (!isBrowser()) return;
  memoryStore.delete(key);
  try {
    if (canUseLocalStorage()) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

/** Test helper: clear in-memory fallback store. */
export function clearMemoryStorage(): void {
  memoryStore.clear();
}
