import { describe, expect, it } from "vitest";
import { matchGlob, shouldTrackPath } from "../src/pageMatcher";
import { createAnalytics } from "../src/createAnalytics";
import {
  ENDPOINT,
  installBeaconMock,
  setupAnalyticsTestHooks,
} from "./helpers";

setupAnalyticsTestHooks();

describe("routing", () => {
  it("matches include globs", () => {
    expect(matchGlob("/gate/**", "/gate/cse")).toBe(true);
    expect(matchGlob("/gate/**", "/gate")).toBe(true);
    expect(matchGlob("/pyq/*", "/pyq/os")).toBe(true);
    expect(matchGlob("/pyq/*", "/pyq/os/extra")).toBe(false);
  });

  it("tracks included routes", () => {
    const sendBeacon = installBeaconMock();
    window.history.replaceState({}, "", "/gate/cse");
    const analytics = createAnalytics({
      endpoint: ENDPOINT,
      pageTracking: {
        enabled: true,
        include: ["/gate/**"],
        exclude: ["/admin/**"],
      },
    });
    analytics.page();
    expect(sendBeacon).toHaveBeenCalledTimes(1);
  });

  it("ignores excluded admin routes even if included", () => {
    const sendBeacon = installBeaconMock();
    window.history.replaceState({}, "", "/admin/users");
    const analytics = createAnalytics({
      endpoint: ENDPOINT,
      pageTracking: {
        enabled: true,
        include: ["/**"],
        exclude: ["/admin/**", "/api/**"],
      },
    });
    analytics.page();
    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it("ignores API routes", () => {
    expect(
      shouldTrackPath("/api/health", {
        enabled: true,
        include: ["/**"],
        exclude: ["/api/**"],
      }),
    ).toBe(false);
  });

  it("ignores irrelevant routes when not in include", () => {
    expect(
      shouldTrackPath("/random", {
        enabled: true,
        include: ["/gate/**", "/jee/**"],
        exclude: [],
      }),
    ).toBe(false);
  });

  it("tracks nothing when include is empty (conservative default)", () => {
    expect(
      shouldTrackPath("/gate", {
        enabled: true,
        include: [],
      }),
    ).toBe(false);
  });

  it("tracks nothing when pageTracking disabled", () => {
    const sendBeacon = installBeaconMock();
    window.history.replaceState({}, "", "/gate");
    const analytics = createAnalytics({
      endpoint: ENDPOINT,
      pageTracking: { enabled: false, include: ["/gate/**"] },
    });
    analytics.page();
    expect(sendBeacon).not.toHaveBeenCalled();
  });
});
