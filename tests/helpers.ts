import { afterEach, beforeEach, vi } from "vitest";
import { clearMemoryStorage } from "../src/storage";
import { STORAGE_KEYS } from "../src/constants";

export const ENDPOINT = "https://analytics.aspirantmitraa.com/events";

export function clearAnalyticsStorage(): void {
  clearMemoryStorage();
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(STORAGE_KEYS.anonymousId);
    localStorage.removeItem(STORAGE_KEYS.session);
    localStorage.removeItem(STORAGE_KEYS.attribution);
  }
}

export function installBeaconMock(returnValue = true) {
  const sendBeacon = vi.fn(() => returnValue);
  Object.defineProperty(navigator, "sendBeacon", {
    configurable: true,
    writable: true,
    value: sendBeacon,
  });
  return sendBeacon;
}

export function readBeaconPayload(sendBeacon: ReturnType<typeof vi.fn>): string {
  const arg = sendBeacon.mock.calls[0]?.[1];
  if (typeof arg === "string") return arg;
  if (arg instanceof Blob) {
    // Sync read via FileReader is awkward; use text() in async tests.
    throw new Error("Use readBeaconPayloadAsync for Blob");
  }
  return String(arg);
}

export async function readBeaconPayloadAsync(
  sendBeacon: ReturnType<typeof vi.fn>,
  callIndex = 0,
): Promise<string> {
  const arg = sendBeacon.mock.calls[callIndex]?.[1];
  if (typeof arg === "string") return arg;
  if (arg instanceof Blob) return arg.text();
  return String(arg ?? "");
}

export function setupAnalyticsTestHooks(): void {
  beforeEach(() => {
    clearAnalyticsStorage();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    clearAnalyticsStorage();
  });
}
