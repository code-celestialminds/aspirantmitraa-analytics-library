import { describe, expect, it } from "vitest";
import { shouldTrackPath } from "../src/pageMatcher";
import { aspirantMitraaPageTracking } from "../src/presets";

describe("aspirantMitraaPageTracking preset", () => {
  const cfg = aspirantMitraaPageTracking;

  it("tracks product journeys", () => {
    const included = [
      "/",
      "/exams",
      "/exams/gate-cse",
      "/pyq",
      "/pyq/gate-cse/topic-wise",
      "/pyq/question/gate/2024/os/some-q",
      "/test-series",
      "/test-series/gate-full-mock",
      "/my-test-series/abc123",
      "/exam/start",
      "/exam/attempt-1",
      "/exam/result/attempt-1",
      "/results",
      "/results/attempt-1/detail",
      "/results/compare/exam-1",
      "/dashboard",
      "/dashboard/my-test-series",
      "/dashboard/purchases",
      "/dashboard/results/compare/exam-1",
      "/syllabus/gate-cse",
      "/referral",
    ];

    for (const path of included) {
      expect(shouldTrackPath(path, cfg), path).toBe(true);
    }
  });

  it("tracks real predictor URL shapes", () => {
    const predictors = [
      "/jee-main-rank-predictor",
      "/jee-advanced-rank-predictor",
      "/jee-rank-predictor-for-2026",
      "/free-jee-rank-predictor",
      "/jee-college-predictor",
      "/neet-rank-predictor",
      "/neet-rank-predictor-no-login",
      "/neet-rank-predictor-ai-analysis",
      "/neet-rank-predictor-2026",
      "/neet-rank-predictor-720-marks",
      "/free-neet-rank-predictor",
      "/mht-cet-rank-predictor",
      "/mht-cet-rank-predictor-150",
      "/mht-cet-rank-predictor-2026",
      "/free-mht-cet-rank-predictor",
      "/jee-rank-predictor-180-marks",
    ];

    for (const path of predictors) {
      expect(shouldTrackPath(path, cfg), path).toBe(true);
    }
  });

  it("excludes admin, auth, api, legal, and marketing noise", () => {
    const excluded = [
      "/admin",
      "/admin/dashboard",
      "/admin/dashboard/users",
      "/admin/dashboard/pyq/questions",
      "/auth/login",
      "/auth/register",
      "/auth/verify",
      "/auth/forgot-password",
      "/api/revalidate",
      "/privacy-policy",
      "/terms-of-service",
      "/cookie-policy",
      "/refund-policy",
      "/editorial-policy",
      "/about",
      "/contact",
      "/our-team",
      "/career-guidance",
      "/blog",
      "/blog/some-post",
      "/news",
      "/news/some-article",
      "/updates",
      "/update/some-update",
      "/authors/jane",
      "/sitemap.xml",
      "/sitemap-blog.xml",
    ];

    for (const path of excluded) {
      expect(shouldTrackPath(path, cfg), path).toBe(false);
    }
  });

  it("does not track unknown one-off paths", () => {
    expect(shouldTrackPath("/random-page", cfg)).toBe(false);
    expect(shouldTrackPath("/internal/debug", cfg)).toBe(false);
  });
});
