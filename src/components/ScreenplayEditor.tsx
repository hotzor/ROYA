"use client";

import { useState } from "react";
import { demoScript } from "@/lib/demo-data";

interface ScreenplayEditorProps {
  onAnalyze: (script: string) => void;
  isLoading: boolean;
}

export default function ScreenplayEditor({ onAnalyze, isLoading }: ScreenplayEditorProps) {
  const [script, setScript] = useState("");

  const handleLoadDemo = () => {
    setScript(demoScript);
  };

  const handleAnalyze = () => {
    if (script.trim().length > 0) {
      onAnalyze(script);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-100">Screenplay Input</h2>
          <p className="text-sm text-gray-500">
            Paste your screenplay below, or load the demo script.
          </p>
        </div>
        <button
          onClick={handleLoadDemo}
          className="btn-secondary text-sm"
          disabled={isLoading}
        >
          Load Demo Script
        </button>
      </div>

      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder="Paste your screenplay here...

FADE IN:

1. INT. LOCATION - DAY
   Description of the scene.
   CHARACTER: &quot;Dialogue.&quot;

2. EXT. LOCATION - NIGHT
   ..."
        className="input-dark w-full font-mono text-sm leading-relaxed resize-y"
        style={{ minHeight: "400px" }}
        disabled={isLoading}
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-600">
          {script.length > 0
            ? `${script.split("\n").filter((l) => l.trim()).length} lines · ${script.length} characters`
            : "No script loaded"}
        </p>
        <button
          onClick={handleAnalyze}
          disabled={isLoading || script.trim().length === 0}
          className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span> Analyzing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              🎬 Analyze Script
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
