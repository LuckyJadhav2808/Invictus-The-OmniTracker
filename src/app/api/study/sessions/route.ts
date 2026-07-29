import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { StudySession } from "@/models/StudySession";

// GET /api/study/sessions?userId=xxx&subjectId=yyy
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

    const sessions = await StudySession.find(query).sort({ date: -1, createdAt: -1 });
    return NextResponse.json(sessions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/study/sessions - Log new study session
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { userId, subjectId, topicId, durationMinutes, type, date, notes } = body;

    if (!userId || durationMinutes === undefined) {
      return NextResponse.json({ error: "Missing required fields (userId, durationMinutes)" }, { status: 400 });
    }

    const id = body.id || `session_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const sessionDate = date || new Date().toISOString().split("T")[0];

    const newSession = await StudySession.create({
      id,
      userId,
      subjectId: subjectId || "general",
      topicId: topicId || "",
      durationMinutes: Number(durationMinutes) || 0,
      type: type || "reading",
      date: sessionDate,
      notes: notes || "",
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/study/sessions?id=xxx&userId=yyy
export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json({ error: "Id and userId required" }, { status: 400 });
    }

    await StudySession.deleteOne({ id, userId });
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
