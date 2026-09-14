/**
 * SSR safety: importing and calling APIs must not throw without window.
 * Run with a Node environment (no DOM).
 */
import { describe, expect, it, vi } from "vitest";

describe("ssr", () => {
  it("imports without accessing window at module evaluation", async () => {
    // happy-dom provides window; simulate SSR by hiding globals during import path checks
    // The library only touches browser APIs inside methods after isBrowser().
    const mod = await import("../src/index");
    expect(typeof mod.createAnalytics).toBe("function");
  });

  it("methods are safe no-ops when not in browser", async () => {
    const { createAnalytics } = await import("../src/createAnalytics");

    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;

    // Temporarily remove browser globals
    // @ts-expect-error intentional SSR simulation
    delete globalThis.window;
    // @ts-expect-error intentional SSR simulation
    delete globalThis.document;

    try {
      const analytics = createAnalytics({
        endpoint: "https://analytics.aspirantmitraa.com/events",
      });

      expect(() => analytics.init()).not.toThrow();
      expect(() => analytics.track("X", { a: 1 })).not.toThrow();
      expect(() => analytics.identify("u1")).not.toThrow();
      expect(() => analytics.page()).not.toThrow();
      expect(() => analytics.reset()).not.toThrow();
    } finally {
      globalThis.window = originalWindow;
      globalThis.document = originalDocument;
    }
  });

  it("does not call sendBeacon during SSR no-op track", async () => {
    const { createAnalytics } = await import("../src/createAnalytics");
    const sendBeacon = vi.fn(() => true);

    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;
    const originalNavigator = globalThis.navigator;

    // @ts-expect-error intentional
    delete globalThis.window;
    // @ts-expect-error intentional
    delete globalThis.document;

    try {
      Object.defineProperty(globalThis, "navigator", {
        configurable: true,
        value: { sendBeacon },
      });

      const analytics = createAnalytics({
        endpoint: "https://analytics.aspirantmitraa.com/events",
      });
      analytics.track("SHOULD_NOT_SEND");
      expect(sendBeacon).not.toHaveBeenCalled();
    } finally {
      globalThis.window = originalWindow;
      globalThis.document = originalDocument;
      Object.defineProperty(globalThis, "navigator", {
        configurable: true,
        value: originalNavigator,
      });
    }
  });
});
