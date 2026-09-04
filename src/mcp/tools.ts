"use client";

import {
  clientAnalyze,
  setAnalyzedScenes,
  getState,
  getStatus,
  getCallSheet,
  applySchedule,
  addTask,
  clientGenerateSchedule,
  getAvailableDates,
} from "@/lib/client-store";
import type { WeatherForecast } from "@/lib/store";

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
      const scenes = await clientAnalyze(String(input.script || ""));
      setAnalyzedScenes(scenes);
      return {
        error: false,
        data: {
          sceneCount: scenes.length,
          scenes,
          message: `Extracted ${scenes.length} scenes from screenplay.`,
        },
      };
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
      const scenes = getState().scenes;
      const sceneId = input.sceneId as string | undefined;
      if (sceneId) {
        const scene = scenes.find((s) => s.id === sceneId);
        if (!scene) return { error: true, message: `Scene "${sceneId}" not found.` };
        return { error: false, data: scene };
      }
      return {
        error: false,
        data: {
          total: scenes.length,
          byStatus: {
            pending: scenes.filter((s) => s.status === "pending").length,
            scheduled: scenes.filter((s) => s.status === "scheduled").length,
            in_progress: scenes.filter((s) => s.status === "in_progress").length,
            completed: scenes.filter((s) => s.status === "completed").length,
          },
          scenes,
        },
      };
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
    description: "Generates a weather-aware shooting schedule from the current scenes. External scenes are placed on clear days; rain pushes INT scenes.",
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
      const startDate = String(input.startDate || "2025-02-03");
      const scenes = getState().scenes;
      const scheduled = await clientGenerateSchedule(scenes, startDate);
      applySchedule(scheduled, startDate);
      const forecasts = scheduled.filter((s) => s.weather).map((s) => s.weather!) as WeatherForecast[];
      return {
        error: false,
        data: {
          startDate,
          totalScheduled: scheduled.length,
          days: Array.from(new Set(scheduled.map((s) => s.dayNumber))).filter(Boolean).length,
          scenes: scheduled,
          weatherAlerts: forecasts
            .filter((f) => f.rainPercent > 50)
            .map((f) => `${f.date}: ${f.rainPercent}% rain at ${f.location}`),
        },
      };
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
      const sceneId = String(input.sceneId || "");
      const newDate = String(input.newDate || "");
      const newDayNumber = Number(input.newDayNumber) || 1;
      const current = getState();
      const updated = current.scenes.map((s) =>
        s.id === sceneId ? { ...s, scheduledDate: newDate, dayNumber: newDayNumber } : s
      );
      applySchedule(updated, current.startDate);
      const scene = updated.find((s) => s.id === sceneId);
      return {
        error: false,
        data: scene ? { scene, message: `Rescheduled ${sceneId} to ${newDate} (Day ${newDayNumber}).` } : { message: "Scene not found." },
      };
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
      const task = addTask({
        sceneId: String(input.sceneId || ""),
        department: String(input.department || ""),
        task: String(input.task || ""),
        assignee: input.assignee ? String(input.assignee) : undefined,
      });
      return { error: false, data: task };
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
      return { error: false, data: getStatus() };
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
      const date = String(input.date || "");
      const castFilter = Array.isArray(input.castFilter) ? input.castFilter.map(String) : undefined;
      const sheet = getCallSheet(date, castFilter);
      if (sheet.scenes.length === 0) {
        const dates = getAvailableDates();
        return {
          error: false,
          data: {
            availableDates: dates,
            message: `No call sheet for ${date}. Available: ${dates.join(", ") || "none"}.`,
          },
        };
      }
      return { error: false, data: sheet };
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
