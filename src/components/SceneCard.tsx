"use client";

import type { Scene } from "@/lib/store";

interface SceneCardProps {
  scene: Scene;
  onStatusChange?: (id: string, status: Scene["status"]) => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-600/30 text-gray-400 border-gray-600/40",
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
};

export default function SceneCard({ scene, onStatusChange }: SceneCardProps) {
  return (
    <div className="card group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-gray-100 leading-tight">
          {scene.heading}
        </h3>
        <span className={`badge text-[10px] shrink-0 ${STATUS_COLORS[scene.status] || STATUS_COLORS.pending}`}>
          {STATUS_LABELS[scene.status] || scene.status}
        </span>
      </div>

      <p className="text-xs text-gray-400 mb-3 line-clamp-2">{scene.summary}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={scene.type === "INT" ? "badge-int" : "badge-ext"}>
          {scene.type}
        </span>
        <span className={scene.timeOfDay === "DAY" ? "badge-day" : "badge-night"}>
          {scene.timeOfDay}
        </span>
        {scene.scheduledDate && (
          <span className="badge bg-purple-500/20 text-purple-400 border border-purple-500/30">
            📅 {scene.scheduledDate}
          </span>
        )}
        {scene.dayNumber && (
          <span className="badge bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            Day {scene.dayNumber}
          </span>
        )}
      </div>

      <div className="text-xs text-gray-500 mb-3">
        <span className="font-medium text-gray-400">Location:</span> {scene.location}
      </div>

      {scene.cast.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {scene.cast.map((name) => (
            <span key={name} className="text-[10px] bg-dark-600 text-gray-300 px-2 py-0.5 rounded-full border border-dark-500">
              {name}
            </span>
          ))}
        </div>
      )}

      {onStatusChange && (
        <div className="flex gap-1 pt-2 border-t border-dark-500 mt-2">
          {(["pending", "scheduled", "in_progress", "completed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(scene.id, s)}
              className={`text-[10px] px-2 py-1 rounded transition-all ${
                scene.status === s
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-gray-600 hover:text-gray-400 hover:bg-dark-600"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
