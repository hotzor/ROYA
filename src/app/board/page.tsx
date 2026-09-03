"use client";

import { useState, useEffect, useCallback } from "react";
import type { Task } from "@/lib/store";

const DEPARTMENTS = ["Camera", "Lighting", "Art", "Sound", "Wardrobe", "Props"];
const STATUSES = ["todo", "in_progress", "done"] as const;
const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};
const STATUS_COLORS: Record<string, string> = {
  todo: "border-gray-600/40",
  in_progress: "border-amber-500/40",
  done: "border-green-500/40",
};

export default function BoardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    sceneId: "",
    department: "Camera",
    task: "",
    assignee: "",
  });
  const [scenes, setScenes] = useState<{ id: string; slug: string }[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, scenesRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/scenes"),
      ]);
      const tasksData = await tasksRes.json();
      const scenesData = await scenesRes.json();
      setTasks(tasksData.data?.tasks || []);
      setScenes(scenesData.data?.scenes?.map((s: { id: string; slug: string }) => ({ id: s.id, slug: s.slug })) || []);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!form.sceneId || !form.task.trim()) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.error) {
        setTasks((prev) => [...prev, data.data]);
        setForm({ sceneId: "", department: "Camera", task: "", assignee: "" });
        setShowForm(false);
      }
    } catch {
      // Silent
    }
  }

  async function moveTask(id: string, newStatus: Task["status"]) {
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
      );
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
      );
    }
  }

  if (loading) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">Loading board...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-amber-500">📋 Production Board</h1>
          <p className="text-gray-400 mt-2">
            Kanban task board — drag tasks across departments and statuses.
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "✕ Cancel" : "+ New Task"}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleCreateTask} className="card space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Scene</label>
              <select
                value={form.sceneId}
                onChange={(e) => setForm({ ...form, sceneId: e.target.value })}
                className="input-dark w-full text-sm"
                required
              >
                <option value="">Select scene...</option>
                {scenes.map((s) => (
                  <option key={s.id} value={s.id}>{s.slug}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="input-dark w-full text-sm"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Task</label>
              <input
                type="text"
                value={form.task}
                onChange={(e) => setForm({ ...form, task: e.target.value })}
                className="input-dark w-full text-sm"
                placeholder="What needs to be done?"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Assignee</label>
              <input
                type="text"
                value={form.assignee}
                onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                className="input-dark w-full text-sm"
                placeholder="Person responsible"
              />
            </div>
          </div>
          <button type="submit" className="btn-primary text-sm">
            Create Task
          </button>
        </form>
      )}

      <div className="grid grid-cols-3 gap-4">
        {STATUSES.map((status) => {
          const statusTasks = tasks.filter((t) => t.status === status);
          return (
            <div key={status} className="space-y-3">
              <div className={`border-t-2 ${STATUS_COLORS[status]} pt-3 mb-4`}>
                <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wide">
                  {STATUS_LABELS[status]}
                  <span className="ml-2 text-xs font-normal text-gray-600">
                    ({statusTasks.length})
                  </span>
                </h2>
              </div>
              <div className="space-y-3 kanban-column">
                {statusTasks.map((task) => (
                  <div
                    key={task.id}
                    className="card !p-4 border-l-2 border-l-amber-500/30"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] text-gray-500 font-mono">
                        {task.sceneSlug}
                      </span>
                      <span className="badge bg-dark-600 text-gray-400 border-dark-500 text-[10px]">
                        {task.department}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 mb-2">{task.task}</p>
                    <p className="text-xs text-gray-500 mb-3">{task.assignee}</p>
                    <div className="flex gap-1">
                      {STATUSES.filter((s) => s !== status).map((s) => (
                        <button
                          key={s}
                          onClick={() => moveTask(task.id, s)}
                          className="text-[10px] text-gray-600 hover:text-amber-400 px-2 py-1 rounded hover:bg-dark-600 transition-all"
                        >
                          → {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {statusTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-600 text-xs">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
