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
import { verifyAdminRequest } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

// POST /api/admin/purge
// Administrative endpoint to wipe data for a specific user. Requires verified admin privileges.
export async function POST(req: Request) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 403 });
    }

    await connectToDatabase();
    const body = await req.json().catch(() => ({}));
    const { targetUserId } = body;

    if (!targetUserId || typeof targetUserId !== "string" || targetUserId.trim() === "") {
      return NextResponse.json(
        { error: "A valid targetUserId is required to perform an administrative purge." },
        { status: 400 }
      );
    }

    const query = { userId: targetUserId.trim() };

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
      message: `Successfully purged all MongoDB Atlas cloud records for user ${targetUserId}.`,
    });
  } catch (error: any) {
    console.error("Admin purge error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
