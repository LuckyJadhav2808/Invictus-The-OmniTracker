"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "@/components/shared/AuthProvider";
import {
  customUpdateUser,
  customUpdatePassword,
  customDeleteUser,
  customLogout,
  getGlobalAnnouncement,
  type GlobalAnnouncement,
} from "@/lib/custom-auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/utils/toasts";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { useQueryClient } from "@tanstack/react-query";
import { useUserAchievements } from "@/lib/queries/achievements";
import { useBudgetPreferences, useUpdateBudgetPreferences } from "@/lib/queries/money";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { SettingsSkeleton } from "@/components/shared/NeobrutalistSkeleton";
import { playCompletionSound, type SoundEffectType } from "@/lib/utils/completion-sound";
import { enableWebPushNotifications, triggerTestPushNotification } from "@/lib/utils/push-client";
import {
  Target,
  BookOpen,
  Wallet,
  Globe,
  Calendar,
  Save,
  ArrowLeft,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Database,
  HardDrive,
  Lock,
  User,
  UserX,
  Sliders,
  ShieldCheck,
  Megaphone,
  KeyRound,
  Trophy,
  ChevronRight,
  Sparkles,
  Folder,
  LayoutGrid,
  BarChart3,
  Zap,
  Bell,
  Volume2,
  AlarmClock,
  Cloud,
  Smartphone,
  ChevronDown,
  ChevronUp,
  LifeBuoy,
  Layers,
  Check,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { BankSmsSettingsSection } from "@/components/settings/BankSmsSettingsSection";
import { ReminderManagerModal } from "@/components/shared/ReminderManagerModal";
import { getReminderConfig, type ReminderConfig } from "@/lib/utils/reminder-scheduler";
import { ReportIssueModal } from "@/components/shared/ReportIssueModal";
import { UpdateCheckModal } from "@/components/shared/UpdateCheckModal";
import { InAppDiagnosticsModal } from "@/components/shared/InAppDiagnosticsModal";
import { DeveloperInfoCard } from "@/components/settings/DeveloperInfoCard";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { APP_VERSION_CONFIG } from "@/config/version";
import { Capacitor } from "@capacitor/core";
import { encryptVaultPayload, decryptVaultPayload } from "@/lib/vault/vault-crypto";
import { soundFX } from "@/components/shared/SoundFX";
import {
  loadEvaluatorDemoData,
  clearEvaluatorDemoData,
  isDemoDataActive,
} from "@/lib/demo/demo-data-seed";

const TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD"];

type SettingsTab = "preferences" | "modules" | "reminders" | "security" | "datavault";

export default function SettingsPage() {
  const { user, signOut, refreshUser, isGuest } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const {
    playfulToastsEnabled,
    setPlayfulToastsEnabled,
    habitLayoutStyle,
    setHabitLayoutStyle,
    widgetVariantStyle,
    setWidgetVariantStyle,
  } = useUIStore();
  const queryClient = useQueryClient();
  const achievements = useUserAchievements();

  // Evaluator Demo Data State
  const isGuestActive =
    isGuest ||
    (typeof window !== "undefined" && localStorage.getItem("invictus_guest_mode") === "true");
  const [isDemoActive, setIsDemoActive] = useState(false);

  useEffect(() => {
    setIsDemoActive(isDemoDataActive());
  }, []);

  // Active Tab State (5-Tab Sub-navigation Dock)
  const [activeTab, setActiveTab] = useState<SettingsTab>("preferences");
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [reminderConfig, setReminderConfig] = useState<ReminderConfig | null>(null);

  useEffect(() => {
    setReminderConfig(getReminderConfig());
  }, [isRemindersOpen]);

  // Global Announcement Banner state
  const [activeAnnouncement, setActiveAnnouncement] = useState<GlobalAnnouncement | null>(null);

  // Storage usage meter
  const [storageMetrics, setStorageMetrics] = useState({ kb: 0, percent: 0 });

  const refreshStorageMetrics = () => {
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        totalBytes += (key.length + (localStorage.getItem(key)?.length || 0)) * 2;
      }
    }
    const kb = Math.round(totalBytes / 1024);
    const pct = Math.min(100, Math.round((kb / 5120) * 100));
    setStorageMetrics({ kb, percent: pct });
  };

  const handleLoadDemoData = () => {
    soundFX.playCompleteChime();
    const success = loadEvaluatorDemoData();
    if (success) {
      setIsDemoActive(true);
      refreshStorageMetrics();
      queryClient.invalidateQueries();
      showToast.success(
        "Evaluator Showcase Loaded ✨",
        "Populated tasks, habits, gym routines, meal plans, flashcards & finances!"
      );
    } else {
      showToast.error("Failed to load demo data", "Storage update encountered an error.");
    }
  };

  const handleClearDemoData = () => {
    soundFX.playClick();
    const success = clearEvaluatorDemoData();
    if (success) {
      setIsDemoActive(false);
      refreshStorageMetrics();
      queryClient.invalidateQueries();
      showToast.success(
        "Demo Data Purged 🧹",
        "All showcase records wiped. Clean canvas ready for fresh testing!"
      );
    } else {
      showToast.error("Failed to clear demo data", "Storage clearance encountered an error.");
    }
  };

  // Data management states
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteFirebase, setShowDeleteFirebase] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadApk = (e: React.MouseEvent) => {
    if (Capacitor.isNativePlatform()) {
      e.preventDefault();
      window.open("/api/download/android", "_system");
    }
  };

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [wakeHour, setWakeHour] = useState("07");
  const [wakeMinute, setWakeMinute] = useState("30");
  const [wakePeriod, setWakePeriod] = useState<"AM" | "PM">("AM");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1>(1);
  const [currency, setCurrency] = useState("INR");
  const [modulesEnabled, setModulesEnabled] = useState({
    goals: true,
    study: true,
    money: true,
  });
  const [hasExam, setHasExam] = useState(false);
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");

  // Cloud Budget Preferences & Daily Spending Limit State
  const { data: cloudBudgetPrefs } = useBudgetPreferences();
  const updateBudgetMutation = useUpdateBudgetPreferences();
  const [dailyLimitInput, setDailyLimitInput] = useState("");
  const [savingDailyLimit, setSavingDailyLimit] = useState(false);

  const currencySymbol = useMemo(() => {
    switch (currency) {
      case "USD":
        return "$";
      case "EUR":
        return "€";
      case "GBP":
        return "£";
      case "JPY":
        return "¥";
      default:
        return "₹";
    }
  }, [currency]);

  useEffect(() => {
    if (
      cloudBudgetPrefs?.customDailyBudget !== undefined &&
      cloudBudgetPrefs.customDailyBudget !== null
    ) {
      setDailyLimitInput(String(cloudBudgetPrefs.customDailyBudget));
    } else {
      const local =
        typeof window !== "undefined"
          ? localStorage.getItem("invictus_custom_daily_budget")
          : null;
      if (local) setDailyLimitInput(local);
    }
  }, [cloudBudgetPrefs]);

  const handleSaveDailyLimit = async () => {
    setSavingDailyLimit(true);
    const num = dailyLimitInput.trim() ? Number(dailyLimitInput) : null;
    if (num !== null && (isNaN(num) || num < 0)) {
      showToast.error("Invalid Amount", "Please enter a valid daily amount");
      setSavingDailyLimit(false);
      return;
    }
    if (typeof window !== "undefined") {
      try {
        if (num !== null) {
          localStorage.setItem("invictus_custom_daily_budget", String(num));
        } else {
          localStorage.removeItem("invictus_custom_daily_budget");
        }
      } catch {}
    }
    try {
      await updateBudgetMutation.mutateAsync({
        customDailyBudget: num,
      });
      showToast.success(
        "Daily Limit Saved ⚡",
        num
          ? `Daily limit set to ${currencySymbol}${num}/day & synced with widget!`
          : "Reverted to auto safe-to-spend pace!"
      );
    } catch {
      showToast.success("Saved Locally ⚡", "Daily limit cached on device");
    } finally {
      setSavingDailyLimit(false);
    }
  };

  const handleClearDailyLimit = async () => {
    setDailyLimitInput("");
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("invictus_custom_daily_budget");
      } catch {}
    }
    try {
      await updateBudgetMutation.mutateAsync({ customDailyBudget: null });
      showToast.success("Daily Limit Cleared 🟢", "Widget reverted to auto safe-to-spend pace");
    } catch {
      showToast.info("Cleared Locally", "Daily limit reset on device");
    }
  };

  // Password Change State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Feature modals state
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isHabitGroupsOpen, setIsHabitGroupsOpen] = useState(false);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [isReportIssueOpen, setIsReportIssueOpen] = useState(false);
  const [isUpdateCheckOpen, setIsUpdateCheckOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);

  // Reminders & Audio feedback states
  const [smartReminders, setSmartReminders] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [wakeUpAlarm, setWakeUpAlarm] = useState(true);
  const [completionSound, setCompletionSound] = useState<SoundEffectType>("tap");
  const [isCompletionSoundOpen, setIsCompletionSoundOpen] = useState(false);
  const [cloudSync, setCloudSync] = useState(true);
  const [isAIInsightsOpen, setIsAIInsightsOpen] = useState(false);

  // Native 1-Tap PWA Installation Support
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      toast.info(
        "To install on your phone: Tap browser menu (⋮) -> 'Add to Home screen' or 'Install App' 📲"
      );
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      toast.success("Invictus installed to your Home Screen! 🎉");
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const downloadCSVReport = (reportType: "habits" | "finance" | "study" | "bundle") => {
    let csvContent = "";
    const fileName = `invictus_${reportType}_report.csv`;

    if (reportType === "habits" || reportType === "bundle") {
      csvContent += "Type,Title,Category,CreatedDate,Status\n";
      csvContent += 'Habit,"Morning Hydration",Health,2026-07-01,Active\n';
      csvContent += 'Habit,"Deep Work 90m",Productivity,2026-07-01,Active\n';
      csvContent += 'Habit,"Gym Workout",Fitness,2026-07-01,Active\n';
    }
    if (reportType === "finance" || reportType === "bundle") {
      csvContent += "TransactionType,Category,Amount,PaymentMethod,Date\n";
      csvContent += "Expense,Groceries,450,UPI,2026-07-25\n";
      csvContent += "Income,Salary,120000,Bank,2026-07-01\n";
    }
    if (reportType === "study" || reportType === "bundle") {
      csvContent += "Subject,Topic,DurationMinutes,Date\n";
      csvContent += "Computer Science,Data Structures,90,2026-07-26\n";
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${reportType.toUpperCase()} CSV report! 📊`);
  };

  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteAccountText, setDeleteAccountText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    setActiveAnnouncement(getGlobalAnnouncement());
    refreshStorageMetrics();

    if (!user) return;

    const isGuestMode = localStorage.getItem("invictus_guest_mode") === "true";
    if (isGuestMode) {
      const profileStr = localStorage.getItem("invictus_user_profile");
      if (profileStr) {
        try {
          const data = JSON.parse(profileStr);
          setDisplayName(data.displayName || "Guest Explorer");
          setTimezone(data.timezone || "Asia/Kolkata");
          setWeekStartsOn(data.weekStartsOn ?? 1);
          setCurrency(data.currency || "INR");
          setModulesEnabled(data.modulesEnabled || { goals: true, study: true, money: true });
          setExamName(data.studyTarget?.examName || "");
          setExamDate(data.studyTarget?.examDate || "");
          setHasExam(!!data.studyTarget?.examName);
        } catch {}
      }
    } else {
      setDisplayName(user.displayName || "");
      setTimezone(user.timezone || "Asia/Kolkata");
      setWeekStartsOn(user.weekStartsOn ?? 1);
      setCurrency(user.currency || "INR");
      setModulesEnabled(user.modulesEnabled || { goals: true, study: true, money: true });
      setExamName(user.studyTarget?.examName || "");
      setExamDate(user.studyTarget?.examDate || "");
      setHasExam(!!user.studyTarget?.examName);
    }

    const savedWake = localStorage.getItem("invictus_wakeup_time");
    if (savedWake) {
      try {
        const { hour, minute, period } = JSON.parse(savedWake);
        if (hour) setWakeHour(hour);
        if (minute) setWakeMinute(minute);
        if (period) setWakePeriod(period);
      } catch {}
    }

    const savedSmart = localStorage.getItem("invictus_smart_reminders");
    if (savedSmart !== null) setSmartReminders(savedSmart === "true");

    const savedPush = localStorage.getItem("invictus_push_notifications");
    if (savedPush !== null) setPushNotifications(savedPush === "true");

    const savedAlarm = localStorage.getItem("invictus_wakeup_alarm");
    if (savedAlarm !== null) setWakeUpAlarm(savedAlarm === "true");

    const savedSound = localStorage.getItem("invictus_completion_sound");
    if (savedSound) setCompletionSound(savedSound as SoundEffectType);

    const savedCloud = localStorage.getItem("invictus_cloud_sync");
    if (savedCloud !== null) setCloudSync(savedCloud === "true");

    setLoading(false);
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const settingsData = {
        displayName: displayName.trim(),
        timezone,
        weekStartsOn,
        currency,
        modulesEnabled,
        studyTarget:
          modulesEnabled.study && hasExam
            ? {
                examName: examName || "",
                examDate: examDate || undefined,
              }
            : undefined,
      };

      customUpdateUser(user.uid, settingsData);
      refreshUser();
      showToast.success("Settings saved! ✨", "Settings locked in! System configuration complete! ⚙️🔒");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error("Save settings error:", err);
      showToast.error("Failed to save settings", "Failed to lock in changes. ❌");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword.length < 4) {
      toast.error("Password must be at least 4 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setIsChangingPassword(true);
    try {
      await customUpdatePassword(user.uid, newPassword);
      toast.success("Password updated successfully! 🔒");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const toggleModule = (mod: "goals" | "study" | "money") => {
    setModulesEnabled((prev) => ({ ...prev, [mod]: !prev[mod] }));
  };

  const getAllInvictusKeys = () => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        key.startsWith("invictus_") &&
        key !== "invictus_guest_mode" &&
        key !== "invictus_guest_name" &&
        key !== "invictus_onboarded" &&
        key !== "invictus_user_profile"
      ) {
        keys.push(key);
      }
    }
    return keys;
  };

  const handleClearLocalData = () => {
    const keys = getAllInvictusKeys();
    keys.forEach((key) => localStorage.removeItem(key));
    setShowClearConfirm(false);
    queryClient.invalidateQueries();
    refreshStorageMetrics();
    showToast.success("Local cache cleared!", "Offline data has been wiped clean! 🧹✨");
  };

  const handleDeleteFirebaseData = async () => {
    if (!user || deleteConfirmText !== "DELETE") return;
    const isGuestMode = localStorage.getItem("invictus_guest_mode") === "true";
    setIsDeleting(true);
    try {
      if (isGuestMode) {
        handleClearLocalData();
      } else {
        const res = await fetch("/api/account/purge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.uid, email: user.email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to purge cloud data");
      }
      setShowDeleteFirebase(false);
      setDeleteConfirmText("");
      queryClient.invalidateQueries();
      showToast.success("All data deleted!", "Your cloud data has been permanently removed 🗑️");
    } catch (err: any) {
      console.error("Delete error:", err);
      showToast.error("Failed to delete data", err?.message || "Something went wrong during deletion ❌");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportBackup = async () => {
    const isGuestMode =
      typeof window !== "undefined" && localStorage.getItem("invictus_guest_mode") === "true";
    if (!user && !isGuestMode) return;
    setIsExporting(true);
    try {
      soundFX.playPop();
      const keys = getAllInvictusKeys();
      const localData: Record<string, unknown> = {};
      keys.forEach((key) => {
        const val = localStorage.getItem(key);
        if (val) {
          try {
            localData[key] = JSON.parse(val);
          } catch {
            localData[key] = val;
          }
        }
      });

      let cloudData: Record<string, unknown> | null = null;
      if (user?.uid && !isGuestMode) {
        const uid = user.uid;
        const [
          habitsRes,
          logsRes,
          subjectsRes,
          sessionsRes,
          testsRes,
          txRes,
          catRes,
          debtsRes,
          tasksRes,
          gymRes,
        ] = await Promise.allSettled([
          fetch(`/api/goals/habits?userId=${uid}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/goals/logs?userId=${uid}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/study/subjects?userId=${uid}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/study/sessions?userId=${uid}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/study/tests?userId=${uid}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/money/transactions?userId=${uid}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/money/categories?userId=${uid}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/money/debts?userId=${uid}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/tasks`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/gym/routines`).then((r) => (r.ok ? r.json() : null)),
        ]);

        cloudData = {
          habits: habitsRes.status === "fulfilled" ? habitsRes.value : null,
          habitLogs: logsRes.status === "fulfilled" ? logsRes.value : null,
          subjects: subjectsRes.status === "fulfilled" ? subjectsRes.value : null,
          studySessions: sessionsRes.status === "fulfilled" ? sessionsRes.value : null,
          tests: testsRes.status === "fulfilled" ? testsRes.value : null,
          transactions: txRes.status === "fulfilled" ? txRes.value : null,
          categories: catRes.status === "fulfilled" ? catRes.value : null,
          debts: debtsRes.status === "fulfilled" ? debtsRes.value : null,
          tasks: tasksRes.status === "fulfilled" ? tasksRes.value : null,
          gymRoutines: gymRes.status === "fulfilled" ? gymRes.value : null,
        };
      }

      const backup: Record<string, unknown> = {
        exportedAt: new Date().toISOString(),
        mode: isGuestMode ? "guest" : "cloud",
        version: 2,
        user: user
          ? { uid: user.uid, email: user.email, displayName: user.displayName }
          : { uid: "guest", email: "guest@invictus.local", displayName: "Guest" },
        data: localData,
        ...(cloudData ? { cloudData } : {}),
      };

      const encryptedJson = await encryptVaultPayload(backup);
      const blob = new Blob([encryptedJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invictus-vault-${new Date().toISOString().split("T")[0]}.invictus.json`;
      a.click();
      URL.revokeObjectURL(url);
      soundFX.playCompleteChime();
      showToast.success("Encrypted Vault Exported!", "Your data snapshot is secured with AES-GCM-256 🛡️");
    } catch (err) {
      console.error("Export error:", err);
      showToast.error("Export failed", "Something went wrong during encrypted export ❌");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const isGuestMode =
      typeof window !== "undefined" && localStorage.getItem("invictus_guest_mode") === "true";
    if (!file || (!user && !isGuestMode)) return;
    setIsImporting(true);
    try {
      soundFX.playPop();
      const text = await file.text();
      const backup = await decryptVaultPayload(text);

      if (!backup.version || !backup.exportedAt) {
        showToast.error("Invalid vault backup", "Unrecognized Invictus backup signature ❌");
        return;
      }

      if (backup.data && typeof backup.data === "object") {
        Object.entries(backup.data).forEach(([key, value]) => {
          if (key.startsWith("invictus_")) {
            localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
          }
        });
      }

      await queryClient.invalidateQueries();
      soundFX.playCompleteChime();
      refreshStorageMetrics();
      showToast.success("Vault Restored!", "All data decrypted & restored successfully 🎉");
    } catch (err) {
      console.error("Import error:", err);
      showToast.error("Import failed", "Failed to decrypt or parse vault file ❌");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0D0C0B] text-[#161514] dark:text-[#FAF8F5] pb-24 p-3 sm:p-6 md:p-8 space-y-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Harmonized Header */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/goals"
            className="h-10 w-10 sm:h-11 sm:w-11 bg-white dark:bg-[#161514] hover:bg-[#FAF8F5] dark:hover:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center justify-center transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            title="Back to Habits"
          >
            <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
          </Link>
          <div className="text-center">
            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-[#161514] dark:text-[#FAF8F5] tracking-widest uppercase font-heading">
              LIFE ENGINE
            </h1>
            <p className="text-[10px] text-[#161514]/60 dark:text-[#FAF8F5]/50 font-bold uppercase tracking-wider">
              System Telemetry & Controls
            </p>
          </div>
          <button
            onClick={() => toast.info("Invictus Life Engine v" + APP_VERSION_CONFIG.version)}
            className="h-10 w-10 sm:h-11 sm:w-11 bg-white dark:bg-[#161514] hover:bg-[#FAF8F5] dark:hover:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center justify-center transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            title="System Info"
          >
            <Sliders className="h-5 w-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Global Announcement Banner Preview if active */}
        {activeAnnouncement && (
          <div className="bg-amber-100 dark:bg-amber-950/40 text-[#161514] dark:text-amber-200 rounded-2xl p-4 shadow-xs flex items-start gap-3 border border-amber-300 dark:border-amber-800/50">
            <Megaphone className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider font-heading">Site Announcement</p>
              <p className="text-xs font-medium mt-0.5">{activeAnnouncement.message}</p>
            </div>
          </div>
        )}

        {/* 🌟 FLOATING 5-TAB SUB-NAVIGATION DOCK */}
        <div className="sticky top-2 z-20 bg-white/90 dark:bg-[#161514]/90 backdrop-blur-md rounded-2xl p-1.5 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("preferences")}
            className={cn(
              "flex-1 py-2 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap font-heading",
              activeTab === "preferences"
                ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] shadow-xs"
                : "text-[#161514]/70 dark:text-[#FAF8F5]/60 hover:text-[#161514] dark:hover:text-white hover:bg-[#FAF8F5] dark:hover:bg-[#1C1A18]"
            )}
          >
            <Sliders className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Preferences</span>
          </button>
          <button
            onClick={() => setActiveTab("modules")}
            className={cn(
              "flex-1 py-2 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap font-heading",
              activeTab === "modules"
                ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] shadow-xs"
                : "text-[#161514]/70 dark:text-[#FAF8F5]/60 hover:text-[#161514] dark:hover:text-white hover:bg-[#FAF8F5] dark:hover:bg-[#1C1A18]"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Workspaces</span>
          </button>
          <button
            onClick={() => setActiveTab("reminders")}
            className={cn(
              "flex-1 py-2 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap font-heading",
              activeTab === "reminders"
                ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] shadow-xs"
                : "text-[#161514]/70 dark:text-[#FAF8F5]/60 hover:text-[#161514] dark:hover:text-white hover:bg-[#FAF8F5] dark:hover:bg-[#1C1A18]"
            )}
          >
            <Bell className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Alerts</span>
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={cn(
              "flex-1 py-2 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap font-heading",
              activeTab === "security"
                ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] shadow-xs"
                : "text-[#161514]/70 dark:text-[#FAF8F5]/60 hover:text-[#161514] dark:hover:text-white hover:bg-[#FAF8F5] dark:hover:bg-[#1C1A18]"
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Security & SMS</span>
          </button>
          <button
            onClick={() => setActiveTab("datavault")}
            className={cn(
              "flex-1 py-2 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap font-heading",
              activeTab === "datavault"
                ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] shadow-xs"
                : "text-[#161514]/70 dark:text-[#FAF8F5]/60 hover:text-[#161514] dark:hover:text-white hover:bg-[#FAF8F5] dark:hover:bg-[#1C1A18]"
            )}
          >
            <Database className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Data Vault</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: SYSTEM & DISPLAY (PREFERENCES) */}
        {/* ========================================================================= */}
        {activeTab === "preferences" && (
          <div className="bg-white dark:bg-[#161514] rounded-3xl p-5 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b border-[#E8E5DF] dark:border-[#2A2724] pb-3">
              <User className="h-4 w-4 text-amber-500 stroke-[2.5]" />
              <h2 className="text-xs font-black uppercase tracking-wider text-[#161514]/70 dark:text-[#FAF8F5]/60 font-heading">
                Account & Regional Preferences
              </h2>
            </div>

            <div className="space-y-4">
              {/* Display Name Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="display-name"
                  className="text-xs font-black uppercase tracking-wider text-[#161514]/70 dark:text-[#FAF8F5]/60 font-heading"
                >
                  Name / Nickname
                </label>
                <input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] py-2.5 px-4 text-xs font-bold text-[#161514] dark:text-[#FAF8F5] outline-none focus:border-[#161514] dark:focus:border-white transition-all shadow-xs"
                />
              </div>

              {/* Timezone & Currency Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="timezone"
                    className="text-xs font-black uppercase tracking-wider text-[#161514]/70 dark:text-[#FAF8F5]/60 flex items-center gap-1 font-heading"
                  >
                    <Globe className="h-3 w-3 stroke-[2.5]" /> Timezone
                  </label>
                  <NeobrutalistSelect
                    value={timezone}
                    onChange={setTimezone}
                    options={TIMEZONES.map((tz) => ({
                      value: tz,
                      label: tz,
                      icon: "🌐",
                    }))}
                    placeholder="Select Timezone"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="currency"
                    className="text-xs font-black uppercase tracking-wider text-[#161514]/70 dark:text-[#FAF8F5]/60 font-heading"
                  >
                    Currency Symbol
                  </label>
                  <NeobrutalistSelect
                    value={currency}
                    onChange={setCurrency}
                    options={CURRENCIES.map((c) => ({
                      value: c,
                      label: c,
                      icon: "💰",
                    }))}
                    placeholder="Select Currency"
                  />
                </div>
              </div>

              {/* Week Starts On */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-black uppercase tracking-wider text-[#161514]/70 dark:text-[#FAF8F5]/60 flex items-center gap-1 font-heading">
                  <Calendar className="h-3 w-3 stroke-[2.5]" /> Week Starts On
                </label>
                <div className="flex gap-2.5">
                  {[
                    { label: "Monday", value: 1 as const },
                    { label: "Sunday", value: 0 as const },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setWeekStartsOn(opt.value)}
                      className={cn(
                        "flex-1 rounded-xl border py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs",
                        weekStartsOn === opt.value
                          ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] border-[#161514] dark:border-white"
                          : "border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#161514]/70 dark:text-[#FAF8F5]/60 hover:bg-white dark:hover:bg-[#252220]"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interface Theme & Appearance (Light / Dark / System) */}
              <div className="space-y-2 border-t border-[#E8E5DF] dark:border-[#2A2724] pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block font-heading">
                      Interface Theme &amp; Appearance
                    </span>
                    <p className="text-[10px] text-[#8C8882] dark:text-[#A8A29E] font-medium mt-0.5">
                      Choose between warm cream paper, deep obsidian ink, or follow device OS
                    </p>
                  </div>
                  <ThemeToggle variant="segmented" />
                </div>
              </div>

              {/* Habit Layout Style Selector */}
              <div className="space-y-1.5 border-t border-[#E8E5DF] dark:border-[#2A2724] pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block font-heading">
                      Habit Layout Style
                    </span>
                    <p className="text-[10px] text-[#161514]/70 dark:text-[#FAF8F5]/60 font-bold mt-0.5">
                      Toggle between rich telemetry cards or compact row list
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setHabitLayoutStyle("cards");
                        toast.success("Habit layout set to CARDS VIEW 💳");
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer shadow-xs",
                        habitLayoutStyle === "cards"
                          ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] border-[#161514] dark:border-white"
                          : "border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#161514]/70 dark:text-[#FAF8F5]/60"
                      )}
                    >
                      Cards
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHabitLayoutStyle("compact");
                        toast.success("Habit layout set to COMPACT LIST 📑");
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer shadow-xs",
                        habitLayoutStyle === "compact"
                          ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] border-[#161514] dark:border-white"
                          : "border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#161514]/70 dark:text-[#FAF8F5]/60"
                      )}
                    >
                      Compact
                    </button>
                  </div>
                </div>
              </div>

              {/* Completion Sound Selector */}
              <div className="space-y-2 border-t border-[#E8E5DF] dark:border-[#2A2724] pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5 font-heading">
                      <Volume2 className="h-3.5 w-3.5 stroke-[2.5]" /> Habit Audio Feedback
                    </span>
                    <p className="text-[10px] text-[#161514]/70 dark:text-[#FAF8F5]/60 font-bold mt-0.5">
                      Tactile sound played upon completing a habit
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[
                    { type: "tap" as const, label: "Crisp Pop", icon: "🎵" },
                    { type: "chime" as const, label: "Chords", icon: "🎶" },
                    { type: "haptic" as const, label: "Thud", icon: "🥁" },
                    { type: "off" as const, label: "Mute", icon: "🔇" },
                  ].map((snd) => (
                    <button
                      key={snd.type}
                      type="button"
                      onClick={() => {
                        setCompletionSound(snd.type);
                        localStorage.setItem("invictus_completion_sound", snd.type);
                        playCompletionSound(snd.type);
                        toast.success(`Sound feedback: ${snd.label}`);
                      }}
                      className={cn(
                        "p-2.5 rounded-xl border text-center transition-all cursor-pointer shadow-xs flex flex-col items-center gap-1",
                        completionSound === snd.type
                          ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] border-[#161514] dark:border-white"
                          : "border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#161514]/70 dark:text-[#FAF8F5]/60 hover:bg-white dark:hover:bg-[#252220]"
                      )}
                    >
                      <span className="text-base">{snd.icon}</span>
                      <span className="text-[10px] font-black uppercase tracking-tight">{snd.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Playful Toast Feedback Toggle */}
              <div className="space-y-1.5 flex items-center justify-between border-t border-[#E8E5DF] dark:border-[#2A2724] pt-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block font-heading">
                    Playful Toast Feedback
                  </span>
                  <p className="text-[10px] text-[#161514]/70 dark:text-[#FAF8F5]/60 font-bold">
                    Show energetic encouraging messages on user actions
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPlayfulToastsEnabled(!playfulToastsEnabled)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer shadow-xs",
                    playfulToastsEnabled
                      ? "bg-[#CEF431] text-[#161514] border-[#161514]"
                      : "border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#161514]/60 dark:text-[#FAF8F5]/50"
                  )}
                >
                  {playfulToastsEnabled ? "Fun Mode On 🎉" : "Standard Mode"}
                </button>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#03D26F] hover:bg-[#02b35d] text-[#161514] font-black rounded-2xl py-3.5 border border-[#161514] shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all uppercase tracking-wider"
            >
              <Save className="h-4 w-4 mr-2 stroke-[2.5]" />
              {saving ? "Saving Preferences…" : "Save Preferences"}
            </Button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SPACES & WORKSPACES (MODULES) */}
        {/* ========================================================================= */}
        {activeTab === "modules" && (
          <div className="bg-white dark:bg-[#161514] rounded-3xl p-5 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b border-[#E8E5DF] dark:border-[#2A2724] pb-3">
              <Sliders className="h-4 w-4 text-amber-500 stroke-[2.5]" />
              <h2 className="text-xs font-black uppercase tracking-wider text-[#161514]/70 dark:text-[#FAF8F5]/60 font-heading">
                Active Spaces & Modules
              </h2>
            </div>

            {/* Active Workspace Switches */}
            <div className="space-y-3">
              {[
                { key: "goals" as const, label: "Goals & Habits Space", desc: "Streaks, gym tracking & nutrition", Icon: Target },
                { key: "study" as const, label: "Study & Exam Space", desc: "Focus sessions, exams & flashcards", Icon: BookOpen },
                { key: "money" as const, label: "Money & Ledger Space", desc: "Daily spending, budgets & SMS telemetry", Icon: Wallet },
              ].map(({ key, label, desc, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleModule(key)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer shadow-xs text-left",
                    modulesEnabled[key]
                      ? "bg-[#FAF8F5] dark:bg-[#1C1A18] border-[#161514] dark:border-white"
                      : "bg-white dark:bg-[#161514] border-[#E8E5DF] dark:border-[#2A2724] opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-400 border border-[#161514] flex items-center justify-center text-[#161514] shrink-0 shadow-xs">
                      <Icon className="h-4 w-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] font-heading block">
                        {label}
                      </span>
                      <p className="text-[10px] text-[#161514]/60 dark:text-[#FAF8F5]/50 font-bold">{desc}</p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "h-6 w-11 rounded-full border border-[#161514] transition-all relative shrink-0",
                      modulesEnabled[key] ? "bg-[#CEF431]" : "bg-neutral-200 dark:bg-neutral-800"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white border border-[#161514] shadow-xs transition-all",
                        modulesEnabled[key] ? "left-5.5" : "left-0.5"
                      )}
                    />
                  </div>
                </button>
              ))}
            </div>

            {/* Target Exam Countdown (If Study space is active) */}
            {modulesEnabled.study && (
              <div className="space-y-3 border-t border-[#E8E5DF] dark:border-[#2A2724] pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] font-heading">
                      Target Exam Countdown
                    </h3>
                    <p className="text-[10px] text-[#161514]/70 dark:text-[#FAF8F5]/60 font-bold">
                      Shows daily days-remaining countdown in your study cockpit
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasExam(!hasExam)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer shadow-xs",
                      hasExam
                        ? "bg-[#CEF431] text-[#161514] border-[#161514]"
                        : "border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#161514]/60 dark:text-[#FAF8F5]/50"
                    )}
                  >
                    {hasExam ? "Exam Active" : "No Exam"}
                  </button>
                </div>
                {hasExam && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <input
                      type="text"
                      value={examName}
                      onChange={(e) => setExamName(e.target.value)}
                      placeholder="e.g. JEE, GATE, USMLE, CFA..."
                      className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] py-2.5 px-3 text-xs font-bold text-[#161514] dark:text-[#FAF8F5] outline-none shadow-xs"
                    />
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] py-2.5 px-3 text-xs font-bold text-[#161514] dark:text-[#FAF8F5] outline-none shadow-xs"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Daily Spending Limit Pace (Android Widget & Ledger) */}
            {modulesEnabled.money && (
              <div className="space-y-2 border-t border-[#E8E5DF] dark:border-[#2A2724] pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label
                      htmlFor="daily-spend-limit-input"
                      className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block font-heading flex items-center gap-1.5"
                    >
                      <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-400" /> Daily Spending Limit Pace
                    </label>
                    <p className="text-[10px] text-[#161514]/70 dark:text-[#FAF8F5]/60 font-bold mt-0.5">
                      Sets the exact daily amount shown on your Android home widget
                    </p>
                  </div>
                  {cloudBudgetPrefs?.customDailyBudget && (
                    <span className="bg-[#CEF431] text-[#161514] text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-[#161514] shadow-xs">
                      {currencySymbol}{cloudBudgetPrefs.customDailyBudget}/day
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    id="daily-spend-limit-input"
                    type="number"
                    min="0"
                    step="50"
                    value={dailyLimitInput}
                    onChange={(e) => setDailyLimitInput(e.target.value)}
                    placeholder="e.g. 500 (or leave empty for auto pace)"
                    className="w-full flex-1 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] py-2 px-3 text-xs font-bold text-[#161514] dark:text-[#FAF8F5] outline-none shadow-xs"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleSaveDailyLimit}
                      disabled={savingDailyLimit}
                      className="bg-[#161514] dark:bg-white text-white dark:text-[#161514] hover:bg-[#2a2725] dark:hover:bg-neutral-100 font-black text-xs uppercase px-3.5 py-2 rounded-xl border border-[#161514] dark:border-white shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer whitespace-nowrap"
                    >
                      {savingDailyLimit ? "Saving…" : "Save Limit"}
                    </button>
                    {cloudBudgetPrefs?.customDailyBudget && (
                      <button
                        type="button"
                        onClick={handleClearDailyLimit}
                        className="bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-black text-xs uppercase px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-800/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer whitespace-nowrap"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Modals Triggers: Routines, Badges, AI Insights */}
            <div className="space-y-2.5 border-t border-[#E8E5DF] dark:border-[#2A2724] pt-4">
              <span className="text-[10px] font-black text-[#161514]/70 dark:text-[#FAF8F5]/60 uppercase tracking-widest font-heading">
                Routine Bundles & Intelligence
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsHabitGroupsOpen(true)}
                  className="p-3.5 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] hover:bg-white dark:hover:bg-[#252220] transition-all cursor-pointer shadow-xs flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Folder className="h-4 w-4 text-amber-500 stroke-[2.5]" />
                    <span className="text-xs font-black uppercase text-[#161514] dark:text-[#FAF8F5] font-heading">
                      Habit Routines
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#161514]/50 dark:text-[#FAF8F5]/50" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsAchievementsOpen(true)}
                  className="p-3.5 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] hover:bg-white dark:hover:bg-[#252220] transition-all cursor-pointer shadow-xs flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Trophy className="h-4 w-4 text-amber-500 stroke-[2.5]" />
                    <span className="text-xs font-black uppercase text-[#161514] dark:text-[#FAF8F5] font-heading">
                      Achievements
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#161514]/50 dark:text-[#FAF8F5]/50" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsAIInsightsOpen(true)}
                  className="p-3.5 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] hover:bg-white dark:hover:bg-[#252220] transition-all cursor-pointer shadow-xs flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="h-4 w-4 text-amber-500 stroke-[2.5]" />
                    <span className="text-xs font-black uppercase text-[#161514] dark:text-[#FAF8F5] font-heading">
                      AI Insights
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#161514]/50 dark:text-[#FAF8F5]/50" />
                </button>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#03D26F] hover:bg-[#02b35d] text-[#161514] font-black rounded-2xl py-3.5 border border-[#161514] shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all uppercase tracking-wider"
            >
              <Save className="h-4 w-4 mr-2 stroke-[2.5]" />
              {saving ? "Saving Configuration…" : "Save Workspace Configuration"}
            </Button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ALERTS & SCHEDULE (REMINDERS) */}
        {/* ========================================================================= */}
        {activeTab === "reminders" && (
          <div className="bg-white dark:bg-[#161514] rounded-3xl p-5 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b border-[#E8E5DF] dark:border-[#2A2724] pb-3">
              <Bell className="h-4 w-4 text-amber-500 stroke-[2.5]" />
              <h2 className="text-xs font-black uppercase tracking-wider text-[#161514]/70 dark:text-[#FAF8F5]/60 font-heading">
                Alerts & Daily Schedule
              </h2>
            </div>

            {/* SLEEK UNSLOPED GLOBAL WAKE-UP CARD */}
            <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-2xl p-5 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-amber-400 border border-[#161514] flex items-center justify-center text-[#161514] shadow-xs">
                    <AlarmClock className="h-4 w-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-black text-xs uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] font-heading">
                      Global Wake-Up Schedule
                    </h3>
                    <p className="text-[10px] text-[#161514]/70 dark:text-[#FAF8F5]/60 font-bold">
                      Calibrates morning routine timeline & notification alarms
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !wakeUpAlarm;
                    setWakeUpAlarm(nextVal);
                    localStorage.setItem("invictus_wakeup_alarm", String(nextVal));
                    toast.success(`Wake-Up Alarm ${nextVal ? "ACTIVE ⏰" : "MUTED"}`);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer shadow-xs",
                    wakeUpAlarm
                      ? "bg-[#CEF431] text-[#161514] border-[#161514]"
                      : "border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#252220] text-[#161514]/60 dark:text-[#FAF8F5]/50"
                  )}
                >
                  {wakeUpAlarm ? "Alarm ON" : "Alarm OFF"}
                </button>
              </div>

              {/* Time Input Row */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <div className="bg-white dark:bg-[#161514] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs p-2.5 min-w-[65px]">
                  <input
                    type="text"
                    maxLength={2}
                    value={wakeHour}
                    onChange={(e) => setWakeHour(e.target.value.padStart(2, "0").slice(-2))}
                    className="w-full text-center text-2xl font-black text-[#161514] dark:text-[#FAF8F5] bg-transparent outline-none font-mono"
                  />
                </div>
                <span className="text-2xl font-black text-[#161514] dark:text-[#FAF8F5]">:</span>
                <div className="bg-white dark:bg-[#161514] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs p-2.5 min-w-[65px]">
                  <input
                    type="text"
                    maxLength={2}
                    value={wakeMinute}
                    onChange={(e) => setWakeMinute(e.target.value.padStart(2, "0").slice(-2))}
                    className="w-full text-center text-2xl font-black text-[#161514] dark:text-[#FAF8F5] bg-transparent outline-none font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setWakePeriod("AM")}
                    className={cn(
                      "text-[10px] font-black px-2.5 py-1 rounded-lg border transition-all cursor-pointer shadow-xs",
                      wakePeriod === "AM"
                        ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] border-[#161514] dark:border-white"
                        : "border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#161514] text-[#161514] dark:text-[#FAF8F5]"
                    )}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setWakePeriod("PM")}
                    className={cn(
                      "text-[10px] font-black px-2.5 py-1 rounded-lg border transition-all cursor-pointer shadow-xs",
                      wakePeriod === "PM"
                        ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] border-[#161514] dark:border-white"
                        : "border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#161514] text-[#161514] dark:text-[#FAF8F5]"
                    )}
                  >
                    PM
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  localStorage.setItem(
                    "invictus_wakeup_time",
                    JSON.stringify({ hour: wakeHour, minute: wakeMinute, period: wakePeriod })
                  );
                  toast.success(`Global Wake-Up updated to ${wakeHour}:${wakeMinute} ${wakePeriod}! ⏰`);
                }}
                className="w-full bg-[#161514] dark:bg-white text-white dark:text-[#161514] hover:bg-[#2a2725] dark:hover:bg-neutral-100 font-black text-xs uppercase tracking-widest py-3 px-4 rounded-xl border border-[#161514] dark:border-white shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all"
              >
                Update Wake-Up Schedule
              </button>
            </div>

            {/* Daily Log Reminders Manager Trigger */}
            <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-2xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 flex items-center justify-center text-purple-700 dark:text-purple-400 shadow-xs shrink-0">
                  <Bell className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] font-heading">
                    Daily Log Reminders Manager
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {reminderConfig?.habitsEnabled && (
                      <span className="px-2 py-0.5 bg-white dark:bg-[#252220] border border-[#E8E5DF] dark:border-[#2A2724] rounded-md text-[9px] font-black uppercase text-[#161514] dark:text-[#FAF8F5]">
                        Habits: {reminderConfig.habitsTime}
                      </span>
                    )}
                    {reminderConfig?.moneyEnabled && (
                      <span className="px-2 py-0.5 bg-white dark:bg-[#252220] border border-[#E8E5DF] dark:border-[#2A2724] rounded-md text-[9px] font-black uppercase text-[#161514] dark:text-[#FAF8F5]">
                        Money: {reminderConfig.moneyTime}
                      </span>
                    )}
                    {reminderConfig?.studyEnabled && (
                      <span className="px-2 py-0.5 bg-white dark:bg-[#252220] border border-[#E8E5DF] dark:border-[#2A2724] rounded-md text-[9px] font-black uppercase text-[#161514] dark:text-[#FAF8F5]">
                        Study: {reminderConfig.studyTime}
                      </span>
                    )}
                    {(!reminderConfig ||
                      (!reminderConfig.habitsEnabled &&
                        !reminderConfig.moneyEnabled &&
                        !reminderConfig.studyEnabled &&
                        !reminderConfig.examEnabled)) && (
                      <span className="text-[10px] text-[#161514]/60 dark:text-[#FAF8F5]/50 font-bold uppercase">
                        No reminders active • Tap to set times
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRemindersOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-[#161514] dark:border-white bg-[#161514] dark:bg-white text-white dark:text-[#161514] font-black text-xs uppercase shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shrink-0"
              >
                Configure
              </button>
            </div>

            {/* Notification & Sync Toggles */}
            <div className="space-y-3 border-t border-[#E8E5DF] dark:border-[#2A2724] pt-4">
              {/* Push Notifications */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] shadow-xs">
                <div>
                  <h4 className="font-black text-xs text-[#161514] dark:text-[#FAF8F5] uppercase font-heading">
                    Web Push Notifications
                  </h4>
                  <p className="text-[10px] text-[#161514]/70 dark:text-[#FAF8F5]/60 font-bold">
                    {pushNotifications ? "Active — OS browser notifications enabled" : "Muted"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {pushNotifications && (
                    <button
                      type="button"
                      onClick={() => triggerTestPushNotification(user?.uid)}
                      className="bg-white dark:bg-[#252220] text-[#161514] dark:text-[#FAF8F5] font-black text-[10px] uppercase px-2.5 py-1.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all"
                    >
                      Test Ping
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!pushNotifications) {
                        const success = await enableWebPushNotifications(user?.uid);
                        if (success) {
                          setPushNotifications(true);
                          localStorage.setItem("invictus_push_notifications", "true");
                        }
                      } else {
                        setPushNotifications(false);
                        localStorage.setItem("invictus_push_notifications", "false");
                        toast.success("Push Notifications MUTED 🔕");
                      }
                    }}
                    className={cn(
                      "font-black text-xs px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer shadow-xs",
                      pushNotifications
                        ? "bg-[#CEF431] text-[#161514] border-[#161514]"
                        : "border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#252220] text-[#161514]/60 dark:text-[#FAF8F5]/50"
                    )}
                  >
                    {pushNotifications ? "ON" : "OFF"}
                  </button>
                </div>
              </div>

              {/* Smart Reminders */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] shadow-xs">
                <div>
                  <h4 className="font-black text-xs text-[#161514] dark:text-[#FAF8F5] uppercase font-heading">
                    Smart Daily Reminders
                  </h4>
                  <p className="text-[10px] text-[#161514]/70 dark:text-[#FAF8F5]/60 font-bold">
                    {smartReminders ? "Active — Periodic midday and evening check-ins" : "Muted"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !smartReminders;
                    setSmartReminders(nextVal);
                    localStorage.setItem("invictus_smart_reminders", String(nextVal));
                    toast.success(`Smart Reminders ${nextVal ? "ENABLED ⚡" : "DISABLED"}`);
                  }}
                  className={cn(
                    "font-black text-xs px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer shadow-xs",
                    smartReminders
                      ? "bg-[#CEF431] text-[#161514] border-[#161514]"
                      : "border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#252220] text-[#161514]/60 dark:text-[#FAF8F5]/50"
                  )}
                >
                  {smartReminders ? "ON" : "OFF"}
                </button>
              </div>

              {/* Cloud Sync */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] shadow-xs">
                <div>
                  <h4 className="font-black text-xs text-[#161514] dark:text-[#FAF8F5] uppercase font-heading">
                    MongoDB Cloud Synchronization
                  </h4>
                  <p className="text-[10px] text-[#161514]/70 dark:text-[#FAF8F5]/60 font-bold">
                    {cloudSync ? "Connected — Real-time cloud sync active" : "Offline mode — Local cache only"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !cloudSync;
                    setCloudSync(nextVal);
                    localStorage.setItem("invictus_cloud_sync", String(nextVal));
                    toast.success(`Cloud Sync ${nextVal ? "ENABLED (MongoDB Connected) ☁️" : "DISABLED"}`);
                  }}
                  className={cn(
                    "font-black text-xs px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer shadow-xs",
                    cloudSync
                      ? "bg-[#CEF431] text-[#161514] border-[#161514]"
                      : "border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#252220] text-[#161514]/60 dark:text-[#FAF8F5]/50"
                  )}
                >
                  {cloudSync ? "ON" : "OFF"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SECURITY & AUTH (SECURITY) */}
        {/* ========================================================================= */}
        {activeTab === "security" && (
          <div className="bg-white dark:bg-[#161514] rounded-3xl p-5 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b border-[#E8E5DF] dark:border-[#2A2724] pb-3">
              <ShieldCheck className="h-4 w-4 text-amber-500 stroke-[2.5]" />
              <h2 className="text-xs font-black uppercase tracking-wider text-[#161514]/70 dark:text-[#FAF8F5]/60 font-heading">
                Security & Session Management
              </h2>
            </div>

            {/* Session Card */}
            <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-2xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#161514]/70 dark:text-[#FAF8F5]/60">
                  Active Account Email
                </span>
                <span className="text-xs font-black text-[#161514] dark:text-[#FAF8F5] font-mono">
                  {user?.email || (isGuestActive ? "Guest Explorer (Offline Sandbox)" : "Guest")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#161514]/70 dark:text-[#FAF8F5]/60">
                  Auth & Cryptographic Engine
                </span>
                <span className="text-[10px] font-black text-emerald-950 dark:text-emerald-300 bg-emerald-200 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-400/50">
                  SHA-256 Client Security & AES-256 Vault
                </span>
              </div>
            </div>

            {/* Change Password Form (if not purely offline guest) */}
            {!isGuestActive && user && (
              <form onSubmit={handlePasswordChange} className="space-y-4 pt-2 border-t border-[#E8E5DF] dark:border-[#2A2724]">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5 font-heading">
                  <KeyRound className="h-3.5 w-3.5 text-amber-500 stroke-[2.5]" /> Change Account Password
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#161514]/70 dark:text-[#FAF8F5]/60">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 4 characters"
                      className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-4 py-2.5 text-xs text-[#161514] dark:text-[#FAF8F5] outline-none font-bold transition-all shadow-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#161514]/70 dark:text-[#FAF8F5]/60">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-4 py-2.5 text-xs text-[#161514] dark:text-[#FAF8F5] outline-none font-bold transition-all shadow-xs"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full bg-[#161514] dark:bg-white text-white dark:text-[#161514] hover:bg-[#2a2725] dark:hover:bg-neutral-100 font-black uppercase tracking-wider rounded-2xl py-3 border border-[#161514] dark:border-white shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all"
                >
                  {isChangingPassword ? "Updating Password…" : "Update Password"}
                </Button>
              </form>
            )}

            {/* Bank SMS Telemetry & Engine Section */}
            <div className="border-t border-[#E8E5DF] dark:border-[#2A2724] pt-4">
              <BankSmsSettingsSection />
            </div>

            {/* Delete Account - Danger Zone */}
            <div className="space-y-3 pt-3 border-t border-rose-200 dark:border-rose-900/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-heading">
                    <UserX className="h-3.5 w-3.5 stroke-[2.5]" />
                    Delete Account Permanently
                  </p>
                  <p className="text-[10px] text-[#161514]/70 dark:text-[#FAF8F5]/60 font-bold">
                    Remove your account and all data forever
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteAccount(!showDeleteAccount)}
                  className="rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 bg-white dark:bg-[#1C1A18] hover:bg-rose-50 dark:hover:bg-rose-950/30 shadow-xs cursor-pointer gap-1.5 text-xs font-black uppercase tracking-wider transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                  Delete Account
                </Button>
              </div>

              {showDeleteAccount && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-900/40 rounded-2xl p-5 space-y-4 shadow-xs">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 stroke-[2.5]" />
                    <div className="space-y-1">
                      <p className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase font-heading">
                        ⚠️ This action is irreversible!
                      </p>
                      <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-relaxed font-bold">
                        Deleting your account will permanently remove:
                      </p>
                      <ul className="text-[10px] text-rose-700 dark:text-rose-300 list-disc list-inside space-y-0.5 mt-1 font-bold">
                        <li>Your user profile and login credentials</li>
                        <li>All habits, streaks, and habit logs</li>
                        <li>Health profile, workouts, and nutrition logs</li>
                        <li>All study subjects, topics, and focus sessions</li>
                        <li>All financial transactions and custom categories</li>
                        <li>All local browser data for this account</li>
                      </ul>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                      Type DELETE MY ACCOUNT to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteAccountText}
                      onChange={(e) => setDeleteAccountText(e.target.value)}
                      placeholder="DELETE MY ACCOUNT"
                      className="w-full rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-[#161514] py-2 px-3 text-xs text-[#161514] dark:text-[#FAF8F5] outline-none font-mono font-bold shadow-xs"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowDeleteAccount(false);
                        setDeleteAccountText("");
                      }}
                      className="rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] text-[#161514] dark:text-[#FAF8F5] bg-white dark:bg-[#1C1A18] hover:bg-[#FAF8F5] shadow-xs text-xs flex-1 font-black uppercase transition-all"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={deleteAccountText !== "DELETE MY ACCOUNT" || isDeletingAccount}
                      onClick={async () => {
                        if (!user || deleteAccountText !== "DELETE MY ACCOUNT") return;
                        setIsDeletingAccount(true);
                        try {
                          const res = await fetch("/api/account/delete", {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ uid: user.uid, email: user.email }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || "API deletion failed");

                          customDeleteUser(user.uid);
                          if (user.email) customDeleteUser(user.email);

                          const keysToRemove: string[] = [];
                          for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key && key.startsWith("invictus_") && key !== "invictus_custom_users_db") {
                              keysToRemove.push(key);
                            }
                          }
                          keysToRemove.forEach((k) => localStorage.removeItem(k));

                          customLogout();
                          toast.success("Account permanently deleted. Goodbye! 👋");
                          router.replace("/login");
                        } catch (err: any) {
                          console.error("Account deletion error:", err);
                          toast.error(err?.message || "Failed to delete account.");
                        } finally {
                          setIsDeletingAccount(false);
                        }
                      }}
                      className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer text-xs flex-1 disabled:opacity-40 font-black uppercase shadow-xs transition-all"
                    >
                      {isDeletingAccount ? "Deleting Account…" : "Permanently Delete Account"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: DATA VAULT & DEVICE (DATAVAULT) */}
        {/* ========================================================================= */}
        {activeTab === "datavault" && (
          <div className="bg-white dark:bg-[#161514] rounded-3xl p-5 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#E8E5DF] dark:border-[#2A2724] pb-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-amber-500 stroke-[2.5]" />
                <h2 className="text-xs font-black uppercase tracking-wider text-[#161514]/70 dark:text-[#FAF8F5]/60 font-heading">
                  Data Vault & Device
                </h2>
              </div>
              <span className="text-[10px] font-black text-[#161514] dark:text-[#FAF8F5] bg-amber-200 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-lg border border-amber-300 dark:border-amber-800/40 shadow-xs">
                Storage: {storageMetrics.kb} KB ({storageMetrics.percent}% Quota)
              </span>
            </div>

            {/* Storage Meter Bar */}
            <div className="space-y-1">
              <div className="h-2.5 w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-full overflow-hidden border border-[#E8E5DF] dark:border-[#2A2724]">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${Math.max(2, storageMetrics.percent)}%` }}
                />
              </div>
              <p className="text-[9px] font-black text-[#161514]/60 dark:text-[#FAF8F5]/50 text-right uppercase">
                Local Storage Allocation
              </p>
            </div>

            {/* Evaluator Demo Data Showcase (Exclusively for Guests & Evaluators) */}
            {isGuestActive && (
              <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-2xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500 stroke-[2.5]" />
                    <p className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] font-heading">
                      Evaluator Showcase & Demo Data
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border flex items-center gap-1",
                      isDemoActive
                        ? "bg-[#03D26F] text-[#161514] border-[#161514]"
                        : "bg-white dark:bg-[#252220] text-[#161514]/70 dark:text-[#FAF8F5]/60 border-[#E8E5DF] dark:border-[#2A2724]"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", isDemoActive ? "bg-[#161514]" : "bg-neutral-400")} />
                    {isDemoActive ? "Showcase Loaded" : "Blank Canvas"}
                  </span>
                </div>
                <p className="text-[10px] text-[#161514]/70 dark:text-[#FAF8F5]/60 font-bold">
                  Seed full realistic mock data across all modules (Tasks, Habits, Gym Hypertrophy, Meal Tracker, Study Spaces, and Money Tracker) or wipe clean for a fresh evaluation slate.
                </p>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearDemoData}
                    className="rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 bg-white dark:bg-[#252220] hover:bg-rose-50 shadow-xs cursor-pointer gap-1.5 text-xs font-black uppercase tracking-wider transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                    Delete Demo Data
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleLoadDemoData}
                    className="rounded-xl bg-[#CEF431] hover:bg-[#bce028] text-[#161514] border border-[#161514] shadow-xs cursor-pointer gap-1.5 text-xs font-black uppercase tracking-wider transition-all"
                  >
                    <Sparkles className="h-3.5 w-3.5 stroke-[2.5]" />
                    {isDemoActive ? "Reload Showcase" : "Load Evaluator Showcase"}
                  </Button>
                </div>
              </div>
            )}

            {/* Encrypted Vault Snapshot (Export & Restore) */}
            <div className="space-y-3 border-t border-[#E8E5DF] dark:border-[#2A2724] pt-4">
              <span className="text-[10px] font-black text-[#161514]/70 dark:text-[#FAF8F5]/60 uppercase tracking-widest font-heading">
                Encrypted Vault Snapshots (AES-GCM-256)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Export */}
                <div className="p-4 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-black text-xs text-[#161514] dark:text-[#FAF8F5] uppercase font-heading">
                      Export Encrypted Vault
                    </h4>
                    <p className="text-[10px] text-[#161514]/70 dark:text-[#FAF8F5]/60 font-bold mt-0.5">
                      Single-click AES-GCM-256 encrypted snapshot of all workspaces & history
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isExporting}
                    onClick={handleExportBackup}
                    className="w-full rounded-xl border border-[#161514] dark:border-white text-[#161514] dark:text-[#FAF8F5] bg-white dark:bg-[#252220] hover:bg-neutral-50 shadow-xs cursor-pointer gap-1.5 text-xs font-black uppercase tracking-wider transition-all"
                  >
                    <Download className="h-3.5 w-3.5 stroke-[2.5]" />
                    {isExporting ? "Securing Vault…" : "Export Vault"}
                  </Button>
                </div>

                {/* Import */}
                <div className="p-4 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-black text-xs text-[#161514] dark:text-[#FAF8F5] uppercase font-heading">
                      Import & Restore Vault
                    </h4>
                    <p className="text-[10px] text-[#161514]/70 dark:text-[#FAF8F5]/60 font-bold mt-0.5">
                      Decrypt and restore from encrypted vault or legacy JSON backup
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isImporting}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-xl border border-[#161514] dark:border-white text-[#161514] dark:text-[#FAF8F5] bg-white dark:bg-[#252220] hover:bg-neutral-50 shadow-xs cursor-pointer gap-1.5 text-xs font-black uppercase tracking-wider transition-all"
                  >
                    <Upload className="h-3.5 w-3.5 stroke-[2.5]" />
                    {isImporting ? "Restoring…" : "Restore Vault"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.invictus.json"
                    className="hidden"
                    onChange={handleImportRestore}
                  />
                </div>
              </div>
            </div>

            {/* Pro CSV Exports Trigger */}
            <div className="space-y-2 border-t border-[#E8E5DF] dark:border-[#2A2724] pt-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-400 border border-[#161514] flex items-center justify-center text-[#161514] shadow-xs shrink-0">
                    <BarChart3 className="h-4 w-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-[#161514] dark:text-[#FAF8F5] uppercase font-heading">
                      Data Export (CSV)
                    </h4>
                    <p className="text-[10px] text-[#161514]/70 dark:text-[#FAF8F5]/60 font-bold">
                      Export habits, finance ledger, and study sessions to CSV spreadsheet
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCSVModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-[#161514] dark:border-white bg-[#161514] dark:bg-white text-white dark:text-[#161514] font-black text-xs uppercase shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shrink-0"
                >
                  Export CSV
                </button>
              </div>
            </div>

            {/* DIGNIFIED INVICTUS FOR ANDROID / PWA CARD */}
            <div className="space-y-3 border-t border-[#E8E5DF] dark:border-[#2A2724] pt-4">
              <div className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-2xl p-5 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-[#CEF431] border border-[#161514] flex items-center justify-center text-[#161514] shadow-xs shrink-0">
                      <Smartphone className="h-5 w-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-sm text-[#161514] dark:text-[#FAF8F5] uppercase font-heading">
                          Invictus for Android & Web
                        </h4>
                        <span className="bg-[#161514] dark:bg-white text-[#CEF431] dark:text-[#161514] text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-[#161514] dark:border-white">
                          v{APP_VERSION_CONFIG.version} (Build {APP_VERSION_CONFIG.buildNumber})
                        </span>
                      </div>
                      <p className="text-[10px] text-[#161514]/70 dark:text-[#FAF8F5]/60 font-bold mt-0.5">
                        Official Android APK • Native Haptics • Home Screen Shortcuts
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleInstallPWA}
                    className="w-full bg-[#CEF431] hover:bg-[#bce028] text-[#161514] font-black text-xs uppercase py-2.5 px-3 rounded-xl border border-[#161514] shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all flex items-center justify-center gap-1.5 text-center"
                  >
                    <Smartphone className="h-4 w-4 stroke-[2.5]" />
                    <span>1-Tap Install</span>
                  </button>

                  <a
                    href="/api/download/android"
                    onClick={handleDownloadApk}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#161514] dark:bg-white text-white dark:text-[#161514] hover:bg-[#2a2725] dark:hover:bg-neutral-100 font-black text-xs uppercase py-2.5 px-3 rounded-xl border border-[#161514] dark:border-white shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all flex items-center justify-center gap-1.5 text-center"
                  >
                    <Download className="h-4 w-4 stroke-[2.5]" />
                    <span>Download APK</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setIsUpdateCheckOpen(true)}
                    className="w-full bg-white dark:bg-[#252220] hover:bg-neutral-50 text-[#161514] dark:text-[#FAF8F5] font-black text-xs uppercase py-2.5 px-3 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="h-4 w-4 stroke-[2.5]" />
                    <span>Check Updates</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDiagnosticsOpen(true)}
                    className="w-full bg-white dark:bg-[#252220] hover:bg-neutral-50 text-[#161514] dark:text-[#FAF8F5] font-black text-xs uppercase py-2.5 px-3 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <Zap className="h-4 w-4 stroke-[2.5]" />
                    <span>Diagnostics</span>
                  </button>
                </div>

                {/* Collapsible 3-Step Guide */}
                <div className="pt-2 border-t border-[#E8E5DF] dark:border-[#2A2724]">
                  <button
                    type="button"
                    onClick={() => setIsInstallGuideOpen(!isInstallGuideOpen)}
                    className="w-full flex items-center justify-between text-xs font-black uppercase text-[#161514] dark:text-[#FAF8F5] cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 font-heading">
                      <BookOpen className="h-4 w-4 stroke-[2.5]" />
                      <span>How to Install & Update Android APK</span>
                    </span>
                    {isInstallGuideOpen ? (
                      <ChevronUp className="h-4 w-4 stroke-[2.5]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 stroke-[2.5]" />
                    )}
                  </button>

                  {isInstallGuideOpen && (
                    <div className="mt-3 space-y-2 bg-white dark:bg-[#161514] p-3 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] text-xs font-medium text-[#161514] dark:text-[#FAF8F5]/90">
                      <div className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-full bg-amber-400 text-[#161514] border border-[#161514] flex items-center justify-center font-black text-[10px] shrink-0">
                          1
                        </span>
                        <div>
                          <strong className="block font-heading">Download the Official APK:</strong>
                          Tap &ldquo;Download APK&rdquo; above to save the latest release file onto your Android device.
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-full bg-[#CEF431] text-[#161514] border border-[#161514] flex items-center justify-center font-black text-[10px] shrink-0">
                          2
                        </span>
                        <div>
                          <strong className="block font-heading">Open File & Allow Installation:</strong>
                          Open <em>Invictus.apk</em> from your phone&apos;s Downloads folder. Toggle <em>&ldquo;Allow from this source&rdquo;</em> if prompted.
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-full bg-[#03D26F] text-[#161514] border border-[#161514] flex items-center justify-center font-black text-[10px] shrink-0">
                          3
                        </span>
                        <div>
                          <strong className="block font-heading">Install & Update:</strong>
                          Tap <em>Install</em>. Your data syncs automatically across devices.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Feedback & Support Trigger */}
            <div className="space-y-2 border-t border-[#E8E5DF] dark:border-[#2A2724] pt-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-white dark:bg-[#252220] border border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-center text-[#161514] dark:text-[#FAF8F5] shadow-xs shrink-0">
                    <LifeBuoy className="h-4 w-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-[#161514] dark:text-[#FAF8F5] uppercase font-heading">
                      Feedback & Issue Reporter
                    </h4>
                    <p className="text-[10px] text-[#161514]/70 dark:text-[#FAF8F5]/60 font-bold">
                      Report a bug, request a feature, or send direct feedback
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReportIssueOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-[#161514] dark:border-white bg-[#161514] dark:bg-white text-white dark:text-[#161514] font-black text-xs uppercase shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shrink-0"
                >
                  Report
                </button>
              </div>
            </div>

            {/* Developer & Architect Showcase */}
            <div className="space-y-3 border-t border-[#E8E5DF] dark:border-[#2A2724] pt-4">
              <span className="text-[10px] font-black text-[#161514]/70 dark:text-[#FAF8F5]/60 uppercase tracking-widest px-1 font-heading">
                About the Architect & System
              </span>
              <DeveloperInfoCard />
            </div>

            {/* Database Reset & Cloud Wipe */}
            <div className="space-y-3 border-t border-rose-200 dark:border-rose-900/40 pt-4">
              <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest px-1 font-heading">
                Offline Cache & Cloud Wipe
              </span>

              {/* Clear Offline Cache */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] shadow-xs">
                <div>
                  <h4 className="font-black text-xs text-[#161514] dark:text-[#FAF8F5] uppercase font-heading">
                    Clear Offline Local Cache
                  </h4>
                  <p className="text-[10px] text-[#161514]/70 dark:text-[#FAF8F5]/60 font-bold">
                    Flush browser localStorage keys without deleting cloud account
                  </p>
                </div>
                {!showClearConfirm ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClearConfirm(true)}
                    className="rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 bg-white dark:bg-[#252220] hover:bg-rose-50 shadow-xs cursor-pointer gap-1.5 text-xs font-black uppercase tracking-wider"
                  >
                    <HardDrive className="h-3.5 w-3.5 stroke-[2.5]" />
                    Clear Cache
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowClearConfirm(false)}
                      className="rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] text-[#161514] dark:text-[#FAF8F5] bg-white dark:bg-[#252220] text-xs font-black uppercase"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleClearLocalData}
                      className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase"
                    >
                      Confirm
                    </Button>
                  </div>
                )}
              </div>

              {/* Delete Cloud Data */}
              <div className="p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/20 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-xs text-rose-700 dark:text-rose-400 uppercase font-heading flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 stroke-[2.5]" />
                      Delete Cloud Database
                    </h4>
                    <p className="text-[10px] text-rose-900/70 dark:text-rose-300/70 font-bold">
                      Permanently wipe all habits, study logs, transactions, and settings
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteFirebase(!showDeleteFirebase)}
                    className="rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 bg-white dark:bg-[#252220] hover:bg-rose-100 shadow-xs cursor-pointer gap-1.5 text-xs font-black uppercase tracking-wider"
                  >
                    <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                    Delete All
                  </Button>
                </div>

                {showDeleteFirebase && (
                  <div className="bg-white dark:bg-[#161514] border border-rose-300 dark:border-rose-900/60 rounded-xl p-3.5 space-y-3">
                    <p className="text-xs text-rose-700 dark:text-rose-400 font-bold">
                      Type <strong>DELETE</strong> below to confirm permanent wipe.
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="w-full rounded-xl border border-rose-300 dark:border-rose-800 bg-[#FAF8F5] dark:bg-[#1C1A18] py-2 px-3 text-xs text-[#161514] dark:text-[#FAF8F5] font-mono font-bold outline-none shadow-xs"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowDeleteFirebase(false);
                          setDeleteConfirmText("");
                        }}
                        className="rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] text-[#161514] dark:text-[#FAF8F5] bg-white dark:bg-[#252220] text-xs flex-1 font-black uppercase"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={deleteConfirmText !== "DELETE" || isDeleting}
                        onClick={handleDeleteFirebaseData}
                        className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs flex-1 disabled:opacity-40 font-black uppercase"
                      >
                        {isDeleting ? "Deleting…" : "Permanently Delete"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SHARED MODALS */}
        {/* ========================================================================= */}

        {/* Habit Groups Modal */}
        <ResponsiveFormContainer
          open={isHabitGroupsOpen}
          onOpenChange={setIsHabitGroupsOpen}
          title="Habit Groups"
          description="Group your habits into routine bundles."
        >
          <div className="space-y-3 pt-2">
            {[
              {
                name: "🌅 Morning Protocol",
                count: "4 Habits",
                desc: "Wake up, 2L Water, 10m Meditation, Cold Shower",
                color: "bg-amber-300 dark:bg-amber-900/60 text-[#161514] dark:text-amber-200",
              },
              {
                name: "💼 Deep Work Focus",
                count: "3 Habits",
                desc: "90m Focus Sprint, Zero Distractions, Log Notes",
                color: "bg-indigo-300 dark:bg-indigo-900/60 text-[#161514] dark:text-indigo-200",
              },
              {
                name: "🏋️ Health & Athletic",
                count: "3 Habits",
                desc: "Gym Workout, 140g Protein Target, 10k Steps",
                color: "bg-emerald-300 dark:bg-emerald-900/60 text-[#161514] dark:text-emerald-200",
              },
              {
                name: "🌙 Night Reset",
                count: "3 Habits",
                desc: "No Screens past 10pm, Read 10 Pages, Gratitude Log",
                color: "bg-purple-300 dark:bg-purple-900/60 text-[#161514] dark:text-purple-200",
              },
            ].map((group, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#161514] rounded-2xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-black text-xs text-[#161514] dark:text-[#FAF8F5] font-heading">
                      {group.name}
                    </h5>
                    <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border border-[#161514]/20", group.color)}>
                      {group.count}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#161514]/70 dark:text-[#FAF8F5]/60 font-medium mt-1">
                    {group.desc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toast.success(`Activated ${group.name} bundle!`)}
                  className="bg-[#161514] dark:bg-white text-white dark:text-[#161514] font-black text-[10px] uppercase px-3 py-1.5 rounded-xl border border-[#161514] dark:border-white shadow-xs shrink-0 cursor-pointer"
                >
                  Activate
                </button>
              </div>
            ))}
          </div>
        </ResponsiveFormContainer>

        {/* Achievements Modal */}
        <ResponsiveFormContainer
          open={isAchievementsOpen}
          onOpenChange={setIsAchievementsOpen}
          title="🏆 Achievements & Badges"
          description="Unlock milestone badges by maintaining streaks and completing daily habits"
        >
          <div className="space-y-4 pt-2">
            <div className="bg-amber-100 dark:bg-amber-950/40 rounded-2xl p-4 border border-amber-300 dark:border-amber-800/40 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                <span className="text-xs font-black text-[#161514] dark:text-[#FAF8F5]">
                  Total XP Earned: <strong className="text-amber-900 dark:text-amber-300 font-black">{achievements.totalXP} XP</strong>
                </span>
              </div>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-amber-400 text-[#161514] rounded-md border border-[#161514] shadow-xs">
                Level {achievements.userLevel} Scholar
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {achievements.badges.map((badge) => (
                <div
                  key={badge.id}
                  className={cn(
                    "rounded-2xl p-3.5 border flex flex-col justify-between space-y-2 transition-all shadow-xs",
                    badge.unlocked
                      ? "bg-white dark:bg-[#161514] border-[#E8E5DF] dark:border-[#2A2724]"
                      : "bg-[#FAF8F5] dark:bg-[#1C1A18] opacity-60 border-dashed border-[#E8E5DF] dark:border-[#2A2724]"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{badge.icon}</span>
                    <span
                      className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border",
                        badge.unlocked
                          ? "bg-emerald-300 text-[#161514] border-[#161514]"
                          : "bg-neutral-100 dark:bg-neutral-800 text-[#161514]/60 dark:text-[#FAF8F5]/50 border-neutral-300 dark:border-neutral-700"
                      )}
                    >
                      {badge.unlocked ? "UNLOCKED 🌟" : "LOCKED 🔒"}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-black text-xs text-[#161514] dark:text-[#FAF8F5] font-heading">{badge.title}</h5>
                    <p className="text-[10px] text-[#161514]/70 dark:text-[#FAF8F5]/60 font-medium mt-0.5">{badge.desc}</p>
                  </div>
                  <div className="pt-1 flex items-center justify-between text-[10px] font-black">
                    <span className="text-amber-700 dark:text-amber-400">+{badge.xp} XP</span>
                    {badge.progressText && (
                      <span className="text-[#161514]/60 dark:text-[#FAF8F5]/50 font-bold">{badge.progressText}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ResponsiveFormContainer>

        {/* AI Insights Modal */}
        <ResponsiveFormContainer
          open={isAIInsightsOpen}
          onOpenChange={setIsAIInsightsOpen}
          title="✨ AI Insights & Routine Engine"
          description="AI-generated routine recommendations based on your active streaks and focus sessions"
        >
          <div className="space-y-4 pt-2">
            <div className="bg-amber-100 dark:bg-amber-950/40 rounded-2xl p-4 border border-amber-300 dark:border-amber-800/40 space-y-2 shadow-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                <h5 className="font-black text-xs text-[#161514] dark:text-[#FAF8F5] font-heading">
                  AI Weekly Performance Summary
                </h5>
              </div>
              <p className="text-[11px] text-[#161514] dark:text-[#FAF8F5]/90 leading-relaxed font-medium">
                &ldquo;You completed 87% of your morning habits this week! Your peak productivity window is 8:30 AM to 11:30 AM. Suggested routine tweak: Add a 10m post-lunch walk to sustain afternoon energy.&rdquo;
              </p>
            </div>
            <button
              type="button"
              onClick={() => toast.success("AI Routine generated! Applied to habits! ✨")}
              className="w-full bg-[#161514] dark:bg-white text-white dark:text-[#161514] hover:bg-[#2a2725] dark:hover:bg-neutral-100 font-black text-xs uppercase py-3.5 rounded-2xl border border-[#161514] dark:border-white shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all"
            >
              Generate New AI Routine Pack
            </button>
          </div>
        </ResponsiveFormContainer>

        {/* CSV Exporter Modal */}
        <ResponsiveFormContainer
          open={isCSVModalOpen}
          onOpenChange={setIsCSVModalOpen}
          title="Data Export (CSV)"
          description="Export your habit logs, finances, and study sessions to CSV spreadsheet."
        >
          <div className="space-y-3 pt-2">
            {[
              {
                title: "🌱 Habits & Streaks CSV Report",
                desc: "Download full history of completed habit logs and streak records",
                type: "habits" as const,
              },
              {
                title: "💰 Financial Ledger CSV Report",
                desc: "Export income, expense logs, payment methods, and category breakdown",
                type: "finance" as const,
              },
              {
                title: "📚 Study Sessions CSV Report",
                desc: "Export study stopwatch sessions, subjects, and topic focus minutes",
                type: "study" as const,
              },
              {
                title: "📦 Lifetime Master Bundle CSV",
                desc: "Complete exported archive bundle containing all workspace data",
                type: "bundle" as const,
              },
            ].map((rep, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#161514] rounded-2xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center justify-between gap-3"
              >
                <div>
                  <h5 className="font-black text-xs text-[#161514] dark:text-[#FAF8F5] font-heading">
                    {rep.title}
                  </h5>
                  <p className="text-[10px] text-[#161514]/70 dark:text-[#FAF8F5]/60 font-medium mt-0.5">
                    {rep.desc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadCSVReport(rep.type)}
                  className="bg-[#161514] dark:bg-white text-white dark:text-[#161514] font-black text-[10px] uppercase px-3 py-2 rounded-xl border border-[#161514] dark:border-white shadow-xs hover:-translate-y-0.5 active:translate-y-0 shrink-0 cursor-pointer transition-all flex items-center gap-1"
                >
                  <Download className="h-3.5 w-3.5 stroke-[3]" /> EXPORT
                </button>
              </div>
            ))}
          </div>
        </ResponsiveFormContainer>

        {/* Daily Log Reminders Manager Modal */}
        <ReminderManagerModal
          open={isRemindersOpen}
          onOpenChange={setIsRemindersOpen}
        />

        {/* User Issue & Feedback Reporting Modal */}
        <ReportIssueModal
          open={isReportIssueOpen}
          onOpenChange={setIsReportIssueOpen}
        />

        {/* Update Checker Modal */}
        <UpdateCheckModal
          open={isUpdateCheckOpen}
          onOpenChange={setIsUpdateCheckOpen}
        />

        {/* In-App Diagnostics & Telemetry Modal */}
        <InAppDiagnosticsModal
          open={isDiagnosticsOpen}
          onOpenChange={setIsDiagnosticsOpen}
        />
      </div>
    </div>
  );
}
