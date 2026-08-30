# ADR-002: Perceptual (SSIM) diff gate to cut false-positive deviation

Status: Accepted
Date: 2026-08-30
Supersedes/extends: ADR-001 (OSS hygiene)

## Context

The goal's "pixel perfections / expert level" requirement, plus operator feedback to
"have less error and deviation rate", targets the dominant failure mode of visual
regression tooling: **false positives from raw pixel diffing**. Research (2025-2026)
is consistent:

- Raw pixel diffs generate **20-40% false-positive rates** in real projects because of
  anti-aliasing, font-rendering variance, and macOS-vs-Linux/macOS-vs-CI differences
  ([bug0.com](https://bug0.com/knowledge-base/what-is-visual-regression-testing)).
- The fix is a **perceptual metric** (SSIM, or YIQ/CIELAB color distance) that tolerates
  cosmetic noise while still catching real layout/color regressions
  ([thepixelhouse.co.uk](https://thepixelhouse.co.uk/blog/how-visual-diffing-works),
  [wopee.io](https://wopee.io/blog/screenshot-comparison-algorithms-visual-testing/)).
- Best practice is **hybrid**: structural/DOM + perceptual pixel diff, with AI only as a
  *review/triage* layer — not as the judge
  ([dev.to/delta-qa](https://dev.to/delta-qa/screenshot-testing-the-complete-guide-to-visual-screenshot-testing-in-2026-2nei),
  [wopee.io](https://wopee.io/blog/screenshot-comparison-algorithms-visual-testing/)).
  LLMs are unreliable as the diff engine itself (Dirnstorfer/InfoQ: Claude/Gemini/GPT
  failed to spot a missing street that a tiny CNN caught).

parity-kit was already hybrid (pixelmatch + CSS inspector + SEO). The missing piece was a
perceptual gate so benign subpixel/Anti-aliasing noise stops tripping `failOnDiffThreshold`.

## Decision

1. Add **windowed mean SSIM** to `src/diff-engine.js`:
   - Downscale each normalized RGBA buffer to a **256×256 luminance (Y) field** via
     nearest-neighbour sampling (no zero-padding, correct for up- and downscaling).
   - Compute SSIM per **8×8 window** (Wang et al., 2004; C1=(0.01·255)², C2=(0.03·255)²)
     and average → `visual.ssim` in `[0,1]`.
   - Windowing (not global) avoids the single-window degeneracy when a reference region is
     a constant field (global covariance terms vanish → misleading low SSIM).
2. Add `ssimThreshold` (default **0.98**) to `DEFAULT_CONFIG`, `ParityConfig`, and the
   generated config in `config-generator.js`.
3. Make the verdict in `src/index.js` hybrid:
   `passed = pixelPass || (ssimThreshold set && visual.ssim >= ssimThreshold)`.
   Pixel diff remains the primary detector; SSIM only *relieves* a pixel-fail when the page
   is perceptually near-identical. This reduces deviation without hiding genuine regressions
   (a real layout/color break drops SSIM well below 0.98).
4. Surface SSIM in the dashboard (`src/reporter.js`): per-route `SSIM %` and an
   `Average SSIM` metric card, so reviewers see *why* a route passed.

## Consequences

- Cosmetic, perceptually-identical changes (AA/font noise, 1px tint) no longer fail CI by
  default → lower deviation/false-positive rate, matching the operator's ask.
- Genuine regressions still fail (pixel gate + SSIM floor 0.98).
- Tunable: set `ssimThreshold` higher (stricter) or omit it (pure pixel gating) per project.
- Added tests: `diff-engine.test.js` (SSIM bounds) + `integration.test.js` proves the gate
  suppresses a cosmetic change while the same change fails without the gate.

## Verification

- `npm run lint`, `npm run typecheck`, `npm run test:coverage` all green (34 tests; coverage
  75% lines / 90% functions with Chromium installed).
- Integration test asserts: cosmetic change → `passed: true` with gate, `passed: false`
  without it.
