# Architecture notes

## Scope

This package is a **browser client only**. It does not talk to the AspirantMitraa Express API, MongoDB, Redis, or any queue. The analytics HTTP endpoint and storage live in a separate service.

```text
track/page/identify
       │
  enrich (identity, page, attribution, context)
       │
  sanitize properties
       │
  JSON serialize + UTF-8 size guard (≤ 60 KiB)
       │
  navigator.sendBeacon (Blob application/json)
       │
  optional fetch keepalive if beacon fails/unavailable
```

## Why Blob + JSON

`sendBeacon` accepts string, Blob, FormData, or ArrayBufferView.

- A plain **string** is sent as `text/plain;charset=UTF-8`, which is awkward for a JSON events API.
- **ArrayBuffer / Uint8Array** work but add encode steps without a clear win for small event payloads.
- A **Blob** with `type: "application/json"` sets the correct Content-Type and stays simple.

We measure UTF-8 size of the JSON **string** with `TextEncoder` before wrapping it in a Blob, against a **60 KiB** cap (margin under the 64 KiB Beacon queued-data limit).

## Why no client queue

Product rule: analytics is best-effort and must never affect UI, payments, auth, or API traffic. Queues, IndexedDB, retries, and batching add failure modes and main-thread work. One `track()` = one beacon attempt.

## Identity storage

| Field | Storage | Notes |
|-------|---------|--------|
| `anonymousId` | `localStorage` (+ memory fallback) | Survives sessions |
| `sessionId` + `lastActivity` | `localStorage` | Inactivity timeout (default 30m) |
| `userId` | memory only | Set via `identify()` from the host app |
| First-touch attribution | `localStorage` | Never overwritten |

Storage failures (private mode, quota) fall back to in-memory maps and never throw.

## Page tracking ownership

The core library is framework-agnostic. Next.js client navigations do not reload the document, so the **application** must call `page()` on route changes. The library only decides *whether* a path is allowed via include/exclude globs (conservative: empty include → track nothing).

## SSR

No browser globals are read at module evaluation time. All `window` / `document` / `navigator` / `localStorage` / `crypto` access is gated behind `isBrowser()` inside method bodies.
