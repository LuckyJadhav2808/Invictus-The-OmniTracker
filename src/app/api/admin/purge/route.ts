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

// POST /api/admin/purge
// Deletes all cloud data for a user across all MongoDB Atlas collections
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json().catch(() => ({}));
    const { userId, email } = body;

    if (!userId && !email) {
      return NextResponse.json({ error: "UserId or email is required to purge cloud data" }, { status: 400 });
    }

    const query = userId ? { userId } : { userId: "user-admin-default" };

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
      message: "Successfully purged all MongoDB Atlas cloud records.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
