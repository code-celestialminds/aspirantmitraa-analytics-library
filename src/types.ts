export interface PageTrackingConfig {
  enabled?: boolean;
  /** Glob patterns. If empty/missing while enabled, nothing is tracked (conservative). */
  include?: string[];
  /** Glob patterns. Exclude wins over include. */
  exclude?: string[];
}

export interface AnalyticsOptions {
  endpoint: string;
  /** Session inactivity timeout in ms. Default: 30 minutes. */
  sessionTimeoutMs?: number;
  pageTracking?: PageTrackingConfig;
}

export interface PageContext {
  url: string;
  path: string;
  title?: string;
}

export interface AttributionContext {
  firstSource?: string;
  firstMedium?: string;
  firstCampaign?: string;
  firstTerm?: string;
  firstContent?: string;
  firstReferrer?: string;
  firstLandingPage?: string;

  currentSource?: string;
  currentMedium?: string;
  currentCampaign?: string;
  currentTerm?: string;
  currentContent?: string;
  currentReferrer?: string;
}

export interface EnvironmentContext {
  language?: string;
  timezone?: string;
  screenWidth?: number;
  screenHeight?: number;
}

export interface AnalyticsEvent {
  event: string;
  anonymousId: string;
  sessionId: string;
  userId?: string;
  timestamp: number;
  page?: PageContext;
  attribution?: AttributionContext;
  context?: EnvironmentContext;
  properties?: Record<string, unknown>;
}

export interface SessionState {
  id: string;
  lastActivity: number;
}

export interface StoredAttribution {
  firstSource?: string;
  firstMedium?: string;
  firstCampaign?: string;
  firstTerm?: string;
  firstContent?: string;
  firstReferrer?: string;
  firstLandingPage?: string;
}

export interface AnalyticsClient {
  init: (options?: Partial<AnalyticsOptions>) => void;
  track: (eventName: string, properties?: Record<string, unknown>) => void;
  identify: (userId: string) => void;
  reset: () => void;
  page: (overrides?: { path?: string; url?: string; title?: string }) => void;
}
