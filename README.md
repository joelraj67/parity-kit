# 🔍 parity-kit

<p align="center">
  <strong>The AI-native visual, layout, animation & SEO parity scanner for web migrations.</strong><br/>
  Pixel-perfect regression testing. Zero flakes. One command.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/parity-kit"><img src="https://img.shields.io/npm/v/parity-kit?color=orange&label=npm" alt="npm version"/></a>
  <a href="https://www.npmjs.com/package/parity-kit"><img src="https://img.shields.io/npm/dm/parity-kit?color=blue" alt="npm downloads"/></a>
  <a href="https://github.com/joelraj67/parity-kit/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="license"/></a>
  <a href="https://github.com/joelraj67/parity-kit/actions/workflows/ci.yml"><img src="https://github.com/joelraj67/parity-kit/actions/workflows/ci.yml/badge.svg" alt="CI"/></a>
  <a href="https://github.com/joelraj67/parity-kit/actions/workflows/codeql.yml"><img src="https://github.com/joelraj67/parity-kit/actions/workflows/codeql.yml/badge.svg" alt="CodeQL"/></a>
  <img src="https://img.shields.io/badge/tested%20with-Playwright-45ba62.svg" alt="Playwright"/>
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg" alt="node"/>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-why-parity-kit">Why</a> •
  <a href="#-comparison">vs Percy / Chromatic</a> •
  <a href="#%EF%B8%8F-configuration">Config</a> •
  <a href="#-programmatic-api">API</a> •
  <a href="#-cicd">CI</a>
</p>

> Migrating ASP.NET MVC / Razor / PHP / WordPress / Rails -> Next.js / Remix / Astro / Nuxt? **parity-kit** diffs your live baseline against your new build across viewports and ships an interactive dashboard — so AI-accelerated migrations don't ship visual or SEO regressions.

---

## ✨ What it does

| Capability | Detail |
|---|---|
| Pixel-perfect diff | pixelmatch + pngjs with tunable threshold (filters subpixel AA) |
| CSS inspector | Deltas on h1/h2/p/button/nav/container — font-size, line-height, padding, margin |
| Animation audit | CSS transitions / keyframes + hover/click/scroll scenario hooks |
| SEO parity | title, meta, OG, Twitter, canonical, JSON-LD |
| Zero-flake | Freeze animations, hide caret, hide scrollbars, waitForFonts, img.decode() |
| Auto-discovery | --sitemap or --crawl — no manual route list |
| Dashboard | Standalone HTML: side-by-side, swipe scrubber, onion-skin, CSS inspector, console/network health |

**Dashboard preview:** run a scan -> open `parity-report/index.html` (self-contained, no server needed).

---

## 🚀 Quick start

```bash
# 1. Zero-config — compare prod vs local
npx parity-kit https://production.example.com http://localhost:3000

# 2. Auto-discover from sitemap
npx parity-kit --sitemap https://production.example.com/sitemap.xml --current http://localhost:3000

# 3. Crawl internal links
npx parity-kit --crawl --sitemap https://example.com/sitemap.xml --current http://localhost:3000

# 4. Config file (recommended for CI)
npx parity-kit init --baseline https://example.com --current http://localhost:3000
npx parity-kit --config parity.config.json
```

Short alias: `npx parity --help` · legacy `npx web-parity-kit` still works.

---

## 📦 Installation

```bash
npm i -D parity-kit        # project-local
# or
npm i -g parity-kit        # global CLI
npx playwright install chromium  # first run only
```

**Requirements:** Node.js >= 18.

---

## 🧠 Why parity-kit

AI can port a 200-page site in a day. The bottleneck isn't code — it's **trust**: did the hero still align, did the SEO schema survive, did the dropdown animation regress on mobile?

| Without parity-kit | With parity-kit |
|---|---|
| Manual click-through, eyeballing | Deterministic pixel + CSS + SEO diff |
| "Looks fine on my machine" (mac vs win scrollbar) | Scrollbars hidden, fonts awaited, animations frozen |
| SEO break discovered post-indexing | CI fails PR if failOnDiffThreshold exceeded |

Built for **migration parity**, not just Storybook — compare full served pages.

---

## 🔄 Comparison

| Tool | Scope | Self-hosted | SEO check | Cost |
|---|---|---|---|---|
| **parity-kit** | Full-page parity (visual + CSS + SEO) | Yes, local | Yes | Free (MIT) |
| Percy (BrowserStack) | Visual snapshots | No (cloud) | No | Paid |
| Chromatic | Storybook | No (cloud) | No | Paid |
| BackstopJS | Visual regression | Yes | No | Free |
| Lost Pixel | Pages + Storybook | Self-host | No | Free/paid |

