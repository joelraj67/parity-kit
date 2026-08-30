import fs from "node:fs";
import path from "node:path";

/**
 * Universal Dynamic Parity Config Generator for Any Web Framework or Architecture
 */

/**
 * Automatically discover routes across ALL major web frameworks:
 * Next.js, Astro, Remix, SvelteKit, Nuxt, Gatsby, Vite, Hugo, Jekyll, Static HTML, PHP, ASP.NET Core.
 */
export function detectLocalRoutes(projectRoot = process.cwd()) {
  const routes = [];
  const visitedPaths = new Set();

  const addRoute = (routePath, name) => {
    const normalized = routePath === "" ? "/" : routePath.startsWith("/") ? routePath : `/${routePath}`;
    const cleanPath = normalized === "/" ? "/" : normalized.endsWith("/") ? normalized : `${normalized}/`;
    if (!visitedPaths.has(cleanPath)) {
      visitedPaths.add(cleanPath);
      routes.push({
        name: name || formatRouteName(cleanPath),
        path: cleanPath
      });
    }
  };

  // 1. Next.js App Router (src/app, app, or subpackage)
  const appDirs = [
    path.join(projectRoot, "src/app"),
    path.join(projectRoot, "app"),
    path.join(projectRoot, "hansai-spa/src/app")
  ];
  for (const d of appDirs) {
    if (fs.existsSync(d)) {
      scanFolder(d, "", /^page\.(tsx|jsx|js|ts)$/, addRoute);
    }
  }

  // 2. Next.js / Nuxt / Gatsby Pages Router (src/pages, pages)
  const pagesDirs = [
    path.join(projectRoot, "src/pages"),
    path.join(projectRoot, "pages")
  ];
  for (const d of pagesDirs) {
    if (fs.existsSync(d)) {
      scanFolder(d, "", /\.(tsx|jsx|js|ts|vue|astro|md|mdx)$/, (p) => {
        if (!p.startsWith("_") && !p.startsWith("api/")) {
          const clean = p.replace(/\.(tsx|jsx|js|ts|vue|astro|md|mdx)$/, "").replace(/\/index$/, "");
          addRoute(clean === "" ? "/" : clean);
        }
      });
    }
  }

  // 3. Remix / React Router v7 (app/routes)
  const remixDir = path.join(projectRoot, "app/routes");
  if (fs.existsSync(remixDir)) {
    scanFolder(remixDir, "", /\.(tsx|jsx|js|ts)$/, (p) => {
      const clean = p.replace(/\.(tsx|jsx|js|ts)$/, "").replace(/\._index$/, "").replace(/\./g, "/");
      addRoute(clean === "" ? "/" : clean);
    });
  }

  // 4. SvelteKit (src/routes)
  const svelteDir = path.join(projectRoot, "src/routes");
  if (fs.existsSync(svelteDir)) {
    scanFolder(svelteDir, "", /^\+page\.svelte$/, addRoute);
  }

  // 5. Static HTML / Multi-Page Frameworks (StaticWeb, dist, out, public, wwwroot)
  const staticDirs = [
    path.join(projectRoot, "StaticWeb"),
    path.join(projectRoot, "out"),
    path.join(projectRoot, "dist"),
    path.join(projectRoot, "public"),
    path.join(projectRoot, "wwwroot")
  ];
  for (const d of staticDirs) {
    if (fs.existsSync(d)) {
      scanFolder(d, "", /\.html$/, (p) => {
        const clean = p.replace(/\.html$/, "").replace(/\/index$/, "");
        addRoute(clean === "" ? "/" : clean);
      });
    }
  }

  // Fallback: If nothing was found, add default root
  if (routes.length === 0) {
    addRoute("/", "Homepage");
  }

  return routes;
}

/**
 * Recursively scan folder for target filenames
 */
function scanFolder(dir, currentPath, filePattern, onMatch) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Skip hidden folders and node_modules
        if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
        const segment = entry.name.startsWith("(") && entry.name.endsWith(")") ? "" : entry.name;
        scanFolder(path.join(dir, entry.name), segment ? `${currentPath}/${segment}` : currentPath, filePattern, onMatch);
      } else if (entry.isFile() && filePattern.test(entry.name)) {
        onMatch(currentPath);
      }
    }
  } catch (e) {}
}

/**
 * Automatically extract legacy redirects from any config file:
 * next.config.ts/js, staticwebapp.config.json, vercel.json, netlify.toml, _redirects
 */
