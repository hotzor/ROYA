"use client";

import type { Scene, Task, ProductionStatus, WeatherForecast, CallSheet } from "./store";
import { demoScenes, demoTasks } from "./demo-data";
import { buildCallSheet } from "./callsheet-builder";
import { getWeatherForecast } from "./weather";

export const STATE_KEY = "roya_state_v1";

export type DataOrigin = "demo" | "analysis" | "none";

export interface PersistedRoyaState {
  scenes: Scene[];
  tasks: Task[];
  startDate: string;
  origin: DataOrigin;
}

export interface RoyaState extends PersistedRoyaState {
  analyzing: boolean;
  scheduling: boolean;
  script: string;
}

export interface ToastState {
  message: string;
  kind: "info" | "success" | "error";
}

const DEFAULT_START = "2025-02-03";

function weekdayOffset(startDate: string, dayNumber: number): string {
  const [y, m, d] = startDate.split("-").map(Number);
  const base = Date.UTC(y, m - 1, d);
  let cursor = base;
  let added = 0;
  while (added < Math.max(dayNumber - 1, 0)) {
    cursor += 86400000;
    const dow = new Date(cursor).getUTCDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return new Date(cursor).toISOString().split("T")[0];
}

/**
 * Builds a fully-populated demo dataset: demo scenes assigned to weekdays
 * (mirroring the planner) with deterministic weather, plus demo tasks.
 */
export function buildDemoState(): PersistedRoyaState {
  const scenes: Scene[] = demoScenes.map((s) => {
    const scheduledDate = weekdayOffset(DEFAULT_START, s.dayNumber || 1);
    return {
      ...s,
      scheduledDate,
      dayNumber: s.dayNumber || 1,
      status: "scheduled" as const,
      weather: {
        date: scheduledDate,
        location: s.location.split("—")[0].trim(),
        temp: 18,
        conditions: "Partly Cloudy",
        rainPercent: 20,
        icon: "⛅",
      },
    };
  });
  return {
    scenes,
    tasks: demoTasks.map((t) => ({ ...t })),
    startDate: DEFAULT_START,
    origin: "demo",
  };
}

const EMPTY: PersistedRoyaState = {
  scenes: [],
  tasks: [],
  startDate: DEFAULT_START,
  origin: "none",
};

type ROYA_STORE = {
  state: RoyaState;
  persist: boolean;
  hydrated: boolean;
};

const g = globalThis as unknown as { __royaClientStore?: ROYA_STORE };

function defaultStore(): ROYA_STORE {
  return {
    state: {
      ...buildDemoState(),
      analyzing: false,
      scheduling: false,
      script: "",
    },
    persist: false,
    hydrated: false,
  };
}

function readLocalState(): PersistedRoyaState | null {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STATE_KEY) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedRoyaState;
    if (!parsed || !Array.isArray(parsed.scenes)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getClientStore(): ROYA_STORE {
  if (!g.__royaClientStore) {
    g.__royaClientStore = defaultStore();
  }
  return g.__royaClientStore;
}

export function hydrateStore(): void {
  const store = getClientStore();
  if (store.hydrated) return;
  const saved = readLocalState();
  if (saved) {
    store.state = {
      ...saved,
      analyzing: store.state.analyzing,
      scheduling: store.state.scheduling,
      script: store.state.script,
    };
    store.persist = true;
  } else {
    store.state = { ...buildDemoState(), analyzing: false, scheduling: false, script: "" };
    store.persist = true;
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(store.state));
    } catch {
      /* quota / privacy — ignore */
    }
  }
  store.hydrated = true;
  notify();
}

