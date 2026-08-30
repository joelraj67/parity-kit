export interface Viewport {
  name: string;
  width: number;
  height: number;
}

export interface RouteConfig {
  name: string;
  path: string;
  baselinePath?: string;
}

export interface ScenarioConfig {
  name: string;
  action: "hover" | "click" | "scroll";
  selector?: string;
  distance?: number;
  waitFor?: string;
  delay?: number;
}

export interface ParityConfig {
  baselineBaseUrl: string;
  currentBaseUrl: string;
  outputDir?: string;
  threshold?: number;
  failOnDiffThreshold?: number;
  ssimThreshold?: number;
  viewports?: Viewport[];
  browsers?: ("chromium" | "firefox" | "webkit")[];
  freezeAnimations?: boolean;
  waitForFonts?: boolean;
  triggerScrollAnimations?: boolean;
  maskSelectors?: string[];
  scenarios?: ScenarioConfig[];
  routes?: RouteConfig[];
  sitemapUrl?: string;
  crawl?: boolean;
  maxPages?: number;
  outputMd?: string;
  colorScheme?: "light" | "dark";
  silent?: boolean;
  timeout?: number;
}

export interface VisualDiffResult {
  width: number;
  height: number;
  totalPixels: number;
  diffPixels: number;
  diffPercentage: number;
  ssim?: number;
  diffBuffer?: Buffer;
}

export interface CssDelta {
  element: string;
  property: string;
  baseline: string;
  current: string;
}

export interface SeoIssue {
  field: string;
  baseline: string;
  current: string;
  status: "mismatch" | "info";
}

export interface ParityTestResult {
  route: RouteConfig;
  viewport: Viewport;
  browser?: string;
  passed: boolean;
  visual: VisualDiffResult | null;
  seo: { match: boolean; issues: SeoIssue[] } | null;
  cssDeltas: CssDelta[];
  animations: Record<string, any> | null;
  interactiveStates: any[];
  consoleErrors: string[];
  networkErrors: { url: string; status: number }[];
  perf?: {
    domContentLoaded: number;
    loadTime: number;
    ttfb: number;
    totalDomElements: number;
    resourceCount: number;
  };
  paths: {
    baselineRelative: string;
    currentRelative: string;
    diffRelative: string;
  };
  error?: string | null;
}

export function runParityScan(options?: ParityConfig | string): Promise<ParityTestResult[]>;
