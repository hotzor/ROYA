"use client";

import { useState, useEffect } from "react";
import ScheduleRow from "@/components/ScheduleRow";
import type { Scene } from "@/lib/store";

export default function SchedulePage() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [startDate, setStartDate] = useState("2025-02-03");
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [weatherAlerts, setWeatherAlerts] = useState<string[]>([]);

  useEffect(() => {
    fetchSchedule();
  }, []);

  async function fetchSchedule() {
    setLoading(true);
    try {
      const res = await fetch("/api/schedule");
      const data = await res.json();
      if (!data.error && data.data) {
        setScenes(data.data.scenes || []);
        if (data.data.startDate) setStartDate(data.data.startDate);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }

  async function generateSchedule() {
    setLoading(true);
    setWeatherAlerts([]);
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate }),
      });
      const data = await res.json();
      if (!data.error && data.data) {
        setScenes(data.data.scenes || []);
        setWeatherAlerts(data.data.weatherAlerts || []);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }

  const days = Array.from(new Set(scenes.map((s) => s.dayNumber).filter(Boolean))).sort(
    (a, b) => (a as number) - (b as number)
  );

  const extCount = scenes.filter((s) => s.type === "EXT").length;
  const intCount = scenes.filter((s) => s.type === "INT").length;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-amber-500">📅 Shooting Schedule</h1>
          <p className="text-gray-400 mt-2">
            Weather-aware schedule — rain auto-reschedules exterior scenes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-dark text-sm"
            />
          </div>
          <button onClick={generateSchedule} disabled={loading} className="btn-primary mt-5">
            {loading ? "⏳ Scheduling..." : "🎬 Generate Schedule"}
          </button>
        </div>
      </header>

      {weatherAlerts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
          <p className="text-sm font-semibold text-red-400 mb-1">Weather Alerts</p>
          {weatherAlerts.map((alert, i) => (
            <p key={i} className="text-xs text-red-300">{alert}</p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-amber-400">{scenes.length}</p>
          <p className="text-xs text-gray-500">Total Scenes</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-400">{intCount}</p>
          <p className="text-xs text-gray-500">Interior</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-orange-400">{extCount}</p>
          <p className="text-xs text-gray-500">Exterior</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-purple-400">{days.length}</p>
          <p className="text-xs text-gray-500">Shooting Days</p>
        </div>
      </div>

      {!initialLoad && scenes.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">No schedule generated yet.</p>
          <p className="text-gray-600 text-sm mt-2">
            Set a start date and click <strong>Generate Schedule</strong>.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-dark-800 border-b border-dark-500">
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">#</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Scene</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Time</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Location</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Cast</th>
                  <th className="text-center py-3 px-4 text-xs text-gray-500 font-medium">Day</th>
                  <th className="text-center py-3 px-4 text-xs text-gray-500 font-medium">Date</th>
                  <th className="text-center py-3 px-4 text-xs text-gray-500 font-medium">Weather</th>
                  <th className="text-center py-3 px-4 text-xs text-gray-500 font-medium">Rain</th>
                </tr>
              </thead>
              <tbody>
                {scenes.map((scene) => (
                  <ScheduleRow key={scene.id} scene={scene} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
