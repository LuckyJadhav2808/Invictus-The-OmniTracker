import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Subject } from "@/models/Subject";
import { Topic } from "@/models/Topic";
import { StudySession } from "@/models/StudySession";

// GET /api/study/subjects?userId=xxx
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "UserId required for data isolation" }, { status: 400 });
    }

    const subjects = await Subject.find({ userId, archived: { $ne: true } }).sort({ createdAt: -1 });
    return NextResponse.json(subjects);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/study/subjects - Create subject
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { userId, name, color, icon, category } = body;

    if (!userId || !name) {
      return NextResponse.json({ error: "UserId and name required" }, { status: 400 });
    }

    const id = body.id || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSubject = await Subject.create({
      id,
      userId,
      name,
      color: color || "indigo",
      icon: icon || "BookOpen",
      category: category || "General",
      archived: false,
    });

    return NextResponse.json(newSubject, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/study/subjects - Update subject
export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, userId, name, color, icon, category, archived } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: "Id and userId required" }, { status: 400 });
    }

    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name;
    if (color !== undefined) updateFields.color = color;
    if (icon !== undefined) updateFields.icon = icon;
    if (category !== undefined) updateFields.category = category;
    if (archived !== undefined) updateFields.archived = archived;

    const updated = await Subject.findOneAndUpdate(
      { id, userId },
      { $set: updateFields },
      { new: true }
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/study/subjects?id=xxx&userId=yyy - Delete subject and cascading topics
export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json({ error: "Id and userId required" }, { status: 400 });
    }

    await Promise.all([
      Subject.deleteOne({ id, userId }),
      Topic.deleteMany({ subjectId: id, userId }),
      StudySession.deleteMany({ subjectId: id, userId }),
    ]);

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
