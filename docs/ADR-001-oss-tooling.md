# ADR-001: OSS hygiene & tooling for parity-kit

Status: Accepted
Date: 2026-08-30
Scope: Code quality + OSS hygiene (pixel-diff engine unchanged)

## Context

`parity-kit` is a published npm CLI (Node >=18, ESM, Playwright + pixelmatch). It already
ships strong OSS surface: README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CHANGELOG,
issue/PR templates, FUNDING, and a multi-Node CI. The gaps are in **engineering hygiene**:

- `npm run lint` is only `node --check` (syntax only) — no style, no bug-catching rules.
- `src/types.d.ts` is shipped but **never type-checked**; `package.json` has no typecheck step.
- Exactly **one** test file (`test/cli.test.js`) exists for ~13 source modules.
- CI runs `node --check src/index.js` and `--help`, but **never runs `npm test`** or lint properly.

Goal: bring the project to expert-level OSS quality without touching the parity engine.

## Research (current best practice, 2026)

- ESLint v9 uses **flat config** (`eslint.config.js`). ESLint 10 (Feb 2026) removed legacy
  `.eslintrc` and raised the Node floor to `^20.19 || ^22.13 || >=24`. Because `engines` is
  `>=18`, we pin **ESLint 9** to keep Node 18.18+ CI/runtime working. Use `@eslint/js`
  `recommended`, the `globals` package for node/browser globals, and `eslint-config-prettier`
  to avoid rule/format conflicts.
- **Prettier 3** for formatting; ESLint defers formatting to it.
- **Type-checking plain JS**: `tsc --noEmit` with `allowJs: true` + `checkJs: true` applies
  TypeScript's checker to `.js` via JSDoc and validates `types.d.ts`. This is the lowest-risk
  path to real type safety without rewriting to `.ts`.
- **Testing**: Node's built-in `node:test` is production-ready in 2026 (built-in mocking,
  V8 coverage via `--experimental-test-coverage`). `c8` wraps it to add **threshold gating**
  and lcov for Codecov. Use a **ratchet** baseline (fail only if coverage drops below an
  accepted floor) rather than a high fixed bar that blocks on legacy gaps.
- **CI**: lint + typecheck + test-with-coverage on the Node 18/20/22 matrix; upload coverage.
- **Supply chain**: add Dependabot (`gem`/`github-actions`/`npm`) for ongoing hygiene.

## Decisions

1. Add `eslint` (^9) + `@eslint/js` + `globals` + `prettier` + `eslint-config-prettier`.
   - `eslint.config.js` (flat) targeting `src/**/*.js`, `bin/**/*.js`, `test/**/*.js`.
   - `npm run lint` → `eslint .`; `npm run lint:fix` → `eslint . --fix`.
2. Add `prettier` config (`.prettierrc`) + `.prettierignore`.
3. Add `typescript` (dev) + `jsconfig.json` (`allowJs`, `checkJs`, `noEmit`, strict null
   checks) so `npm run typecheck` (`tsc --noEmit`) exercises `src/types.d.ts`. Fix surfaced
   type errors as part of the typecheck item.
4. Expand `node:test` unit tests for pure modules (diff math, CSS delta, SEO scan, config
   resolution, sitemap parsing, reporter rendering) **without importing Playwright at
   module top-level** so they run fast and in CI without a browser. Keep `test/cli.test.js`.
5. Add `c8` (+ `*.test.js` coverage) and a `test:coverage` script with a ratchet threshold;
   emit lcov for Codecov.
6. Harden `ci.yml`: `npm ci` → `lint` → `typecheck` → `test:coverage` on Node 18/20/22;
   upload coverage artifact; add `.github/dependabot.yml`.
7. Do **not** add husky/commitlint (keeps the "minimal and boring" contributor promise in
   CONTRIBUTING); revisit only if contributors ask.

## Consequences

- Contributors get real lint feedback and type checking before CI.
- `types.d.ts` becomes a checked contract, not dead documentation.
- PRs must keep or raise coverage on touched code; CI fails on regressions.
- Node 18 remains supported (ESLint 9 pin).

## Map to goal checklist

| # | Checklist item | Backed by |
|---|---|---|
| 1 | Real lint + formatting | Decision 1–2 |
| 2 | Typecheck step for `types.d.ts` | Decision 3 |
| 3 | Research + recommendations (this ADR) | Research section |
| 4 | Expand unit tests + wire into CI | Decisions 4–5 |
| 5 | Harden CI + coverage + Dependabot | Decision 6 |
| 6 | Final verification | all of the above |
