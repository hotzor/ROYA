"use client";

import { useRoya } from "@/components/RoyaProvider";

interface ScreenplayEditorProps {
  onAnalyze: (script: string) => void;
  isLoading: boolean;
}

export default function ScreenplayEditor({ onAnalyze, isLoading }: ScreenplayEditorProps) {
  const { script, changeScript, loadDemoScript } = useRoya();

  const handleAnalyze = () => {
    if (script.trim().length > 0) {
      onAnalyze(script);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-100">Screenplay Input</h2>
          <p className="text-sm text-gray-500">
            Paste your screenplay below, or load the demo script.
          </p>
        </div>
        <button
          onClick={loadDemoScript}
          className="btn-secondary text-sm min-h-[44px] sm:w-auto w-full"
          disabled={isLoading}
        >
          Load Demo Script
        </button>
      </div>

      <textarea
        value={script}
        onChange={(e) => changeScript(e.target.value)}
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

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-xs text-gray-600">
          {script.length > 0
            ? `${script.split("\n").filter((l) => l.trim()).length} lines · ${script.length} characters`
            : "No script loaded"}
        </p>
        <button
          onClick={handleAnalyze}
          disabled={isLoading || script.trim().length === 0}
          className="btn-primary min-h-[44px] w-full sm:w-auto disabled:opacity-40 disabled:cursor-not-allowed"
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
