"use client";

import { useState, useEffect } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import {
  getReminderConfig,
  saveReminderConfig,
  type ReminderConfig,
  DEFAULT_REMINDER_CONFIG,
} from "@/lib/utils/reminder-scheduler";
import { requestNotificationPermission, sendNativeNotification } from "@/lib/utils/notifications";
import { Bell, Clock, DollarSign, Target, BookOpen, Volume2, VolumeX, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReminderManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSpace?: "money" | "habits" | "study" | "exam" | "all";
}

export function ReminderManagerModal({
  open,
  onOpenChange,
  defaultSpace = "all",
}: ReminderManagerModalProps) {
  const [config, setConfig] = useState<ReminderConfig>(DEFAULT_REMINDER_CONFIG);
  const [permissionState, setPermissionState] = useState<string>("default");

  useEffect(() => {
    if (open) {
      setConfig(getReminderConfig());
      if (typeof window !== "undefined" && "Notification" in window) {
        setPermissionState(Notification.permission);
      }
    }
  }, [open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Request browser notification permission if not yet granted
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted") {
      const granted = await requestNotificationPermission();
      setPermissionState(granted ? "granted" : "denied");
    }

    saveReminderConfig(config);
    toast.success("Daily Reminders Saved & Active! 🔔");
    onOpenChange(false);
  };

  const handleTestNotification = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      sendNativeNotification(
        "🔔 Test Invictus Notification",
        "Your daily reminders are working perfectly! You'll be notified at your chosen times.",
        "/today"
      );
      toast.success("Test notification fired! Check your screen/device notifications 🔔");
    } else {
      toast.error("Notification permission denied by browser settings.");
    }
  };

  return (
    <ResponsiveFormContainer
      open={open}
      onOpenChange={onOpenChange}
      title="DAILY REMINDER & NOTIFICATION SETTINGS"
      description="Pick exact times to be reminded so you never miss a streak or budget log"
    >
      <form onSubmit={handleSave} className="space-y-4 pt-1">
        {/* Permission Banner */}
        {permissionState !== "granted" && (
          <div className="bg-amber-100 p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] text-xs font-bold text-[#161514] flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <Bell className="h-4 w-4 text-amber-700 stroke-[2.5]" />
              Allow browser notifications for background alerts
            </span>
            <button
              type="button"
              onClick={handleTestNotification}
              className="px-2.5 py-1 rounded-xl bg-[#CEF431] text-[#161514] font-black text-[10px] uppercase border border-[#161514] cursor-pointer shrink-0"
            >
              Enable Now
            </button>
          </div>
        )}

        {/* 1. Money & Expense Log Reminder */}
        <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#03D26F]/30 border border-[#161514] flex items-center justify-center text-emerald-950 font-black">
                💰
              </div>
              <span className="text-xs font-black uppercase text-[#161514]">
                Money & Expense Log Reminder
              </span>
            </div>
            <input
              type="checkbox"
              checked={config.moneyEnabled}
              onChange={(e) => setConfig({ ...config, moneyEnabled: e.target.checked })}
              className="h-4 w-4 rounded accent-[#03D26F] cursor-pointer"
            />
          </div>

          {config.moneyEnabled && (
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#161514]/10">
              <span className="text-[10px] font-extrabold text-[#161514]/70">Daily Alert Time:</span>
              <input
                type="time"
                value={config.moneyTime}
                onChange={(e) => setConfig({ ...config, moneyTime: e.target.value })}
                className="bg-white px-3 py-1 rounded-xl border-2 border-[#161514] text-xs font-black text-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]"
              />
            </div>
          )}
        </div>

        {/* 2. Habits & Streaks Log Reminder */}
        <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-amber-300 border border-[#161514] flex items-center justify-center text-amber-950 font-black">
                🌱
              </div>
              <span className="text-xs font-black uppercase text-[#161514]">
                Habits & Streaks Check-in
              </span>
            </div>
            <input
              type="checkbox"
              checked={config.habitsEnabled}
              onChange={(e) => setConfig({ ...config, habitsEnabled: e.target.checked })}
              className="h-4 w-4 rounded accent-amber-500 cursor-pointer"
            />
          </div>

          {config.habitsEnabled && (
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#161514]/10">
              <span className="text-[10px] font-extrabold text-[#161514]/70">Daily Alert Time:</span>
              <input
                type="time"
                value={config.habitsTime}
                onChange={(e) => setConfig({ ...config, habitsTime: e.target.value })}
                className="bg-white px-3 py-1 rounded-xl border-2 border-[#161514] text-xs font-black text-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]"
              />
            </div>
          )}
        </div>

        {/* 3. Study Session & Exam Syllabus Reminder */}
        <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-indigo-200 border border-[#161514] flex items-center justify-center text-indigo-950 font-black">
                📚
              </div>
              <span className="text-xs font-black uppercase text-[#161514]">
                Study Log & PYQ Review
              </span>
            </div>
            <input
              type="checkbox"
              checked={config.studyEnabled}
              onChange={(e) => setConfig({ ...config, studyEnabled: e.target.checked })}
              className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
            />
          </div>

          {config.studyEnabled && (
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#161514]/10">
              <span className="text-[10px] font-extrabold text-[#161514]/70">Daily Alert Time:</span>
              <input
                type="time"
                value={config.studyTime}
                onChange={(e) => setConfig({ ...config, studyTime: e.target.value })}
                className="bg-white px-3 py-1 rounded-xl border-2 border-[#161514] text-xs font-black text-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]"
              />
            </div>
          )}
        </div>

        {/* 4. Exam Targets & Countdown Review */}
        <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-rose-300 border border-[#161514] flex items-center justify-center text-rose-950 font-black">
                🎯
              </div>
              <span className="text-xs font-black uppercase text-[#161514]">
                Exam Target & Countdown Review
              </span>
            </div>
            <input
              type="checkbox"
              checked={config.examEnabled}
              onChange={(e) => setConfig({ ...config, examEnabled: e.target.checked })}
              className="h-4 w-4 rounded accent-rose-500 cursor-pointer"
            />
          </div>

          {config.examEnabled && (
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#161514]/10">
              <span className="text-[10px] font-extrabold text-[#161514]/70">Daily Alert Time:</span>
              <input
                type="time"
                value={config.examTime}
                onChange={(e) => setConfig({ ...config, examTime: e.target.value })}
                className="bg-white px-3 py-1 rounded-xl border-2 border-[#161514] text-xs font-black text-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]"
              />
            </div>
          )}
        </div>

        {/* Chime & Test Actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => setConfig({ ...config, soundEnabled: !config.soundEnabled })}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-black border-2 border-[#161514] flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] cursor-pointer transition-all",
              config.soundEnabled ? "bg-[#CEF431] text-[#161514]" : "bg-white text-gray-500"
            )}
          >
            {config.soundEnabled ? <Volume2 className="h-3.5 w-3.5 stroke-[2.5]" /> : <VolumeX className="h-3.5 w-3.5 stroke-[2.5]" />}
            <span>{config.soundEnabled ? "Chime Audio ON" : "Chime Audio Muted"}</span>
          </button>

          <button
            type="button"
            onClick={handleTestNotification}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-[#161514] text-xs font-black border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] cursor-pointer transition-all flex items-center gap-1"
          >
            <Bell className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Test Notification</span>
          </button>
        </div>

        {/* Submit Save */}
        <button
          type="submit"
          className="w-full bg-[#03D26F] hover:bg-[#02b35d] text-[#161514] font-black text-xs uppercase tracking-wider rounded-2xl py-3 border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all flex items-center justify-center gap-2 mt-2"
        >
          <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
          <span>Save All Reminder Settings</span>
        </button>
      </form>
    </ResponsiveFormContainer>
  );
}
