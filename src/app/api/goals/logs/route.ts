import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { HabitLog } from "@/models/HabitLog";

// GET /api/goals/logs?userId=xxx&date=yyyy-mm-dd&startDate=xxx&endDate=yyy
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!userId) {
      return NextResponse.json({ error: "UserId is required for data isolation" }, { status: 400 });
    }

    const query: Record<string, unknown> = { userId };
    if (date) {
      query.date = date;
    } else if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const logs = await HabitLog.find(query);
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/goals/logs (Toggle/Update Log)
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const { userId, habitId, date, completed, value, isGraceSkip } = body;
    if (!userId || !habitId || !date) {
      return NextResponse.json({ error: "UserId, habitId, and date required" }, { status: 400 });
    }

    if (completed === false) {
      await HabitLog.deleteOne({ userId, habitId, date });
      return NextResponse.json({ success: true, habitId, date, completed: false });
    }

    const updatedLog = await HabitLog.findOneAndUpdate(
      { userId, habitId, date },
      {
        $set: {
          id: `hl_${userId}_${habitId}_${date}`,
          userId,
          habitId,
          date,
          completed: true,
          value: Number(value) || 0,
          isGraceSkip: Boolean(isGraceSkip),
          loggedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(updatedLog);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/goals/logs?userId=xxx&habitId=yyy&date=zzz
export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const habitId = searchParams.get("habitId");
    const date = searchParams.get("date");

    if (!userId || !habitId || !date) {
      return NextResponse.json({ error: "UserId, habitId, and date required" }, { status: 400 });
    }

    await HabitLog.deleteOne({ userId, habitId, date });
    return NextResponse.json({ success: true, habitId, date });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
