import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { demoScenes } from "@/lib/demo-data";

export async function GET(request: NextRequest) {
  try {
    if (!store.isInitialized()) {
      store.init(demoScenes, "2025-02-01");
    }

    const { searchParams } = new URL(request.url);
    const sceneId = searchParams.get("id");

    if (sceneId) {
      const scene = store.getScene(sceneId);
      if (!scene) {
        return NextResponse.json(
          { error: true, message: `Scene "${sceneId}" not found.` },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: false, data: scene });
    }

    const scenes = store.getScenes();
    return NextResponse.json({
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
    });
  } catch (err) {
    console.error("scenes API error:", err);
    return NextResponse.json({
      error: false,
      data: { total: demoScenes.length, scenes: demoScenes },
    });
  }
}
