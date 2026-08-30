import fs from "node:fs";
import path from "node:path";

/**
 * Generate a standalone, interactive visual, computed CSS, and SEO parity dashboard HTML report
 */
export function generateHtmlReport(results, config, outputDir) {
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = totalTests - passedTests;
  const avgDiff =
    results.reduce((acc, r) => acc + (r.visual?.diffPercentage || 0), 0) /
    (totalTests || 1);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visual, CSS & SEO Parity Audit Dashboard - Web Parity Kit</title>
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: #151d30;
      --card-border: #23304b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #38bdf8;
      --primary-glow: rgba(56, 189, 248, 0.2);
      --success: #22c55e;
      --danger: #ef4444;
      --warning: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: var(--bg); color: var(--text); padding: 2rem; line-height: 1.5; }
    .container { max-width: 1440px; margin: 0 auto; }
    header { margin-bottom: 2rem; border-bottom: 1px solid var(--card-border); padding-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem; }
    h1 { font-size: 2rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 0.75rem; letter-spacing: -0.02em; }
    .subtitle { color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem; }
    
    /* Metrics Grid */
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 2rem; }
    .metric-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; padding: 1.25rem; }
    .metric-title { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin-bottom: 0.25rem; }
    .metric-value { font-size: 2rem; font-weight: 800; }
    .metric-value.pass { color: var(--success); }
    .metric-value.fail { color: var(--danger); }
    .metric-value.info { color: var(--primary); }

    /* Filter Controls */
    .controls { display: flex; gap: 1rem; margin-bottom: 2rem; align-items: center; flex-wrap: wrap; justify-content: space-between; }
    .filter-group { display: flex; gap: 0.5rem; }
    .filter-btn { background: var(--card-bg); border: 1px solid var(--card-border); color: var(--text); padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.875rem; transition: all 0.2s; }
    .filter-btn:hover { border-color: var(--primary); }
    .filter-btn.active { background: var(--primary); color: #000; border-color: var(--primary); font-weight: 700; }
    .search-input { background: var(--card-bg); border: 1px solid var(--card-border); color: var(--text); padding: 0.5rem 1rem; border-radius: 8px; min-width: 260px; font-size: 0.875rem; }
    .search-input:focus { outline: 2px solid var(--primary); }

    /* Result Cards */
    .results-list { display: flex; flex-direction: column; gap: 2rem; }
    .result-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
    .result-header { padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--card-border); flex-wrap: wrap; gap: 1rem; }
    .result-title { font-size: 1.2rem; font-weight: 700; display: flex; align-items: center; gap: 0.75rem; }
    .badge { padding: 0.3rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
    .badge.pass { background: rgba(34, 197, 94, 0.15); color: var(--success); border: 1px solid var(--success); }
    .badge.fail { background: rgba(239, 68, 68, 0.15); color: var(--danger); border: 1px solid var(--danger); }
    
    .result-body { padding: 1.5rem; }
    .viewer-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--card-border); padding-bottom: 0.75rem; }
    .tab-btn { background: none; border: none; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; cursor: pointer; padding: 0.4rem 0.85rem; border-radius: 6px; transition: all 0.2s; }
    .tab-btn:hover { color: #fff; }
    .tab-btn.active { background: var(--card-border); color: #fff; }

    /* Comparison Modes */
    .mode-content { display: none; }
    .mode-content.active { display: block; }
    
    .grid-view { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.25rem; }
    .image-box { border: 1px solid var(--card-border); border-radius: 10px; overflow: hidden; background: #000; }
    .image-box-header { padding: 0.6rem 0.85rem; font-size: 0.75rem; font-weight: 700; background: #0f172a; color: var(--text-muted); border-bottom: 1px solid var(--card-border); display: flex; justify-content: space-between; }
    .image-box img { width: 100%; display: block; height: auto; }

    /* Interactive Swipe Slider */
    .swipe-wrapper { position: relative; width: 100%; max-width: 1100px; margin: 0 auto; border: 1px solid var(--card-border); border-radius: 10px; overflow: hidden; background: #000; user-select: none; }
    .swipe-baseline { width: 100%; display: block; }
    .swipe-current-layer { position: absolute; top: 0; left: 0; width: 50%; height: 100%; overflow: hidden; border-right: 3px solid var(--primary); box-shadow: 0 0 12px var(--primary-glow); }
    .swipe-current-layer img { width: 100%; max-width: none; display: block; }
    .swipe-handle { position: absolute; top: 50%; left: 50%; width: 40px; height: 40px; background: var(--primary); border-radius: 50%; transform: translate(-50%, -50%); cursor: ew-resize; display: flex; align-items: center; justify-content: center; color: #000; font-weight: 900; font-size: 1rem; box-shadow: 0 0 15px rgba(56, 189, 248, 0.8); z-index: 10; pointer-events: none; }

    /* Onion Skin Mode */
    .onion-wrapper { position: relative; width: 100%; max-width: 1100px; margin: 0 auto; border: 1px solid var(--card-border); border-radius: 10px; overflow: hidden; background: #000; }
    .onion-wrapper img.base { width: 100%; display: block; }
    .onion-wrapper img.overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.5; }
    .onion-control { margin-top: 1rem; display: flex; align-items: center; gap: 1rem; justify-content: center; }
    .onion-control input { width: 300px; }

    /* Tables */
    .data-table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.875rem; }
    .data-table th, .data-table td { padding: 0.75rem 1rem; border: 1px solid var(--card-border); text-align: left; }
    .data-table th { background: #0f172a; color: var(--text-muted); font-weight: 700; }
    .delta-tag { background: rgba(239, 68, 68, 0.15); color: var(--danger); padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>🔍 Web Parity Kit — Visual, CSS & SEO Audit</h1>
        <p class="subtitle">Generic automated parity scanner comparing <strong>${config.baselineBaseUrl}</strong> (Baseline) vs <strong>${config.currentBaseUrl}</strong> (Modern)</p>
      </div>
      <div style="font-size: 0.85rem; color: var(--text-muted);">
        Scanned at ${new Date().toLocaleString()}
      </div>
    </header>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-title">Total Tests</div>
        <div class="metric-value info">${totalTests}</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Passed (100% Match)</div>
        <div class="metric-value pass">${passedTests}</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Mismatches Detected</div>
        <div class="metric-value ${failedTests > 0 ? "fail" : "pass"}">${failedTests}</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Average Pixel Diff</div>
        <div class="metric-value info">${avgDiff.toFixed(3)}%</div>
      </div>
    </div>

    <div class="controls">
      <div class="filter-group">
        <button class="filter-btn active" onclick="filterCards('all', this)">All Tests (${totalTests})</button>
        <button class="filter-btn" onclick="filterCards('fail', this)">Mismatches (${failedTests})</button>
        <button class="filter-btn" onclick="filterCards('pass', this)">Passed (${passedTests})</button>
      </div>
      <input type="text" class="search-input" placeholder="Filter by route name or path..." oninput="searchCards(this.value)">
    </div>

    <div class="results-list">
      ${results
        .map((r, idx) => {
          const cardId = `test-${idx}`;
          return `
        <div class="result-card" id="${cardId}" data-status="${r.passed ? "pass" : "fail"}" data-name="${r.route.name.toLowerCase()} ${r.route.path}">
          <div class="result-header">
            <div class="result-title">
              <span class="badge ${r.passed ? "pass" : "fail"}">${r.passed ? "PASS" : "DIFF DETECTED"}</span>
              <span>${r.route.name} <code style="color: var(--primary); font-size: 0.9rem;">${r.route.path}</code></span>
              <span style="font-size: 0.85rem; color: var(--text-muted);">[${r.viewport.name} - ${r.viewport.width}x${r.viewport.height}]</span>
            </div>
            <div style="font-size: 0.95rem; font-weight: 700;">
              Diff: <span style="color: ${r.passed ? "var(--success)" : "var(--danger)"}">${r.visual?.diffPercentage || 0}%</span> (${r.visual?.diffPixels?.toLocaleString() || 0} px)
            </div>
          </div>

          <div class="result-body">
            <div class="viewer-tabs">
              <button class="tab-btn active" onclick="switchTab('${cardId}', 'grid', this)">Side-by-Side Grid</button>
              <button class="tab-btn" onclick="switchTab('${cardId}', 'swipe', this)">Interactive Swipe</button>
              <button class="tab-btn" onclick="switchTab('${cardId}', 'onion', this)">Onion Skin</button>
              <button class="tab-btn" onclick="switchTab('${cardId}', 'css', this)">CSS Inspector ${r.cssDeltas?.length ? `(${r.cssDeltas.length})` : ""}</button>
              <button class="tab-btn" onclick="switchTab('${cardId}', 'anim', this)">Animations & Transitions</button>
              <button class="tab-btn" onclick="switchTab('${cardId}', 'seo', this)">SEO & Schema</button>
              <button class="tab-btn" onclick="switchTab('${cardId}', 'perf', this)">Performance</button>
              <button class="tab-btn" onclick="switchTab('${cardId}', 'health', this)">Console & Network ${(r.consoleErrors?.length || 0) + (r.networkErrors?.length || 0) > 0 ? `⚠️` : `✅`}</button>
            </div>

            <!-- Tab 1: 3-Panel Side-by-Side Grid -->
            <div class="mode-content active tab-grid">
              <div class="grid-view">
                <div class="image-box">
                  <div class="image-box-header"><span>BASELINE (Legacy Live)</span><span>${r.visual?.width}x${r.visual?.height}</span></div>
                  <img src="${r.paths.baselineRelative}" alt="Baseline" loading="lazy">
                </div>
                <div class="image-box">
                  <div class="image-box-header"><span>CURRENT (Modern SPA)</span><span>${r.visual?.width}x${r.visual?.height}</span></div>
                  <img src="${r.paths.currentRelative}" alt="Current" loading="lazy">
                </div>
                <div class="image-box">
                  <div class="image-box-header"><span>DIFF HEATMAP (Discrepancies)</span><span>${r.visual?.diffPercentage}% mismatch</span></div>
                  <img src="${r.paths.diffRelative}" alt="Diff Heatmap" loading="lazy">
                </div>
              </div>
            </div>

            <!-- Tab 2: Interactive Swipe Slider -->
            <div class="mode-content tab-swipe">
              <div class="swipe-wrapper" onmousemove="handleSwipe(event, this)">
                <img class="swipe-baseline" src="${r.paths.baselineRelative}" alt="Baseline">
                <div class="swipe-current-layer" style="width: 50%;">
                  <img src="${r.paths.currentRelative}" alt="Current" style="width: ${r.visual?.width}px;">
                </div>
                <div class="swipe-handle" style="left: 50%;">↔</div>
              </div>
              <p style="text-align: center; color: var(--text-muted); font-size: 0.8rem; margin-top: 0.5rem;">Move mouse left/right over image to reveal visual diff</p>
            </div>

            <!-- Tab 3: Onion Skin Transparency Slider -->
            <div class="mode-content tab-onion">
              <div class="onion-wrapper">
                <img class="base" src="${r.paths.baselineRelative}" alt="Baseline">
                <img class="overlay" id="${cardId}-onion-img" src="${r.paths.currentRelative}" alt="Current">
              </div>
              <div class="onion-control">
                <span style="font-size: 0.85rem; color: var(--text-muted);">Baseline (0%)</span>
                <input type="range" min="0" max="100" value="50" oninput="document.getElementById('${cardId}-onion-img').style.opacity = this.value / 100">
                <span style="font-size: 0.85rem; color: var(--text-muted);">Current SPA (100%)</span>
              </div>
            </div>

            <!-- Tab 4: Computed CSS Inspector -->
            <div class="mode-content tab-css">
              ${
                r.cssDeltas?.length
                  ? `
                <table class="data-table">
                  <thead>
                    <tr><th>Element</th><th>CSS Property</th><th>Baseline Value</th><th>Current Value</th></tr>
                  </thead>
                  <tbody>
                    ${r.cssDeltas
                      .map(
                        (d) =>
                          `<tr><td><strong>${d.element}</strong></td><td>${d.property}</td><td><span class="delta-tag">${d.baseline}</span></td><td><span style="color: var(--success); font-weight: 700;">${d.current}</span></td></tr>`
                      )
                      .join("")}
                  </tbody>
                </table>
              `
                  : `<p style="color: var(--success); font-weight: 600; padding: 1rem 0;">✅ All primary typography and layout CSS properties match baseline!</p>`
              }
            </div>

            <!-- Tab 5: Animations & Transitions Inspector -->
            <div class="mode-content tab-anim">
              <table class="data-table">
                <thead>
                  <tr><th>Interactive Target</th><th>Transition Property</th><th>Duration</th><th>Easing Timing Function</th></tr>
                </thead>
                <tbody>
                  ${
                    r.animations
                      ? Object.entries(r.animations)
                          .map(
                            ([target, anim]) =>
                              `<tr><td><strong>${target}</strong></td><td><code>${anim.transitionProperty || "all"}</code></td><td><span style="color: var(--primary); font-weight: bold;">${anim.transitionDuration || "0s"}</span></td><td><code>${anim.transitionTimingFunction || "ease"}</code></td></tr>`
                          )
                          .join("")
                      : `<tr><td colspan="4">No explicit transitions declared</td></tr>`
                  }
                </tbody>
              </table>
            </div>

            <!-- Tab 5: SEO & Schema Inspector -->
            <div class="mode-content tab-seo">
              ${
                r.seo?.issues?.length
                  ? `
                <table class="data-table">
                  <thead>
                    <tr><th>Field</th><th>Baseline Value</th><th>Current SPA Value</th></tr>
                  </thead>
                  <tbody>
                    ${r.seo.issues
                      .map(
                        (issue) =>
                          `<tr><td><strong>${issue.field}</strong></td><td>${issue.baseline || "—"}</td><td>${issue.current || "—"}</td></tr>`
                      )
                      .join("")}
                  </tbody>
                </table>
              `
                  : `<p style="color: var(--success); font-weight: 600; padding: 1rem 0;">✅ SEO meta tags, OpenGraph, and JSON-LD structured schemas match perfectly!</p>`
              }
            </div>

            <!-- Tab 6: Performance Metrics -->
            <div class="mode-content tab-perf">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 0.5rem;">
                <div class="metric-card"><div class="metric-title">DOM Elements</div><div class="metric-value info">${r.perf?.totalDomElements || 0}</div></div>
                <div class="metric-card"><div class="metric-title">Page Load Time</div><div class="metric-value info">${r.perf?.loadTime || 0} ms</div></div>
                <div class="metric-card"><div class="metric-title">TTFB (Server Response)</div><div class="metric-value info">${r.perf?.ttfb || 0} ms</div></div>
                <div class="metric-card"><div class="metric-title">Total Resources</div><div class="metric-value info">${r.perf?.resourceCount || 0}</div></div>
              </div>
            </div>

            <!-- Tab 7: Console & Network Health -->
            <div class="mode-content tab-health">
              ${
                (r.consoleErrors?.length || 0) + (r.networkErrors?.length || 0) > 0
                  ? `
                <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 0.5rem;">
                  ${
                    r.consoleErrors?.length
                      ? `
                    <div>
                      <h4 style="color: var(--danger); font-size: 0.95rem; margin-bottom: 0.5rem;">Console Errors (${r.consoleErrors.length}):</h4>
                      <div style="background: #111827; padding: 1rem; border-radius: 8px; border: 1px solid var(--card-border); font-family: monospace; font-size: 0.8rem; color: #fca5a5;">
                        ${r.consoleErrors.map((e) => `<div>❌ ${e}</div>`).join("")}
                      </div>
                    </div>`
                      : ""
                  }
                  ${
                    r.networkErrors?.length
                      ? `
                    <div>
                      <h4 style="color: var(--warning); font-size: 0.95rem; margin-bottom: 0.5rem;">Failed Network Assets (404/500):</h4>
                      <table class="data-table">
                        <thead><tr><th>Failed Asset URL</th><th>Status Code</th></tr></thead>
                        <tbody>
                          ${r.networkErrors.map((ne) => `<tr><td><code>${ne.url}</code></td><td><span class="delta-tag">${ne.status}</span></td></tr>`).join("")}
                        </tbody>
                      </table>
                    </div>`
                      : ""
                  }
                </div>
              `
                  : `<p style="color: var(--success); font-weight: 600; padding: 1rem 0;">✅ 0 console errors and 0 failed network requests detected!</p>`
              }
            </div>

          </div>
        </div>
        `;
        })
        .join("")}
    </div>
  </div>

  <script>
    function filterCards(status, btn) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.result-card').forEach(card => {
        if (status === 'all' || card.dataset.status === status) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    }

    function searchCards(query) {
      const q = query.toLowerCase();
      document.querySelectorAll('.result-card').forEach(card => {
        if (card.dataset.name.includes(q)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    }

    function switchTab(cardId, tabName, btn) {
      const card = document.getElementById(cardId);
      card.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      card.querySelectorAll('.mode-content').forEach(c => c.classList.remove('active'));
      card.querySelector('.tab-' + tabName).classList.add('active');
    }

    function handleSwipe(e, container) {
      const rect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percent = (x / rect.width) * 100;
      container.querySelector('.swipe-current-layer').style.width = percent + '%';
      container.querySelector('.swipe-handle').style.left = percent + '%';
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(outputDir, "index.html"), html, "utf-8");
}
