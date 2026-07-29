import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { HealthProfile } from "@/models/HealthProfile";

// GET /api/goals/health?userId=xxx
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "UserId is required for user data isolation" }, { status: 400 });
    }

    let profile = await HealthProfile.findOne({ userId });
    if (!profile) {
      // Create initial profile for user if it doesn't exist
      profile = await HealthProfile.create({
        userId,
        weight: "68 kg",
        height: "175 cm",
        gender: "Not Set",
        age: "Not Set",
      });
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/goals/health (Upsert profile)
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const { userId, ...updates } = body;
    if (!userId) {
      return NextResponse.json({ error: "UserId is required" }, { status: 400 });
    }

    const updatedProfile = await HealthProfile.findOneAndUpdate(
      { userId },
      { $set: { userId, ...updates, updatedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(updatedProfile);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
