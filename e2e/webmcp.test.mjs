#!/usr/bin/env node
/**
 * ROYA — WebMCP End-to-End Verification
 *
 * Deterministic e2e test that:
 *   1. Discovers the highest-version Puppeteer-cached Chrome first, then
 *      system Chrome → Edge.
 *   2. Launches with the WebMCP feature flag
 *      ['--enable-features=WebMCP,WebMCPAPI,WebModelContext'].
 *   3. Injects a registerTool wrapper via evaluateOnNewDocument to record
 *      every registered tool BEFORE navigation.
 *   4. Loads the live app, asserts all 8 ROYA tools are registered, and
 *      executes get_production_status + get_weather_forecast to prove they
 *      work end-to-end.
 *   5. Writes screenshots (home, schedule, console tool list) and a
 *      results.json summary.
 *
 * Run:  node e2e/webmcp.test.mjs
 * Env:  ROYA_URL (default https://roya-seven.vercel.app)
 *       PUPPETEER_EXECUTABLE_PATH (optional override)
 */

import puppeteer from "puppeteer";
import { existsSync, mkdirSync, writeFileSync, readdirSync } from "fs";
import { join, basename, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SHOTS_DIR = join(__dirname, "shots");
const RESULTS_FILE = join(__dirname, "results.json");
const TARGET_URL = process.env.ROYA_URL || "https://roya-seven.vercel.app";

const EXPECTED_TOOLS = [
  "analyze_script",
  "get_scene_breakdown",
  "get_weather_forecast",
  "generate_schedule",
  "reschedule_scene",
  "assign_task",
  "get_production_status",
  "export_call_sheet",
];

const WEBMCP_FLAG = "--enable-features=WebMCP,WebMCPAPI,WebModelContext";

/* ------------------------------------------------------------------ */
/* 1. Discover candidates: cached Chrome (highest version) -> Chrome -> Edge */
/* ------------------------------------------------------------------ */

function compareVersions(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  }
  return 0;
}

/** Discover Puppeteer-cached Chrome binaries (win64-<version> dirs), newest first. */
async function discoverCachedChrome() {
  const cacheRoot = join(homedir(), ".cache", "puppeteer", "chrome");
  const found = [];
  if (!existsSync(cacheRoot)) return found;

  const dirs = [];
  let entries = [];
  try { entries = readdirSync(cacheRoot); } catch {}
  for (const entry of entries) {
    const full = join(cacheRoot, entry);
    const verMatch = entry.match(/(\d+\.\d+\.\d+)/);
    if (!verMatch) continue;
    // account for win64-<ver>, or plain <ver> subfolders, and either chrome-win64 / chrome-win / chrome
    for (const sub of ["chrome-win64", "chrome-win", "chrome"]) {
      const p = join(full, sub, "chrome.exe");
      if (existsSync(p)) {
        dirs.push({ ver: verMatch[1], path: p });
        break;
      }
    }
  }
  dirs.sort((a, b) => compareVersions(b.ver, a.ver));
  for (const d of dirs) found.push({ name: "cached-chrome-" + d.ver, path: d.path });
  return found;
}

