import { NextRequest, NextResponse } from "next/server";
import { buildCallSheet, formatCallSheetText, formatCallSheetHTML } from "@/lib/callsheet-builder";
import { demoScenes } from "@/lib/demo-data";

function seedScenes() {
  return demoScenes.map((s, i) => ({
    ...s,
    dayNumber: Math.floor(i / 4) + 1,
    scheduledDate: `2025-02-0${Math.floor(i / 4) + 3}`,
    status: "scheduled" as const,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const format = searchParams.get("format") || "json";
    let castFilter: string[] | undefined;
    try {
      const raw = searchParams.get("cast");
      if (raw) castFilter = JSON.parse(raw);
    } catch {
      castFilter = undefined;
    }

    const scenes = seedScenes();
    const dates = [...new Set(scenes.map((s) => s.scheduledDate).filter(Boolean))] as string[];

    if (!date) {
      return NextResponse.json({
        error: false,
        data: {
          availableDates: dates,
          message: "Provide a ?date= parameter to generate a call sheet.",
        },
      });
    }

    const sheet = buildCallSheet(scenes, date, castFilter);

    if (format === "text") {
      const text = formatCallSheetText(sheet);
      return new NextResponse(text, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="call-sheet-day${sheet.dayNumber}.txt"`,
        },
      });
    }

    if (format === "html") {
      const html = formatCallSheetHTML(sheet);
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return NextResponse.json({ error: false, data: sheet });
  } catch (err) {
    console.error("callsheet API error:", err);
    const fallbackSheet = buildCallSheet(seedScenes(), "2025-02-03");
    return NextResponse.json({ error: false, data: fallbackSheet });
  }
}
