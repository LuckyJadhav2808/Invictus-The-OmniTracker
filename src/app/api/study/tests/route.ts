import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Test } from "@/models/Test";

// GET /api/study/tests?userId=xxx
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "UserId required for data isolation" }, { status: 400 });
    }

    const tests = await Test.find({ userId }).sort({ date: -1 });
    return NextResponse.json(tests);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/study/tests - Add test
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { userId, name, date, score, totalScore, subjectId } = body;

    if (!userId || !name || !date) {
      return NextResponse.json({ error: "UserId, name, and date required" }, { status: 400 });
    }

    const id = body.id || `test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTest = await Test.create({
      id,
      userId,
      name,
      date,
      score: Number(score) || 0,
      totalScore: Number(totalScore) || 100,
      subjectId: subjectId || "",
    });

    return NextResponse.json(newTest, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/study/tests - Update test
export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, userId, name, date, score, totalScore, subjectId } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: "Id and userId required" }, { status: 400 });
    }

    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name;
    if (date !== undefined) updateFields.date = date;
    if (score !== undefined) updateFields.score = Number(score);
    if (totalScore !== undefined) updateFields.totalScore = Number(totalScore);
    if (subjectId !== undefined) updateFields.subjectId = subjectId;

    const updated = await Test.findOneAndUpdate(
      { id, userId },
      { $set: updateFields },
      { new: true }
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/study/tests?id=xxx&userId=yyy
export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json({ error: "Id and userId required" }, { status: 400 });
    }

    await Test.deleteOne({ id, userId });
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
