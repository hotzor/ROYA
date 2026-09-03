import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { demoTasks } from "@/lib/demo-data";

function ensureDemoTasks() {
  if (!store.isInitialized()) {
    store.init([], "2025-02-01");
  }
  if (store.getTasks().length === 0) {
    for (const task of demoTasks) {
      store.addTask(task);
    }
  }
}

export async function GET() {
  try {
    ensureDemoTasks();
    const tasks = store.getTasks();
    return NextResponse.json({
      error: false,
      data: {
        total: tasks.length,
        byStatus: {
          todo: tasks.filter((t) => t.status === "todo").length,
          in_progress: tasks.filter((t) => t.status === "in_progress").length,
          done: tasks.filter((t) => t.status === "done").length,
        },
        tasks,
      },
    });
  } catch (err) {
    console.error("tasks GET error:", err);
    return NextResponse.json({
      error: false,
      data: { total: demoTasks.length, tasks: demoTasks },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    ensureDemoTasks();

    const body = await request.json();
    const { sceneId, department, task, assignee, status } = body;

    if (!sceneId || !department || !task) {
      return NextResponse.json(
        { error: true, message: "Required fields: sceneId, department, task." },
        { status: 400 }
      );
    }

    const scene = store.getScene(sceneId);
    const sceneSlug = scene?.slug || "unknown";

    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newTask = {
      id,
      sceneId,
      sceneSlug,
      department,
      task,
      assignee: assignee || "Unassigned",
      status: status || "todo",
      createdAt: new Date().toISOString(),
    };

    store.addTask(newTask);

    return NextResponse.json({ error: false, data: newTask });
  } catch (err) {
    console.error("tasks POST error:", err);
    return NextResponse.json(
      { error: true, message: "Failed to create task." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    ensureDemoTasks();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: true, message: "Task id is required." },
        { status: 400 }
      );
    }

    const updated = store.updateTask(id, updates);
    if (!updated) {
      return NextResponse.json(
        { error: true, message: `Task "${id}" not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: false, data: updated });
  } catch (err) {
    console.error("tasks PATCH error:", err);
    return NextResponse.json(
      { error: true, message: "Failed to update task." },
      { status: 500 }
    );
  }
}
