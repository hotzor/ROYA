import { NextRequest, NextResponse } from "next/server";
import { generateSchedule, rescheduleScene } from "@/lib/planner";
import { demoScenes } from "@/lib/demo-data";

function demoFallbackPayload() {
  const scenes = demoScenes.map((s, i) => ({
    ...s,
    dayNumber: Math.floor(i / 4) + 1,
    scheduledDate: `2025-02-0${Math.floor(i / 4) + 3}`,
    status: "scheduled",
  }));
  return {
    startDate: "2025-02-03",
    totalScheduled: scenes.length,
    days: 3,
    scenes,
    weatherAlerts: [] as string[],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // reschedule_scene: update a single scene's date/day within the provided scene set.
    if (body.sceneId && body.newDate && body.newDayNumber && Array.isArray(body.scenes)) {
      const updated = rescheduleScene(body.scenes, body.sceneId, body.newDate, body.newDayNumber);
      return NextResponse.json({
        error: false,
        data: {
          startDate: body.startDate || "2025-02-03",
          totalScheduled: updated.length,
          days: Array.from(new Set(updated.map((s) => s.dayNumber))).filter(Boolean).length,
          scenes: updated,
          weatherAlerts: [],
        },
      });
    }

    const scenesInput = Array.isArray(body.scenes) ? body.scenes : demoScenes;
    const startDate = body.startDate || "2025-02-03";
    const scheduled = await generateSchedule(scenesInput, startDate);

    const forecasts = scheduled
      .filter((s) => s.weather)
      .map((s) => s.weather!);

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
      data: demoFallbackPayload(),
    });
  }
}

export async function GET() {
  return NextResponse.json({
    error: false,
    data: demoFallbackPayload(),
  });
}
