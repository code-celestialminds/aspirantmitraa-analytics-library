import { describe, expect, it, vi } from "vitest";
import { createAnalytics } from "../src/createAnalytics";
import { sendEvent } from "../src/transport";
import {
  ENDPOINT,
  installBeaconMock,
  setupAnalyticsTestHooks,
} from "./helpers";

setupAnalyticsTestHooks();

describe("transport", () => {
  it("uses sendBeacon on success", () => {
    const sendBeacon = installBeaconMock(true);
    const result = sendEvent(ENDPOINT, '{"event":"X"}');
    expect(result).toBe("sent");
    expect(sendBeacon).toHaveBeenCalledWith(
      ENDPOINT,
      expect.any(Blob),
    );
  });

  it("falls back to fetch when sendBeacon returns false", () => {
    installBeaconMock(false);
    const fetchMock = vi.fn(() => Promise.resolve(new Response()));
    vi.stubGlobal("fetch", fetchMock);

    const result = sendEvent(ENDPOINT, '{"event":"X"}');
    expect(result).toBe("fallback");
    expect(fetchMock).toHaveBeenCalledWith(
      ENDPOINT,
      expect.objectContaining({
        method: "POST",
        keepalive: true,
      }),
    );
  });

  it("falls back when sendBeacon is unavailable", () => {
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: undefined,
    });
    const fetchMock = vi.fn(() => Promise.resolve(new Response()));
    vi.stubGlobal("fetch", fetchMock);

    const result = sendEvent(ENDPOINT, '{"event":"X"}');
    expect(result).toBe("fallback");
    expect(fetchMock).toHaveBeenCalled();
  });

  it("does not throw when sendBeacon returns false", () => {
    installBeaconMock(false);
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("net"))));

    const analytics = createAnalytics({ endpoint: ENDPOINT });
    expect(() => analytics.track("SAFE")).not.toThrow();
  });

  it("drops when no transport available", () => {
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: undefined,
    });
    vi.stubGlobal("fetch", undefined);

    const result = sendEvent(ENDPOINT, '{"event":"X"}');
    expect(result).toBe("dropped");
  });
});
