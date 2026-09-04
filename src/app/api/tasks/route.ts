import { NextRequest, NextResponse } from "next/server";
import { demoTasks, demoScenes } from "@/lib/demo-data";

export async function GET() {
  try {
    const tasks = demoTasks;
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
    const body = await request.json();
    const { sceneId, department, task, assignee, status } = body;

    if (!sceneId || !department || !task) {
      return NextResponse.json(
        { error: true, message: "Required fields: sceneId, department, task." },
        { status: 400 }
      );
    }

    const scene = demoScenes.find((s) => s.id === sceneId);
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

    return NextResponse.json({ error: false, data: newTask });
  } catch (err) {
    console.error("tasks POST error:", err);
    return NextResponse.json(
      { error: true, message: "Failed to create task." },
      { status: 500 }
    );
  }
}