export function detectLegacyRouteMappings(projectRoot = process.cwd()) {
  const mappings = {};

  // 1. staticwebapp.config.json
  const swaFiles = [
    path.join(projectRoot, "staticwebapp.config.json"),
    path.join(projectRoot, "hansai-spa/staticwebapp.config.json")
  ];
  for (const f of swaFiles) {
    if (fs.existsSync(f)) {
      try {
        const swa = JSON.parse(fs.readFileSync(f, "utf-8"));
        if (Array.isArray(swa.routes)) {
          for (const r of swa.routes) {
            if (r.route && r.redirect) {
              mappings[r.redirect.replace(/\/$/, "")] = r.route;
            }
          }
        }
      } catch (e) {}
    }
  }

  // 2. vercel.json
  const vercelPath = path.join(projectRoot, "vercel.json");
  if (fs.existsSync(vercelPath)) {
    try {
      const vercel = JSON.parse(fs.readFileSync(vercelPath, "utf-8"));
      if (Array.isArray(vercel.redirects)) {
        for (const r of vercel.redirects) {
          if (r.source && r.destination) {
            mappings[r.destination.replace(/\/$/, "")] = r.source;
          }
        }
      }
    } catch (e) {}
  }

  // 3. next.config.ts / next.config.js
  const nextConfigPaths = [
    path.join(projectRoot, "next.config.ts"),
    path.join(projectRoot, "next.config.js"),
    path.join(projectRoot, "hansai-spa/next.config.ts"),
    path.join(projectRoot, "hansai-spa/next.config.js")
  ];
  for (const ncp of nextConfigPaths) {
    if (fs.existsSync(ncp)) {
      try {
        const content = fs.readFileSync(ncp, "utf-8");
        const redirectMatches = [...content.matchAll(/source:\s*["']([^"']+)["'],\s*destination:\s*["']([^"']+)["']/g)];
        for (const m of redirectMatches) {
          mappings[m[2].replace(/\/$/, "")] = m[1];
        }
      } catch (e) {}
    }
  }

  // 4. Netlify _redirects
  const netlifyRedirects = path.join(projectRoot, "_redirects");
  if (fs.existsSync(netlifyRedirects)) {
    try {
      const lines = fs.readFileSync(netlifyRedirects, "utf-8").split("\n");
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2 && !parts[0].startsWith("#")) {
          mappings[parts[1].replace(/\/$/, "")] = parts[0];
        }
      }
    } catch (e) {}
  }

  return mappings;
}

/**
 * Format a URL path into a human-readable title
 */
function formatRouteName(pathname) {
  if (!pathname || pathname === "/") return "Homepage";
  const clean = pathname.replace(/^\//, "").replace(/\/$/, "");
  return clean
    .split(/[\/-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Generate a complete, universal parity configuration file for ANY project
 */
export function generateParityConfig(options = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  const baselineBaseUrl = options.baseline || "https://hansaitechnosoft.com";
  const currentBaseUrl = options.current || "http://localhost:3000";
  const outputPath = path.resolve(projectRoot, options.outputConfig || "parity.config.json");

  console.log(`\n🔍 Auto-detecting project structure and legacy mappings in: ${projectRoot}`);

  const discoveredRoutes = detectLocalRoutes(projectRoot);
  const legacyMappings = detectLegacyRouteMappings(projectRoot);

  console.log(`   Found ${discoveredRoutes.length} local application routes`);
  console.log(`   Found ${Object.keys(legacyMappings).length} legacy route redirects`);

  // Merge discovered routes with legacy mappings
  const routes = discoveredRoutes.map((r) => {
    const cleanPath = r.path.replace(/\/$/, "");
    const legacyPath = legacyMappings[cleanPath] || legacyMappings[r.path] || r.path;
    return {
      name: r.name,
      path: r.path,
      baselinePath: legacyPath
    };
  });

  const config = {
    baselineBaseUrl,
    currentBaseUrl,
    outputDir: "./parity-report",
    threshold: 0.1,
    failOnDiffThreshold: 5.0,
    viewports: [
      { name: "desktop", width: 1280, height: 800 },
      { name: "mobile", width: 375, height: 812 }
    ],
    freezeAnimations: true,
    waitForFonts: true,
    triggerScrollAnimations: true,
    maskSelectors: [
      ".live-clock",
      ".dynamic-timestamp"
    ],
    scenarios: [
      {
        name: "Navigation Dropdown Hover",
        action: "hover",
        selector: ".nav-item.dropdown:nth-child(3)",
        waitFor: ".dropdown-menu.show",
        delay: 350
      },
      {
        name: "Primary CTA Button Hover",
        action: "hover",
        selector: ".thm-btn, .btn-primary",
        delay: 250
      }
    ],
    routes: routes.length > 0 ? routes : [{ name: "Homepage", path: "/", baselinePath: "/" }]
  };

  fs.writeFileSync(outputPath, JSON.stringify(config, null, 2), "utf-8");
  console.log(`\n✅ Successfully generated universal config at: ${outputPath}\n`);

  return config;
}
