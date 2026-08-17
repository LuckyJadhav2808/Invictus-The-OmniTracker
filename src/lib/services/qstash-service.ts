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
 * Calculates the exact next target timestamp in seconds (epoch) for a given "HH:MM" in a specific timezone.
 */
export function calculateNextOccurrenceEpoch(timeStr: string, timezone: string = "Asia/Kolkata"): { epochSeconds: number; targetDateStr: string } {
  const [targetHourStr, targetMinStr] = timeStr.split(":");
  const targetHour = parseInt(targetHourStr, 10) || 0;
  const targetMin = parseInt(targetMinStr, 10) || 0;

  const now = new Date();

  // Get current local date parts in user's timezone
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
  const month = getPart("month") - 1; // 0-indexed
  const day = getPart("day");
  const curHour = getPart("hour");
  const curMin = getPart("minute");

  // Approximate offset difference in ms
  const localTargetDate = new Date(Date.UTC(year, month, day, targetHour, targetMin, 0));
  
  // Calculate if target time today has already passed in user's timezone
  const isPastToday = curHour > targetHour || (curHour === targetHour && curMin >= targetMin);

  // If passed today, schedule for tomorrow
  let targetDay = day;
  let targetMonth = month;
  let targetYear = year;

  if (isPastToday) {
    const nextDay = new Date(Date.UTC(year, month, day + 1));
    targetYear = nextDay.getUTCFullYear();
    targetMonth = nextDay.getUTCMonth();
    targetDay = nextDay.getUTCDate();
  }

  // Convert target local time to UTC epoch
  // Using Intl format string representation to parse cleanly
  const targetIsoString = `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}T${String(targetHour).padStart(2, "0")}:${String(targetMin).padStart(2, "0")}:00`;
  
  // Create Date with user timezone string
  const targetWithTz = new Date(new Date(targetIsoString).toLocaleString("en-US", { timeZone: timezone }));
  const diff = new Date().getTime() - new Date(new Date().toLocaleString("en-US", { timeZone: timezone })).getTime();
  const exactTargetUtcMs = new Date(targetIsoString).getTime() + diff;

  const epochSeconds = Math.floor(exactTargetUtcMs / 1000);
  const targetDateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;

  return { epochSeconds, targetDateStr };
}

/**
 * Publishes a single delayed reminder message to Upstash QStash.
 */
export async function scheduleReminderJob(params: {
  userId: string;
  type: ReminderType;
  timeStr: string;
  timezone: string;
}) {
  if (!qstashClient) {
    console.warn("[QStash] No QSTASH_TOKEN configured. Falling back to background cron.");
    return null;
  }

  try {
    const { userId, type, timeStr, timezone } = params;
    const { epochSeconds, targetDateStr } = calculateNextOccurrenceEpoch(timeStr, timezone);

    const destinationUrl = `${appUrl}/api/push/trigger-reminder`;
    const deduplicationId = `invictus_${userId}_${type}_${targetDateStr}_${timeStr.replace(":", "")}`;

    const res = await qstashClient.publishJSON({
      url: destinationUrl,
      body: {
        userId,
        type,
        timeStr,
        timezone,
        scheduledForDate: targetDateStr,
      },
      notBefore: epochSeconds,
      deduplicationId,
      retries: 3,
    });

    console.log(`[QStash] Successfully scheduled ${type} reminder for user ${userId} at ${targetDateStr} ${timeStr} (${timezone}). Message ID: ${res.messageId}`);
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
