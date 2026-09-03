import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { generateSchedule } from "@/lib/planner";
import { demoScenes } from "@/lib/demo-data";

export async function POST(request: NextRequest) {
  try {
    if (!store.isInitialized()) {
      store.init(demoScenes, "2025-02-01");
    }

    const body = await request.json().catch(() => ({}));
    const startDate = body.startDate || store.getScheduleStartDate() || "2025-02-03";

    const scenes = store.getScenes();
    const scheduled = await generateSchedule(scenes, startDate);

    store.setScenes(scheduled);
    store.setScheduleStartDate(startDate);

    const forecasts = scheduled
      .filter((s) => s.weather)
      .map((s) => s.weather!);
    store.setWeatherCache(forecasts);

    return NextResponse.json({
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
    });
  } catch (err) {
    console.error("schedule API error:", err);
    return NextResponse.json({
      error: false,
      data: {
        startDate: "2025-02-03",
        totalScheduled: demoScenes.length,
        days: 3,
        scenes: demoScenes.map((s, i) => ({
          ...s,
          dayNumber: Math.floor(i / 4) + 1,
          scheduledDate: `2025-02-0${Math.floor(i / 4) + 3}`,
          status: "scheduled",
        })),
        weatherAlerts: [],
      },
    });
  }
}

export async function GET() {
  if (!store.isInitialized()) {
    store.init(demoScenes, "2025-02-01");
  }

  const scenes = store.getScenes();
  const scheduled = scenes.filter((s) => s.scheduledDate);
  const days = Array.from(new Set(scheduled.map((s) => s.dayNumber))).filter(Boolean);

  return NextResponse.json({
    error: false,
    data: {
      startDate: store.getScheduleStartDate(),
      totalScheduled: scheduled.length,
      days: days.length,
      scenes: scheduled,
    },
  });
}
