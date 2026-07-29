import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Macros } from "@/models/Macros";

// GET /api/goals/macros?userId=xxx&date=YYYY-MM-DD
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date");

    if (!userId || !date) {
      return NextResponse.json({ error: "Missing userId or date" }, { status: 400 });
    }

    let doc = await Macros.findOne({ userId, date });
    if (!doc) {
      doc = await Macros.create({
        userId,
        date,
        protein: 0,
        carbs: 0,
        fat: 0,
      });
    }

    return NextResponse.json({
      id: doc._id.toString(),
      date: doc.date,
      protein: doc.protein || 0,
      carbs: doc.carbs || 0,
      fat: doc.fat || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/goals/macros - save/update macros
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { userId, date, protein, carbs, fat } = body;

    if (!userId || !date) {
      return NextResponse.json({ error: "Missing userId or date" }, { status: 400 });
    }

    const doc = await Macros.findOneAndUpdate(
      { userId, date },
      {
        $set: {
          protein: Number(protein) || 0,
          carbs: Number(carbs) || 0,
          fat: Number(fat) || 0,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      id: doc._id.toString(),
      date: doc.date,
      protein: doc.protein || 0,
      carbs: doc.carbs || 0,
      fat: doc.fat || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
