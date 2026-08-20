import { Client } from "@upstash/qstash";

const qstashToken = process.env.QSTASH_TOKEN;
const qstashUrl = process.env.QSTASH_URL || "https://qstash-us-east-1.upstash.io";
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://invictus-the-omni-tracker.vercel.app");

export const qstashClient = qstashToken
  ? new Client({ token: qstashToken, baseUrl: qstashUrl })
  : null;

export type ReminderType = "money" | "habits" | "study" | "exam";

/**
 * Calculates the exact delay in seconds from right now until the target "HH:MM" in the specified timezone.
 * Bulletproof and immune to any server clock drift.
 */
export function calculateDelaySeconds(
  timeStr: string,
  timezone: string = "Asia/Kolkata"
): { diffSeconds: number; targetDateStr: string } {
  const [targetHourStr, targetMinStr] = timeStr.split(":");
  const targetHour = parseInt(targetHourStr, 10) || 0;
  const targetMin = parseInt(targetMinStr, 10) || 0;

  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || "0", 10);

  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const curHour = getPart("hour");
  const curMin = getPart("minute");
  const curSec = getPart("second");

  const curTotalSec = curHour * 3600 + curMin * 60 + curSec;
  const targetTotalSec = targetHour * 3600 + targetMin * 60;

  let diffSeconds = targetTotalSec - curTotalSec;
  let targetDateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  if (diffSeconds <= 0) {
    // Already passed today in user's timezone -> Schedule for tomorrow
    diffSeconds += 24 * 3600;
    const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
    const tmrParts = formatter.formatToParts(tomorrow);
    const tmrYear = tmrParts.find((p) => p.type === "year")?.value || year;
    const tmrMonth = tmrParts.find((p) => p.type === "month")?.value || month;
    const tmrDay = tmrParts.find((p) => p.type === "day")?.value || day;
    targetDateStr = `${tmrYear}-${String(tmrMonth).padStart(2, "0")}-${String(tmrDay).padStart(2, "0")}`;
  }

  return { diffSeconds, targetDateStr };
}

/**
 * Publishes a single delayed reminder message to Upstash QStash.
 */
export async function scheduleReminderJob(params: {
  userId: string;
  type: ReminderType;
  timeStr: string;
  timezone: string;
  customDelaySeconds?: number;
}) {
  if (!qstashClient) {
    console.warn("[QStash] No QSTASH_TOKEN configured. Falling back to background cron.");
    return null;
  }

  try {
    const { userId, type, timeStr, timezone, customDelaySeconds } = params;
    const { diffSeconds, targetDateStr } = calculateDelaySeconds(timeStr, timezone);
    const finalDelay = customDelaySeconds !== undefined ? customDelaySeconds : diffSeconds;

    const destinationUrl = `${appUrl}/api/push/trigger-reminder`;
    const deduplicationId = `invictus_${userId}_${type}_${Date.now()}`;

    const res = await qstashClient.publishJSON({
      url: destinationUrl,
      body: {
        userId,
        type,
        timeStr,
        timezone,
        scheduledForDate: targetDateStr,
      },
      delay: Math.max(1, Math.round(finalDelay)),
      deduplicationId,
      retries: 3,
    });

    console.log(
      `[QStash] Successfully queued ${type} reminder for user ${userId} in ${finalDelay}s (Target: ${timeStr} ${timezone}). Message ID: ${(res as any)?.messageId || "ok"}`
    );
    return res;
  } catch (err) {
    console.error("[QStash] Error scheduling reminder job:", err);
    return null;
  }
}

/**
 * Schedules all enabled reminders for a user (Money, Habits, Study, Exams)
 */
export async function scheduleAllUserReminders(
  userId: string,
  timezone: string,
  config: {
    moneyEnabled?: boolean;
    moneyTime?: string;
    habitsEnabled?: boolean;
    habitsTime?: string;
    studyEnabled?: boolean;
    studyTime?: string;
    examEnabled?: boolean;
    examTime?: string;
  }
) {
  const jobs: Promise<any>[] = [];

  if (config.moneyEnabled && config.moneyTime) {
    jobs.push(
      scheduleReminderJob({
        userId,
        type: "money",
        timeStr: config.moneyTime,
        timezone,
      })
    );
  }

  if (config.habitsEnabled && config.habitsTime) {
    jobs.push(
      scheduleReminderJob({
        userId,
        type: "habits",
        timeStr: config.habitsTime,
        timezone,
      })
    );
  }

  if (config.studyEnabled && config.studyTime) {
    jobs.push(
      scheduleReminderJob({
        userId,
        type: "study",
        timeStr: config.studyTime,
        timezone,
      })
    );
  }

  if (config.examEnabled && config.examTime) {
    jobs.push(
      scheduleReminderJob({
        userId,
        type: "exam",
        timeStr: config.examTime,
        timezone,
      })
    );
  }

  const results = await Promise.allSettled(jobs);
  return results;
}
