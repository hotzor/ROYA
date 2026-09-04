import { NextResponse } from "next/server";
import { demoScenes, demoTasks } from "@/lib/demo-data";

function computeStatus(scenes: typeof demoScenes, tasks: typeof demoTasks) {
  const completedScenes = scenes.filter((s) => s.status === "completed").length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const days = new Set(scenes.filter((s) => s.dayNumber).map((s) => s.dayNumber));
  const total = Math.max(scenes.length + tasks.length, 1);
  const done = completedScenes + completedTasks;
  return {
    totalScenes: scenes.length,
    completedScenes,
    totalTasks: tasks.length,
    completedTasks,
    shootingDays: days.size,
    nextShootDate: "2025-02-03",
    weatherAlerts: [] as string[],
    completionPercent: Math.round((done / total) * 100),
  };
}

export async function GET() {
  return NextResponse.json({
    error: false,
    data: computeStatus(demoScenes, demoTasks),
  });
}
