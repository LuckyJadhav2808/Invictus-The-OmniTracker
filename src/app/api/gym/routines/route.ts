import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { GymRoutine } from "@/models/GymRoutine";
import {
  getCurrentISOWeekKey,
  shouldRoutineRollover,
  resetRoutineCheckmarks,
} from "@/lib/utils/gym-rollover";

// GET /api/gym/routines?userId=xxx&dayOfWeek=Monday
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const dayOfWeek = searchParams.get("dayOfWeek");

    if (!userId) {
      return NextResponse.json({ error: "UserId required for data isolation" }, { status: 400 });
    }

    const targetUserIds = (userId === "user-admin-default" || userId === "user_1kapw9sad_1784744868999")
      ? ["user-admin-default", "user_1kapw9sad_1784744868999"]
      : [userId];

    const query: any = { userId: { $in: targetUserIds } };
    if (dayOfWeek) query.dayOfWeek = dayOfWeek;

    const routines = await GymRoutine.find(query).sort({ createdAt: 1 });
    const currentWeekKey = getCurrentISOWeekKey();

    // Automatic Weekly Rollover:
    // If a routine was completed in an earlier week, automatically refresh checkboxes
    // while strictly preserving all exercises, machines, weights, and reps.
    for (const routine of routines) {
      if (shouldRoutineRollover(routine, currentWeekKey)) {
        const hasCompletedSets = (routine.exercises || []).some((ex: any) =>
          (ex.sets || []).some((s: any) => s.completed)
        );
        if (hasCompletedSets || !routine.lastActiveWeek) {
          routine.exercises = resetRoutineCheckmarks(routine.exercises || []);
          routine.lastActiveWeek = currentWeekKey;
          await routine.save();
        }
      }
    }

    return NextResponse.json(routines);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/gym/routines - Create day routine split
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { userId, dayOfWeek, routineTitle, exercises } = body;

    if (!userId || !dayOfWeek || !routineTitle) {
      return NextResponse.json({ error: "UserId, dayOfWeek, and routineTitle required" }, { status: 400 });
    }

    const id = body.id || `gr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    // Check if routine for this day already exists for user
    const existing = await GymRoutine.findOne({ userId, dayOfWeek });
    if (existing) {
      existing.routineTitle = routineTitle;
      if (exercises) existing.exercises = exercises;
      existing.lastActiveWeek = getCurrentISOWeekKey();
      await existing.save();
      return NextResponse.json(existing);
    }

    const newRoutine = await GymRoutine.create({
      id,
      userId,
      dayOfWeek,
      routineTitle,
      exercises: exercises || [],
      lastActiveWeek: getCurrentISOWeekKey(),
    });

    return NextResponse.json(newRoutine, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/gym/routines - Update routine (title, exercises, sets, reps, completed)
export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, userId, routineTitle, exercises } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: "Id and userId required" }, { status: 400 });
    }

    const updateFields: any = {};
    if (routineTitle !== undefined) updateFields.routineTitle = routineTitle;
    if (exercises !== undefined) {
      updateFields.exercises = exercises;
      updateFields.lastActiveWeek = getCurrentISOWeekKey();
    }

    const updated = await GymRoutine.findOneAndUpdate(
      { id, userId },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/gym/routines?id=xxx&userId=yyy
export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json({ error: "Id and userId required" }, { status: 400 });
    }

    await GymRoutine.deleteOne({ id, userId });
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
