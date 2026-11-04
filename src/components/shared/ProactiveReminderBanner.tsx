"use client";

import { useState, useEffect } from "react";
import { Bell, Clock, Check, X } from "lucide-react";
import { getReminderConfig, saveReminderConfig } from "@/lib/utils/reminder-scheduler";
import { requestNotificationPermission, sendNativeNotification } from "@/lib/utils/notifications";
import { ReminderManagerModal } from "@/components/shared/ReminderManagerModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProactiveReminderBannerProps {
  space?: "today" | "money" | "goals" | "habits" | "study" | "exam" | "all";
}

export function ProactiveReminderBanner({ space = "today" }: ProactiveReminderBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasEnabledReminders, setHasEnabledReminders] = useState(true);

  const dismissStorageKey = `invictus_reminder_dismissed_${space}`;

  useEffect(() => {
    // 1. Check persistent dismissal in localStorage
    if (typeof window !== "undefined") {
      const savedDismissed = localStorage.getItem(dismissStorageKey);
      if (savedDismissed === "true") {
        setIsDismissed(true);
        return;
      }
    }

    // 2. Check active reminder state
    const config = getReminderConfig();
    let isActive = false;
    if (space === "money") isActive = config.moneyEnabled;
    else if (space === "goals" || space === "habits") isActive = config.habitsEnabled;
    else if (space === "study") isActive = config.studyEnabled;
    else if (space === "exam") isActive = config.examEnabled;
    else isActive = config.moneyEnabled || config.habitsEnabled || config.studyEnabled || config.examEnabled;

    setHasEnabledReminders(isActive);
  }, [space, dismissStorageKey]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(dismissStorageKey, "true");
      } catch {}
    }
  };

  const handleQuickEnable = async () => {
    const granted = await requestNotificationPermission();
    const config = getReminderConfig();
    
    if (space === "money") {
      config.moneyEnabled = true;
    } else if (space === "study" || space === "exam") {
      config.studyEnabled = true;
    } else {
      config.habitsEnabled = true;
    }

    saveReminderConfig(config);
    setHasEnabledReminders(true);

    const { isNativeApp, scheduleAllNativeAlarms } = await import("@/lib/native/native-notifications");
    if (isNativeApp()) {
      await scheduleAllNativeAlarms(config);
    } else if (granted) {
      sendNativeNotification(
        "Reminders Enabled",
        "Your daily check-in alarms are now active.",
        "/today"
      );
    }
    toast.success("Daily Reminders Active", {
      description: space === "money" ? "Evening expense log set for 8:00 PM" : space === "study" ? "Study session prompt set for 6:00 PM" : "Habit streak check-in set for 9:00 PM",
    });
  };

  const getContextualContent = () => {
    switch (space) {
      case "goals":
      case "habits":
        return {
          title: "Habit Streak Reminders",
          description: "Get a gentle evening prompt at 9:00 PM to review and protect your streaks.",
          buttonLabel: "Enable (9:00 PM)",
        };
      case "study":
      case "exam":
        return {
          title: "Study Sprint Reminders",
          description: "Stay consistent for exams. Evening reminder prompt at 6:00 PM.",
          buttonLabel: "Enable (6:00 PM)",
        };
      case "money":
        return {
          title: "Expense Logging Reminders",
          description: "Keep safe-to-spend accurate. Quick daily prompt at 8:00 PM.",
          buttonLabel: "Enable (8:00 PM)",
        };
      default:
        return {
          title: "Daily Consistency Reminders",
          description: "Gentle daily alerts for habits, study sprints, and expense logs.",
          buttonLabel: "Enable Reminders",
        };
    }
  };

  if (isDismissed || hasEnabledReminders) return null;

  const content = getContextualContent();

  return (
    <>
      <div className="bg-white dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#383531] p-3 sm:p-3.5 my-3 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          {/* Left: Icon & Text */}
          <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
            <div className="size-8 rounded-lg bg-[#FAF8F5] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531] flex items-center justify-center shrink-0 text-[#161514] dark:text-[#FAF8F5]">
              <Bell className="size-4 stroke-[1.8] text-[#03D26F] dark:text-[#CEF431]" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-heading font-bold text-xs sm:text-sm text-[#161514] dark:text-[#FAF8F5] tracking-tight">
                  {content.title}
                </h4>
                <span className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] bg-[#FAF8F5] dark:bg-[#252321] px-1.5 py-0.2 rounded border border-[#E8E5DF] dark:border-[#383531]">
                  Alerts
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#6B6B6B] dark:text-[#A8A29E] mt-0.5 leading-snug">
                {content.description}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={handleQuickEnable}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#161514] dark:bg-[#CEF431] hover:bg-[#2A2826] dark:hover:bg-[#d6f64d] text-white dark:text-[#161514] font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer min-h-[32px]"
            >
              <Check className="size-3.5 stroke-[2.5]" />
              <span className="whitespace-nowrap">{content.buttonLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="p-1.5 rounded-lg bg-[#FAF8F5] dark:bg-[#252321] hover:bg-[#F1EFEA] dark:hover:bg-[#2e2b28] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#383531] transition-colors cursor-pointer min-h-[32px] flex items-center justify-center"
              title="Customize exact reminder times"
            >
              <Clock className="size-3.5 stroke-[1.8]" />
              <span className="sr-only">Customize Times</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-[#8C8882] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5] hover:bg-[#FAF8F5] dark:hover:bg-[#252321] cursor-pointer transition-colors"
              title="Dismiss reminder prompt"
            >
              <X className="size-3.5 stroke-[2]" />
              <span className="sr-only">Dismiss</span>
            </button>
          </div>
        </div>
      </div>

      <ReminderManagerModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        defaultSpace={space === "today" ? "all" : space === "goals" ? "habits" : space}
      />
    </>
  );
}
