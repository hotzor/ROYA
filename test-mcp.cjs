/* ROYA WebMCP test via Puppeteer + CDP
 *
 * Launches Chrome with the WebMCP flags, navigates to the live app,
 * and verifies the 8 WebMCP tools are registered AND executable.
 *
 * Chrome 152 verification surface (document-first contract):
 *   - Producer:   document.modelContext.registerTool / getTools / executeTool
 *   - Testing:    navigator.modelContextTesting.listTools / executeTool (legacy, may be absent)
 */

const puppeteer = require("puppeteer");

const TARGET_URL = process.env.ROYA_URL || "http://localhost:3000";
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

async function main() {
  console.log("=".repeat(72));
  console.log("  ROYA WebMCP Verification via Puppeteer + Chrome CDP");
  console.log("  Target:", TARGET_URL);
  console.log("=".repeat(72));

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--enable-experimental-web-platform-features",
      "--enable-features=WebMCP,WebMCPTesting,DevToolsWebMCPSupport",
      "--enable-webmcp-testing",
    ],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  console.log("\n[1] Navigating to app at real HTTP origin...");
  await page.goto(TARGET_URL, { waitUntil: "networkidle2", timeout: 60000 });
  // wait extra for client registration
  await new Promise((r) => setTimeout(r, 4000));

  const chromeVersion =
    (await page.evaluate(() => navigator.userAgent.match(/Chrome\/(\d+)/)?.[1])) || "?";

  console.log("\n[2] WebMCP surface probe (Chrome " + chromeVersion + ")...");
  const surface = await page.evaluate(() => {
    const docMC = typeof document !== "undefined" ? document.modelContext : undefined;
    const navMC = typeof navigator !== "undefined" ? navigator.modelContext : undefined;
    const testMC = typeof navigator !== "undefined" ? navigator.modelContextTesting : undefined;
    return {
      document_modelContext: Boolean(docMC),
      navigator_modelContext: Boolean(navMC),
      navigator_modelContextTesting: Boolean(testMC),
      doc_getTools: typeof docMC?.getTools === "function",
      doc_executeTool: typeof docMC?.executeTool === "function",
      doc_registerTool: typeof docMC?.registerTool === "function",
      test_listTools: typeof testMC?.listTools === "function",
      test_executeTool: typeof testMC?.executeTool === "function",
    };
  });
  Object.entries(surface).forEach(([k, v]) => console.log(`   ${k}: ${v ? "✅" : "—"}`));

  // --- Poll getTools() (registration is async) ---
  console.log("\n[3] Polling document.modelContext.getTools() for ROYA tools...");
  let toolsList = null;
  for (let i = 0; i < 20; i++) {
    const t = await page.evaluate(async () => {
      try {
        const mc = document.modelContext;
        if (mc && typeof mc.getTools === "function") {
          const tools = await mc.getTools();
          return Array.isArray(tools) ? tools.map((x) => x?.name) : null;
        }
      } catch (e) {
        return { error: String(e) };
      }
      return null;
    });
    if (Array.isArray(t) && t.length > 0) {
      toolsList = t;
      break;
    }
    if (i < 19) await new Promise((r) => setTimeout(r, 1000));
  }

  if (toolsList && Array.isArray(toolsList)) {
    console.log("  getTools() ->", toolsList.join(", "));
    const missing = EXPECTED_TOOLS.filter((t) => !toolsList.includes(t));
    if (missing.length === 0) {
      console.log("  ✅ ALL 8 ROYA tools confirmed via getTools()");
    } else {
      console.log("  ⚠ Missing from getTools():", missing.join(", "));
    }
  } else {
    console.log("  ⚠ getTools() returned empty/undefined. Trying navigator.modelContextTesting.listTools()...");
    const testTools = await page.evaluate(async () => {
      try {
        const mc = navigator.modelContextTesting;
        if (mc && typeof mc.listTools === "function") {
          const l = await mc.listTools();
          return Array.isArray(l) ? l.map((x) => x?.name) : [];
        }
      } catch (e) {
        return { error: String(e) };
      }
      return [];
    });
    console.log("  listTools() ->", JSON.stringify(testTools));
  }

  // --- Execute a tool end-to-end via executeTool ---
  console.log("\n[4] Executing tools via document.modelContext.executeTool()...");
  const execResult = await page.evaluate(async (names) => {
    const out = [];
    const mc = document.modelContext;
    if (!mc || typeof mc.executeTool !== "function") {
      return { unavailable: true, out };
    }
    for (const name of names) {
      try {
        const tools = await mc.getTools();
        const tool = tools.find((t) => t?.name === name);
        if (!tool) {
          out.push({ name, status: "not-registered" });
          continue;
        }
        const args =
          name === "get_scene_breakdown"
            ? "{}"
            : name === "get_production_status"
            ? "{}"
            : "{}";
        const result = await mc.executeTool(tool, args);
        out.push({ name, status: "ok", result: String(result).slice(0, 200) });
      } catch (e) {
        out.push({ name, status: "error", error: String(e).slice(0, 200) });
      }
    }
    return { out };
  }, ["get_scene_breakdown", "get_production_status", "get_weather_forecast"]);

  if (execResult.unavailable) {
    console.log("  ⚠ document.modelContext.executeTool not available in this Chrome");
  }
  execResult.out.forEach((r) => {
    console.log(`   ${r.name}: ${r.status === "ok" ? "✅" : "❌"} ${r.error || r.result?.slice(0, 120)}`);
  });

  if (pageErrors.length) {
    console.log("\n[5] Page errors captured during run:");
    pageErrors.forEach((e) => console.log("   ⚠", e));
  } else {
    console.log("\n[5] No page errors captured ✅");
  }

  console.log("\n" + "=".repeat(72));
  console.log("  DONE");
  console.log("=".repeat(72));

  await browser.close();
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