async function discoverSystemBrowsers() {
  const out = [];
  const candidates = process.platform === "win32"
    ? [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files\\Google\\Chrome SxS\\Application\\chrome.exe",
        join(process.env.LOCALAPPDATA || "", "Google\\Chrome SxS\\Application\\chrome.exe"),
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      ]
    : process.platform === "darwin"
      ? [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
          "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        ]
      : [
          "/usr/bin/google-chrome",
          "/usr/bin/google-chrome-canary",
          "/opt/google/chrome/chrome",
          "/usr/bin/microsoft-edge",
        ];
  for (const p of candidates) {
    if (p && existsSync(p)) {
      out.push({ name: basename(p), path: p });
    }
  }
  return out;
}

async function discoverCandidates() {
  const order = [];
  const seen = new Set();
  const where = (path, name) => {
    if (seen.has(path)) return;
    seen.add(path);
    order.push({ name, path });
  };

  if (process.env.PUPPETEER_EXECUTABLE_PATH && existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    where(process.env.PUPPETEER_EXECUTABLE_PATH, "env");
  }
  for (const c of await discoverCachedChrome()) where(c.path, c.name);
  for (const c of await discoverSystemBrowsers()) where(c.path, c.name);
  return order;
}

/* ------------------------------------------------------------------ */
/* 2. Instrumentation: wrap registerTool to record tools + execute fns */
/* ------------------------------------------------------------------ */

const INSTRUMENT_SNIPPET = `(() => {
  try {
    if (window.__royaTools) return;
    window.__royaTools = {};
    const record = (tool) => {
      try { if (tool && tool.name) window.__royaTools[tool.name] = tool; } catch {}
    };
    const wrap = (mc) => {
      if (!mc) return;
      const orig = mc.registerTool ? mc.registerTool.bind(mc) : null;
      try {
        mc.registerTool = (tool) => {
          try { record(tool); } catch {}
          return orig ? orig(tool) : undefined;
        };
      } catch {}
    };
    wrap(window.document && document.modelContext);
    wrap(window.navigator && navigator.modelContext);
    window.__royaToolNames = () => Object.keys(window.__royaTools);
    window.__royaExecute = async (name, args) => {
      const t = window.__royaTools[name];
      if (!t) return { ok: false, error: "tool not registered" };
      const fn = t.execute || t.handler;
      if (typeof fn !== "function") return { ok: false, error: "no execute/handler on tool" };
      try {
        const r = await fn(args || {});
        return { ok: true, raw: typeof r === "string" ? r : JSON.stringify(r) };
      } catch (e) {
        return { ok: false, error: String(e) };
      }
    };
  } catch (e) { /* ignore */ }
})();`;

/* ------------------------------------------------------------------ */

async function main() {
  mkdirSync(SHOTS_DIR, { recursive: true });
  console.log("=".repeat(72));
  console.log("  ROYA WebMCP E2E Verification");
  console.log("  Target: " + TARGET_URL);
  console.log("=".repeat(72));

  const candidates = await discoverCandidates();
  if (candidates.length === 0) {
    console.error("✖ No Chrome/Edge found. Set PUPPETEER_EXECUTABLE_PATH.");
    process.exit(1);
  }
  console.log("\n[candidates]");
  candidates.forEach((c) => console.log("   - " + c.name + " → " + c.path));

  // Try each candidate with the WebMCP flag until one activates modelContext.
  let chosen = null;
  let boom = null;
  for (const cand of candidates) {
    console.log(`\n[launch] ${cand.name} with ${WEBMCP_FLAG}`);
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        executablePath: cand.path,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", WEBMCP_FLAG],
        defaultViewport: { width: 1440, height: 960 },
      });
    } catch (e) {
      console.log("   launch failed: " + e.message);
      continue;
    }

    const page = await browser.newPage();
    await page.evaluateOnNewDocument(INSTRUMENT_SNIPPET);

    const consoleLog = [];
    page.on("console", (m) => consoleLog.push(`[${m.type()}] ${m.text()}`));
    page.on("pageerror", (e) => consoleLog.push(`[pageerror] ${e.message}`));

    try {
      await page.goto(TARGET_URL, { waitUntil: "networkidle0", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 2500));

      const hasMC = await page.evaluate(() =>
        Boolean(
          (typeof document !== "undefined" && document.modelContext) ||
          (typeof navigator !== "undefined" && navigator.modelContext)
        )
      );

      if (hasMC) {
        chosen = { browser, page, cand, consoleLog };
        console.log("   ✅ modelContext active");
        break;
      } else {
        console.log("   ⚠ modelContext NOT defined — trying next browser");
        await browser.close();
      }
    } catch (e) {
      console.log("   navigation error: " + e.message);
      await browser.close();
    }
  }

  if (!chosen) {
    console.error("\n✖ No browser activated WebMCP (modelContext undefined everywhere).");
    writeFileSync(RESULTS_FILE, JSON.stringify({ error: "no WebMCP browser", tools: [] }, null, 2));
    process.exit(1);
  }

  const { browser, page, cand, consoleLog } = chosen;
  const browserVersion = await page.evaluate(
    () => navigator.userAgent.match(/Chrome\/([\d.]+)/)?.[1] || "unknown"
  );

  console.log("\n[active browser] " + cand.name + " → Chrome " + browserVersion);

  /* ---- 3. Assert registration ---- */
  const registered = await page.evaluate(() => (window.__royaToolNames ? window.__royaToolNames() : []));
  const missing = EXPECTED_TOOLS.filter((t) => !registered.includes(t));
  const allRegistered = missing.length === 0;

  console.log("\n[registered tools] (" + registered.length + ")");
  registered.sort().forEach((t) => console.log("   [✓] " + t));
  console.log("[assert] " + (allRegistered ? "✅ ALL 8 tools registered" : "❌ MISSING: " + missing.join(", ")));

  /* ---- 6. Execute two tools for functional proof ---- */
  console.log("\n[execute] get_production_status + get_weather_forecast");
  const execArgs = {
    get_production_status: {},
    get_weather_forecast: { location: "Studio A", date: "2025-02-03" },
  };
  const execResults = {};
  for (const name of ["get_production_status", "get_weather_forecast"]) {
    const r = await page.evaluate(
      async (n, a) => window.__royaExecute(n, a),
      name,
      execArgs[name]
    );
    execResults[name] = r;
    if (r.ok) {
      console.log("   [OK] " + name + " → " + r.raw.slice(0, 140));
    } else {
      console.log("   [FAIL] " + name + " → " + r.error);
    }
  }
  const execPassed = execResults.get_production_status?.ok && execResults.get_weather_forecast?.ok;

  /* ---- 7. Screenshots ---- */
  console.log("\n[screenshots]");
  await shot(page, join(SHOTS_DIR, "homepage.png"), TARGET_URL, "homepage");
  await shot(page, join(SHOTS_DIR, "schedule.png"), TARGET_URL + "/schedule", "schedule");

  writeFileSync(
    join(SHOTS_DIR, "console.txt"),
    [
      "ROYA WebMCP verification — console (browser: " + cand.name + ", Chrome " + browserVersion + ")",
      "Target: " + TARGET_URL,
      "Modern modelContext: " + (await page.evaluate(() => Boolean(document.modelContext))),
      "",
      "Registered tools:",
      ...registered.sort().map((t) => "  [✓] " + t),
      "",
      "Execution:",
      ...Object.entries(execResults).map(([n, r]) =>
        r.ok ? "  [OK] " + n + " => " + r.raw : "  [FAIL] " + n + " => " + r.error
      ),
      "",
      "Page console (last 25):",
      ...consoleLog.slice(-25).map((l) => "  " + l),
    ].join("\n")
  );
  console.log("   saved console.txt");
  console.log("   saved homepage.png / schedule.png");

  /* ---- 4. results.json ---- */
  const results = {
    appUrl: TARGET_URL,
    activBrowser: cand.name,
    activChromeVersion: browserVersion,
    modelContextSurface: await page.evaluate(() => ({
      document: Boolean(document.modelContext),
      navigator: Boolean(navigator.modelContext),
    })),
    flags: [WEBMCP_FLAG],
    toolCount: registered.length,
    registeredTools: registered.sort(),
    expectedTools: EXPECTED_TOOLS,
    allRegistered,
    missing,
    execution: execResults,
    executionPassed: execPassed,
    verdict: allRegistered && execPassed ? "PASS" : "FAIL",
    timestamp: new Date().toISOString(),
  };
  writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
  console.log("\n[results] saved → " + RESULTS_FILE);

  /* ---- Verdict ---- */
  console.log("\n" + "=".repeat(72));
  console.log("  VERDICT: " + results.verdict);
  console.log("  Activator: " + cand.name + " (Chrome " + browserVersion + ")");
  console.log("  Registered: " + registered.length + "/8 → " + (allRegistered ? "PASS" : "FAIL"));
  console.log("  Executed: " + (execPassed ? "PASS (both tools returned JSON)" : "FAIL"));
  console.log("=".repeat(72));

  await browser.close();
  process.exit(results.verdict === "PASS" ? 0 : 1);
}

async function shot(page, file, url, label) {
  try {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: file, fullPage: true });
  } catch (e) {
    console.log("   screenshot " + label + " failed: " + e.message);
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
