"use client";

/**
 * Example Next.js App Router integration for aspirantmitraa-frontend-ts.
 * Copy into your app (e.g. src/components/AnalyticsProvider.tsx)
 * and wrap the tree from a client Providers component.
 *
 * Page include/exclude comes from aspirantMitraaPageTracking,
 * mapped to real App Router routes (not placeholder /gate/** paths).
 */

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  createAnalytics,
  aspirantMitraaPageTracking,
  type AnalyticsClient,
} from "@aspirantmitraa/analytics";

let client: AnalyticsClient | null = null;

function getClient(): AnalyticsClient {
  if (!client) {
    client = createAnalytics({
      endpoint: "https://analytics.aspirantmitraa.com/events",
      pageTracking: aspirantMitraaPageTracking,
    });
  }
  return client;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastKey = useRef<string>("");

  useEffect(() => {
    const analytics = getClient();
    analytics.init();

    const key = `${pathname}?${searchParams?.toString() ?? ""}`;
    if (key === lastKey.current) return;
    lastKey.current = key;

    analytics.page({ path: pathname });
  }, [pathname, searchParams]);

  return <>{children}</>;
}

/** Call after login / signup with your internal user id. */
export function identifyUser(userId: string): void {
  getClient().identify(userId);
}

/** Call on logout. */
export function resetAnalytics(): void {
  getClient().reset();
}

/** Track a business event from anywhere on the client. */
export function trackEvent(
  name: string,
  properties?: Record<string, unknown>,
): void {
  getClient().track(name, properties);
}
