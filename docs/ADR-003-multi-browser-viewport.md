# ADR-003: Multi-browser × multi-viewport parity matrix

Status: Accepted
Date: 2026-08-30

## Context

Operator asked for parity to be "truly genuine" by accepting **multiple browsers and
resolutions** as inputs. A single Chromium desktop screenshot is not a real parity signal:
the same DOM/CSS renders differently across engines (Chromium/Firefox/WebKit) and across
viewport sizes, which is exactly where migration regressions hide (responsive breakage,
engine-specific CSS interpretation). Research (Karate Labs, Applitools, BrowserStack/Percy)
is clear that cross-browser + multi-viewport coverage is what makes visual parity meaningful.

## Decision

1. Add a `browsers` config option (`("chromium" | "firefox" | "webkit")[]`), default
   `["chromium"]` (keeps CI green since the pipeline installs only Chromium).
2. `src/index.js` now iterates **every `browser × viewport × route`** combination, launching
   each browser via a `launchBrowser(name)` helper and capturing baseline + current with the
   *same* browser/viewport (like-for-like comparison, never cross-engine).
3. Each `ParityTestResult` carries a `browser` field; the dashboard (`src/reporter.js`) and
   Markdown summary show the browser, and artifacts are namespaced
   (`<route>-<browser>-<viewport>-*`).
4. CLI gains `--browsers`/`-B` and `--viewports`/`-V` (comma-separated `WxH`) flags;
   `bin/cli.js` parses and forwards them.
5. Unsupported browser names are rejected early with a clear error (`launchBrowser`).

## Consequences

- Genuine parity: run `npx parity-kit <base> <current> -B chromium,firefox,webkit -V 1280x800,375x812`.
- Default behavior unchanged (Chromium-only) → CI stays green without extra browser installs.
- Opting into more browsers requires `npx playwright install firefox webkit` (documented in
  `config.browsers` default comment).

## Verification

- `npm run lint` / `npm run typecheck` / `npm run test:coverage` all green (38 tests).
- `test/integration.test.js` asserts the matrix produces `routes × viewports` results, each
  tagged with its `browser`; `test/config.test.js` asserts `browsers` default + override;
  an unsupported-browser test asserts rejection.
