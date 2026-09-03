export interface Scene {
  id: string;
  slug: string;
  heading: string;
  type: "INT" | "EXT";
  timeOfDay: "DAY" | "NIGHT";
  location: string;
  summary: string;
  cast: string[];
  props: string[];
  departmentNotes: Record<string, string>;
  dayNumber: number | null;
  scheduledDate: string | null;
  status: "pending" | "scheduled" | "in_progress" | "completed";
  weather?: WeatherForecast;
}

export interface WeatherForecast {
  date: string;
  location: string;
  temp: number;
  conditions: string;
  rainPercent: number;
  icon: string;
}

export interface Task {
  id: string;
  sceneId: string;
  sceneSlug: string;
  department: string;
  task: string;
  assignee: string;
  status: "todo" | "in_progress" | "done";
  createdAt: string;
}

export interface ProductionStatus {
  totalScenes: number;
  completedScenes: number;
  totalTasks: number;
  completedTasks: number;
  shootingDays: number;
  nextShootDate: string | null;
  weatherAlerts: string[];
  completionPercent: number;
}

export interface CallSheet {
  date: string;
  dayNumber: number;
  scenes: Scene[];
  cast: CallSheetCastEntry[];
  weather: WeatherForecast | null;
  notes: string[];
}

export interface CallSheetCastEntry {
  name: string;
  scenes: string[];
  callTime: string;
  notes: string;
}

class ProductionStore {
  private scenes: Map<string, Scene> = new Map();
  private tasks: Map<string, Task> = new Map();
  private weatherCache: Map<string, WeatherForecast> = new Map();
  private scheduleStartDate: string = "";
  private initialized = false;

  isInitialized(): boolean {
    return this.initialized;
  }

  init(scenes: Scene[], startDate: string): void {
    this.scenes.clear();
    this.tasks.clear();
    this.weatherCache.clear();
    for (const scene of scenes) {
      this.scenes.set(scene.id, scene);
    }
    this.scheduleStartDate = startDate;
    this.initialized = true;
  }

  getScenes(): Scene[] {
    return Array.from(this.scenes.values());
  }

  getScene(id: string): Scene | undefined {
    return this.scenes.get(id);
  }

  getScenesByStatus(status: Scene["status"]): Scene[] {
    return this.getScenes().filter((s) => s.status === status);
  }

  getScenesByDay(dayNumber: number): Scene[] {
    return this.getScenes().filter((s) => s.dayNumber === dayNumber);
  }

  updateScene(id: string, updates: Partial<Scene>): Scene | undefined {
    const scene = this.scenes.get(id);
    if (!scene) return undefined;
    const updated = { ...scene, ...updates };
    this.scenes.set(id, updated);
    return updated;
  }

  setScenes(scenes: Scene[]): void {
    this.scenes.clear();
    for (const scene of scenes) {
      this.scenes.set(scene.id, scene);
    }
  }

  setWeatherCache(forecasts: WeatherForecast[]): void {
    this.weatherCache.clear();
    for (const f of forecasts) {
      this.weatherCache.set(`${f.date}_${f.location}`, f);
    }
  }

  getWeatherForDate(date: string): WeatherForecast | undefined {
    for (const [, f] of this.weatherCache) {
      if (f.date === date) return f;
    }
    return undefined;
  }

  getWeatherCache(): WeatherForecast[] {
    return Array.from(this.weatherCache.values());
  }

  getScheduleStartDate(): string {
    return this.scheduleStartDate;
  }

  setScheduleStartDate(date: string): void {
    this.scheduleStartDate = date;
  }

  addTask(task: Task): void {
    this.tasks.set(task.id, task);
  }

  getTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getTasksByScene(sceneId: string): Task[] {
    return this.getTasks().filter((t) => t.sceneId === sceneId);
  }

  getTasksByDepartment(dept: string): Task[] {
    return this.getTasks().filter((t) => t.department === dept);
  }

  getTasksByStatus(status: Task["status"]): Task[] {
    return this.getTasks().filter((t) => t.status === status);
  }

  updateTask(id: string, updates: Partial<Task>): Task | undefined {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    const updated = { ...task, ...updates };
    this.tasks.set(id, updated);
    return updated;
  }

  getStatus(): ProductionStatus {
    const scenes = this.getScenes();
    const tasks = this.getTasks();
    const completedScenes = scenes.filter(
      (s) => s.status === "completed"
    ).length;
    const completedTasks = tasks.filter((t) => t.status === "done").length;
    const days = new Set(scenes.filter((s) => s.dayNumber).map((s) => s.dayNumber));
    const weatherAlerts: string[] = [];

    const forecasts = this.getWeatherCache();
    for (const f of forecasts) {
      if (f.rainPercent > 50) {
        weatherAlerts.push(
          `⚠️ ${f.date}: ${f.rainPercent}% rain chance at ${f.location}`
        );
      }
    }

    const scheduledScenes = scenes.filter((s) => s.scheduledDate);
    const nextDate = scheduledScenes
      .map((s) => s.scheduledDate!)
      .sort()
      .find((d) => d >= new Date().toISOString().split("T")[0]);

    const total = Math.max(scenes.length + tasks.length, 1);
    const done = completedScenes + completedTasks;

    return {
      totalScenes: scenes.length,
      completedScenes,
      totalTasks: tasks.length,
      completedTasks,
      shootingDays: days.size,
      nextShootDate: nextDate || null,
      weatherAlerts,
      completionPercent: Math.round((done / total) * 100),
    };
  }

  reset(): void {
    this.scenes.clear();
    this.tasks.clear();
    this.weatherCache.clear();
    this.scheduleStartDate = "";
    this.initialized = false;
  }
}

const globalForStore = globalThis as unknown as { __royaStore: ProductionStore };
export const store =
  globalForStore.__royaStore || (globalForStore.__royaStore = new ProductionStore());
