"use client";

import { useState, useEffect, useCallback } from "react";
import StatusGrid from "@/components/StatusGrid";
import CallSheetDisplay from "@/components/CallSheet";
import type { ProductionStatus, CallSheet } from "@/lib/store";

export default function DashboardPage() {
  const [status, setStatus] = useState<ProductionStatus | null>(null);
  const [callSheet, setCallSheet] = useState<CallSheet | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      if (!data.error) setStatus(data.data);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchDates();
  }, [fetchStatus]);

  async function fetchDates() {
    try {
      const res = await fetch("/api/callsheet");
      const data = await res.json();
      if (!data.error && data.data?.availableDates) {
        setAvailableDates(data.data.availableDates);
        if (data.data.availableDates.length > 0) {
          setSelectedDate(data.data.availableDates[0]);
        }
      }
    } catch {
      // Silent
    }
  }

  async function loadCallSheet(date: string) {
    setSelectedDate(date);
    try {
      const res = await fetch(`/api/callsheet?date=${date}`);
      const data = await res.json();
      if (!data.error) setCallSheet(data.data);
    } catch {
      // Silent
    }
  }

  function exportCallSheet(format: "text" | "html") {
    if (!selectedDate) return;
    window.open(`/api/callsheet?date=${selectedDate}&format=${format}`, "_blank");
  }

  if (loading) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-amber-500">📊 Production Dashboard</h1>
        <p className="text-gray-400 mt-2">
          Overview of your production status, schedule, and call sheets.
        </p>
      </header>

      {status && <StatusGrid status={status} />}

      {status && status.weatherAlerts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-5 py-4">
          <h3 className="text-sm font-bold text-red-400 mb-2">⚠️ Weather Alerts</h3>
          {status.weatherAlerts.map((alert, i) => (
            <p key={i} className="text-xs text-red-300">{alert}</p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold text-gray-100 mb-4">📅 Call Sheet</h2>
          {availableDates.length > 0 ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                {availableDates.map((d) => (
                  <button
                    key={d}
                    onClick={() => loadCallSheet(d)}
                    className={`text-sm px-3 py-1.5 rounded-lg transition-all ${
                      selectedDate === d
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "text-gray-500 hover:text-gray-300 bg-dark-800 border border-dark-500"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              {callSheet && (
                <CallSheetDisplay sheet={callSheet} onExport={exportCallSheet} />
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              Generate a schedule first to see call sheets.
            </p>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-gray-100 mb-4">🎭 Quick Stats</h2>
          {status && (
            <div className="space-y-4">
              <div className="bg-dark-800 rounded-lg p-4 border border-dark-500">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Overall Completion</span>
                  <span className="text-amber-400 font-bold">{status.completionPercent}%</span>
                </div>
                <div className="w-full bg-dark-600 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${status.completionPercent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-dark-800 rounded-lg p-3 border border-dark-500 text-center">
                  <p className="text-xl font-bold text-blue-400">{status.totalScenes}</p>
                  <p className="text-xs text-gray-500">Scenes</p>
                </div>
                <div className="bg-dark-800 rounded-lg p-3 border border-dark-500 text-center">
                  <p className="text-xl font-bold text-purple-400">{status.totalTasks}</p>
                  <p className="text-xs text-gray-500">Tasks</p>
                </div>
                <div className="bg-dark-800 rounded-lg p-3 border border-dark-500 text-center">
                  <p className="text-xl font-bold text-green-400">{status.completedScenes}</p>
                  <p className="text-xs text-gray-500">Scenes Done</p>
                </div>
                <div className="bg-dark-800 rounded-lg p-3 border border-dark-500 text-center">
                  <p className="text-xl font-bold text-amber-400">{status.completedTasks}</p>
                  <p className="text-xs text-gray-500">Tasks Done</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
