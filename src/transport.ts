import { isBrowser } from "./storage";

export type TransportResult = "sent" | "fallback" | "dropped";

/**
 * Best-effort delivery. Never throws. Never blocks on response.
 */
export function sendEvent(endpoint: string, payload: string): TransportResult {
  if (!isBrowser() || !endpoint) return "dropped";

  try {
    const blob = new Blob([payload], { type: "application/json" });

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const ok = navigator.sendBeacon(endpoint, blob);
      if (ok) return "sent";
      // sendBeacon returned false — try keepalive fetch once
      return fallbackFetch(endpoint, payload);
    }

    return fallbackFetch(endpoint, payload);
  } catch {
    return "dropped";
  }
}

function fallbackFetch(endpoint: string, payload: string): TransportResult {
  try {
    if (typeof fetch !== "function") return "dropped";
    // Fire-and-forget; do not await
    void fetch(endpoint, {
      method: "POST",
      body: payload,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      credentials: "omit",
      mode: "cors",
    }).catch(() => {
      // ignore network errors
    });
    return "fallback";
  } catch {
    return "dropped";
  }
}
