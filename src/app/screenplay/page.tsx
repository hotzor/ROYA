"use client";

import { useState } from "react";
import SceneCard from "@/components/SceneCard";
import { useRoya } from "@/components/RoyaProvider";
import type { Scene } from "@/lib/store";

export default function ScreenplayPage() {
  const { state, origin, changeSceneStatus } = useRoya();
  const [filter, setFilter] = useState<string>("all");

  const scenes = state.scenes;
  const loading = false;

  const filtered = filter === "all" ? scenes : scenes.filter((s) => s.status === filter);

  const counts = {
    all: scenes.length,
    pending: scenes.filter((s) => s.status === "pending").length,
    scheduled: scenes.filter((s) => s.status === "scheduled").length,
    in_progress: scenes.filter((s) => s.status === "in_progress").length,
    completed: scenes.filter((s) => s.status === "completed").length,
  };

  function handleStatusChange(id: string, status: Scene["status"]) {
    changeSceneStatus(id, status);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-amber-500 leading-tight">🎬 Scene Breakdown</h1>
        <p className="text-gray-400 mt-2 text-sm md:text-base">
          All extracted scenes with cast, props, locations, and department notes.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "pending", "scheduled", "in_progress", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm px-3 py-1.5 rounded-lg transition-all ${
              filter === f
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "text-gray-500 hover:text-gray-300 hover:bg-dark-700 border border-transparent"
            }`}
          >
            {f === "all" ? "All" : f.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            <span className="ml-1.5 text-xs opacity-60">({counts[f]})</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {origin === "demo" && (
            <span className="badge bg-blue-500/20 text-blue-400 border border-blue-500/30">Demo data</span>
          )}
          {origin === "analysis" && (
            <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/30">Your analysis</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Loading scenes...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">{scenes.length === 0 ? "No scenes yet — analyze a script." : "No scenes match this filter."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((scene) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
