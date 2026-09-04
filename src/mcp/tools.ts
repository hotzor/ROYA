"use client";

interface ModelContext {
  registerTool: (tool: MCPTool) => void;
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (input: Record<string, unknown>) => Promise<unknown>;
  execute?: (input: Record<string, unknown>) => Promise<unknown>;
}

function getModelContext(): ModelContext | null {
  if (typeof window === "undefined") return null;

  const ctx =
    (window as unknown as Record<string, unknown>).navigator &&
    typeof (window.navigator as unknown as Record<string, unknown>).modelContext !== "undefined"
      ? (window.navigator as unknown as Record<string, unknown>).modelContext as ModelContext
      : null;

  if (ctx && typeof ctx.registerTool === "function") return ctx;

  const docCtx =
    typeof (window as unknown as Record<string, unknown>).document !== "undefined"
      ? (window.document as unknown as Record<string, unknown>).modelContext as ModelContext | null
      : null;

  if (docCtx && typeof docCtx.registerTool === "function") return docCtx;

  return null;
}

async function apiCall(path: string, options?: RequestInit): Promise<unknown> {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  return res.json();
}

const TOOLS: MCPTool[] = [
  {
    name: "analyze_script",
    description: "Analyzes a screenplay and extracts scene breakdowns with cast, props, locations, and department notes.",
    inputSchema: {
      type: "object",
      properties: {
        script: { type: "string", description: "The full screenplay text to analyze." },
      },
      required: ["script"],
    },
    handler: async (input) => {
      const res = await apiCall("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ script: input.script }),
      });
      return res;
    },
  },
  {
    name: "get_scene_breakdown",
    description: "Retrieves scene breakdown details. Pass sceneId for a specific scene, or omit for all scenes.",
    inputSchema: {
      type: "object",
      properties: {
        sceneId: { type: "string", description: "Scene ID (e.g. 'sc-1'). Omit for all scenes." },
      },
    },
    handler: async (input) => {
      const params = input.sceneId ? `?id=${input.sceneId}` : "";
      return apiCall(`/api/scenes${params}`);
    },
  },
  {
    name: "get_weather_forecast",
    description: "Gets weather forecast for a specific location and date. Uses OpenWeatherMap or mock data.",
    inputSchema: {
      type: "object",
      properties: {
        location: { type: "string", description: "Location name (e.g. 'Studio A', 'Rooftop')." },
        date: { type: "string", description: "Date in YYYY-MM-DD format." },
      },
      required: ["location", "date"],
    },
    handler: async (input) => {
      return apiCall(
        `/api/weather?location=${encodeURIComponent(input.location as string)}&date=${input.date}`
      );
    },
  },
  {
    name: "generate_schedule",
    description: "Generates a weather-aware shooting schedule. External scenes are placed on clear days; rain pushes INT scenes.",
    inputSchema: {
      type: "object",
      properties: {
        startDate: {
          type: "string",
          description: "Schedule start date (YYYY-MM-DD). Weekends are skipped automatically.",
        },
      },
      required: ["startDate"],
    },
    handler: async (input) => {
      return apiCall("/api/schedule", {
        method: "POST",
        body: JSON.stringify({ startDate: input.startDate }),
      });
    },
  },
  {
    name: "reschedule_scene",
    description: "Reschedules a specific scene to a new date and day number.",
    inputSchema: {
      type: "object",
      properties: {
        sceneId: { type: "string", description: "Scene ID to reschedule." },
        newDate: { type: "string", description: "New date (YYYY-MM-DD)." },
        newDayNumber: { type: "number", description: "New day number." },
      },
      required: ["sceneId", "newDate", "newDayNumber"],
    },
    handler: async (input) => {
      return apiCall("/api/schedule", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
  },
  {
    name: "assign_task",
    description: "Assigns a production task to a department for a specific scene.",
    inputSchema: {
      type: "object",
      properties: {
        sceneId: { type: "string", description: "Scene ID the task is for." },
        department: {
          type: "string",
          enum: ["Camera", "Lighting", "Art", "Sound", "Wardrobe", "Props"],
          description: "Department responsible.",
        },
        task: { type: "string", description: "Task description." },
        assignee: { type: "string", description: "Person assigned (optional)." },
      },
      required: ["sceneId", "department", "task"],
    },
    handler: async (input) => {
      return apiCall("/api/tasks", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
  },
  {
    name: "get_production_status",
    description: "Returns overall production status: scene counts, task counts, completion percentage, and weather alerts.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async () => {
      return apiCall("/api/status");
    },
  },
  {
    name: "export_call_sheet",
    description: "Generates a call sheet for a given date with cast call times, scenes, and weather.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date for the call sheet (YYYY-MM-DD)." },
        castFilter: {
          type: "array",
          items: { type: "string" },
          description: "Optional array of cast member names to include.",
        },
      },
      required: ["date"],
    },
    handler: async (input) => {
      const params = new URLSearchParams({ date: input.date as string });
      if (input.castFilter) {
        params.set("cast", JSON.stringify(input.castFilter));
      }
      return apiCall(`/api/callsheet?${params.toString()}`);
    },
  },
];

let registered = false;

export function registerMCPTools(): void {
  if (registered) return;
  if (typeof window === "undefined") return;

  const ctx = getModelContext();
  if (!ctx) {
    console.log("[ROYA] MCP context not available — tools registered in-memory only.");
    registered = true;
    return;
  }

  for (const tool of TOOLS) {
    try {
      // WebMCP spec expects an `execute` function. Provide it from `handler`.
      const webmcpTool = {
        ...tool,
        execute: tool.handler,
      };
      ctx.registerTool(webmcpTool);
      console.log(`[ROYA] MCP tool registered: ${tool.name}`);
    } catch (err) {
      console.warn(`[ROYA] Failed to register tool ${tool.name}:`, err);
    }
  }

  registered = true;
  console.log(`[ROYA] ${TOOLS.length} WebMCP tools registered successfully.`);
}

export function getTools(): MCPTool[] {
  return TOOLS;
}
