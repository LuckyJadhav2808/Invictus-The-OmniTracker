import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Task } from "@/models/Task";

const ADMIN_UID = "user_1kapw9sad_1784744868999";
const LEGACY_ADMIN_UID = "user-admin-default";

function getTargetUserIds(userId: string) {
  if (userId === ADMIN_UID || userId === LEGACY_ADMIN_UID) {
    return [ADMIN_UID, LEGACY_ADMIN_UID];
  }
  return [userId];
}

// GET /api/tasks?userId=xxx
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "UserId is required for data isolation" }, { status: 400 });
    }

    const targetUserIds = getTargetUserIds(userId);
    const tasks = await Task.find({ userId: { $in: targetUserIds } }).sort({ createdAt: -1 });

    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/tasks
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const userId = body.userId || ADMIN_UID;
    const taskId = body.id || `task_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

    const task = await Task.findOneAndUpdate(
      { id: taskId },
      {
        $set: {
          id: taskId,
          userId,
          title: body.title,
          description: body.description || "",
          status: body.status || "todo",
          priority: body.priority || "p2",
          dueDate: body.dueDate || null,
          dueTime: body.dueTime || null,
          estimatedMinutes: Number(body.estimatedMinutes) || 0,
          loggedMinutes: Number(body.loggedMinutes) || 0,
          projectTag: body.projectTag || "General",
          subtasks: body.subtasks || [],
          completedAt: body.completedAt || null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/tasks
export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const userId = body.userId || ADMIN_UID;
    const targetUserIds = getTargetUserIds(userId);

    const updatedTask = await Task.findOneAndUpdate(
      { id: body.id, userId: { $in: targetUserIds } },
      {
        $set: {
          ...(body.title !== undefined && { title: body.title }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.status !== undefined && { status: body.status }),
          ...(body.priority !== undefined && { priority: body.priority }),
          ...(body.dueDate !== undefined && { dueDate: body.dueDate }),
          ...(body.dueTime !== undefined && { dueTime: body.dueTime }),
          ...(body.estimatedMinutes !== undefined && { estimatedMinutes: Number(body.estimatedMinutes) }),
          ...(body.loggedMinutes !== undefined && { loggedMinutes: Number(body.loggedMinutes) }),
          ...(body.projectTag !== undefined && { projectTag: body.projectTag }),
          ...(body.subtasks !== undefined && { subtasks: body.subtasks }),
          ...(body.completedAt !== undefined && { completedAt: body.completedAt }),
        },
      },
      { new: true }
    );

    if (!updatedTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/tasks?id=xxx&userId=yyy
export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId") || ADMIN_UID;

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const targetUserIds = getTargetUserIds(userId);
    await Task.findOneAndDelete({ id, userId: { $in: targetUserIds } });

    return NextResponse.json({ success: true, message: "Task deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