function persist(): void {
  const store = getClientStore();
  if (!store.persist) return;
  try {
    const { scenes, tasks, startDate, origin } = store.state;
    localStorage.setItem(STATE_KEY, JSON.stringify({ scenes, tasks, startDate, origin }));
  } catch {
    /* ignore */
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notify(): void {
  for (const fn of Array.from(listeners)) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
}

function mutate(updater: (s: RoyaState) => RoyaState): void {
  const store = getClientStore();
  const next = updater({ ...store.state, scenes: [...store.state.scenes], tasks: [...store.state.tasks] });
  store.state = next;
  persist();
  notify();
}

export function getState(): RoyaState {
  return getClientStore().state;
}

export function getStatus(): ProductionStatus {
  const { scenes, tasks } = getClientStore().state;
  const completedScenes = scenes.filter((s) => s.status === "completed").length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const days = new Set(scenes.filter((s) => s.dayNumber).map((s) => s.dayNumber));
  const weatherAlerts: string[] = [];
  for (const s of scenes) {
    if (s.weather && s.weather.rainPercent > 50) {
      weatherAlerts.push(
        `⚠️ ${s.weather.date}: ${s.weather.rainPercent}% rain chance at ${s.weather.location}`
      );
    }
  }
  const scheduled = scenes.filter((s) => s.scheduledDate);
  const nextDate = scheduled
    .map((s) => s.scheduledDate!)
    .sort()
    .find((d) => d >= new Date().toISOString().split("T")[0]) || null;
  const total = Math.max(scenes.length + tasks.length, 1);
  const done = completedScenes + completedTasks;
  return {
    totalScenes: scenes.length,
    completedScenes,
    totalTasks: tasks.length,
    completedTasks,
    shootingDays: days.size,
    nextShootDate: nextDate,
    weatherAlerts,
    completionPercent: Math.round((done / total) * 100),
  };
}

export function getCallSheet(date: string, castFilter?: string[]): CallSheet {
  return buildCallSheet(getClientStore().state.scenes, date, castFilter);
}

export function getAvailableDates(): string[] {
  const dates = new Set<string>();
  for (const s of getClientStore().state.scenes) {
    if (s.scheduledDate) dates.add(s.scheduledDate);
  }
  return Array.from(dates).sort();
}

export function setAnalyzedScenes(scenes: Scene[]): void {
  mutate((s) => ({
    ...s,
    scenes: scenes.map((sc) => ({ ...sc, dayNumber: null, scheduledDate: null, status: "pending" as const })),
    origin: "analysis",
    tasks: [],
  }));
}

export function applySchedule(scenes: Scene[], startDate: string): void {
  mutate((s) => ({
    ...s,
    scenes,
    tasks: s.tasks.length === 0 ? demoTasks.map((t) => ({ ...t })) : s.tasks,
    startDate,
  }));
}

export function setStartDate(date: string): void {
  mutate((s) => ({ ...s, startDate: date }));
}

export function resetAnalyzing(): void {
  mutate((s) => ({ ...s, analyzing: false }));
}

export function setAnalyzing(): void {
  mutate((s) => ({ ...s, analyzing: true }));
}

export function setScheduling(v: boolean): void {
  mutate((s) => ({ ...s, scheduling: v }));
}

/**
 * Clears the analyzed/scheduled results (used by "Load Demo Script"),
 * leaving an empty state until the user runs Analyze.
 */
export function clearResults(): void {
  mutate((s) => ({
    ...s,
    scenes: [],
    tasks: [],
    startDate: DEFAULT_START,
    origin: "none",
  }));
}

/** Re-seeds the pristine demo dataset (used by Reset). */
export function resetToDemo(): void {
  mutate(() => ({
    ...buildDemoState(),
    analyzing: false,
    scheduling: false,
    script: "",
  }));
}

export function setScript(script: string): void {
  mutate((s) => ({ ...s, script }));
}

export function updateSceneStatus(id: string, status: Scene["status"]): void {
  mutate((s) => ({
    ...s,
    scenes: s.scenes.map((sc) => (sc.id === id ? { ...sc, status } : sc)),
  }));
}

export function addTask(input: { sceneId: string; department: string; task: string; assignee?: string }): Task {
  const store = getClientStore();
  const scene = store.state.scenes.find((s) => s.id === input.sceneId);
  const task: Task = {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sceneId: input.sceneId,
    sceneSlug: scene?.slug || "unknown",
    department: input.department,
    task: input.task,
    assignee: input.assignee || "Unassigned",
    status: "todo",
    createdAt: new Date().toISOString(),
  };
  mutate((s) => ({ ...s, tasks: [...s.tasks, task] }));
  return task;
}

export function updateTask(id: string, updates: Partial<Task>): Task | undefined {
  const store = getClientStore();
  const existing = store.state.tasks.find((t) => t.id === id);
  if (!existing) return undefined;
  const next = { ...existing, ...updates };
  mutate((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? next : t)) }));
  return next;
}

export async function scheduleFromScenes(scenes: Scene[], startDate: string): Promise<Scene[]> {
  const tracks = await Promise.all(
    scenes.map(async (sc) => {
      if (!sc.scheduledDate) return { scene: sc, forecast: null as WeatherForecast | null };
      const location = sc.location.split("—")[0].trim();
      const forecast = await getWeatherForecast(location, sc.scheduledDate);
      return { scene: sc, forecast };
    })
  );
  return tracks.map(({ scene, forecast }) =>
    forecast ? { ...scene, weather: forecast } : scene
  );
}

/**
 * Stateless schedule computation via /api/schedule (pure compute, no persistence).
 * Passes the current client scenes so the returned schedule reflects this session.
 */
export async function clientGenerateSchedule(scenes: Scene[], startDate: string): Promise<Scene[]> {
  const res = await fetch("/api/schedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenes, startDate }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.message || "Schedule generation failed.");
  return data.data?.scenes || [];
}

export function generateScheduleLocal(scenes: Scene[], startDate: string): Scene[] {
  const ordered = [...scenes].sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0));
  let currentDate = new Date(`${startDate}T00:00:00`);
  let day = 1;
  const out: Scene[] = [];
  for (const sc of ordered) {
    const d = nextWeekday(currentDate);
    out.push({ ...sc, dayNumber: day, scheduledDate: d, status: "scheduled" as const });
    day++;
  }
  return out;
}

function nextWeekday(d: Date): string {
  let c = new Date(d);
  c.setDate(c.getDate() + 1);
  while (c.getDay() === 0 || c.getDay() === 6) c.setDate(c.getDate() + 1);
  return c.toISOString().split("T")[0];
}

export function clientAnalyze(script: string): Promise<Scene[]> {
  return new Promise((resolve, reject) => {
    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          reject(new Error(data.message || "Analysis failed."));
          return;
        }
        resolve(data.data.scenes || []);
      })
      .catch(reject);
  });
}
