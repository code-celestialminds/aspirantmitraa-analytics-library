# Next.js integration example

Page tracking uses `aspirantMitraaPageTracking`, aligned with `aspirantmitraa-frontend-ts` routes.

### Tracked
Home, exams, PYQ, test series, exam taking, results, dashboard, syllabus, predictors, referral.

### Not tracked
Admin, auth, API/sitemaps, legal, blog/news/updates/authors, about/contact/team.

1. Install the package (path or registry).
2. Copy [`AnalyticsProvider.tsx`](./AnalyticsProvider.tsx) into your app.
3. Wrap your client providers:

```tsx
// src/providers/index.tsx
"use client";

import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { AuthProvider } from "@/context/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AnalyticsProvider>{children}</AnalyticsProvider>
    </AuthProvider>
  );
}
```

4. On login success: `identifyUser(user.id)`.
5. On logout: `resetAnalytics()`.
6. Track product events:

```ts
import { trackEvent } from "@/components/AnalyticsProvider";

trackEvent("TEST_STARTED", { testId: "gate-cse-full-test-01" });
trackEvent("PURCHASE_COMPLETED", {
  productId: "gate-mastery",
  amount: 999,
  currency: "INR",
});
```

Wrap `useSearchParams` usage in a `<Suspense>` boundary if your Next.js version requires it for static rendering.
