# @aspirantmitraa/analytics

Lightweight first-party client analytics for AspirantMitraa.

**collect → enrich → serialize → send** via `navigator.sendBeacon()`.

- Zero runtime dependencies
- SSR-safe for Next.js
- Framework-agnostic
- No client queue, batching, or retries

## Install (from GitHub — no npmjs.com)

Consumers install directly from the GitHub repo (npm builds `dist` via the `prepare` script):

```bash
npm install github:code-celestialminds/aspirantmitraa-analytics#v0.1.0
```

In `package.json`:

```json
{
  "dependencies": {
    "@aspirantmitraa/analytics": "github:code-celestialminds/aspirantmitraa-analytics#v0.1.0"
  }
}
```

### Host this package on GitHub (one-time)

From `aspirantmitraa-analytics/`:

```bash
# 1. Init and push a private repo under code-celestialminds
git init
git add .
git commit -m "chore: initial @aspirantmitraa/analytics package"
gh repo create code-celestialminds/aspirantmitraa-analytics --private --source=. --remote=origin --push

# 2. Tag a version (pin installs to this tag)
git tag v0.1.0
git push origin v0.1.0
```

### Update consumers after a lib change

```bash
# in aspirantmitraa-analytics
npm version patch   # or manually bump version in package.json
git add -A && git commit -m "chore: release v0.1.1"
git tag v0.1.1
git push origin main --tags

# in aspirantmitraa-frontend-ts — bump the tag in package.json, then:
npm install
```

### Private repo access

- **Local:** use SSH (`gh auth login` / SSH key) or a GitHub credential helper so `npm install` can clone.
- **CI (GitHub Actions):** grant the workflow access to the private repo, or use a PAT:

```yaml
- uses: actions/checkout@v4
- run: npm ci
  env:
    # optional if default GITHUB_TOKEN cannot read the other private repo
    NODE_AUTH_TOKEN: ${{ secrets.GH_PACKAGES_READ_TOKEN }}
```

For HTTPS git installs with a PAT:

```json
"@aspirantmitraa/analytics": "git+https://<TOKEN>@github.com/code-celestialminds/aspirantmitraa-analytics.git#v0.1.0"
```

Prefer SSH in `~/.gitconfig` / deploy keys instead of committing tokens.

### Local lib development (optional)

While editing the library before tagging:

```bash
# temporary override
npm install ../aspirantmitraa-analytics
# when done, switch back to the GitHub tag in package.json and npm install
```

## Quick start

```ts
import {
  createAnalytics,
  aspirantMitraaPageTracking,
} from "@aspirantmitraa/analytics";

const analytics = createAnalytics({
  endpoint: "https://analytics.aspirantmitraa.com/events",
  // Mapped to aspirantmitraa-frontend-ts App Router routes
  pageTracking: aspirantMitraaPageTracking,
});

analytics.track("PYQ_VIEW", {
  questionId: "gate-os-2024-12",
  subject: "Operating Systems",
});

analytics.identify("user_xxx");
analytics.page();
analytics.reset();
```

## API

| Method | Description |
|--------|-------------|
| `createAnalytics(options)` | Create a client instance |
| `analytics.init(partial?)` | Optional re-config / bootstrap |
| `analytics.track(name, props?)` | Send one business event |
| `analytics.identify(userId)` | Attach app user id to future events |
| `analytics.page(overrides?)` | Send `PAGE_VIEW` if path matches allowlist |
| `analytics.reset()` | Clear user id, rotate session; keep anon + first-touch |

## Page tracking

Conservative by default: if `include` is empty, **no** page views are sent. `exclude` always wins.

Use the built-in preset for the current frontend:

```ts
import { aspirantMitraaPageTracking } from "@aspirantmitraa/analytics";
```

| Include (product journeys) | Exclude (noise) |
|----------------------------|-----------------|
| `/`, `/exams/**`, `/pyq/**`, `/test-series/**`, `/my-test-series/**`, `/exam/**`, `/results/**`, `/dashboard/**`, `/syllabus/**`, `/*-rank-predictor*`, `/*-college-predictor*`, `/referral` | `/admin/**`, `/auth/**`, `/api/**`, `/sitemap*`, legal pages, `/blog/**`, `/news/**`, `/about`, `/contact`, … |

Call `analytics.page()` yourself on SPA navigations (Next.js App Router example in [`examples/nextjs`](./examples/nextjs)).

## Transport

Primary: `navigator.sendBeacon` with a JSON `Blob` (`application/json`).

Fallback (only if beacon unavailable or returns `false`): `fetch(..., { keepalive: true })`.

Payloads over **60 KiB** drop optional `properties`; if still too large, the event is dropped. Analytics never throws into your app.

## Scripts

```bash
npm test
npm run build
npm run size
```

## License

UNLICENSED — private AspirantMitraa package.
