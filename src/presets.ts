import type { PageTrackingConfig } from "./types";

/**
 * Page allowlist derived from aspirantmitraa-frontend-ts App Router routes.
 *
 * INCLUDE: product journeys (exams, PYQ, tests, predictors, dashboard) + home + referral.
 * EXCLUDE: admin, auth, API, legal, sitemaps, low-signal marketing pages.
 *
 * Conservative: routes not listed in `include` are not tracked.
 */
export const aspirantMitraaPageTracking: PageTrackingConfig = {
  enabled: true,
  include: [
    // Landing
    "/",

    // Exam discovery & hubs
    "/exams",
    "/exams/**",

    // Previous year questions
    "/pyq",
    "/pyq/**",

    // Test series catalog & purchases
    "/test-series",
    "/test-series/**",
    "/my-test-series",
    "/my-test-series/**",

    // Live exam taking & results
    "/exam",
    "/exam/**",
    "/results",
    "/results/**",

    // Authenticated learner dashboard
    "/dashboard",
    "/dashboard/**",

    // Syllabus study pages
    "/syllabus",
    "/syllabus/**",

    // Rank / college predictors (flat routes + SEO marks pages under /[slug])
    // e.g. /jee-main-rank-predictor, /neet-rank-predictor-720-marks, /free-jee-rank-predictor
    "/*-rank-predictor*",
    "/*-college-predictor*",

    // Growth
    "/referral",
  ],
  exclude: [
    // Internal tools
    "/admin",
    "/admin/**",

    // Auth flows (callbacks, forms — track via SIGNUP/LOGIN events instead)
    "/auth",
    "/auth/**",

    // API / infrastructure
    "/api",
    "/api/**",
    "/sitemap*",
    "/sitemap*.xml",

    // Legal / policy (low signal)
    "/privacy-policy",
    "/terms-of-service",
    "/cookie-policy",
    "/refund-policy",
    "/editorial-policy",

    // Static marketing (prefer explicit CTA events over page noise)
    "/about",
    "/contact",
    "/our-team",
    "/career-guidance",
    "/blog",
    "/blog/**",
    "/news",
    "/news/**",
    "/updates",
    "/update",
    "/update/**",
    "/authors",
    "/authors/**",
  ],
};
