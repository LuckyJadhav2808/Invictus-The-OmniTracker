import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { WaterLog } from "@/models/WaterLog";

// GET /api/goals/water?userId=xxx&date=yyyy-mm-dd
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date");

    if (!userId || !date) {
      return NextResponse.json({ error: "UserId and date required" }, { status: 400 });
    }

    let waterLog = await WaterLog.findOne({ userId, date });
    if (!waterLog) {
      // 0 ml logged initially, 1000 ml (1 Ltr) target capacity
      waterLog = await WaterLog.create({
        userId,
        date,
        amount: 0,
        waterGoal: 1000,
      });
    }

    return NextResponse.json(waterLog);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/goals/water (Upsert water log or goal)
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { userId, date, amount, mode, waterGoal } = body;

    if (!userId || !date) {
      return NextResponse.json({ error: "UserId and date required" }, { status: 400 });
    }

    let waterLog = await WaterLog.findOne({ userId, date });
    let currentAmount = waterLog ? waterLog.amount : 0;
    let nextAmount = currentAmount;

    if (mode === "add") {
      nextAmount = Math.max(0, currentAmount + (Number(amount) || 0));
    } else if (mode === "set" || amount !== undefined) {
      nextAmount = Math.max(0, Number(amount));
    }

    const updatedGoal = waterGoal !== undefined ? Number(waterGoal) : (waterLog?.waterGoal || 1000);

    const updated = await WaterLog.findOneAndUpdate(
      { userId, date },
      {
        $set: {
          userId,
          date,
          amount: nextAmount,
          waterGoal: updatedGoal,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
