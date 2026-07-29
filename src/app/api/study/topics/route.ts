import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Topic } from "@/models/Topic";

// GET /api/study/topics?userId=xxx&subjectId=yyy
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const subjectId = searchParams.get("subjectId");

    if (!userId) {
      return NextResponse.json({ error: "UserId required for data isolation" }, { status: 400 });
    }

    const query: any = { userId };
    if (subjectId) query.subjectId = subjectId;

    const topics = await Topic.find(query).sort({ createdAt: 1 });
    return NextResponse.json(topics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/study/topics - Create topic
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { userId, subjectId, title, difficulty, status, confidence, estimatedHours, revisionsCount, satisfactionRate, notes } = body;

    if (!userId || !subjectId || !title) {
      return NextResponse.json({ error: "UserId, subjectId, and title required" }, { status: 400 });
    }

    const id = body.id || `topic_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTopic = await Topic.create({
      id,
      userId,
      subjectId,
      title,
      difficulty: difficulty || "medium",
      status: status || "notStarted",
      confidence: Number(confidence) || 1,
      estimatedHours: Number(estimatedHours) || 1,
      revisionsCount: Number(revisionsCount) || 0,
      satisfactionRate: Number(satisfactionRate) || 5,
      notes: notes || "",
    });

    return NextResponse.json(newTopic, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/study/topics - Update topic
export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, userId, title, difficulty, status, confidence, estimatedHours, revisionsCount, satisfactionRate, notes } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: "Id and userId required" }, { status: 400 });
    }

    const updateFields: any = {};
    if (title !== undefined) updateFields.title = title;
    if (difficulty !== undefined) updateFields.difficulty = difficulty;
    if (status !== undefined) updateFields.status = status;
    if (confidence !== undefined) updateFields.confidence = Number(confidence);
    if (estimatedHours !== undefined) updateFields.estimatedHours = Number(estimatedHours);
    if (revisionsCount !== undefined) updateFields.revisionsCount = Number(revisionsCount);
    if (satisfactionRate !== undefined) updateFields.satisfactionRate = Number(satisfactionRate);
    if (notes !== undefined) updateFields.notes = notes;

    const updated = await Topic.findOneAndUpdate(
      { id, userId },
      { $set: updateFields },
      { new: true }
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/study/topics?id=xxx&userId=yyy
export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json({ error: "Id and userId required" }, { status: 400 });
    }

    await Topic.deleteOne({ id, userId });
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
