import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { PushSubscriptionModel } from "@/lib/models/push-subscription";
import { DebtModel } from "@/models/Debt";
import { webpush } from "@/lib/web-push-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return handleCronReminders(req);
}

export async function POST(req: NextRequest) {
  return handleCronReminders(req);
}

async function handleCronReminders(req: NextRequest) {
  try {
    await connectToDatabase();

    const subscriptions = await PushSubscriptionModel.find({});
    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: "No active push subscriptions found", sent: 0 });
    }

    const now = new Date();
    let totalSent = 0;
    const errors: any[] = [];

    for (const sub of subscriptions) {
      try {
        const tz = sub.timezone || "Asia/Kolkata";

        // Get local time in user's timezone
        const timeFormatter = new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        const timeParts = timeFormatter.format(now).split(":");
        const currentTimeStr = `${timeParts[0]}:${timeParts[1]}`;

        // Get local date in user's timezone (YYYY-MM-DD)
        const dateFormatter = new Intl.DateTimeFormat("en-CA", {
          timeZone: tz,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        const todayDateStr = dateFormatter.format(now);

        const lastSent = sub.lastSentKeys || {};
        const notificationsToSend: Array<{ key: string; title: string; body: string; url: string }> = [];

        // Helper to check if a reminder is due today and not yet sent
        const isReminderDue = (targetTimeStr?: string, keyPrefix?: string) => {
          if (!targetTimeStr || !keyPrefix) return false;
          const key = `${keyPrefix}_${todayDateStr}`;
          if (lastSent[key]) return false; // Already sent today
          // Match if current time is at or past the target time (windowed catch-up)
          return currentTimeStr >= targetTimeStr;
        };

        // 1. Money / Expense Log Reminder
        if (sub.moneyEnabled && isReminderDue(sub.moneyTime, "money")) {
          const key = `money_${todayDateStr}`;
          notificationsToSend.push({
            key,
            title: "💰 Time to Log Today's Expenses!",
            body: "Keep your budget on track. Log your spending & income in Money Space.",
            url: "/money",
          });
        }

        // 2. Habits & Streaks Reminder
        if (sub.habitsEnabled && isReminderDue(sub.habitsTime, "habits")) {
          const key = `habits_${todayDateStr}`;
          notificationsToSend.push({
            key,
            title: "🔥 Keep Your Habit Streaks Glowing!",
            body: "Don't lose your streak! Check off today's habits in Life Space.",
            url: "/goals",
          });
        }

        // 3. Study Session & PYQ Check-in
        if (sub.studyEnabled && isReminderDue(sub.studyTime, "study")) {
          const key = `study_${todayDateStr}`;
          notificationsToSend.push({
            key,
            title: "📚 Study Session & PYQ Check-in!",
            body: "Log your study hours and PYQs solved today in Study Space.",
            url: "/study",
          });
        }

        // 4. Morning Exam Prep & Syllabus Review
        if (sub.examEnabled && isReminderDue(sub.examTime, "exam")) {
          const key = `exam_${todayDateStr}`;
          notificationsToSend.push({
            key,
            title: "⚡ Review Today's Exam Syllabus Targets!",
            body: "Stay ahead of your target date. Review study topics in Study Space.",
            url: "/study",
          });
        }

        // 5. Debt Due Date Reminders (Checked in morning slot around 09:00 - 10:00 or current slot)
        if (sub.userId && sub.userId !== "guest") {
          try {
            const pendingDebts = await DebtModel.find({
              userId: sub.userId,
              status: "pending",
              dueDate: todayDateStr,
            });

            for (const debt of pendingDebts) {
              const key = `debt_${debt._id}_${todayDateStr}`;
              if (!lastSent[key]) {
                const title = debt.type === "lent"
                  ? `💰 Collect ₹${debt.amount} from ${debt.personName}`
                  : `🚨 Pay ₹${debt.amount} to ${debt.personName}`;
                const body = debt.type === "lent"
                  ? `${debt.personName} owes you ₹${debt.amount} due today. Tap to settle up!`
                  : `You owe ${debt.personName} ₹${debt.amount} due today. Tap to settle up!`;

                notificationsToSend.push({ key, title, body, url: "/money" });
              }
            }
          } catch {}
        }

        // Send all queued notifications to this subscription
        for (const item of notificationsToSend) {
          const payload = JSON.stringify({
            title: item.title,
            body: item.body,
            url: item.url,
          });

          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            payload
          );

          lastSent[item.key] = new Date().toISOString();
          totalSent++;
        }

        // Persist updated lastSentKeys
        if (notificationsToSend.length > 0) {
          await PushSubscriptionModel.updateOne(
            { _id: sub._id },
            { $set: { lastSentKeys: lastSent } }
          );
        }
      } catch (err: any) {
        // Handle 410 Gone / 404 Not Found (expired subscriptions)
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await PushSubscriptionModel.deleteOne({ _id: sub._id });
        } else {
          errors.push(err?.message || "Send error");
        }
      }
    }

    return NextResponse.json({
      success: true,
      processedSubscriptions: subscriptions.length,
      sent: totalSent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error("Cron send reminders error:", err);
    return NextResponse.json({ error: err?.message || "Failed to execute cron" }, { status: 500 });
  }
}
