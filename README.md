# 🔍 parity-kit

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/badge/npm-v1.0.0-orange.svg)](https://npmjs.com/package/parity-kit)
[![Playwright](https://img.shields.io/badge/tested%20with-Playwright-green.svg)](https://playwright.dev/)

> **The AI-Native Visual, Layout, Animation & SEO Parity Scanner for Web Migrations and Regression Testing.**

As AI accelerates full-stack web migrations (ASP.NET MVC, Razor, PHP, WordPress, Rails, Ruby -> Next.js, Remix, Astro, Nuxt), the #1 risk is **visual, structural, and SEO regression**.

`parity-kit` provides a deterministic automated audit engine that compares your live production baseline against your new modern build across responsive viewports, generating an interactive visual comparison dashboard.

---

## 🌟 Key Capabilities

- 🎯 **Pixel-Perfect Visual Regression**: Fast, SIMD-filtered pixel diffing using Pixelmatch with configurable color-distance thresholds.
- 📐 **Deep Computed CSS Diagnostics**: Pinpoints exact CSS deltas across semantic tags (`h1`, `h2`, `p`, `button`, `nav`, `container`) showing font size, line height, padding, and margin shifts.
- 🎬 **Micro-Interactions & Animation Auditing**: Audits CSS transition durations, timing functions, and keyframe animations with interactive scenario hooks (`hover`, `click`, `scroll`).
- 🔍 **Semantic SEO & Schema Validation**: Verifies Title, Description, OpenGraph, Twitter Cards, canonical tags, and JSON-LD structured schemas.
- 🛡️ **Zero-Flake Preprocessors**: Automatically freezes CSS animations, hides blinking text cursors, hides cross-OS scrollbars, and awaits web font & image decode readiness.
- 🕷️ **Automated Route Discovery**: Zero-config sitemap parser (`--sitemap`) and recursive internal link crawler (`--crawl`).
- 📊 **Standalone Interactive Dashboard**: Generates a self-contained HTML report with **Side-by-Side View**, **Interactive Swipe Scrubber**, **Onion-Skin Transparency**, **CSS Inspector**, and **Console & Network Health**.

---

## 🚀 Quick Start

### 1. Zero-Config CLI (One-Liner)
Compare any live website against any local or staging build immediately:
```bash
npx parity-kit https://production.example.com http://localhost:3000
```

### 2. Auto-Crawl from Sitemap
```bash
npx parity-kit --sitemap https://production.example.com/sitemap.xml --current http://localhost:3000
```

### 3. Using a Configuration File
```bash
npx parity-kit --config parity.config.json
```

---

## ⚙️ Configuration Reference (`parity.config.json`)

```json
{
  "baselineBaseUrl": "https://github.com/joelraj67/parity-kit",
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
  "maskSelectors": [
    ".live-clock",
    ".dynamic-timestamp"
  ],
  "scenarios": [
    {
      "name": "Navigation Dropdown Hover",
      "action": "hover",
      "selector": ".nav-item.dropdown",
      "waitFor": ".dropdown-menu.show",
      "delay": 300
    }
  ],
  "routes": [
    { "name": "Homepage", "path": "/", "baselinePath": "/" },
    { "name": "About Us", "path": "/about", "baselinePath": "/AboutUs" },
    { "name": "AI Services", "path": "/services/ai", "baselinePath": "/AIServicesPage" }
  ]
}
```

---

## 💻 Programmatic Node.js / TypeScript API

```typescript
import { runParityScan } from "parity-kit";

const results = await runParityScan({
  baselineBaseUrl: "https://production.example.com",
  currentBaseUrl: "http://localhost:3000",
  threshold: 0.1,
  viewports: [{ name: "desktop", width: 1280, height: 800 }],
  routes: [
    { name: "Homepage", path: "/" }
  ]
});

console.log(`Passed: ${results.filter(r => r.passed).length} / ${results.length}`);
```

---

## 🤖 CI/CD Integration

### GitHub Actions Workflow (`.github/workflows/parity.yml`)
```yaml
name: Visual & SEO Parity Check
on: [pull_request]

jobs:
  parity-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build && npm start &
      - run: npx parity-kit --config parity.config.json --output-md pr-summary.md
      - uses: actions/github-script@v7
        if: always()
        with:
          script: |
            const fs = require('fs');
            if (fs.existsSync('pr-summary.md')) {
              const body = fs.readFileSync('pr-summary.md', 'utf8');
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: body
              });
            }
```

---

## 🛡️ Edge Cases Handled

1. **AOS & Scroll-Triggered Animations**: Virtually scrolls the page to trigger all viewport intersection observers, then injects zero-motion CSS before capture.
2. **Font Swap & WebFont Jitter (FOIT/FOUT)**: Awaits `document.fonts.ready` on both baseline and target environments.
3. **Blinking Input Cursors**: Injects `caret-color: transparent !important;` and blurs active elements to prevent random 1px caret diffs.
4. **Cross-OS Scrollbar Differences**: Disables and hides scrollbars across Windows, macOS, and Linux to ensure uniform viewport widths.
5. **Smart Embed & Tracker Masks**: Auto-masks Google Maps iframes, YouTube embeds, cookie consent banners, and chat bubbles (HubSpot, Intercom, Crisp, Drift).
6. **Progressive Image Decoding**: Awaits `img.decode()` on all images so heavy WebP/AVIF graphics never render as blank grey boxes.
7. **Broken Assets & Console Errors**: Listens for JavaScript runtime exceptions and 404/500 asset failures.

---

## 📄 License
MIT © [Joel Raj Bathula](https://hansaitechnosoft.com)
