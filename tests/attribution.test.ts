import { describe, expect, it } from "vitest";
import { createAnalytics } from "../src/createAnalytics";
import { STORAGE_KEYS } from "../src/constants";
import {
  ENDPOINT,
  installBeaconMock,
  readBeaconPayloadAsync,
  setupAnalyticsTestHooks,
} from "./helpers";

setupAnalyticsTestHooks();

describe("attribution", () => {
  it("captures UTM parameters as current and first-touch", async () => {
    window.history.replaceState({}, "", "/gate?utm_source=google&utm_medium=cpc&utm_campaign=spring");
    Object.defineProperty(document, "referrer", {
      configurable: true,
      get: () => "",
    });

    const sendBeacon = installBeaconMock();
    const analytics = createAnalytics({ endpoint: ENDPOINT });
    analytics.track("LANDING");

    const payload = JSON.parse(await readBeaconPayloadAsync(sendBeacon));
    expect(payload.attribution.firstSource).toBe("google");
    expect(payload.attribution.firstMedium).toBe("cpc");
    expect(payload.attribution.firstCampaign).toBe("spring");
    expect(payload.attribution.currentSource).toBe("google");
    expect(payload.attribution.firstLandingPage).toContain("/gate");
  });

  it("captures Google organic referrer", async () => {
    window.history.replaceState({}, "", "/jee");
    Object.defineProperty(document, "referrer", {
      configurable: true,
      get: () => "https://www.google.com/search?q=gate",
    });

    const sendBeacon = installBeaconMock();
    const analytics = createAnalytics({ endpoint: ENDPOINT });
    analytics.track("LANDING");

    const payload = JSON.parse(await readBeaconPayloadAsync(sendBeacon));
    expect(payload.attribution.firstSource).toBe("google");
    expect(payload.attribution.firstMedium).toBe("organic");
    expect(payload.attribution.firstReferrer).toContain("google.com");
  });

  it("marks direct visits", async () => {
    window.history.replaceState({}, "", "/");
    Object.defineProperty(document, "referrer", {
      configurable: true,
      get: () => "",
    });

    const sendBeacon = installBeaconMock();
    const analytics = createAnalytics({ endpoint: ENDPOINT });
    analytics.track("LANDING");

    const payload = JSON.parse(await readBeaconPayloadAsync(sendBeacon));
    expect(payload.attribution.firstSource).toBe("direct");
    expect(payload.attribution.firstMedium).toBe("none");
  });

  it("does not overwrite first-touch attribution", async () => {
    window.history.replaceState({}, "", "/?utm_source=first&utm_medium=email");
    Object.defineProperty(document, "referrer", {
      configurable: true,
      get: () => "",
    });

    const sendBeacon = installBeaconMock();
    const a = createAnalytics({ endpoint: ENDPOINT });
    a.track("FIRST");

    window.history.replaceState({}, "", "/?utm_source=second&utm_medium=cpc");
    a.track("SECOND");

    const second = JSON.parse(await readBeaconPayloadAsync(sendBeacon, 1));
    expect(second.attribution.firstSource).toBe("first");
    expect(second.attribution.firstMedium).toBe("email");
    expect(second.attribution.currentSource).toBe("second");
    expect(second.attribution.currentMedium).toBe("cpc");

    // Stored first-touch remains
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.attribution)!);
    expect(stored.firstSource).toBe("first");
  });
});
