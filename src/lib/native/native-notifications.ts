"use client";

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { toast } from "sonner";

export function isNativeApp(): boolean {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

/**
 * Request exact alarm & notification permissions on native Android/iOS
 */
export async function requestNativeNotificationPermissions(): Promise<boolean> {
  if (!isNativeApp()) return false;

  try {
    const status = await LocalNotifications.requestPermissions();
    if (status.display === "granted") {
      toast.success("Native Alarm Permissions Granted! 🔔");
      return true;
    } else {
      toast.error("Notification permissions not granted on device.");
      return false;
    }
  } catch (err) {
    console.error("[NativeNotifications] Failed to request permissions:", err);
    return false;
  }
}

/**
 * Calculates the exact next target Date for a given "HH:MM"
 */
function getNextOccurrenceDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date();

  target.setHours(hours, minutes, 0, 0);

  // If time has already passed today, schedule for tomorrow
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target;
}

export interface NativeAlarmConfig {
  moneyEnabled?: boolean;
  moneyTime?: string;
  habitsEnabled?: boolean;
  habitsTime?: string;
  studyEnabled?: boolean;
  studyTime?: string;
  examEnabled?: boolean;
  examTime?: string;
}

/**
 * Schedules hardware-level exact alarms that ring and wake up the lock screen even in deep Doze mode
 */
export async function scheduleAllNativeAlarms(config: NativeAlarmConfig): Promise<boolean> {
  if (!isNativeApp()) return false;

  try {
    await requestNativeNotificationPermissions();

    // 1. Cancel existing scheduled local notifications to avoid duplicates
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map((n) => ({ id: n.id })),
      });
    }

    const notificationsToSchedule: any[] = [];

    // Habits Alarm (ID: 101)
    if (config.habitsEnabled && config.habitsTime) {
      notificationsToSchedule.push({
        id: 101,
        title: "🔥 Keep Your Habit Streaks Glowing!",
        body: "Don't lose your streak! Check off today's habits in Life Space.",
        schedule: {
          at: getNextOccurrenceDate(config.habitsTime),
          allowWhileIdle: true, // Wakes phone up even in deep battery Doze mode
          repeats: true,
          every: "day",
        },
        sound: "beep.wav",
        smallIcon: "ic_stat_icon",
        iconColor: "#CEF431",
        extra: { url: "/goals", type: "habits" },
      });
    }

    // Money Expense Alarm (ID: 102)
    if (config.moneyEnabled && config.moneyTime) {
      notificationsToSchedule.push({
        id: 102,
        title: "💰 Time to Log Today's Expenses!",
        body: "Keep your budget on track. Log your spending & income in Money Space.",
        schedule: {
          at: getNextOccurrenceDate(config.moneyTime),
          allowWhileIdle: true,
          repeats: true,
          every: "day",
        },
        sound: "beep.wav",
        smallIcon: "ic_stat_icon",
        iconColor: "#03D26F",
        extra: { url: "/money", type: "money" },
      });
    }

    // Study Session Alarm (ID: 103)
    if (config.studyEnabled && config.studyTime) {
      notificationsToSchedule.push({
        id: 103,
        title: "📚 Study Session & PYQ Check-in!",
        body: "Log your study hours and PYQs solved today in Study Space.",
        schedule: {
          at: getNextOccurrenceDate(config.studyTime),
          allowWhileIdle: true,
          repeats: true,
          every: "day",
        },
        sound: "beep.wav",
        smallIcon: "ic_stat_icon",
        iconColor: "#FED7AA",
        extra: { url: "/study", type: "study" },
      });
    }

    // Exam Review Alarm (ID: 104)
    if (config.examEnabled && config.examTime) {
      notificationsToSchedule.push({
        id: 104,
        title: "⚡ Review Today's Exam Syllabus Targets!",
        body: "Stay ahead of your target date. Review study topics in Study Space.",
        schedule: {
          at: getNextOccurrenceDate(config.examTime),
          allowWhileIdle: true,
          repeats: true,
          every: "day",
        },
        sound: "beep.wav",
        smallIcon: "ic_stat_icon",
        iconColor: "#FFE4E6",
        extra: { url: "/study", type: "exam" },
      });
    }

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({
        notifications: notificationsToSchedule,
      });
      toast.success(`Scheduled ${notificationsToSchedule.length} Native Alarms! ⏰ (Guaranteed lockscreen wake)`);
    }

    return true;
  } catch (err: any) {
    console.error("[NativeNotifications] Error scheduling alarms:", err);
    toast.error("Failed to schedule native alarms: " + err?.message);
    return false;
  }
}
