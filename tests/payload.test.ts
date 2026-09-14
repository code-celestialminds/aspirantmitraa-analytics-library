import { describe, expect, it } from "vitest";
import { MAX_PAYLOAD_BYTES } from "../src/constants";
import { serializeEvent, utf8ByteLength } from "../src/serialize";
import { createAnalytics } from "../src/createAnalytics";
import type { AnalyticsEvent } from "../src/types";
import {
  ENDPOINT,
  installBeaconMock,
  readBeaconPayloadAsync,
  setupAnalyticsTestHooks,
} from "./helpers";

setupAnalyticsTestHooks();

function baseEvent(overrides: Partial<AnalyticsEvent> = {}): AnalyticsEvent {
  return {
    event: "TEST",
    anonymousId: "anon_x",
    sessionId: "sess_x",
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("payload", () => {
  it("calculates UTF-8 byte length correctly", () => {
    expect(utf8ByteLength("abc")).toBe(3);
    expect(utf8ByteLength("ह")).toBe(3); // Devanagari
    expect(utf8ByteLength("🙂")).toBe(4);
  });

  it("serializes payloads under the limit", () => {
    const payload = serializeEvent(baseEvent({ properties: { a: 1 } }));
    expect(payload).toBeTruthy();
    expect(utf8ByteLength(payload!)).toBeLessThanOrEqual(MAX_PAYLOAD_BYTES);
  });

  it("drops properties when payload exceeds limit", () => {
    const huge = "x".repeat(MAX_PAYLOAD_BYTES);
    const withProps = serializeEvent(
      baseEvent({ properties: { blob: huge } }),
    );
    expect(withProps).toBeTruthy();
    const parsed = JSON.parse(withProps!);
    expect(parsed.properties).toBeUndefined();
    expect(parsed.anonymousId).toBe("anon_x");
    expect(parsed.event).toBe("TEST");
  });

  it("drops entirely if required fields alone exceed limit", () => {
    const hugeId = "x".repeat(MAX_PAYLOAD_BYTES);
    const result = serializeEvent(
      baseEvent({ anonymousId: hugeId, sessionId: hugeId }),
    );
    expect(result).toBeNull();
  });

  it("never sends oversized beacon from track()", async () => {
    const sendBeacon = installBeaconMock();
    const analytics = createAnalytics({ endpoint: ENDPOINT });
    // After sanitize (max 50 keys × 2048 chars) this still exceeds 60 KiB
    const props: Record<string, unknown> = {};
    for (let i = 0; i < 50; i++) {
      props[`k${i}`] = "y".repeat(2048);
    }
    analytics.track("HUGE", props);

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    const raw = await readBeaconPayloadAsync(sendBeacon);
    expect(utf8ByteLength(raw)).toBeLessThanOrEqual(MAX_PAYLOAD_BYTES);
    const parsed = JSON.parse(raw);
    expect(parsed.properties).toBeUndefined();
    expect(parsed.event).toBe("HUGE");
  });
});
