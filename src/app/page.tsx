"use client";

import { useState, useEffect } from "react";
import ScreenplayEditor from "@/components/ScreenplayEditor";
import SceneCard from "@/components/SceneCard";
import { registerMCPTools } from "@/mcp/tools";
import { useRoya } from "@/components/RoyaProvider";

export default function HomePage() {
  const { state, analyze, origin } = useRoya();
  const [message, setMessage] = useState("");

  useEffect(() => {
    registerMCPTools();
  }, []);

  const scenes = state.scenes;
  const isLoading = state.analyzing;

  async function handleAnalyze(script: string) {
    setMessage("");
    try {
      await analyze(script);
      setMessage(`${state.scenes.length} scenes extracted from screenplay.`);
    } catch {
      setMessage("Analysis failed.");
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-amber-500 leading-tight">🎬 Script Analysis</h1>
        <p className="text-gray-400 mt-2 text-sm md:text-base">
          Paste a screenplay to extract scenes, or explore the pre-loaded demo data.
        </p>
      </header>

      <ScreenplayEditor onAnalyze={handleAnalyze} isLoading={isLoading} />

      {message && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-amber-400">
          {message}
        </div>
      )}

      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-lg font-bold text-gray-100">
          {origin === "demo" ? "Demo Scenes" : origin === "analysis" ? "Extracted Scenes" : "Scenes"}
        </h2>
        {origin === "demo" && (
          <span className="badge bg-blue-500/20 text-blue-400 border border-blue-500/30">Demo data</span>
        )}
        {origin === "analysis" && (
          <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/30">Your analysis</span>
        )}
        {scenes.length > 0 && !isLoading && (
          <span className="text-sm text-gray-500">({scenes.length})</span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-dark-600 rounded w-3/4 mb-3" />
              <div className="h-3 bg-dark-600 rounded w-full mb-2" />
              <div className="h-3 bg-dark-600 rounded w-5/6 mb-4" />
              <div className="h-3 bg-dark-600 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : scenes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenes.map((scene) => (
            <SceneCard key={scene.id} scene={scene} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">No scenes loaded yet.</p>
          <p className="text-gray-600 text-sm mt-2">
            Load the demo script above or paste a screenplay and click <strong>Analyze Script</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
