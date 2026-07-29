import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { MoodLog } from "@/models/MoodLog";

// GET /api/goals/mood?userId=xxx&date=2026-07-27
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date");

    if (!userId) {
      return NextResponse.json({ error: "UserId required for data isolation" }, { status: 400 });
    }

    const query: any = { userId };
    if (date) query.date = date;

    const logs = await MoodLog.find(query).sort({ date: -1 });
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/goals/mood - Upsert mood log for given date
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { userId, date, mood, energy, note } = body;

    if (!userId || !date) {
      return NextResponse.json({ error: "UserId and date required" }, { status: 400 });
    }

    const upserted = await MoodLog.findOneAndUpdate(
      { userId, date },
      { $set: { mood: mood || "okay", energy: energy !== undefined ? Number(energy) : 3, note: note || "" } },
      { new: true, upsert: true }
    );

    return NextResponse.json(upserted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
