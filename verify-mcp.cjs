/* Final ROYA WebMCP verification — single evaluate, register + execute all 8 tools */
const puppeteer = require("puppeteer");

const TARGET = process.env.ROYA_URL || "http://localhost:3000";

const ALL_TOOLS = [
  "analyze_script",
  "get_scene_breakdown",
  "get_weather_forecast",
  "generate_schedule",
  "reschedule_scene",
  "assign_task",
  "get_production_status",
  "export_call_sheet",
];

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--enable-features=WebMCP,WebMCPTesting"],
  });
  const page = await browser.newPage();
  await page.goto(TARGET, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3000));

  const chromeVersion = await page.evaluate(
    () => navigator.userAgent.match(/Chrome\/(\d+)/)?.[1]
  );

  // Everything inside ONE evaluate for robustness
  const result = await page.evaluate(async (allTools) => {
    const mc = document.modelContext;
    const tools = await mc.getTools();
    const byName = (n) => tools.find((t) => t.name === n);

    const argsMap = {
      analyze_script: { script: "1. INT. OFFICE - DAY\nALICE: Hello." },
      get_scene_breakdown: {},
      get_weather_forecast: { location: "Studio A", date: "2025-02-03" },
      generate_schedule: { startDate: "2025-02-03" },
      reschedule_scene: { sceneId: "sc-1", newDate: "2025-02-05", newDayNumber: 2 },
      assign_task: { sceneId: "sc-1", department: "Camera", task: "Test rig" },
      get_production_status: {},
      export_call_sheet: { date: "2025-02-03" },
    };

    const executed = [];
    for (const name of allTools) {
      const t = byName(name);
      if (!t) {
        executed.push({ name, ok: false, err: "NOT REGISTERED" });
        continue;
      }
      try {
        const r = await mc.executeTool(t, JSON.stringify(argsMap[name] || {}));
        executed.push({ name, ok: true, res: String(r).slice(0, 60) });
      } catch (e) {
        executed.push({ name, ok: false, err: String(e).slice(0, 100) });
      }
    }

    return {
      count: tools.length,
      names: tools.map((t) => t.name).sort(),
      executed,
    };
  }, ALL_TOOLS);

  console.log("");
  console.log("=== ROYA WebMCP Test — " + TARGET + " ===");
  console.log("Chrome " + chromeVersion);
  console.log("");
  console.log("REGISTERED TOOLS (" + result.count + "):");
  result.names.forEach((n) => console.log("  [✓] " + n));
  console.log("");

  const missing = ALL_TOOLS.filter((t) => !result.names.includes(t));
  if (missing.length) {
    console.log("MISSING (" + missing.length + "): " + missing.join(", "));
    console.log("");
  }

  console.log("EXECUTION:");
  let pass = 0;
  result.executed.forEach((o) => {
    if (o.ok) {
      pass++;
      console.log("  [OK]   " + o.name + " => " + o.res);
    } else {
      console.log("  [FAIL] " + o.name + " => " + o.err);
    }
  });
  console.log("");
  console.log(
    "SUMMARY: " + pass + "/" + ALL_TOOLS.length + " tools registered AND executed successfully."
  );

  await browser.close();
  if (pass !== ALL_TOOLS.length) process.exit(1);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});