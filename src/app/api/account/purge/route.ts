import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Habit } from "@/models/Habit";
import { HabitLog } from "@/models/HabitLog";
import { HealthProfile } from "@/models/HealthProfile";
import { WaterLog } from "@/models/WaterLog";
import { Workout } from "@/models/Workout";
import { Diet } from "@/models/Diet";
import { Macros } from "@/models/Macros";
import { Transaction } from "@/models/Transaction";
import { Category } from "@/models/Category";
import { Subject } from "@/models/Subject";
import { Topic } from "@/models/Topic";
import { StudySession } from "@/models/StudySession";
import { MoodLog } from "@/models/MoodLog";
import { SavingsGoal } from "@/models/SavingsGoal";
import { Subscription } from "@/models/Subscription";

// POST /api/account/purge
// Securely wipes all user-owned records for a specific authenticated user
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json().catch(() => ({}));
    const { userId } = body;

    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      return NextResponse.json({ error: "Valid userId is required to purge account data" }, { status: 400 });
    }

    const query = { userId: userId.trim() };

    await Promise.all([
      Habit.deleteMany(query),
      HabitLog.deleteMany(query),
      HealthProfile.deleteMany(query),
      WaterLog.deleteMany(query),
      Workout.deleteMany(query),
      Diet.deleteMany(query),
      Macros.deleteMany(query),
      Transaction.deleteMany(query),
      Category.deleteMany(query),
      Subject.deleteMany(query),
      Topic.deleteMany(query),
      StudySession.deleteMany(query),
      MoodLog.deleteMany(query),
      SavingsGoal.deleteMany(query),
      Subscription.deleteMany(query),
    ]);

    return NextResponse.json({
      success: true,
      message: "Successfully purged all account records.",
    });
  } catch (error: any) {
    console.error("Account purge error:", error);
    return NextResponse.json({ error: error.message || "Failed to purge account data" }, { status: 500 });
  }
}
