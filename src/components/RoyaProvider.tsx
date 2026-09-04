"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Scene, Task } from "@/lib/store";
import {
  getState,
  subscribe,
  hydrateStore,
  setAnalyzing,
  resetAnalyzing,
  setScheduling,
  clientAnalyze,
  setAnalyzedScenes,
  applySchedule,
  updateSceneStatus,
  addTask,
  updateTask,
  clearResults,
  resetToDemo,
  setStartDate,
  clientGenerateSchedule,
  setScript,
} from "@/lib/client-store";
import { demoScript } from "@/lib/demo-data";
import type { RoyaState, DataOrigin, ToastState } from "@/lib/client-store";

interface RoyaContextValue {
  state: RoyaState;
  origin: DataOrigin;
  script: string;
  changeScript: (script: string) => void;
  showToast: (message: string, kind?: ToastState["kind"]) => void;
  analyze: (script: string) => Promise<void>;
  loadDemoScript: () => void;
  generateSchedule: (startDate: string) => Promise<void>;
  rescheduleAndGenerate: (startDate: string) => Promise<void>;
  changeSceneStatus: (id: string, status: Scene["status"]) => void;
  createTask: (input: { sceneId: string; department: string; task: string; assignee?: string }) => Task;
  moveTask: (id: string, status: Task["status"]) => void;
  changeStartDate: (date: string) => void;
  reset: () => void;
}

const RoyaContext = createContext<RoyaContextValue | null>(null);

interface ToastItem {
  id: number;
  message: string;
  kind: ToastState["kind"];
}

export function RoyaProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RoyaState>(() => getState());
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastId = useRef(0);

  useEffect(() => {
    hydrateStore();
    setState(getState());
    const unsub = subscribe(() => setState(getState()));
    return unsub;
  }, []);

  const showToast = useCallback((message: string, kind: ToastState["kind"] = "info") => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const analyze = useCallback(
    async (script: string) => {
      setAnalyzing();
      setState(getState());
      showToast("Analyzing screenplay…", "info");
      try {
        const scenes = await clientAnalyze(script);
        if (!scenes || scenes.length === 0) {
          resetAnalyzing();
          setState(getState());
          showToast("No scenes could be extracted from the script.", "error");
          return;
        }
        setAnalyzedScenes(scenes);
        resetAnalyzing();
        setState(getState());
        showToast(`Extracted ${scenes.length} scenes.`, "success");
      } catch {
        resetAnalyzing();
        setState(getState());
        showToast("Analysis failed — please try again.", "error");
      }
    },
    [showToast]
  );

  const loadDemoScript = useCallback(() => {
    setScript(demoScript);
    clearResults();
    setState(getState());
    showToast("Demo script loaded — click Analyze to extract scenes.", "info");
  }, [showToast]);

  const generateSchedule = useCallback(
    async (startDate: string) => {
      setScheduling(true);
      setState(getState());
      try {
        const current = getState();
        const scenes = current.scenes;
        if (scenes.length === 0) {
          setScheduling(false);
          setState(getState());
          showToast("No scenes to schedule — analyze a script first.", "error");
          return;
        }
        const withWeather = await clientGenerateSchedule(scenes, startDate);
        setScheduling(false);
        applySchedule(withWeather, startDate);
        setState(getState());
        showToast(`Schedule generated for ${scenes.length} scenes.`, "success");
      } catch {
        setScheduling(false);
        setState(getState());
        showToast("Could not generate schedule.", "error");
      }
    },
    [showToast]
  );

  const rescheduleAndGenerate = useCallback(
    async (startDate: string) => {
      setScheduling(true);
      setState(getState());
      await new Promise((r) => setTimeout(r, 300));
      const current = getState();
      const scheduled = await clientGenerateSchedule(current.scenes, startDate);
      setScheduling(false);
      applySchedule(scheduled, startDate);
      setState(getState());
      showToast(`Schedule regenerated from ${startDate}.`, "success");
    },
    [showToast]
  );

  const changeSceneStatus = useCallback((id: string, status: Scene["status"]) => {
    updateSceneStatus(id, status);
    setState(getState());
  }, []);

  const createTask = useCallback(
    (input: { sceneId: string; department: string; task: string; assignee?: string }) => {
      const task = addTask(input);
      setState(getState());
      showToast("Task created.", "success");
      return task;
    },
    [showToast]
  );

  const moveTask = useCallback((id: string, status: Task["status"]) => {
    updateTask(id, { status });
    setState(getState());
  }, []);

  const changeStartDate = useCallback((date: string) => {
    setStartDate(date);
    setState(getState());
  }, []);

  const changeScript = useCallback((script: string) => {
    setScript(script);
  }, []);

  const reset = useCallback(() => {
    resetToDemo();
    setState(getState());
    showToast("Reset complete — demo data restored.", "success");
  }, [showToast]);

  const value: RoyaContextValue = {
    state,
    origin: state.origin,
    script: state.script,
    changeScript,
    showToast,
    analyze,
    loadDemoScript,
    generateSchedule,
    rescheduleAndGenerate,
    changeSceneStatus,
    createTask,
    moveTask,
    changeStartDate,
    reset,
  };

  return (
    <RoyaContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto max-w-[85vw] sm:max-w-sm px-4 py-3 rounded-lg text-sm font-medium shadow-lg border animate-[fadeIn_0.2s_ease-out] ${
              t.kind === "success"
                ? "bg-green-600/95 text-white border-green-400/40"
                : t.kind === "error"
                ? "bg-red-600/95 text-white border-red-400/40"
                : "bg-dark-700/95 text-gray-100 border-dark-500"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </RoyaContext.Provider>
  );
}

export function useRoya(): RoyaContextValue {
  const ctx = useContext(RoyaContext);
  if (!ctx) {
    throw new Error("useRoya must be used within a RoyaProvider");
  }
  return ctx;
}
