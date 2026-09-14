import { describe, expect, it, vi } from "vitest";
import { createAnalytics } from "../src/createAnalytics";
import { STORAGE_KEYS } from "../src/constants";
import {
  ENDPOINT,
  installBeaconMock,
  readBeaconPayloadAsync,
  setupAnalyticsTestHooks,
} from "./helpers";

setupAnalyticsTestHooks();

describe("identity", () => {
  it("creates a first visitor anonymous id", async () => {
    const sendBeacon = installBeaconMock();
    const analytics = createAnalytics({ endpoint: ENDPOINT });
    analytics.track("TEST");

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(await readBeaconPayloadAsync(sendBeacon));
    expect(payload.anonymousId).toMatch(/^anon_/);
    expect(localStorage.getItem(STORAGE_KEYS.anonymousId)).toBe(payload.anonymousId);
  });

  it("persists visitor id across instances", async () => {
    const sendBeacon = installBeaconMock();
    const a = createAnalytics({ endpoint: ENDPOINT });
    a.track("A");
    const first = JSON.parse(await readBeaconPayloadAsync(sendBeacon, 0)).anonymousId;

    const b = createAnalytics({ endpoint: ENDPOINT });
    b.track("B");
    const second = JSON.parse(await readBeaconPayloadAsync(sendBeacon, 1)).anonymousId;
    expect(second).toBe(first);
  });

  it("creates a session id", async () => {
    const sendBeacon = installBeaconMock();
    const analytics = createAnalytics({ endpoint: ENDPOINT });
    analytics.track("TEST");
    const payload = JSON.parse(await readBeaconPayloadAsync(sendBeacon));
    expect(payload.sessionId).toMatch(/^sess_/);
  });

  it("expires session after inactivity timeout", async () => {
    const sendBeacon = installBeaconMock();
    const analytics = createAnalytics({
      endpoint: ENDPOINT,
      sessionTimeoutMs: 1000,
    });

    analytics.track("FIRST");
    const first = JSON.parse(await readBeaconPayloadAsync(sendBeacon, 0)).sessionId;

    const raw = localStorage.getItem(STORAGE_KEYS.session)!;
    const session = JSON.parse(raw);
    session.lastActivity = Date.now() - 5000;
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));

    analytics.track("SECOND");
    const second = JSON.parse(await readBeaconPayloadAsync(sendBeacon, 1)).sessionId;
    expect(second).not.toBe(first);
  });

  it("identify() attaches userId to future events", async () => {
    const sendBeacon = installBeaconMock();
    const analytics = createAnalytics({ endpoint: ENDPOINT });
    analytics.identify("user_abc");
    analytics.track("LOGIN_COMPLETED");

    const payload = JSON.parse(await readBeaconPayloadAsync(sendBeacon));
    expect(payload.userId).toBe("user_abc");
  });

  it("reset() clears userId and rotates session, keeps anonymousId", async () => {
    const sendBeacon = installBeaconMock();
    const analytics = createAnalytics({ endpoint: ENDPOINT });
    analytics.identify("user_abc");
    analytics.track("BEFORE");
    const before = JSON.parse(await readBeaconPayloadAsync(sendBeacon, 0));

    analytics.reset();
    analytics.track("AFTER");
    const after = JSON.parse(await readBeaconPayloadAsync(sendBeacon, 1));

    expect(after.anonymousId).toBe(before.anonymousId);
    expect(after.userId).toBeUndefined();
    expect(after.sessionId).not.toBe(before.sessionId);
  });

  it("does not throw when storage is unavailable", () => {
    const sendBeacon = installBeaconMock();
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("quota");
    });

    const analytics = createAnalytics({ endpoint: ENDPOINT });
    expect(() => analytics.track("SAFE")).not.toThrow();
    expect(sendBeacon).toHaveBeenCalled();

    setItem.mockRestore();
    getItem.mockRestore();
  });
});
