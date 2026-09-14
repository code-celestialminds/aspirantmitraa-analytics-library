import { STORAGE_KEYS } from "./constants";
import { isBrowser, storageGet, storageSet } from "./storage";
import type { AttributionContext, StoredAttribution } from "./types";

function readStored(): StoredAttribution | null {
  const raw = storageGet(STORAGE_KEYS.attribution);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAttribution;
  } catch {
    return null;
  }
}

function writeStored(data: StoredAttribution): void {
  storageSet(STORAGE_KEYS.attribution, JSON.stringify(data));
}

function parseUtm(search: string): {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
} {
  try {
    const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
    const source = params.get("utm_source") || undefined;
    const medium = params.get("utm_medium") || undefined;
    const campaign = params.get("utm_campaign") || undefined;
    const term = params.get("utm_term") || undefined;
    const content = params.get("utm_content") || undefined;
    return { source, medium, campaign, term, content };
  } catch {
    return {};
  }
}

function referrerSource(referrer: string): { source?: string; medium?: string } {
  if (!referrer) return {};
  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();
    if (!host) return {};

    if (host.includes("google.")) return { source: "google", medium: "organic" };
    if (host.includes("bing.")) return { source: "bing", medium: "organic" };
    if (host.includes("yahoo.")) return { source: "yahoo", medium: "organic" };
    if (host.includes("duckduckgo.")) return { source: "duckduckgo", medium: "organic" };

    return { source: host, medium: "referral" };
  } catch {
    return {};
  }
}

function isSameOriginReferrer(referrer: string): boolean {
  if (!referrer || !isBrowser()) return false;
  try {
    const ref = new URL(referrer);
    return ref.origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Capture / refresh attribution. First-touch fields are never overwritten.
 */
export function captureAttribution(): AttributionContext {
  if (!isBrowser()) return {};

  const search = window.location.search || "";
  const utm = parseUtm(search);
  const rawReferrer = document.referrer || "";
  const sameOrigin = isSameOriginReferrer(rawReferrer);
  const externalReferrer = sameOrigin ? "" : rawReferrer;
  const fromReferrer = externalReferrer ? referrerSource(externalReferrer) : {};

  const hasUtm = Boolean(utm.source || utm.medium || utm.campaign || utm.term || utm.content);

  const currentSource = hasUtm ? utm.source : fromReferrer.source;
  const currentMedium = hasUtm ? utm.medium : fromReferrer.medium;
  const currentCampaign = hasUtm ? utm.campaign : undefined;
  const currentTerm = hasUtm ? utm.term : undefined;
  const currentContent = hasUtm ? utm.content : undefined;

  let stored = readStored();
  if (!stored) {
    stored = {
      firstSource: currentSource || (externalReferrer ? undefined : "direct"),
      firstMedium: currentMedium || (externalReferrer ? undefined : "none"),
      firstCampaign: currentCampaign,
      firstTerm: currentTerm,
      firstContent: currentContent,
      firstReferrer: externalReferrer || undefined,
      firstLandingPage: `${window.location.pathname}${window.location.search}`,
    };
    writeStored(stored);
  }

  return {
    firstSource: stored.firstSource,
    firstMedium: stored.firstMedium,
    firstCampaign: stored.firstCampaign,
    firstTerm: stored.firstTerm,
    firstContent: stored.firstContent,
    firstReferrer: stored.firstReferrer,
    firstLandingPage: stored.firstLandingPage,
    currentSource,
    currentMedium,
    currentCampaign,
    currentTerm,
    currentContent,
    currentReferrer: externalReferrer || undefined,
  };
}

export function getAttributionSnapshot(): AttributionContext {
  return captureAttribution();
}
