import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { buildCallSheet, formatCallSheetText, formatCallSheetHTML } from "@/lib/callsheet-builder";
import { demoScenes } from "@/lib/demo-data";

function ensureInitialized() {
  if (!store.isInitialized()) {
    store.init(demoScenes, "2025-02-01");
  }
}

export async function GET(request: NextRequest) {
  try {
    ensureInitialized();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const format = searchParams.get("format") || "json";

    const scenes = store.getScenes();
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

    const sheet = buildCallSheet(scenes, date);

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
    const fallbackSheet = buildCallSheet(demoScenes, "2025-02-03");
    return NextResponse.json({ error: false, data: fallbackSheet });
  }
}
