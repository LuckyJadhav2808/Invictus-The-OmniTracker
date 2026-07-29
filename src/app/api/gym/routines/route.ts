import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { GymRoutine } from "@/models/GymRoutine";

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

    const query: any = { userId };
    if (dayOfWeek) query.dayOfWeek = dayOfWeek;

    const routines = await GymRoutine.find(query).sort({ createdAt: 1 });
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
      await existing.save();
      return NextResponse.json(existing);
    }

    const newRoutine = await GymRoutine.create({
      id,
      userId,
      dayOfWeek,
      routineTitle,
      exercises: exercises || [],
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
    if (exercises !== undefined) updateFields.exercises = exercises;

    const updated = await GymRoutine.findOneAndUpdate(
      { id, userId },
      { $set: updateFields },
      { new: true }
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
