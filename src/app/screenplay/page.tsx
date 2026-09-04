"use client";

import { useState, useEffect } from "react";
import SceneCard from "@/components/SceneCard";
import type { Scene } from "@/lib/store";

export default function ScreenplayPage() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scenes")
      .then((r) => r.json())
      .then((data) => {
        setScenes(data.data?.scenes || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: Scene["status"]) {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setScenes((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status } : s))
        );
      }
    } catch {
      setScenes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      );
    }
  }

  const filtered = filter === "all" ? scenes : scenes.filter((s) => s.status === filter);

  const counts = {
    all: scenes.length,
    pending: scenes.filter((s) => s.status === "pending").length,
    scheduled: scenes.filter((s) => s.status === "scheduled").length,
    in_progress: scenes.filter((s) => s.status === "in_progress").length,
    completed: scenes.filter((s) => s.status === "completed").length,
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-amber-500 leading-tight">🎬 Scene Breakdown</h1>
        <p className="text-gray-400 mt-2">
          All extracted scenes with cast, props, locations, and department notes.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
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
      </div>

      {loading ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Loading scenes...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No scenes match this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((scene) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              onStatusChange={updateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