Use Percy/Chromatic for component libraries; use **parity-kit** for site migration confidence (routes, redirects, SEO, layout).

---

## ⚙️ Configuration

`parity.config.json` (from `npx parity-kit init`):

```json
{
  "baselineBaseUrl": "https://example.com",
  "currentBaseUrl": "http://localhost:3000",
  "outputDir": "./parity-report",
  "threshold": 0.1,
  "failOnDiffThreshold": 2.0,
  "viewports": [
    { "name": "desktop", "width": 1280, "height": 800 },
    { "name": "mobile", "width": 375, "height": 812 }
  ],
  "freezeAnimations": true,
  "waitForFonts": true,
  "triggerScrollAnimations": true,
  "maskSelectors": [".live-clock", ".dynamic-timestamp"],
  "scenarios": [
    { "name": "Dropdown hover", "action": "hover", "selector": ".nav-item.dropdown", "waitFor": ".dropdown-menu.show", "delay": 300 }
  ],
  "routes": [
    { "name": "Homepage", "path": "/", "baselinePath": "/" },
    { "name": "About", "path": "/about", "baselinePath": "/about-us" }
  ]
}
```

| Key | Default | Note |
|---|---|---|
| threshold | 0.1 | Pixelmatch color distance (0 strict) |
| failOnDiffThreshold | 1.0 | % mismatch to fail CI |
| sitemapUrl / crawl | — | Auto-discover routes |
| maskSelectors | — | Hide dynamic regions |
| scenarios | — | Hover/click/scroll before capture |

---

## 💻 Programmatic API

```ts
import { runParityScan } from "parity-kit";

const results = await runParityScan({
  baselineBaseUrl: "https://production.example.com",
  currentBaseUrl: "http://localhost:3000",
  threshold: 0.1,
  viewports: [{ name: "desktop", width: 1280, height: 800 }],
  routes: [{ name: "Homepage", path: "/" }]
});

console.log(`Passed: ${results.filter(r => r.passed).length} / ${results.length}`);
```

Types: `import type { ParityConfig, ParityResult } from "parity-kit"` — see `src/types.d.ts`.

---

## 🤖 CI/CD

### GitHub Actions (PR comment with diff table)

```yaml
name: Visual & SEO Parity Check
on: [pull_request]
jobs:
  parity-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build && npm start &
      - run: npx parity-kit --config parity.config.json --output-md pr-summary.md
      - uses: actions/github-script@v7
        if: always()
        with:
          script: |
            const fs = require('fs');
            if (fs.existsSync('pr-summary.md')) {
              const body = fs.readFileSync('pr-summary.md','utf8');
              github.rest.issues.createComment({ issue_number: context.issue.number, owner: context.repo.owner, repo: context.repo.repo, body });
            }
```

Upload `parity-report/` as artifact for the HTML dashboard. See `.github/workflows/ci.yml`.

### Local CI fail gate
`failOnDiffThreshold: 2.0` -> process exits 1 if any route exceeds 2% mismatch.

---

## 🛡️ Edge cases handled

1. **AOS / scroll animations** — virtually scrolls to trigger IntersectionObserver, then zeroes motion.
2. **FOIT/FOUT** — awaits `document.fonts.ready`.
3. **Caret blink** — `caret-color: transparent` + blur.
4. **Scrollbar width** — hides scrollbars cross-OS.
5. **Embeds/trackers** — auto-masks Maps, YouTube, cookie banners, HubSpot/Intercom/Crisp/Drift.
6. **Progressive images** — awaits `img.decode()`.
7. **Console/network** — captures 4xx/5xx + JS exceptions into report.

---

## 🗺️ Roadmap

- [ ] Baseline auto-update (`--update-baseline`)
- [ ] Trace viewer integration
- [ ] Storybook component mode
- [ ] SARIF output for GitHub code scanning

PRs welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 🤝 Contributing & community

- [Contributing guide](CONTRIBUTING.md) · [Code of Conduct](CODE_OF_CONDUCT.md) · [Security](SECURITY.md) · [Changelog](CHANGELOG.md)
- Discussions: [GitHub Discussions](https://github.com/joelraj67/parity-kit/discussions)
- Issues: [Bug / Feature templates](https://github.com/joelraj67/parity-kit/issues/new/choose)

---

## 📄 License

MIT © [Joel Raj Bathula](https://github.com/joelraj67)
