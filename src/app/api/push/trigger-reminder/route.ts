import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { PushSubscriptionModel } from "@/lib/models/push-subscription";
import { webpush } from "@/lib/web-push-service";
import { scheduleReminderJob, type ReminderType } from "@/lib/services/qstash-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, type, timeStr, timezone } = body as {
      userId: string;
      type: ReminderType;
      timeStr: string;
      timezone: string;
    };

    if (!userId || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Find active Push Subscriptions
    let subscriptions = [];
    if (userId && userId !== "guest") {
      subscriptions = await PushSubscriptionModel.find({ userId });
    }
    if (subscriptions.length === 0) {
      subscriptions = await PushSubscriptionModel.find({}).sort({ updatedAt: -1 }).limit(5);
    }

    if (subscriptions.length === 0) {
      console.warn(`[TriggerReminder] No active subscriptions found for user ${userId}`);
      return NextResponse.json({ message: "No active push subscriptions", sent: 0 });
    }

    // 2. Build tailored Neobrutalist Notification Payload
    let title = "🚀 Invictus OmniTracker";
    let messageBody = "Time for your daily check-in!";
    let url = "/today";

    if (type === "money") {
      title = "💰 Time to Log Today's Expenses!";
      messageBody = "Keep your budget on track. Log your spending & income in Money Space.";
      url = "/money";
    } else if (type === "habits") {
      title = "🔥 Keep Your Habit Streaks Glowing!";
      messageBody = "Don't lose your streak! Check off today's habits in Life Space.";
      url = "/goals";
    } else if (type === "study") {
      title = "📚 Study Session & PYQ Check-in!";
      messageBody = "Log your study hours and PYQs solved today in Study Space.";
      url = "/study";
    } else if (type === "exam") {
      title = "⚡ Review Today's Exam Syllabus Targets!";
      messageBody = "Stay ahead of your target date. Review study topics in Study Space.";
      url = "/study";
    }

    const payload = JSON.stringify({
      title,
      body: messageBody,
      url,
    });

    let sentCount = 0;

    // 3. Dispatch Web Push to all active devices
    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            payload,
            {
              TTL: 86400, // 24 hours retention on push server
              urgency: "high", // High priority wake-lock for mobile & desktop
            }
          );
          sentCount++;
        } catch (err: any) {
          // Auto-prune expired subscriptions (410 Gone / 404 Not Found)
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await PushSubscriptionModel.deleteOne({ _id: sub._id });
          }
        }
      })
    );

    // 4. Auto-Reschedule NEXT day's recurring reminder in QStash (Self-Perpetuating 24h Loop)
    if (timeStr) {
      await scheduleReminderJob({
        userId,
        type,
        timeStr,
        timezone: timezone || "Asia/Kolkata",
        customDelaySeconds: 24 * 3600,
      }).catch((e) => console.error("[TriggerReminder] Failed to schedule next day recurring job:", e));
    }

    return NextResponse.json({
      success: true,
      type,
      sentCount,
      totalDevices: subscriptions.length,
      nextScheduled: true,
    });
  } catch (err: any) {
    console.error("[TriggerReminder] Webhook execution error:", err);
    return NextResponse.json({ error: err?.message || "Failed to trigger reminder" }, { status: 500 });
  }
}
