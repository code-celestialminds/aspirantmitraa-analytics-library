import { getAttributionSnapshot } from "./attribution";
import { DEFAULT_SESSION_TIMEOUT_MS } from "./constants";
import { getEnvironmentContext, getPageContext } from "./context";
import {
  clearSessionStorage,
  getOrCreateAnonymousId,
  getOrCreateSessionId,
  rotateSession,
  touchSession,
} from "./identity";
import { shouldTrackPath } from "./pageMatcher";
import { sanitizeProperties } from "./sanitize";
import { serializeEvent } from "./serialize";
import { isBrowser } from "./storage";
import { sendEvent } from "./transport";
import type {
  AnalyticsClient,
  AnalyticsEvent,
  AnalyticsOptions,
  PageTrackingConfig,
} from "./types";

export function createAnalytics(options: AnalyticsOptions): AnalyticsClient {
  let endpoint = options.endpoint;
  let sessionTimeoutMs = options.sessionTimeoutMs ?? DEFAULT_SESSION_TIMEOUT_MS;
  let pageTracking: PageTrackingConfig | undefined = options.pageTracking;

  let userId: string | undefined;
  let bootstrapped = false;

  function bootstrap(): void {
    if (bootstrapped || !isBrowser()) return;
    bootstrapped = true;
    getOrCreateAnonymousId();
    getOrCreateSessionId(sessionTimeoutMs);
    getAttributionSnapshot();
  }

  function buildEvent(
    eventName: string,
    properties?: Record<string, unknown>,
    pageOverrides?: { path?: string; url?: string; title?: string },
  ): AnalyticsEvent | null {
    if (!isBrowser()) return null;
    if (!eventName || typeof eventName !== "string") return null;

    bootstrap();

    const anonymousId = getOrCreateAnonymousId();
    const sessionId = touchSession(sessionTimeoutMs);
    const page = getPageContext(pageOverrides);
    const attribution = getAttributionSnapshot();
    const context = getEnvironmentContext();
    const sanitized = sanitizeProperties(properties);

    const event: AnalyticsEvent = {
      event: eventName,
      anonymousId,
      sessionId,
      timestamp: Date.now(),
      page,
      attribution,
      context,
    };

    if (userId) event.userId = userId;
    if (sanitized) event.properties = sanitized;

    return event;
  }

  function emit(
    eventName: string,
    properties?: Record<string, unknown>,
    pageOverrides?: { path?: string; url?: string; title?: string },
  ): void {
    try {
      if (!isBrowser() || !endpoint) return;
      const event = buildEvent(eventName, properties, pageOverrides);
      if (!event) return;
      const payload = serializeEvent(event);
      if (!payload) return;
      sendEvent(endpoint, payload);
    } catch {
      // Analytics must never break the host application
    }
  }

  const client: AnalyticsClient = {
    init(partial?: Partial<AnalyticsOptions>): void {
      try {
        if (partial?.endpoint) endpoint = partial.endpoint;
        if (partial?.sessionTimeoutMs !== undefined) {
          sessionTimeoutMs = partial.sessionTimeoutMs;
        }
        if (partial?.pageTracking !== undefined) {
          pageTracking = partial.pageTracking;
        }
        bootstrap();
      } catch {
        // ignore
      }
    },

    track(eventName: string, properties?: Record<string, unknown>): void {
      emit(eventName, properties);
    },

    identify(id: string): void {
      try {
        if (!isBrowser()) return;
        if (!id || typeof id !== "string") return;
        bootstrap();
        userId = id;
      } catch {
        // ignore
      }
    },

    reset(): void {
      try {
        if (!isBrowser()) return;
        userId = undefined;
        clearSessionStorage();
        rotateSession();
      } catch {
        // ignore
      }
    },

    page(overrides?: { path?: string; url?: string; title?: string }): void {
      try {
        if (!isBrowser()) return;
        bootstrap();
        const page = getPageContext(overrides);
        const path = page?.path ?? "/";
        if (!shouldTrackPath(path, pageTracking)) return;
        emit("PAGE_VIEW", undefined, overrides);
      } catch {
        // ignore
      }
    },
  };

  return client;
}
