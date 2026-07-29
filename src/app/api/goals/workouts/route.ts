import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Workout } from "@/models/Workout";

// GET /api/goals/workouts?userId=xxx&date=YYYY-MM-DD
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const query: any = { userId };
    if (date) query.date = date;

    const docs = await Workout.find(query).sort({ createdAt: 1 });
    const formatted = docs.map((doc) => ({
      id: doc._id.toString(),
      date: doc.date,
      name: doc.name,
      details: doc.details || "",
      completed: !!doc.completed,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/goals/workouts - create workout
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { userId, date, name, details } = body;

    if (!userId || !date || !name) {
      return NextResponse.json({ error: "Missing required fields (userId, date, name)" }, { status: 400 });
    }

    const doc = await Workout.create({
      userId,
      date,
      name,
      details: details || "",
      completed: false,
    });

    return NextResponse.json({
      id: doc._id.toString(),
      date: doc.date,
      name: doc.name,
      details: doc.details || "",
      completed: doc.completed,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/goals/workouts - update/toggle workout
export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, userId, completed, name, details } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: "Missing id or userId" }, { status: 400 });
    }

    const updateFields: any = {};
    if (completed !== undefined) updateFields.completed = completed;
    if (name !== undefined) updateFields.name = name;
    if (details !== undefined) updateFields.details = details;

    const doc = await Workout.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateFields },
      { new: true }
    );

    if (!doc) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: doc._id.toString(),
      date: doc.date,
      name: doc.name,
      details: doc.details || "",
      completed: doc.completed,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/goals/workouts?id=xxx&userId=yyy
export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json({ error: "Missing id or userId" }, { status: 400 });
    }

    await Workout.deleteOne({ _id: id, userId });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
