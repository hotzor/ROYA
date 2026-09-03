"use client";

import { useState, useEffect } from "react";
import ScreenplayEditor from "@/components/ScreenplayEditor";
import SceneCard from "@/components/SceneCard";
import { registerMCPTools } from "@/mcp/tools";
import type { Scene } from "@/lib/store";

export default function HomePage() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    registerMCPTools();
    fetchScenes();
  }, []);

  async function fetchScenes() {
    try {
      const res = await fetch("/api/scenes");
      const data = await res.json();
      if (!data.error && data.data?.scenes) {
        setScenes(data.data.scenes);
      }
    } catch {
      // Silently fail — demo data will be used on next analyze
    }
  }

  async function handleAnalyze(script: string) {
    setIsLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script }),
      });
      const data = await res.json();
      if (!data.error && data.data) {
        setScenes(data.data.scenes);
        setMessage(data.data.message);
      } else {
        setMessage(data.message || "Analysis failed.");
      }
    } catch {
      setMessage("Network error — using demo data.");
      fetchScenes();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-amber-500">🎬 Script Analysis</h1>
        <p className="text-gray-400 mt-2">
          Paste a screenplay to extract scenes, or explore the pre-loaded demo data.
        </p>
      </header>

      <ScreenplayEditor onAnalyze={handleAnalyze} isLoading={isLoading} />

      {message && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-amber-400">
          {message}
        </div>
      )}

      {scenes.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-100 mb-4">
            Extracted Scenes ({scenes.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenes.map((scene) => (
              <SceneCard key={scene.id} scene={scene} />
            ))}
          </div>
        </div>
      )}

      {scenes.length === 0 && !isLoading && (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">No scenes loaded yet.</p>
          <p className="text-gray-600 text-sm mt-2">
            Paste a screenplay above and click <strong>Analyze Script</strong>, or load the demo.
          </p>
        </div>
      )}
    </div>
  );
}
