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
import { User } from "@/models/User";

// DELETE /api/account/delete
// Permanently deletes user account and all associated data from MongoDB
export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { uid, email } = body;

    if (!uid || !email) {
      return NextResponse.json(
        { error: "Missing uid or email in request body." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Delete all user data across every MongoDB collection
    const results = await Promise.allSettled([
      Habit.deleteMany({ userId: uid }),
      HabitLog.deleteMany({ userId: uid }),
      HealthProfile.deleteMany({ userId: uid }),
      WaterLog.deleteMany({ userId: uid }),
      Workout.deleteMany({ userId: uid }),
      Diet.deleteMany({ userId: uid }),
      Macros.deleteMany({ userId: uid }),
      Transaction.deleteMany({ userId: uid }),
      Category.deleteMany({ userId: uid }),
      Subject.deleteMany({ userId: uid }),
      Topic.deleteMany({ userId: uid }),
      StudySession.deleteMany({ userId: uid }),
      MoodLog.deleteMany({ userId: uid }),
      SavingsGoal.deleteMany({ userId: uid }),
      Subscription.deleteMany({ userId: uid }),
    ]);

    // Delete the user document itself by uid or email
    await User.deleteMany({
      $or: [{ uid }, { email: email.toLowerCase() }],
    });

    // Count total deleted documents
    let totalDeleted = 0;
    for (const r of results) {
      if (r.status === "fulfilled" && r.value?.deletedCount) {
        totalDeleted += r.value.deletedCount;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Account ${email} and all associated data permanently deleted.`,
      totalDocumentsDeleted: totalDeleted,
    });
  } catch (error: any) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete account." },
      { status: 500 }
    );
  }
}
