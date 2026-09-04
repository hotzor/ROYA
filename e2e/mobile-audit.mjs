#!/usr/bin/env node
/**
 * ROYA — Mobile Emulation Audit
 *
 * Emulates a phone (390x844, touch) and checks every page for horizontal
 * overflow, saving before/after screenshots and reporting scrollWidth vs
 * innerWidth for each page.
 *
 * Usage:
 *   node e2e/mobile-audit.mjs --before        (capture current/before state)
 *   node e2e/mobile-audit.mjs --after         (capture after fixes)
 *   node e2e/mobile-audit.mjs                 (just report scroll overflow)
 *
 * Env: ROYA_URL (default http://localhost:3000)
 */
import puppeteer from "puppeteer";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOTS_DIR = join(__dirname, "shots");
const TARGET = process.env.ROYA_URL || "http://localhost:3000";

const PAGES = [
  { route: "/", label: "home" },
  { route: "/screenplay", label: "screenplay" },
  { route: "/schedule", label: "schedule" },
  { route: "/board", label: "board" },
  { route: "/dashboard", label: "dashboard" },
];

const tag = process.argv.includes("--before") ? "before" : process.argv.includes("--after") ? "after" : null;

async function findChrome() {
  const cached = await (async () => {
    try { return puppeteer.executablePath(); } catch { return null; }
  })();
  if (cached && existsSync(cached)) return { path: cached };
  const sys = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Google\\Chrome SxS\\Application\\chrome.exe",
  ].find((p) => existsSync(p));
  return sys ? { path: sys } : { path: cached };
}

async function main() {
  mkdirSync(SHOTS_DIR, { recursive: true });
  const { path } = await findChrome();
  console.log(`[mobile-audit] target=${TARGET} tag=${tag || "report"} chrome=${path}`);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: path,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

  const results = [];
  for (const p of PAGES) {
    try {
      await page.goto(TARGET + p.route, { waitUntil: "networkidle0", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 1200));

      const metrics = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          innerWidth: window.innerWidth,
          vv: window.visualViewport ? window.visualViewport.width : window.innerWidth,
          scrollWidth: doc.scrollWidth,
          scrollHeight: doc.scrollHeight,
          bodyScrollWidth: document.body ? document.body.scrollWidth : 0,
          overflowingElements: (() => {
            const bad = [];
            const all = document.querySelectorAll("*");
            for (const el of all) {
              const r = el.getBoundingClientRect();
              if (r.width > 0 && r.right > window.innerWidth + 1) {
                bad.push({ tag: el.tagName, cls: (el.className || "").toString().slice(0, 60), right: Math.round(r.right) });
              }
              if (bad.length > 8) break;
            }
            return bad;
          })(),
        };
      });

      const overflows = metrics.scrollWidth > metrics.innerWidth;
      const deviceOverflows = metrics.scrollWidth > metrics.vv;
      const hasOverflowEl = metrics.overflowingElements.length > 0;

      let shot = "";
      if (tag) {
        shot = `${SHOTS_DIR}/mobile-${tag}-${p.label}.png`;
        await page.screenshot({ path: shot, fullPage: false });
      }

      results.push({ ...p, metrics, overflows, deviceOverflows, overflowEls: metrics.overflowingElements.length, shot });
      console.log(
        `[${p.label}] inner=${metrics.innerWidth} vv=${metrics.vv} scroll=${metrics.scrollWidth} ` +
        `${overflows ? "❌ OVERFLOW" : "✅ OK"}${deviceOverflows && !overflows ? " ⚠ device-overflow" : ""}` +
        (hasOverflowEl ? ` (${metrics.overflowingElements.length} elem overflow)` : "") +
        (shot ? ` → ${shot}` : "")
      );
      metrics.overflowingElements.slice(0, 5).forEach((e) =>
        console.log(`        └ ${e.tag} .${e.cls} right=${e.right}`)
      );
    } catch (e) {
      console.log(`[${p.label}] ERROR: ${e.message}`);
      results.push({ ...p, error: e.message, overflows: true });
    }
  }

  const fail = results.filter((r) => r.overflows || r.deviceOverflows);
  console.log("\n=== MOBILE OVERFLOW SUMMARY ===");
  results.forEach((r) =>
    console.log(`  ${r.label.padEnd(12)} ${r.overflows || r.deviceOverflows ? "❌ OVERFLOW" : "✅ NO OVERFLOW"} (scroll=${r.metrics?.scrollWidth}, vv=${r.metrics?.vv}, inner=${r.metrics?.innerWidth})`)
  );
  console.log(`  Passed: ${results.length - fail.length}/${results.length}`);
  await browser.close();
  process.exit(fail.length ? 1 : 0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
