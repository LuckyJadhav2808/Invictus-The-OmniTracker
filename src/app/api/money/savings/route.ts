import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SavingsGoal } from "@/models/SavingsGoal";

// GET /api/money/savings?userId=xxx
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "UserId required for data isolation" }, { status: 400 });
    }

    const goals = await SavingsGoal.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json(goals);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/money/savings - Create savings goal
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { userId, title, targetAmount, currentAmount, category, targetDate } = body;

    if (!userId || !title || targetAmount === undefined) {
      return NextResponse.json({ error: "UserId, title, and targetAmount required" }, { status: 400 });
    }

    const id = body.id || `sg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newGoal = await SavingsGoal.create({
      id,
      userId,
      title,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      category: category || "Safety",
      targetDate: targetDate || "",
    });

    return NextResponse.json(newGoal, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/money/savings - Update savings goal (deposit or details)
export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, userId, title, targetAmount, currentAmount, category, targetDate } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: "Id and userId required" }, { status: 400 });
    }

    const updateFields: any = {};
    if (title !== undefined) updateFields.title = title;
    if (targetAmount !== undefined) updateFields.targetAmount = Number(targetAmount);
    if (currentAmount !== undefined) updateFields.currentAmount = Number(currentAmount);
    if (category !== undefined) updateFields.category = category;
    if (targetDate !== undefined) updateFields.targetDate = targetDate;

    const updated = await SavingsGoal.findOneAndUpdate(
      { id, userId },
      { $set: updateFields },
      { new: true }
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/money/savings?id=xxx&userId=yyy
export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json({ error: "Id and userId required" }, { status: 400 });
    }

    await SavingsGoal.deleteOne({ id, userId });
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
