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
import { Bell, Clock, Wallet, CheckSquare, GraduationCap, Target, Volume2, VolumeX, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NeobrutalistTimeInput } from "@/components/shared/NeobrutalistTimeInput";

import { enableWebPushNotifications, triggerTestPushNotification } from "@/lib/utils/push-client";
import { useAuth } from "@/components/shared/AuthProvider";
import { isNativeApp, scheduleAllNativeAlarms } from "@/lib/native/native-notifications";
import { triggerHaptic } from "@/lib/native/haptics";

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
  const { user } = useAuth();
  const [config, setConfig] = useState<ReminderConfig>(DEFAULT_REMINDER_CONFIG);
  const [permissionState, setPermissionState] = useState<string>("default");
  const isNative = isNativeApp();

  useEffect(() => {
    if (open) {
      setConfig(getReminderConfig());
      if (isNative) {
        import("@/lib/native/native-notifications").then(({ getNativeNotificationPermissionStatus }) => {
          getNativeNotificationPermissionStatus().then((status) => {
            setPermissionState(status);
          });
        });
      } else if (typeof window !== "undefined" && "Notification" in window) {
        setPermissionState(Notification.permission);
      }
    }
  }, [open, isNative]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    triggerHaptic("success");

    // 1. If running as Native Android/iOS App, schedule hardware-level exact alarms
    if (isNative) {
      await scheduleAllNativeAlarms(config);
    } else {
      // 2. Request browser notification permission if on web browser
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted") {
        const granted = await requestNotificationPermission();
        setPermissionState(granted ? "granted" : "denied");
      }
    }

    // Enable Background Web Push token registration & sync schedule to MongoDB
    await enableWebPushNotifications(user?.uid || "guest", config).catch(() => {});

    saveReminderConfig(config);
    toast.success("Daily reminders saved", {
      description: "Hardware alarms & local schedule synchronized",
    });
    onOpenChange(false);
  };

  const handleTestNotification = async () => {
    if (isNative) {
      const { sendTestNativeAlarm } = await import("@/lib/native/native-notifications");
      await sendTestNativeAlarm();
      return;
    }

    const granted = await requestNotificationPermission();
    if (granted) {
      sendNativeNotification(
        "Invictus System Alert",
        "Your daily reminders are active. Notifications will appear at your scheduled times.",
        "/today"
      );
      await triggerTestPushNotification().catch(() => {});
      toast.success("Test notification dispatched to status bar");
    } else {
      toast.error("Notification permission denied by browser settings.");
    }
  };

  return (
    <ResponsiveFormContainer
      open={open}
      onOpenChange={onOpenChange}
      title="Daily Reminder & Notification Settings"
      description="Pick exact times to be reminded so you never miss a streak or budget log"
    >
      <form onSubmit={handleSave} className="space-y-4 pt-1">
        {/* Permission Banner */}
        {permissionState === "granted" ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-950 dark:text-emerald-200 flex flex-wrap items-center justify-between gap-2 shadow-xs transition-colors">
            <span className="flex items-center gap-1.5 font-black text-[11px] sm:text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400 stroke-[2.5] shrink-0" />
              {isNative ? "Native Hardware Alarms Granted & Active" : "Browser Notifications Granted & Active"}
            </span>
            <button
              type="button"
              onClick={handleTestNotification}
              className="px-3 py-1 rounded-lg bg-white dark:bg-[#1C1A18] hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-[#161514] dark:text-[#FAF8F5] font-semibold text-[10px] border border-emerald-300 dark:border-emerald-700 cursor-pointer shrink-0 ml-auto shadow-xs transition-colors"
            >
              Test Alarm
            </button>
          </div>
        ) : permissionState === "denied" ? (
          <div className="bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-950 dark:text-rose-200 space-y-1 shadow-xs transition-colors">
            <div className="flex items-center gap-1.5 font-black text-[11px] sm:text-xs">
              <Bell className="h-4 w-4 text-rose-700 dark:text-rose-400 stroke-[2.5] shrink-0" />
              {isNative ? "Notifications Blocked in Device Settings" : "Notifications Blocked in Browser Settings"}
            </div>
            <p className="text-[11px] font-medium text-rose-900 dark:text-rose-300 leading-tight">
              {isNative ? (
                <>To enable: Open your phone&apos;s <strong>Settings &gt; Apps &gt; Invictus &gt; Notifications</strong> and toggle <strong>Allow notifications</strong> to On.</>
              ) : (
                <>To enable: Click the 🔒 lock icon on your browser address bar next to <code className="bg-white/80 dark:bg-[#1C1A18] px-1 py-0.5 rounded text-[10px]">localhost:3000</code> &rarr; Switch <strong>Notifications</strong> to <strong>Allow</strong>.</>
              )}
            </p>
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800 text-xs font-bold text-[#161514] dark:text-[#FAF8F5] flex flex-wrap items-center justify-between gap-2 shadow-xs transition-colors">
            <span className="flex items-center gap-1.5 text-[11px] sm:text-xs">
              <Bell className="h-4 w-4 text-amber-700 dark:text-amber-400 stroke-[2.5] shrink-0" />
              {isNative ? "Enable Native Hardware Alarms for lock screen alerts" : "Allow browser notifications for background alerts"}
            </span>
            <button
              type="button"
              onClick={async () => {
                if (isNative) {
                  const { requestNativeNotificationPermissions } = await import("@/lib/native/native-notifications");
                  const granted = await requestNativeNotificationPermissions();
                  setPermissionState(granted ? "granted" : "denied");
                } else {
                  const granted = await requestNotificationPermission();
                  setPermissionState(granted ? "granted" : "denied");
                  if (granted) {
                    await enableWebPushNotifications().catch(() => {});
                    toast.success("Notifications Enabled! 🎉");
                  } else {
                    toast.error("Permission denied in browser.");
                  }
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-[#CEF431] text-[#161514] font-black text-[10px] uppercase border border-[#CEF431] shadow-xs cursor-pointer shrink-0 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              Enable Now
            </button>
          </div>
        )}

        {/* 1. Money & Expense Log Reminder */}
        <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Wallet className="size-4 stroke-[2.2]" />
              </div>
              <span className="text-xs font-heading font-bold text-[#161514] dark:text-[#FAF8F5]">
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
            <div className="pt-2 border-t border-[#E8E5DF] dark:border-[#2A2724]">
              <NeobrutalistTimeInput
                value={config.moneyTime}
                onChange={(val) => setConfig({ ...config, moneyTime: val })}
              />
            </div>
          )}
        </div>

        {/* 2. Habits & Streaks Log Reminder */}
        <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <CheckSquare className="size-4 stroke-[2.2]" />
              </div>
              <span className="text-xs font-heading font-bold text-[#161514] dark:text-[#FAF8F5]">
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
            <div className="pt-2 border-t border-[#E8E5DF] dark:border-[#2A2724]">
              <NeobrutalistTimeInput
                value={config.habitsTime}
                onChange={(val) => setConfig({ ...config, habitsTime: val })}
              />
            </div>
          )}
        </div>

        {/* 3. Study Session & Exam Syllabus Reminder */}
        <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                <GraduationCap className="size-4 stroke-[2.2]" />
              </div>
              <span className="text-xs font-heading font-bold text-[#161514] dark:text-[#FAF8F5]">
                Study Log & Review
              </span>
            </div>
            <input
              type="checkbox"
              checked={config.studyEnabled}
              onChange={(e) => setConfig({ ...config, studyEnabled: e.target.checked })}
              className="h-4 w-4 rounded accent-purple-600 cursor-pointer"
            />
          </div>

          {config.studyEnabled && (
            <div className="pt-2 border-t border-[#E8E5DF] dark:border-[#2A2724]">
              <NeobrutalistTimeInput
                value={config.studyTime}
                onChange={(val) => setConfig({ ...config, studyTime: val })}
              />
            </div>
          )}
        </div>

        {/* 4. Exam Targets & Countdown Review */}
        <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Target className="size-4 stroke-[2.2]" />
              </div>
              <span className="text-xs font-heading font-bold text-[#161514] dark:text-[#FAF8F5]">
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
            <div className="pt-2 border-t border-[#E8E5DF] dark:border-[#2A2724]">
              <NeobrutalistTimeInput
                value={config.examTime}
                onChange={(val) => setConfig({ ...config, examTime: val })}
              />
            </div>
          )}
        </div>

        {/* Chime & Test Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => setConfig({ ...config, soundEnabled: !config.soundEnabled })}
            className={cn(
              "flex-1 min-w-[125px] px-2.5 py-2 rounded-xl text-xs font-black border flex items-center justify-center gap-1.5 shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all",
              config.soundEnabled
                ? "bg-[#CEF431] text-[#161514] border-[#CEF431]"
                : "bg-white dark:bg-[#252321] text-gray-500 dark:text-gray-400 border-[#E8E5DF] dark:border-[#2A2724]"
            )}
          >
            {config.soundEnabled ? <Volume2 className="h-3.5 w-3.5 stroke-[2.5]" /> : <VolumeX className="h-3.5 w-3.5 stroke-[2.5]" />}
            <span>{config.soundEnabled ? "Chime ON" : "Chime Muted"}</span>
          </button>

          <button
            type="button"
            onClick={handleTestNotification}
            className="flex-1 min-w-[125px] px-2.5 py-2 rounded-xl bg-white dark:bg-[#252321] hover:bg-[#FFF9EA] dark:hover:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] text-xs font-black border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <Bell className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Test Alert</span>
          </button>
        </div>

        {/* Submit Save */}
        <button
          type="submit"
          className="w-full bg-[#03D26F] hover:bg-[#02b35d] text-[#161514] font-heading font-bold text-xs rounded-xl py-2.5 border border-[#03D26F] shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
        >
          <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
          <span>Save Reminder Settings</span>
        </button>
      </form>
    </ResponsiveFormContainer>
  );
}
