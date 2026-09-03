import type { Scene, WeatherForecast } from "./store";
import { getWeatherForecast } from "./weather";

const UNIQUE_LOCATIONS = ["Studio A", "Studio B", "Rooftop", "Exterior"];

export async function generateSchedule(
  scenes: Scene[],
  startDate: string
): Promise<Scene[]> {
  const locationDateMap = buildLocationDateMap(scenes, startDate);
  const forecasts: WeatherForecast[] = [];

  for (const [date, locations] of Object.entries(locationDateMap)) {
    for (const loc of locations) {
      const forecast = await getWeatherForecast(loc, date);
      forecasts.push(forecast);
    }
  }

  const scheduled = scheduleScenes(scenes, startDate, forecasts);
  return scheduled;
}

function buildLocationDateMap(
  scenes: Scene[],
  startDate: string
): Record<string, string[]> {
  const map: Record<string, Set<string>> = {};
  const dates = getShootingDates(startDate, Math.ceil(scenes.length / 4));
  for (const date of dates) {
    map[date] = new Set(UNIQUE_LOCATIONS);
  }
  return Object.fromEntries(
    Object.entries(map).map(([k, v]) => [k, Array.from(v)])
  );
}

function getShootingDates(startDate: string, count: number): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  let added = 0;
  while (added < count) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(current.toISOString().split("T")[0]);
      added++;
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function scheduleScenes(
  scenes: Scene[],
  startDate: string,
  forecasts: WeatherForecast[]
): Scene[] {
  const rainDates = new Set(
    forecasts
      .filter((f) => f.rainPercent > 50)
      .map((f) => f.date)
  );

  const extScenes = scenes.filter((s) => s.type === "EXT");
  const intScenes = scenes.filter((s) => s.type === "INT");

  const dates = getShootingDates(startDate, Math.ceil(scenes.length / 4));

  const clearDates = dates.filter((d) => !rainDates.has(d));
  const rainyDates = dates.filter((d) => rainDates.has(d));
  const allDates = [...clearDates, ...rainyDates];

  const scheduled: Scene[] = [];
  let dayNum = 1;

  const intForRain = [...intScenes];
  const extForClear = [...extScenes];

  for (const date of allDates) {
    const isRainy = rainDates.has(date);
    const scenesForDay: Scene[] = [];

    if (isRainy) {
      while (intForRain.length > 0 && scenesForDay.length < 4) {
        scenesForDay.push(intForRain.shift()!);
      }
    } else {
      while (extForClear.length > 0 && scenesForDay.length < 2) {
        scenesForDay.push(extForClear.shift()!);
      }
      while (intForRain.length > 0 && scenesForDay.length < 4) {
        scenesForDay.push(intForRain.shift()!);
      }
    }

    for (const scene of scenesForDay) {
      const forecast = forecasts.find((f) => f.date === date);
      scheduled.push({
        ...scene,
        dayNumber: dayNum,
        scheduledDate: date,
        status: "scheduled",
        weather: forecast,
      });
    }

    if (scenesForDay.length > 0) {
      dayNum++;
    }
  }

  const remaining = [...intForRain, ...extForClear];
  for (const scene of remaining) {
    scheduled.push({
      ...scene,
      dayNumber: dayNum,
      scheduledDate: allDates[allDates.length - 1] || startDate,
      status: "scheduled",
    });
  }

  return scheduled;
}

export function rescheduleScene(
  scenes: Scene[],
  sceneId: string,
  newDate: string,
  newDayNumber: number
): Scene[] {
  return scenes.map((s) =>
    s.id === sceneId
      ? { ...s, scheduledDate: newDate, dayNumber: newDayNumber }
      : s
  );
}
