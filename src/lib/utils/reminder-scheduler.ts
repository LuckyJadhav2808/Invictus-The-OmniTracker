"use client";

import { sendNativeNotification, requestNotificationPermission } from "@/lib/utils/notifications";
import { toast } from "sonner";

export interface ReminderConfig {
  moneyEnabled: boolean;
  moneyTime: string; // e.g. "20:00"
  habitsEnabled: boolean;
  habitsTime: string; // e.g. "21:00"
  studyEnabled: boolean;
  studyTime: string; // e.g. "18:00"
  examEnabled: boolean;
  examTime: string; // e.g. "10:00"
  soundEnabled: boolean;
}

const STORAGE_KEY = "invictus_reminder_config";
const LAST_TRIGGERED_KEY = "invictus_last_triggered_reminders";

export const DEFAULT_REMINDER_CONFIG: ReminderConfig = {
  moneyEnabled: false,
  moneyTime: "20:00", // 8:00 PM
  habitsEnabled: false,
  habitsTime: "21:00", // 9:00 PM
  studyEnabled: false,
  studyTime: "18:00", // 6:00 PM
  examEnabled: false,
  examTime: "10:00", // 10:00 AM
  soundEnabled: true,
};

export function getReminderConfig(): ReminderConfig {
  if (typeof window === "undefined") return DEFAULT_REMINDER_CONFIG;
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return DEFAULT_REMINDER_CONFIG;
  try {
    return { ...DEFAULT_REMINDER_CONFIG, ...JSON.parse(data) };
  } catch {
    return DEFAULT_REMINDER_CONFIG;
  }
}

export function saveReminderConfig(config: ReminderConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

async function playNotificationChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

let schedulerInterval: any = null;

export function initReminderScheduler() {
  if (typeof window === "undefined") return;
  if (schedulerInterval) clearInterval(schedulerInterval);

  const checkAndTrigger = async () => {
    const config = getReminderConfig();
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    let lastTriggered: Record<string, string> = {};
    try {
      const stored = localStorage.getItem(LAST_TRIGGERED_KEY);
      if (stored) lastTriggered = JSON.parse(stored);
    } catch {}

    const triggerReminder = async (key: string, title: string, body: string, url: string) => {
      const triggerKey = `${key}_${todayDateStr}_${currentTimeStr}`;
      if (lastTriggered[triggerKey]) return; // Already triggered this minute today

      lastTriggered[triggerKey] = new Date().toISOString();
      localStorage.setItem(LAST_TRIGGERED_KEY, JSON.stringify(lastTriggered));

      if (config.soundEnabled) playNotificationChime();

      toast.info(title, {
        description: body,
        action: {
          label: "Open Space",
          onClick: () => { window.location.href = url; },
        },
      });

      await sendNativeNotification(title, body, url);
    };

    // 1. Money / Expense Log Reminder
    if (config.moneyEnabled && config.moneyTime === currentTimeStr) {
      await triggerReminder(
        "money",
        "💰 Time to Log Today's Expenses!",
        "Keep your budget on track. Log your spending & income in Money Space.",
        "/money"
      );
    }

    // 2. Habits & Streaks Reminder
    if (config.habitsEnabled && config.habitsTime === currentTimeStr) {
      await triggerReminder(
        "habits",
        "🔥 Keep Your Habit Streaks Glowing!",
        "Don't lose your streak! Check off today's habits in Life Space.",
        "/goals"
      );
    }

    // 3. Study Session & Exam Syllabus Reminder
    if (config.studyEnabled && config.studyTime === currentTimeStr) {
      await triggerReminder(
        "study",
        "📚 Study Session & PYQ Check-in!",
        "Log your study hours and PYQs solved today in Study Space.",
        "/study"
      );
    }

    // 4. Morning Exam Prep & Target Review Reminder
    if (config.examEnabled && config.examTime === currentTimeStr) {
      await triggerReminder(
        "exam",
        "⚡ Review Today's Exam Syllabus Targets!",
        "Stay ahead of your target date. Review study topics in Study Space.",
        "/study"
      );
    }

    // 5. Debt Due Date Reminders (Lent & Borrowed Due Today - Triggers STRICTLY ONCE PER DAY per debt)
    try {
      const localDebtsStr = localStorage.getItem("invictus_debts");
      if (localDebtsStr) {
        const localDebts = JSON.parse(localDebtsStr);
        for (const debt of localDebts) {
          if (debt.status === "pending" && debt.dueDate === todayDateStr) {
            const title = debt.type === "lent"
              ? `💰 Collect ₹${debt.amount} from ${debt.personName}`
              : `🚨 Pay ₹${debt.amount} to ${debt.personName}`;
            const body = debt.type === "lent"
              ? `${debt.personName} owes you ₹${debt.amount} due today. Tap to settle up!`
              : `You owe ${debt.personName} ₹${debt.amount} due today. Tap to settle up!`;

            // Use once-per-day key format: debt_id_2026-08-15
            const dailyDebtKey = `debt_${debt.id}_${todayDateStr}`;
            if (!lastTriggered[dailyDebtKey]) {
              lastTriggered[dailyDebtKey] = new Date().toISOString();
              localStorage.setItem(LAST_TRIGGERED_KEY, JSON.stringify(lastTriggered));

              if (config.soundEnabled) playNotificationChime();

              toast.info(title, {
                description: body,
                action: {
                  label: "Open Money",
                  onClick: () => { window.location.href = "/money"; },
                },
              });

              await sendNativeNotification(title, body, "/money");
            }
          }
        }
      }
    } catch {}
  };

  // Run initial check and set up interval
  checkAndTrigger();
  schedulerInterval = setInterval(checkAndTrigger, 30000); // check every 30s
}
