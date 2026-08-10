"use client";

import { useState, useEffect } from "react";
import { Bell, Clock, Sparkles, Check, X, ShieldAlert } from "lucide-react";
import { getReminderConfig, saveReminderConfig, type ReminderConfig } from "@/lib/utils/reminder-scheduler";
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

  useEffect(() => {
    const config = getReminderConfig();
    let isActive = false;
    if (space === "money") isActive = config.moneyEnabled;
    else if (space === "goals" || space === "habits") isActive = config.habitsEnabled;
    else if (space === "study") isActive = config.studyEnabled;
    else if (space === "exam") isActive = config.examEnabled;
    else isActive = config.moneyEnabled || config.habitsEnabled || config.studyEnabled || config.examEnabled;

    setHasEnabledReminders(isActive);
  }, [space]);

  const handleQuickEnable = async () => {
    const granted = await requestNotificationPermission();
    const config = getReminderConfig();
    config.moneyEnabled = true;
    config.habitsEnabled = true;
    config.studyEnabled = true;
    config.examEnabled = true;
    saveReminderConfig(config);
    setHasEnabledReminders(true);

    if (granted) {
      sendNativeNotification(
        "🔔 Reminders Enabled!",
        "You're all set! Daily reminders for Money, Habits & Study sessions are now active.",
        "/today"
      );
    }
    toast.success("Default Reminders Active! 🔔 (8:00 PM Money, 9:00 PM Habits)");
  };

  if (isDismissed || hasEnabledReminders) return null;

  return (
    <>
      <div className="bg-[#CEF431] text-[#161514] rounded-2xl p-4 border-2 border-[#161514] shadow-[3.5px_3.5px_0px_0px_rgba(22,21,20,1)] relative my-3 space-y-2">
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="absolute right-3 top-3 text-[#161514]/60 hover:text-[#161514] p-0.5 cursor-pointer border-none bg-transparent"
          title="Dismiss banner"
        >
          <X className="h-4 w-4 stroke-[3]" />
        </button>

        <div className="flex items-center gap-3 pr-6">
          <div className="h-10 w-10 rounded-xl bg-white border-2 border-[#161514] flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]">
            <Bell className="h-5 w-5 stroke-[2.5] text-[#161514] animate-bounce" />
          </div>

          <div>
            <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider text-[#161514] flex items-center gap-1.5">
              <span>Never miss a streak or budget log! 🔔</span>
            </h4>
            <p className="text-[11px] sm:text-xs font-extrabold text-[#161514]/80 mt-0.5 leading-tight">
              Proactive Suggestion: Set daily reminders for Expenses, Habits & Exam Study sessions at your preferred times.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-[#161514]/20 flex-wrap">
          <button
            type="button"
            onClick={handleQuickEnable}
            className="px-3 py-1.5 rounded-xl bg-[#03D26F] text-[#161514] font-black text-xs uppercase tracking-wider border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all flex items-center gap-1"
          >
            <Check className="h-3.5 w-3.5 stroke-[3]" />
            <span>Enable 8:00 PM Reminders</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white text-[#161514] font-black text-xs uppercase tracking-wider border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all flex items-center gap-1"
          >
            <Clock className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Customize Time ⚙️</span>
          </button>
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
