import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Habit } from "@/models/Habit";
import { HabitLog } from "@/models/HabitLog";

// GET /api/goals/habits?userId=xxx
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "UserId is required" }, { status: 400 });
    }

    const targetUserIds = (userId === "user-admin-default" || userId === "user_1kapw9sad_1784744868999")
      ? ["user-admin-default", "user_1kapw9sad_1784744868999"]
      : [userId];

    const habits = await Habit.find({ userId: { $in: targetUserIds }, archived: { $ne: true } }).sort({ createdAt: -1 });
    return NextResponse.json(habits);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/goals/habits (Create new habit)
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.userId || !body.title) {
      return NextResponse.json({ error: "UserId and title are required" }, { status: 400 });
    }

    const habitId = body.id || `h_${Date.now()}`;
    
    // Normalize targetValue/goalTarget and unit/goalUnit for cross-schema compatibility
    const targetValue = body.targetValue ?? body.goalTarget;
    const goalTarget = body.goalTarget ?? body.targetValue;
    const unit = body.unit ?? body.goalUnit;
    const goalUnit = body.goalUnit ?? body.unit;

    const newHabit = await Habit.create({
      ...body,
      id: habitId,
      archived: false,
      targetValue,
      goalTarget,
      unit,
      goalUnit,
    });

    return NextResponse.json(newHabit, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/goals/habits (Update habit)
export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, userId, ...updates } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: "Habit id and userId are required" }, { status: 400 });
    }

    const targetUserIds = (userId === "user-admin-default" || userId === "user_1kapw9sad_1784744868999")
      ? ["user-admin-default", "user_1kapw9sad_1784744868999"]
      : [userId];

    const updated = await Habit.findOneAndUpdate(
      { id, userId: { $in: targetUserIds } },
      { $set: { ...updates, updatedAt: new Date() } },
      { new: true }
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/goals/habits?id=xxx&userId=yyy (Delete habit)
export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json({ error: "Habit id and userId are required" }, { status: 400 });
    }

    const targetUserIds = (userId === "user-admin-default" || userId === "user_1kapw9sad_1784744868999")
      ? ["user-admin-default", "user_1kapw9sad_1784744868999"]
      : [userId];

    // Permanently delete habit document and all its logs from MongoDB
    await Habit.deleteOne({ id, userId: { $in: targetUserIds } });
    await HabitLog.deleteMany({ habitId: id, userId: { $in: targetUserIds } });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
