"use client";

import type { Scene } from "@/lib/store";

interface ScheduleRowProps {
  scene: Scene;
}

export default function ScheduleRow({ scene }: ScheduleRowProps) {
  return (
    <tr className="border-b border-dark-600 hover:bg-dark-600/50 transition-colors">
      <td className="py-3 px-4">
        <span className="text-xs font-mono text-amber-400">
          {scene.id.replace("sc-", "#")}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-gray-100">{scene.heading}</span>
      </td>
      <td className="py-3 px-4">
        <span className={scene.type === "INT" ? "badge-int" : "badge-ext"}>
          {scene.type}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className={scene.timeOfDay === "DAY" ? "badge-day" : "badge-night"}>
          {scene.timeOfDay}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-gray-300">{scene.location}</span>
      </td>
      <td className="py-3 px-4">
        <span className="text-xs text-gray-400">
          {scene.cast.join(", ")}
        </span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-sm font-semibold text-cyan-400">
          {scene.dayNumber ? `Day ${scene.dayNumber}` : "—"}
        </span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-xs text-gray-400">
          {scene.scheduledDate || "—"}
        </span>
      </td>
      <td className="py-3 px-4 text-center">
        {scene.weather ? (
          <span className="text-sm">
            {scene.weather.icon} {scene.weather.temp}°C
          </span>
        ) : (
          <span className="text-gray-600">—</span>
        )}
      </td>
      <td className="py-3 px-4 text-center">
        {scene.weather ? (
          <span className={scene.weather.rainPercent > 50 ? "badge-rain" : "badge-clear"}>
            {scene.weather.rainPercent}%
          </span>
        ) : (
          <span className="text-gray-600">—</span>
        )}
      </td>
    </tr>
  );
}
