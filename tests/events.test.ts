import { describe, expect, it } from "vitest";
import { createAnalytics } from "../src/createAnalytics";
import { sanitizeProperties } from "../src/sanitize";
import {
  ENDPOINT,
  installBeaconMock,
  readBeaconPayloadAsync,
  setupAnalyticsTestHooks,
} from "./helpers";

setupAnalyticsTestHooks();

describe("events", () => {
  it("creates events with required fields", async () => {
    const sendBeacon = installBeaconMock();
    const analytics = createAnalytics({ endpoint: ENDPOINT });
    analytics.track("PYQ_VIEW", { questionId: "gate-os-2024-12" });

    const payload = JSON.parse(await readBeaconPayloadAsync(sendBeacon));
    expect(payload.event).toBe("PYQ_VIEW");
    expect(payload.anonymousId).toBeTruthy();
    expect(payload.sessionId).toBeTruthy();
    expect(typeof payload.timestamp).toBe("number");
    expect(payload.properties.questionId).toBe("gate-os-2024-12");
    expect(payload.page).toBeTruthy();
    expect(payload.context?.language || payload.context?.timezone).toBeTruthy();
  });

  it("allows missing properties", async () => {
    const sendBeacon = installBeaconMock();
    const analytics = createAnalytics({ endpoint: ENDPOINT });
    analytics.track("CTA_CLICK");
    const payload = JSON.parse(await readBeaconPayloadAsync(sendBeacon));
    expect(payload.properties).toBeUndefined();
  });

  it("sanitizes invalid properties", () => {
    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;

    const cleaned = sanitizeProperties({
      ok: "yes",
      password: "secret",
      email: "a@b.com",
      fn: () => 1,
      nested: { deep: { deeper: { tooDeep: true } } },
      circular,
      big: "x".repeat(5000),
    });

    expect(cleaned?.ok).toBe("yes");
    expect(cleaned?.password).toBeUndefined();
    expect(cleaned?.email).toBeUndefined();
    expect(cleaned?.fn).toBeUndefined();
    expect((cleaned?.big as string).length).toBe(2048);
    // Circular link stripped; non-circular keys retained
    expect(cleaned?.circular).toEqual({ a: 1 });
  });

  it("drops sensitive keys from tracked properties", async () => {
    const sendBeacon = installBeaconMock();
    const analytics = createAnalytics({ endpoint: ENDPOINT });
    analytics.track("SIGNUP_COMPLETED", {
      productId: "gate",
      password: "hunter2",
      token: "abc",
    });
    const payload = JSON.parse(await readBeaconPayloadAsync(sendBeacon));
    expect(payload.properties.productId).toBe("gate");
    expect(payload.properties.password).toBeUndefined();
    expect(payload.properties.token).toBeUndefined();
  });
});
