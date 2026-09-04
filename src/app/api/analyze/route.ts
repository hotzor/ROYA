import { NextRequest, NextResponse } from "next/server";
import { analyzeScript } from "@/lib/ai";
import { demoScenes } from "@/lib/demo-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { script } = body;

    if (!script || typeof script !== "string" || script.trim().length === 0) {
      return NextResponse.json(
        { error: true, message: "No script provided. Paste a screenplay to analyze." },
        { status: 400 }
      );
    }

    const scenes = await analyzeScript(script);

    const initialized = scenes.map((s, i) => ({
      ...s,
      dayNumber: null,
      scheduledDate: null,
      status: "pending" as const,
    }));

    return NextResponse.json({
      error: false,
      data: {
        sceneCount: initialized.length,
        scenes: initialized,
        message: `Extracted ${initialized.length} scenes from screenplay.`,
      },
    });
  } catch (err) {
    console.error("analyze API error:", err);
    return NextResponse.json({
      error: false,
      data: {
        sceneCount: demoScenes.length,
        scenes: demoScenes,
        message: "Analysis used demo data (mock fallback).",
      },
    });
  }
}
