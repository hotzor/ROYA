import { NextRequest, NextResponse } from "next/server";
import { getWeatherForecast } from "@/lib/weather";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location") || "Studio A";
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const forecast = await getWeatherForecast(location, date);

    return NextResponse.json({
      error: false,
      data: forecast,
    });
  } catch (err) {
    console.error("weather API error:", err);
    return NextResponse.json({
      error: false,
      data: {
        date: new Date().toISOString().split("T")[0],
        location: "Unknown",
        temp: 20,
        conditions: "Clear",
        rainPercent: 10,
        icon: "☀️",
      },
    });
  }
}
