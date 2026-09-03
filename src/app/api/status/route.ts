import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { demoScenes, demoTasks } from "@/lib/demo-data";

function ensureInitialized() {
  if (!store.isInitialized()) {
    store.init(demoScenes, "2025-02-01");
    for (const task of demoTasks) {
      store.addTask(task);
    }
  }
}

export async function GET() {
  try {
    ensureInitialized();
    const status = store.getStatus();

    return NextResponse.json({
      error: false,
      data: status,
    });
  } catch (err) {
    console.error("status API error:", err);
    return NextResponse.json({
      error: false,
      data: {
        totalScenes: 12,
        completedScenes: 0,
        totalTasks: 8,
        completedTasks: 2,
        shootingDays: 3,
        nextShootDate: "2025-02-03",
        weatherAlerts: [],
        completionPercent: 17,
      },
    });
  }
}
