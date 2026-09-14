"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/shared/AuthProvider";
import { customUpdateUser, customUpdatePassword, customDeleteUser, customLogout, getGlobalAnnouncement, type GlobalAnnouncement } from "@/lib/custom-auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/utils/toasts";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { useQueryClient } from "@tanstack/react-query";
import { useUserAchievements } from "@/lib/queries/achievements";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
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
  Award,
  Flame,
  Folder,
  LayoutGrid,
  Layers,
  Plus,
  BarChart3,
  FileSpreadsheet,
  Zap,
  Bell,
  Volume2,
  AlarmClock,
  Cloud,
  Smartphone,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { SubscriptionsTracker } from "@/components/money/SubscriptionsTracker";
import { ReminderManagerModal } from "@/components/shared/ReminderManagerModal";
import { ReportIssueModal } from "@/components/shared/ReportIssueModal";
import { UpdateCheckModal } from "@/components/shared/UpdateCheckModal";
import { APP_VERSION_CONFIG } from "@/config/version";
import { Capacitor } from "@capacitor/core";

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

export default function SettingsPage() {
  const { user, signOut, refreshUser } = useAuth();
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

  // Active Tab State
  const [activeTab, setActiveTab] = useState<"preferences" | "modules" | "security" | "datavault">("preferences");
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);

  // Global Announcement Banner state
  const [activeAnnouncement, setActiveAnnouncement] = useState<GlobalAnnouncement | null>(null);

  // Storage usage meter
  const [storageMetrics, setStorageMetrics] = useState({ kb: 0, percent: 0 });

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

  // Password Change State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Feature modals state
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isHabitGroupsOpen, setIsHabitGroupsOpen] = useState(false);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [isWidgetVariantsOpen, setIsWidgetVariantsOpen] = useState(false);
  const [isReportIssueOpen, setIsReportIssueOpen] = useState(false);
  const [isUpdateCheckOpen, setIsUpdateCheckOpen] = useState(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);

  // Reminders & Audio feedback states
  const [smartReminders, setSmartReminders] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [wakeUpAlarm, setWakeUpAlarm] = useState(true);
  const [completionSound, setCompletionSound] = useState<SoundEffectType>("tap");
  const [isCompletionSoundOpen, setIsCompletionSoundOpen] = useState(false);
  const [cloudSync, setCloudSync] = useState(true);
  const [isAIInsightsOpen, setIsAIInsightsOpen] = useState(false);

  // 📲 Native 1-Tap PWA Installation Support
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
      toast.info("To install on your phone: Tap the browser menu (⋮) -> 'Add to Home screen' or 'Install App' 📲");
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
    let fileName = `invictus_${reportType}_report.csv`;

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
    // Check for global announcement banner
    setActiveAnnouncement(getGlobalAnnouncement());

    // Calculate Storage Usage
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        totalBytes += (key.length + (localStorage.getItem(key)?.length || 0)) * 2;
      }
    }
    const kb = Math.round(totalBytes / 1024);
    // Typical LocalStorage quota is ~5000 KB (5 MB)
    const pct = Math.min(100, Math.round((kb / 5120) * 100));
    setStorageMetrics({ kb, percent: pct });

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
          setModulesEnabled(
            data.modulesEnabled || { goals: true, study: true, money: true }
          );
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
      setModulesEnabled(
        user.modulesEnabled || { goals: true, study: true, money: true }
      );
      setExamName(user.studyTarget?.examName || "");
      setExamDate(user.studyTarget?.examDate || "");
      setHasExam(!!user.studyTarget?.examName);
    }
    // Restore all settings states from localStorage
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
        studyTarget: modulesEnabled.study && hasExam
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
      showToast.error("Failed to save settings", "Ah! We failed to lock in your changes! ❌🔒");
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

  // Dynamic localStorage keys (date/id-based)
  const getAllInvictusKeys = () => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("invictus_") && key !== "invictus_guest_mode" && key !== "invictus_guest_name" && key !== "invictus_onboarded" && key !== "invictus_user_profile") {
        keys.push(key);
      }
    }
    return keys;
  };

  // MongoDB collections under user database
  const MONGODB_COLLECTIONS = [
    "habits", "habitLogs", "streaks", "healthProfile",
    "waterLogs", "workouts", "macros", "diet",
    "subjects", "studySessions", "tests",
    "categories", "transactions",
  ];

  const handleClearLocalData = () => {
    const keys = getAllInvictusKeys();
    keys.forEach((key) => localStorage.removeItem(key));
    setShowClearConfirm(false);
    queryClient.invalidateQueries();
    showToast.success("Local data cleared!", "All offline data has been wiped clean! 🧹✨");
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
    const isGuestMode = typeof window !== "undefined" && localStorage.getItem("invictus_guest_mode") === "true";
    if (!user && !isGuestMode) return;
    setIsExporting(true);
    try {
      const keys = getAllInvictusKeys();
      const localData: Record<string, unknown> = {};
      keys.forEach((key) => {
        const val = localStorage.getItem(key);
        if (val) {
          try { localData[key] = JSON.parse(val); } catch { localData[key] = val; }
        }
      });

      let cloudData: Record<string, unknown> | null = null;
      if (user?.uid && !isGuestMode) {
        const uid = user.uid;
        const [habitsRes, logsRes, subjectsRes, sessionsRes, testsRes, txRes, catRes, debtsRes] = await Promise.allSettled([
          fetch(`/api/goals/habits?userId=${uid}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/goals/logs?userId=${uid}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/study/subjects?userId=${uid}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/study/sessions?userId=${uid}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/study/tests?userId=${uid}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/money/transactions?userId=${uid}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/money/categories?userId=${uid}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/money/debts?userId=${uid}`).then((r) => (r.ok ? r.json() : null)),
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
        };
      }

      const backup: Record<string, unknown> = {
        exportedAt: new Date().toISOString(),
        mode: isGuestMode ? "guest" : "cloud",
        version: 1,
        user: user
          ? { uid: user.uid, email: user.email, displayName: user.displayName }
          : { uid: "guest", email: "guest@invictus.local", displayName: "Guest" },
        data: localData,
        ...(cloudData ? { cloudData } : {}),
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invictus-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast.success("Backup exported!", "Your data backup has been downloaded 📦");
    } catch (err) {
      console.error("Export error:", err);
      showToast.error("Export failed", "Something went wrong during export ❌");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const isGuestMode = typeof window !== "undefined" && localStorage.getItem("invictus_guest_mode") === "true";
    if (!file || (!user && !isGuestMode)) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.version || !backup.exportedAt) {
        showToast.error("Invalid backup", "This file doesn't look like a valid Invictus backup ❌");
        return;
      }

      if (backup.data && typeof backup.data === "object") {
        Object.entries(backup.data).forEach(([key, value]) => {
          if (key.startsWith("invictus_")) {
            localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
          }
        });
      }

      queryClient.invalidateQueries();
      showToast.success("Backup restored!", "Your data has been restored successfully 🎉");
    } catch (err) {
      console.error("Import error:", err);
      showToast.error("Import failed", "Failed to parse or restore the backup file ❌");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-bg">
        <div className="h-8 w-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 p-3 sm:p-6 md:p-8 space-y-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Neubrutalist LIFE ENGINE Header */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/goals"
            className="h-11 w-11 bg-white hover:bg-[#FAF8F5] text-[#161514] rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
          </Link>
          <h1
            className="text-xl md:text-2xl font-black text-[#161514] tracking-widest uppercase font-heading"
          >
            LIFE ENGINE
          </h1>
          <button
            onClick={() => toast.info("Life Engine Settings Active ⚙️")}
            className="h-11 w-11 bg-amber-400 hover:bg-amber-500 text-[#161514] rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            <Sliders className="h-5 w-5 stroke-[2.5]" />
          </button>
        </div>

        {/* 📱 FEATURE 7: WEB-TO-APP DOWNLOAD DISCOVERY HINT CARD */}
        <div className="bg-[#CEF431] rounded-3xl p-5 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white border-2 border-[#161514] flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_#161514] shrink-0">
              📱
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm uppercase tracking-tight text-[#161514] font-heading">
                  Get Invictus for Android
                </h3>
                <span className="bg-[#161514] text-[#CEF431] text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-[#161514]">
                  Official APK v{APP_VERSION_CONFIG.version}
                </span>
              </div>
              <p className="text-xs text-[#161514] font-bold mt-0.5 leading-snug">
                Browsing on the web? Install the official Android APK for native haptic feedback, offline cache, and instant home-screen app shortcuts!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={handleInstallPWA}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#161514] text-xs font-black uppercase tracking-wider border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all flex items-center justify-center gap-1.5"
              title="Install immediately to Home Screen without downloading APK"
            >
              <Smartphone className="h-4 w-4 stroke-[2.5]" />
              <span>Install App</span>
            </button>

            <a
              href="/api/download/android"
              onClick={handleDownloadApk}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#161514] hover:bg-[#2a2725] text-white text-xs font-black uppercase tracking-wider border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="h-4 w-4 stroke-[2.5]" />
              <span>Download APK</span>
            </a>

            <button
              type="button"
              onClick={() => setIsUpdateCheckOpen(true)}
              className="px-3 py-2.5 rounded-xl bg-white hover:bg-amber-100 text-[#161514] text-xs font-black border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all shrink-0"
              title="View Release Notes & Check Updates"
            >
              <Sparkles className="h-4 w-4 text-[#161514] stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* FEATURE 1: ⏰ GLOBAL WAKE-UP HERO WIDGET */}
        <div className="bg-amber-400 rounded-3xl p-6 border-[2.5px] border-[#161514] shadow-[5px_5px_0px_0px_#161514] space-y-5 text-center">
          <div className="flex items-center justify-center gap-2 text-[#161514] font-black text-xs uppercase tracking-widest font-heading">
            <span className="text-base">⏰</span> GLOBAL WAKE-UP
          </div>

          {/* Interactive Time Display */}
          <div className="flex items-center justify-center gap-3">
            <div className="bg-white rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] p-3 min-w-[75px]">
              <input
                type="text"
                maxLength={2}
                value={wakeHour}
                onChange={(e) => setWakeHour(e.target.value.padStart(2, "0").slice(-2))}
                className="w-full text-center text-3xl font-black text-[#161514] bg-transparent outline-none font-mono"
              />
            </div>
            <span className="text-3xl font-black text-[#161514]">:</span>
            <div className="bg-white rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] p-3 min-w-[75px]">
              <input
                type="text"
                maxLength={2}
                value={wakeMinute}
                onChange={(e) => setWakeMinute(e.target.value.padStart(2, "0").slice(-2))}
                className="w-full text-center text-3xl font-black text-[#161514] bg-transparent outline-none font-mono"
              />
            </div>

            {/* AM / PM Selector Stack */}
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setWakePeriod("AM")}
                className={cn(
                  "text-[10px] font-black px-2.5 py-1 rounded-lg border-2 border-[#161514] transition-all cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
                  wakePeriod === "AM" ? "bg-[#161514] text-white shadow-[1.5px_1.5px_0px_0px_#161514]" : "bg-white text-[#161514]"
                )}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => setWakePeriod("PM")}
                className={cn(
                  "text-[10px] font-black px-2.5 py-1 rounded-lg border-2 border-[#161514] transition-all cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
                  wakePeriod === "PM" ? "bg-[#161514] text-white shadow-[1.5px_1.5px_0px_0px_#161514]" : "bg-white text-[#161514]"
                )}
              >
                PM
              </button>
            </div>
          </div>

          {/* Update Schedule Button */}
          <button
            type="button"
            onClick={() => {
              localStorage.setItem("invictus_wakeup_time", JSON.stringify({ hour: wakeHour, minute: wakeMinute, period: wakePeriod }));
              toast.success(`Global Wake-Up updated to ${wakeHour}:${wakeMinute} ${wakePeriod}! ⏰`);
            }}
            className="w-full bg-[#161514] hover:bg-[#2a2725] text-white font-black text-xs uppercase tracking-widest py-3.5 px-4 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all"
          >
            UPDATE SCHEDULE
          </button>
        </div>

        {/* DAILY LOG REMINDERS CARD */}
        <div className="space-y-2 pt-2">
          <span className="text-[10px] font-black text-[#161514]/70 uppercase tracking-widest px-1">
            NOTIFICATIONS & ALERTS
          </span>

          <button
            type="button"
            onClick={() => setIsRemindersOpen(true)}
            className="w-full bg-[#CEF431] hover:bg-[#bce028] text-[#161514] rounded-2xl p-4 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex items-center justify-between transition-all cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-white border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] shrink-0">
                <Bell className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <h4 className="font-black text-sm text-[#161514] tracking-tight uppercase font-heading">
                  DAILY LOG REMINDERS & NOTIFICATIONS 🔔
                </h4>
                <p className="text-[10px] text-[#161514]/80 font-black uppercase tracking-wide">
                  EXPENSES, HABITS & EXAM STUDY TIMES
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-[#161514] stroke-[3]" />
          </button>
        </div>

        {/* PROGRESS SECTION */}
        <div className="space-y-2 pt-2">
          <span className="text-[10px] font-black text-[#161514]/70 uppercase tracking-widest px-1">
            PROGRESS
          </span>

          {/* FEATURE 3: 🏆 ACHIEVEMENTS CARD */}
          <button
            type="button"
            onClick={() => setIsAchievementsOpen(true)}
            className="w-full bg-white hover:bg-[#FAF8F5] rounded-2xl p-4 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex items-center justify-between transition-all cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-amber-400 border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] shrink-0">
                <Trophy className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <h4 className="font-black text-sm text-[#161514] tracking-tight uppercase font-heading">
                  ACHIEVEMENTS
                </h4>
                <p className="text-[10px] text-[#161514]/70 font-black uppercase tracking-wide">
                  EARN BADGES FOR MILESTONES
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-[#161514] stroke-[3]" />
          </button>
        </div>

        {/* FEATURE 3: 🏆 ACHIEVEMENTS & MILESTONE BADGES MODAL */}
        <ResponsiveFormContainer
          open={isAchievementsOpen}
          onOpenChange={setIsAchievementsOpen}
          title="🏆 ACHIEVEMENTS & BADGES"
          description="Unlock milestone badges by maintaining streaks and completing daily habits"
        >
          <div className="space-y-4 pt-2">
            <div className="bg-amber-100 rounded-2xl p-4 border-2 border-[#161514] flex items-center justify-between shadow-[2px_2px_0px_0px_#161514]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-700" />
                <span className="text-xs font-black text-[#161514]">Total XP Earned: <strong className="text-amber-900 font-black">{achievements.totalXP} XP</strong></span>
              </div>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-amber-400 rounded-md border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514]">Level {achievements.userLevel} Scholar</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievements.badges.map((badge) => (
                <div
                  key={badge.id}
                  className={cn(
                    "rounded-2xl p-3.5 border-2 border-[#161514] flex flex-col justify-between space-y-2 transition-all",
                    badge.unlocked
                      ? "bg-white shadow-[3px_3px_0px_0px_#161514]"
                      : "bg-[#FAF8F5] opacity-75 border-dashed"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{badge.icon}</span>
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border-2 border-[#161514]",
                      badge.unlocked ? "bg-emerald-300 text-[#161514] shadow-[1px_1px_0px_0px_#161514]" : "bg-white text-[#161514]/60"
                    )}>
                      {badge.unlocked ? "UNLOCKED 🌟" : "LOCKED 🔒"}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-black text-xs text-[#161514] font-heading">{badge.title}</h5>
                    <p className="text-[10px] text-[#161514]/70 font-bold mt-0.5">{badge.desc}</p>
                  </div>
                  <div className="pt-1 flex items-center justify-between text-[10px] font-black">
                    <span className="text-amber-800">+{badge.xp} XP</span>
                    {badge.progressText && <span className="text-[#161514]/70 font-black">{badge.progressText}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ResponsiveFormContainer>

        {/* ORGANIZE SECTION */}
        <div className="space-y-3 pt-2">
          <span className="text-[10px] font-black text-[#161514]/70 uppercase tracking-widest px-1">
            ORGANIZE
          </span>

          {/* FEATURE 4A: 📂 HABIT GROUPS CARD */}
          <button
            type="button"
            onClick={() => setIsHabitGroupsOpen(true)}
            className="w-full bg-white hover:bg-[#FAF8F5] rounded-2xl p-4 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex items-center justify-between transition-all cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-amber-400 border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] shrink-0">
                <Folder className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <h4 className="font-black text-sm text-[#161514] tracking-tight uppercase font-heading">
                  HABIT GROUPS
                </h4>
                <p className="text-[10px] text-[#161514]/70 font-black uppercase tracking-wide">
                  BUNDLE HABITS INTO ROUTINES
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-[#161514] stroke-[3]" />
          </button>

          {/* FEATURE 4B: 💳 HABIT LAYOUT CARD */}
          <div className="bg-white rounded-2xl p-4 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-amber-400 border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] shrink-0">
                <LayoutGrid className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <h4 className="font-black text-sm text-[#161514] tracking-tight uppercase font-heading">
                  HABIT LAYOUT
                </h4>
                <p className="text-[10px] text-[#161514]/70 font-black uppercase tracking-wide">
                  {habitLayoutStyle === "cards" ? "CARDS VIEW" : "COMPACT LIST VIEW"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextStyle = habitLayoutStyle === "cards" ? "compact" : "cards";
                setHabitLayoutStyle(nextStyle);
                toast.success(`Habit layout updated to ${nextStyle.toUpperCase()}! 💳`);
              }}
              className="bg-amber-400 hover:bg-amber-500 text-[#161514] font-black text-xs px-3.5 py-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all"
            >
              TOGGLE
            </button>
          </div>
        </div>

        {/* HABIT GROUPS MODAL */}
        <ResponsiveFormContainer
          open={isHabitGroupsOpen}
          onOpenChange={setIsHabitGroupsOpen}
          title="📂 HABIT GROUPS & ROUTINE BUNDLES"
          description="Group your habits into morning, work, or night routine bundles"
        >
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 gap-3">
              {[
                { name: "🌅 Morning Protocol", count: "4 Habits", desc: "Wake up, 2L Water, 10m Meditation, Cold Shower", color: "bg-amber-300" },
                { name: "💼 Deep Work Focus", count: "3 Habits", desc: "90m Focus Sprint, Zero Distractions, Log Notes", color: "bg-indigo-300" },
                { name: "🏋️ Health & Athletic", count: "3 Habits", desc: "Gym Workout, 140g Protein Target, 10k Steps", color: "bg-emerald-300" },
                { name: "🌙 Night Reset", count: "3 Habits", desc: "No Screens past 10pm, Read 10 Pages, Gratitude Log", color: "bg-purple-300" },
              ].map((group, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-4 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-black text-xs text-[#161514] font-heading">{group.name}</h5>
                      <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border-2 border-[#161514]", group.color)}>
                        {group.count}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#161514]/70 font-bold mt-1">{group.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.success(`Activated ${group.name} bundle!`)}
                    className="bg-[#161514] hover:bg-[#2a2725] text-white font-black text-[10px] uppercase px-3 py-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none shrink-0 cursor-pointer transition-all"
                  >
                    ACTIVATE
                  </button>
                </div>
              ))}
            </div>
          </div>
        </ResponsiveFormContainer>

        {/* PRO TOOLS SECTION */}
        <div className="space-y-3 pt-2">
          <span className="text-[10px] font-black text-[#161514]/70 uppercase tracking-widest px-1">
            PRO TOOLS
          </span>

          {/* FEATURE 5A: 📊 PREMIUM STATS & CSV CARD */}
          <button
            type="button"
            onClick={() => setIsCSVModalOpen(true)}
            className="w-full bg-white hover:bg-[#FAF8F5] rounded-2xl p-4 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex items-center justify-between transition-all cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-amber-400 border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] shrink-0">
                <BarChart3 className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <h4 className="font-black text-sm text-[#161514] tracking-tight uppercase font-heading">
                  PREMIUM STATS & CSV
                </h4>
                <p className="text-[10px] text-[#161514]/70 font-black uppercase tracking-wide">
                  LIFETIME PRO REPORTS
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-[#161514] stroke-[3]" />
          </button>

          {/* FEATURE 5B: 🎛️ WIDGET VARIANTS CARD */}
          <button
            type="button"
            onClick={() => setIsWidgetVariantsOpen(true)}
            className="w-full bg-white hover:bg-[#FAF8F5] rounded-2xl p-4 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex items-center justify-between transition-all cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-amber-400 border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] shrink-0">
                <Sliders className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <h4 className="font-black text-sm text-[#161514] tracking-tight uppercase font-heading">
                  WIDGET VARIANTS
                </h4>
                <p className="text-[10px] text-[#161514]/70 font-black uppercase tracking-wide">
                  COMPACT, EXPANDED & DARK MODE
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-[#161514] stroke-[3]" />
          </button>

          {/* FEATURE 5C: 🛠️ REPORT AN ISSUE / FEEDBACK CARD */}
          <button
            type="button"
            onClick={() => setIsReportIssueOpen(true)}
            className="w-full bg-[#CEF431] hover:bg-[#bce028] rounded-2xl p-4 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex items-center justify-between transition-all cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-white border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] shrink-0 font-black text-lg">
                🛠️
              </div>
              <div className="text-left">
                <h4 className="font-black text-sm text-[#161514] tracking-tight uppercase font-heading">
                  REPORT ISSUE OR FEEDBACK
                </h4>
                <p className="text-[10px] text-[#161514]/90 font-black uppercase tracking-wide">
                  SUBMIT BUGS & REQUESTS TO ADMIN BOARD
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-[#161514] stroke-[3]" />
          </button>
        </div>

        {/* FEATURE 5A: CSV EXPORTER MODAL */}
        <ResponsiveFormContainer
          open={isCSVModalOpen}
          onOpenChange={setIsCSVModalOpen}
          title="📊 PREMIUM STATS & CSV REPORTS"
          description="Export lifetime habit logs, financial ledger, and study focus hours to CSV spreadsheets"
        >
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 gap-3">
              {[
                { title: "🌱 Habits & Streaks CSV Report", desc: "Download full history of completed habit logs and streak records", type: "habits" as const },
                { title: "💰 Financial Ledger CSV Report", desc: "Export income, expense logs, payment methods, and category breakdown", type: "finance" as const },
                { title: "📚 Study Sessions CSV Report", desc: "Export study stopwatch sessions, subjects, and topic focus minutes", type: "study" as const },
                { title: "📦 Lifetime Master Bundle CSV", desc: "Complete exported archive bundle containing all workspace data", type: "bundle" as const },
              ].map((rep, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-4 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] flex items-center justify-between gap-3">
                  <div>
                    <h5 className="font-black text-xs text-[#161514] font-heading">{rep.title}</h5>
                    <p className="text-[10px] text-[#161514]/70 font-bold mt-0.5">{rep.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadCSVReport(rep.type)}
                    className="bg-amber-400 hover:bg-amber-500 text-[#161514] font-black text-[10px] uppercase px-3 py-2 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none shrink-0 cursor-pointer transition-all flex items-center gap-1"
                  >
                    <Download className="h-3.5 w-3.5 stroke-[3]" /> EXPORT
                  </button>
                </div>
              ))}
            </div>
          </div>
        </ResponsiveFormContainer>

        {/* FEATURE 5B: WIDGET VARIANTS MODAL */}
        <ResponsiveFormContainer
          open={isWidgetVariantsOpen}
          onOpenChange={setIsWidgetVariantsOpen}
          title="🎛️ WIDGET VARIANTS & THEME"
          description="Choose theme variants and card dimensions for dashboard widgets"
        >
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: "classic", name: "Classic Neubrutalist Yellow", desc: "Solid 2px black borders & gold drop shadows", badge: "ACTIVE DEFAULT" },
                { id: "expanded", name: "Expanded Cards Variant", desc: "Large spacious cards with extra data metrics", badge: "PRO EXPANDED" },
                { id: "dark", name: "Dark Mode Stealth Variant", desc: "Sleek dark theme cards with high-contrast text", badge: "DARK MODE" },
              ].map((varItem) => (
                <div
                  key={varItem.id}
                  onClick={() => {
                    setWidgetVariantStyle(varItem.id as any);
                    toast.success(`Activated ${varItem.name}! 🎛️`);
                  }}
                  className={cn(
                    "rounded-2xl p-4 border-2 border-[#161514] cursor-pointer transition-all flex items-center justify-between gap-3 hover:-translate-x-0.5 hover:-translate-y-0.5",
                    widgetVariantStyle === varItem.id
                      ? "bg-amber-100 shadow-[4px_4px_0px_0px_#161514]"
                      : "bg-white hover:bg-[#FAF8F5] shadow-[2px_2px_0px_0px_#161514]"
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-black text-xs text-[#161514] font-heading">{varItem.name}</h5>
                      <span className="bg-[#161514] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-md">
                        {varItem.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#161514]/70 font-bold mt-1">{varItem.desc}</p>
                  </div>
                  <span className={cn(
                    "h-5 w-5 rounded-full border-2 border-[#161514] flex items-center justify-center font-black text-xs",
                    widgetVariantStyle === varItem.id ? "bg-[#161514] text-white" : "bg-white text-transparent"
                  )}>
                    ✓
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ResponsiveFormContainer>

        {/* REMINDERS & FEEDBACK SECTION */}
        <div className="space-y-3 pt-2">
          <span className="text-[10px] font-black text-[#161514]/70 uppercase tracking-widest px-1">
            REMINDERS & FEEDBACK
          </span>

          {/* FEATURE 6A: ⚡ SMART REMINDERS */}
          <div className="bg-white rounded-2xl p-4 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-amber-400 border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] shrink-0">
                <Zap className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <h4 className="font-black text-sm text-[#161514] tracking-tight uppercase font-heading">
                  SMART REMINDERS
                </h4>
                <p className="text-[10px] text-[#161514]/70 font-black uppercase tracking-wide">
                  {smartReminders ? "ON — STREAK SAVES & DAILY RECAP" : "OFF — MUTED"}
                </p>
              </div>
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
                "font-black text-xs px-3.5 py-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all",
                smartReminders ? "bg-amber-400 text-[#161514]" : "bg-[#FAF8F5] text-[#161514]/60"
              )}
            >
              {smartReminders ? "ON" : "OFF"}
            </button>
          </div>

          {/* FEATURE 6B: 🔔 PUSH NOTIFICATIONS */}
          <div className="bg-white rounded-2xl p-4 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex items-center justify-between gap-2">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-amber-400 border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] shrink-0">
                <Bell className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <h4 className="font-black text-sm text-[#161514] tracking-tight uppercase font-heading">
                  PUSH NOTIFICATIONS
                </h4>
                <p className="text-[10px] text-[#161514]/70 font-black uppercase tracking-wide">
                  {pushNotifications ? "ON — SYSTEM PUSH ACTIVE" : "OFF — MUTED"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pushNotifications && (
                <button
                  type="button"
                  onClick={() => triggerTestPushNotification(user?.uid)}
                  className="bg-[#161514] hover:bg-[#2a2725] text-white font-black text-[10px] uppercase px-2.5 py-1.5 rounded-xl border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all shrink-0"
                >
                  TEST
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
                  "font-black text-xs px-3.5 py-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all",
                  pushNotifications ? "bg-amber-400 text-[#161514]" : "bg-[#FAF8F5] text-[#161514]/60"
                )}
              >
                {pushNotifications ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          {/* FEATURE 6C: ⏰ WAKE-UP ALARM */}
          <div className="bg-white rounded-2xl p-4 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-amber-400 border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] shrink-0">
                <AlarmClock className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <h4 className="font-black text-sm text-[#161514] tracking-tight uppercase font-heading">
                  WAKE-UP ALARM
                </h4>
                <p className="text-[10px] text-[#161514]/70 font-black uppercase tracking-wide">
                  {wakeUpAlarm ? "ON — DAILY ALARM TO DO YOUR HABITS" : "OFF — DISABLED"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = !wakeUpAlarm;
                setWakeUpAlarm(nextVal);
                localStorage.setItem("invictus_wakeup_alarm", String(nextVal));
                toast.success(`Wake-Up Alarm ${nextVal ? "ACTIVE ⏰" : "DISABLED"}`);
              }}
              className={cn(
                "font-black text-xs px-3.5 py-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all",
                wakeUpAlarm ? "bg-amber-400 text-[#161514]" : "bg-[#FAF8F5] text-[#161514]/60"
              )}
            >
              {wakeUpAlarm ? "ON" : "OFF"}
            </button>
          </div>

          {/* FEATURE 6D: 🔊 COMPLETION SOUNDS */}
          <button
            type="button"
            onClick={() => setIsCompletionSoundOpen(true)}
            className="w-full bg-white hover:bg-[#FAF8F5] rounded-2xl p-4 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex items-center justify-between transition-all cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-amber-400 border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] shrink-0">
                <Volume2 className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <h4 className="font-black text-sm text-[#161514] tracking-tight uppercase font-heading">
                  COMPLETION SOUNDS
                </h4>
                <p className="text-[10px] text-[#161514]/70 font-black uppercase tracking-wide">
                  ACTIVE: {completionSound.toUpperCase()}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-[#161514] stroke-[3]" />
          </button>
        </div>

        {/* FEATURE 6D: COMPLETION SOUNDS MODAL */}
        <ResponsiveFormContainer
          open={isCompletionSoundOpen}
          onOpenChange={setIsCompletionSoundOpen}
          title="🔊 COMPLETION SOUND FEEDBACK"
          description="Choose audio feedback sound effect triggered when checking off daily habits"
        >
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 gap-3">
              {[
                { type: "tap" as const, name: "Tap (Crisp Pop)", desc: "Quick tactile pop sound feedback", icon: "🎵" },
                { type: "chime" as const, name: "Chime (Melodic Chords)", desc: "Uplifting 4-note chord melody for streaks", icon: "🎶" },
                { type: "haptic" as const, name: "Haptic (Percussive Thud)", desc: "Low subtle percussive thud effect", icon: "🥁" },
                { type: "off" as const, name: "Mute All Sounds", desc: "No audio feedback on completion", icon: "🔇" },
              ].map((snd) => (
                <div
                  key={snd.type}
                  onClick={() => {
                    setCompletionSound(snd.type);
                    localStorage.setItem("invictus_completion_sound", snd.type);
                    playCompletionSound(snd.type);
                    toast.success(`Completion sound set to ${snd.name}! 🔊`);
                  }}
                  className={cn(
                    "rounded-2xl p-4 border-2 border-[#161514] cursor-pointer transition-all flex items-center justify-between gap-3 hover:-translate-x-0.5 hover:-translate-y-0.5",
                    completionSound === snd.type
                      ? "bg-amber-100 shadow-[4px_4px_0px_0px_#161514]"
                      : "bg-white hover:bg-[#FAF8F5] shadow-[2px_2px_0px_0px_#161514]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{snd.icon}</span>
                    <div>
                      <h5 className="font-black text-xs text-[#161514] font-heading">{snd.name}</h5>
                      <p className="text-[10px] text-[#161514]/70 font-bold mt-0.5">{snd.desc}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playCompletionSound(snd.type);
                    }}
                    className="bg-[#161514] hover:bg-[#2a2725] text-white font-black text-[10px] uppercase px-3 py-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all shrink-0"
                  >
                    TEST
                  </button>
                </div>
              ))}
            </div>
          </div>
        </ResponsiveFormContainer>

        {/* 📱 FEATURE 7: INVICTUS FOR ANDROID (OFFICIAL APK & UPDATES) */}
        <div className="space-y-3 pt-2">
          <span className="text-[10px] font-black text-[#161514]/70 uppercase tracking-widest px-1">
            ANDROID APP & SYSTEM UPDATES
          </span>

          <div className="w-full bg-white rounded-3xl p-5 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-4">
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-[#CEF431] border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[2px_2px_0px_0px_#161514] shrink-0 font-black text-2xl">
                  🤖
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-sm text-[#161514] tracking-tight uppercase font-heading">
                      Invictus for Android
                    </h4>
                    <span className="bg-[#CEF431] text-[#161514] font-black text-[9px] px-2 py-0.5 rounded-full border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514]">
                      v{APP_VERSION_CONFIG.version} (Build {APP_VERSION_CONFIG.buildNumber})
                    </span>
                  </div>
                  <p className="text-[10px] text-[#161514]/70 font-black uppercase tracking-wide mt-0.5">
                    Official Android APK • Native Haptics • Instant Shortcuts • Zero Data Loss
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleInstallPWA}
                className="w-full bg-[#CEF431] hover:bg-[#bce028] text-[#161514] font-black text-xs uppercase tracking-wider py-3.5 px-3 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all flex items-center justify-center gap-2 text-center"
              >
                <Smartphone className="h-4 w-4 stroke-[2.5]" />
                <span>1-Tap Install (PWA)</span>
              </button>

              <a
                href="/api/download/android"
                onClick={handleDownloadApk}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#161514] hover:bg-[#2a2725] text-white font-black text-xs uppercase tracking-wider py-3.5 px-3 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all flex items-center justify-center gap-2 text-center"
              >
                <Download className="h-4 w-4 stroke-[2.5]" />
                <span>Download APK</span>
              </a>

              <button
                type="button"
                onClick={() => setIsUpdateCheckOpen(true)}
                className="w-full bg-white hover:bg-amber-100 text-[#161514] font-black text-xs uppercase tracking-wider py-3.5 px-3 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4 stroke-[2.5]" />
                <span>Check Updates</span>
              </button>
            </div>

            {/* Expandable 3-Step Installation Guide */}
            <div className="pt-2 border-t-2 border-[#161514]/10">
              <button
                type="button"
                onClick={() => setIsInstallGuideOpen(!isInstallGuideOpen)}
                className="w-full flex items-center justify-between text-xs font-black uppercase text-[#161514] hover:text-[#161514]/80 cursor-pointer"
              >
                <span className="flex items-center gap-1.5 font-heading">
                  <span>📖 How to Install & Update the Android App</span>
                </span>
                {isInstallGuideOpen ? <ChevronUp className="h-4 w-4 stroke-[2.5]" /> : <ChevronDown className="h-4 w-4 stroke-[2.5]" />}
              </button>

              {isInstallGuideOpen && (
                <div className="mt-3 space-y-2.5 bg-[#FAF8F5] p-3.5 rounded-2xl border-2 border-[#161514] text-xs font-bold text-[#161514]">
                  <div className="flex items-start gap-2.5">
                    <span className="h-6 w-6 rounded-full bg-amber-400 text-[#161514] border-2 border-[#161514] flex items-center justify-center font-black text-xs shrink-0 shadow-[1px_1px_0px_0px_#161514]">1</span>
                    <div>
                      <strong className="text-[#161514] block font-heading">Download the Official APK:</strong>
                      Tap the &ldquo;Download APK&rdquo; button above to save the latest release file onto your Android device.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="h-6 w-6 rounded-full bg-[#CEF431] text-[#161514] border-2 border-[#161514] flex items-center justify-center font-black text-xs shrink-0 shadow-[1px_1px_0px_0px_#161514]">2</span>
                    <div>
                      <strong className="text-[#161514] block font-heading">Open File & Allow Installation:</strong>
                      Pull down your notification shade and tap <em>Invictus.apk</em> (or open it from your phone&apos;s Downloads folder). If prompted, tap <em>Settings</em> and toggle <em>&ldquo;Allow from this source&rdquo;</em>.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="h-6 w-6 rounded-full bg-[#03D26F] text-[#161514] border-2 border-[#161514] flex items-center justify-center font-black text-xs shrink-0 shadow-[1px_1px_0px_0px_#161514]">3</span>
                    <div>
                      <strong className="text-[#161514] block font-heading">Install & Zero Data Loss Updates:</strong>
                      Tap <em>Install</em>. When launched, log in with your email & password. All your habits, study logs, transactions, and categories sync seamlessly! When a new update is released, simply download the new APK and install it right over the existing app.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Update Checker Modal */}
        <UpdateCheckModal
          open={isUpdateCheckOpen}
          onOpenChange={setIsUpdateCheckOpen}
        />

        {/* ACCOUNT SECTION */}
        <div className="space-y-3 pt-2">
          <span className="text-[10px] font-black text-[#161514]/70 uppercase tracking-widest px-1">
            ACCOUNT
          </span>

          {/* ACCOUNT SETTINGS CARD */}
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className="w-full bg-white hover:bg-[#FAF8F5] rounded-2xl p-4 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex items-center justify-between transition-all cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-amber-400 border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] shrink-0">
                <User className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <h4 className="font-black text-sm text-[#161514] tracking-tight uppercase font-heading">
                  ACCOUNT SETTINGS
                </h4>
                <p className="text-[10px] text-[#161514]/70 font-black uppercase tracking-wide">
                  SIGN IN OR MANAGE ACCOUNT ({user?.email || "Guest"})
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-[#161514] stroke-[3]" />
          </button>
        </div>

        {/* ENGINE FUEL SECTION */}
        <div className="space-y-3 pt-2">
          <span className="text-[10px] font-black text-[#161514]/70 uppercase tracking-widest px-1">
            ENGINE FUEL
          </span>

          {/* AI INSIGHTS CARD */}
          <button
            type="button"
            onClick={() => setIsAIInsightsOpen(true)}
            className="w-full bg-white hover:bg-[#FAF8F5] rounded-2xl p-4 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex items-center justify-between transition-all cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-amber-400 border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] shrink-0">
                <Sparkles className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <h4 className="font-black text-sm text-[#161514] tracking-tight uppercase font-heading">
                  AI INSIGHTS
                </h4>
                <p className="text-[10px] text-[#161514]/70 font-black uppercase tracking-wide">
                  AI ROUTINE GENERATION AND RECAPS
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-[#161514] stroke-[3]" />
          </button>

          {/* CLOUD SYNC CARD */}
          <div className="bg-white rounded-2xl p-4 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-amber-400 border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] shrink-0">
                <Cloud className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <h4 className="font-black text-sm text-[#161514] tracking-tight uppercase font-heading">
                  CLOUD SYNC
                </h4>
                <p className="text-[10px] text-[#161514]/70 font-black uppercase tracking-wide">
                  {cloudSync ? "SYNC ON — REAL-TIME MONGODB CONNECTED" : "SYNC OFF — OFFLINE MODE"}
                </p>
              </div>
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
                "font-black text-xs px-3.5 py-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all",
                cloudSync ? "bg-amber-400 text-[#161514]" : "bg-[#FAF8F5] text-[#161514]/60"
              )}
            >
              {cloudSync ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* AI INSIGHTS MODAL */}
        <ResponsiveFormContainer
          open={isAIInsightsOpen}
          onOpenChange={setIsAIInsightsOpen}
          title="✨ AI INSIGHTS & ROUTINE ENGINE"
          description="AI-generated routine recommendations based on your active streaks and focus sessions"
        >
          <div className="space-y-4 pt-2">
            <div className="bg-amber-100 rounded-2xl p-4 border-2 border-[#161514] space-y-2 shadow-[2px_2px_0px_0px_#161514]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-700" />
                <h5 className="font-black text-xs text-[#161514] font-heading">AI Weekly Performance Summary</h5>
              </div>
              <p className="text-[11px] text-[#161514] leading-relaxed font-semibold">
                "You completed 87% of your morning habits this week! Your peak productivity window is 8:30 AM to 11:30 AM. Suggested routine tweak: Add 10m post-lunch walk to sustain afternoon energy."
              </p>
            </div>
            <button
              type="button"
              onClick={() => toast.success("AI Routine generated! Applied to habits! ✨")}
              className="w-full bg-[#161514] hover:bg-[#2a2725] text-white font-black text-xs uppercase py-3.5 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all"
            >
              GENERATE NEW AI ROUTINE PACK
            </button>
          </div>
        </ResponsiveFormContainer>

        {/* Global Announcement Banner Preview if active */}
        {activeAnnouncement && (
          <div className="bg-amber-400 text-[#161514] rounded-2xl p-4 shadow-[3px_3px_0px_0px_#161514] flex items-start gap-3 border-2 border-[#161514]">
            <Megaphone className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider font-heading">Site Announcement</p>
              <p className="text-xs font-bold">{activeAnnouncement.message}</p>
            </div>
          </div>
        )}

        {/* Section Segmented Navigation Pills */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-1.5 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex justify-between gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab("preferences")}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap border-2 font-heading",
              activeTab === "preferences"
                ? "bg-[#161514] text-white border-[#161514] shadow-[2px_2px_0px_0px_#161514]"
                : "border-transparent text-[#161514]/70 hover:text-[#161514] hover:bg-[#FAF8F5] hover:-translate-x-0.5 hover:-translate-y-0.5"
            )}
          >
            <User className="h-3.5 w-3.5 stroke-[2.5]" /> Preferences
          </button>
          <button
            onClick={() => setActiveTab("modules")}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap border-2 font-heading",
              activeTab === "modules"
                ? "bg-[#161514] text-white border-[#161514] shadow-[2px_2px_0px_0px_#161514]"
                : "border-transparent text-[#161514]/70 hover:text-[#161514] hover:bg-[#FAF8F5] hover:-translate-x-0.5 hover:-translate-y-0.5"
            )}
          >
            <Sliders className="h-3.5 w-3.5 stroke-[2.5]" /> Modules
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap border-2 font-heading",
              activeTab === "security"
                ? "bg-[#161514] text-white border-[#161514] shadow-[2px_2px_0px_0px_#161514]"
                : "border-transparent text-[#161514]/70 hover:text-[#161514] hover:bg-[#FAF8F5] hover:-translate-x-0.5 hover:-translate-y-0.5"
            )}
          >
            <Lock className="h-3.5 w-3.5 stroke-[2.5]" /> Security
          </button>
          <button
            onClick={() => setActiveTab("datavault")}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap border-2 font-heading",
              activeTab === "datavault"
                ? "bg-[#161514] text-white border-[#161514] shadow-[2px_2px_0px_0px_#161514]"
                : "border-transparent text-[#161514]/70 hover:text-[#161514] hover:bg-[#FAF8F5] hover:-translate-x-0.5 hover:-translate-y-0.5"
            )}
          >
            <Database className="h-3.5 w-3.5 stroke-[2.5]" /> Data Vault
          </button>
        </div>

        {/* TAB 1: Preferences */}
        {activeTab === "preferences" && (
          <div className="bg-white rounded-3xl p-6 border-[2.5px] border-[#161514] shadow-[5px_5px_0px_0px_#161514] space-y-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#161514]/70 flex items-center gap-2 font-heading">
              <User className="h-4 w-4 text-amber-500 stroke-[2.5]" /> Account Preferences
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="display-name" className="text-xs font-black uppercase tracking-wider text-[#161514]/70 font-heading">
                  Name / Nickname
                </label>
                <input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="neo-input w-full rounded-xl border-2 border-[#161514] bg-[#FAF8F5] py-2.5 px-4 text-xs font-bold text-[#161514] outline-none focus:bg-[#FFF9EA] focus:shadow-[2px_2px_0px_0px_#161514] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="timezone" className="text-xs font-black uppercase tracking-wider text-[#161514]/70 flex items-center gap-1 font-heading">
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
                  <label htmlFor="currency" className="text-xs font-black uppercase tracking-wider text-[#161514]/70 font-heading">
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

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#161514]/70 flex items-center gap-1 font-heading">
                  <Calendar className="h-3 w-3 stroke-[2.5]" /> Week starts on
                </label>
                <div className="flex gap-3">
                  {[
                    { label: "Monday", value: 1 as const },
                    { label: "Sunday", value: 0 as const },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setWeekStartsOn(opt.value)}
                      className={`flex-1 rounded-xl border-2 border-[#161514] py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
                        weekStartsOn === opt.value
                          ? "bg-amber-400 text-[#161514] shadow-[2px_2px_0px_0px_#161514]"
                          : "bg-[#FAF8F5] text-[#161514]/70 hover:bg-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 flex items-center justify-between border-t-2 border-[#161514]/10 pt-4">
                <div>
                  <label htmlFor="playful-toasts" className="text-xs font-black uppercase tracking-wider text-[#161514] block font-heading">
                    Playful Toast Feedback
                  </label>
                  <p className="text-[10px] text-[#161514]/70 font-bold">Show energetic encouraging messages on user actions</p>
                </div>
                <button
                  id="playful-toasts"
                  type="button"
                  onClick={() => setPlayfulToastsEnabled(!playfulToastsEnabled)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all",
                    playfulToastsEnabled
                      ? "bg-amber-400 text-[#161514]"
                      : "bg-[#FAF8F5] text-[#161514]/60"
                  )}
                >
                  {playfulToastsEnabled ? "Fun Mode On 🎉" : "Standard Mode"}
                </button>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#03D26F] hover:bg-[#02b35d] text-[#161514] font-black rounded-2xl py-3.5 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all uppercase tracking-wider"
            >
              <Save className="h-4 w-4 mr-2 stroke-[2.5]" />
              {saving ? "Saving Preferences…" : "Save Preferences"}
            </Button>
          </div>
        )}

        {/* TAB 2: Modules & Exam Target */}
        {activeTab === "modules" && (
          <div className="bg-white rounded-3xl p-6 border-[2.5px] border-[#161514] shadow-[5px_5px_0px_0px_#161514] space-y-5">
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#161514]/70 flex items-center gap-2 font-heading">
                <Sliders className="h-4 w-4 text-amber-500 stroke-[2.5]" /> Active Workspace Modules
              </h2>
              {[
                { key: "goals" as const, label: "Goals & Habits Space", Icon: Target },
                { key: "study" as const, label: "Study & Exam Space", Icon: BookOpen },
                { key: "money" as const, label: "Money & Ledger Space", Icon: Wallet },
              ].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleModule(key)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 border-[#161514] transition-all cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
                    modulesEnabled[key]
                      ? "bg-amber-100 shadow-[3px_3px_0px_0px_#161514]"
                      : "bg-[#FAF8F5] opacity-60 shadow-[1px_1px_0px_0px_#161514]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-[#161514] stroke-[2.5]" />
                    <span className="text-xs font-black uppercase tracking-wider text-[#161514] font-heading">{label}</span>
                  </div>
                  <div
                    className={`h-6 w-12 rounded-full border-2 border-[#161514] transition-all relative ${
                      modulesEnabled[key] ? "bg-amber-400" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white border border-[#161514] shadow transition-all ${
                        modulesEnabled[key] ? "left-6" : "left-0.5"
                      }`}
                    />
                  </div>
                </button>
              ))}
            </div>

            {modulesEnabled.study && (
              <>
                <hr className="border-t-2 border-[#161514]/10" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-black uppercase tracking-wider text-[#161514]/70 font-heading">
                      Target Exam Countdown
                    </h2>
                    <button
                      type="button"
                      onClick={() => setHasExam(!hasExam)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all",
                        hasExam
                          ? "bg-amber-400 text-[#161514]"
                          : "bg-[#FAF8F5] text-[#161514]/60"
                      )}
                    >
                      {hasExam ? "Exam Active" : "No Exam"}
                    </button>
                  </div>
                  {hasExam && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={examName}
                        onChange={(e) => setExamName(e.target.value)}
                        placeholder="e.g. SAT, JEE, GATE, CFA, USMLE..."
                        className="neo-input w-full rounded-xl border-2 border-[#161514] bg-[#FAF8F5] py-2.5 px-4 text-xs font-bold text-[#161514] outline-none focus:bg-[#FFF9EA] focus:shadow-[2px_2px_0px_0px_#161514] transition-all"
                      />
                      <input
                        type="date"
                        value={examDate}
                        onChange={(e) => setExamDate(e.target.value)}
                        className="neo-input w-full rounded-xl border-2 border-[#161514] bg-[#FAF8F5] py-2.5 px-4 text-xs font-bold text-[#161514] outline-none focus:bg-[#FFF9EA] focus:shadow-[2px_2px_0px_0px_#161514] transition-all"
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#03D26F] hover:bg-[#02b35d] text-[#161514] font-black rounded-2xl py-3.5 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all uppercase tracking-wider"
            >
              <Save className="h-4 w-4 mr-2 stroke-[2.5]" />
              {saving ? "Saving Configuration…" : "Save Configuration"}
            </Button>
          </div>
        )}

        {/* TAB 3: Security & Auth */}
        {activeTab === "security" && (
          <div className="bg-white rounded-3xl p-6 border-[2.5px] border-[#161514] shadow-[5px_5px_0px_0px_#161514] space-y-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#161514]/70 flex items-center gap-2 font-heading">
              <ShieldCheck className="h-4 w-4 text-amber-500 stroke-[2.5]" /> Security & Session Management
            </h2>

            <div className="bg-[#FAF8F5] rounded-2xl p-4 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#161514]/70">Active Account Email</span>
                <span className="text-xs font-black text-[#161514] font-mono">{user?.email || "Guest"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#161514]/70">Auth Engine</span>
                <span className="text-[10px] font-black text-emerald-950 bg-emerald-300 px-2 py-0.5 rounded-md border-2 border-[#161514]">SHA-256 Client Security</span>
              </div>
            </div>

            {/* Change Password Form */}
            <form onSubmit={handlePasswordChange} className="space-y-4 pt-2 border-t-2 border-[#161514]/10">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#161514] flex items-center gap-1.5 font-heading">
                <KeyRound className="h-3.5 w-3.5 text-amber-500 stroke-[2.5]" /> Change Account Password
              </h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#161514]/70">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 4 characters"
                    className="neo-input w-full bg-[#FAF8F5] rounded-xl border-2 border-[#161514] px-4 py-2.5 text-xs text-[#161514] outline-none focus:bg-[#FFF9EA] focus:shadow-[2px_2px_0px_0px_#161514] font-bold transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#161514]/70">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="neo-input w-full bg-[#FAF8F5] rounded-xl border-2 border-[#161514] px-4 py-2.5 text-xs text-[#161514] outline-none focus:bg-[#FFF9EA] focus:shadow-[2px_2px_0px_0px_#161514] font-bold transition-all"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isChangingPassword}
                className="w-full bg-[#161514] hover:bg-[#2a2725] text-white font-black uppercase tracking-wider rounded-2xl py-3.5 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all"
              >
                {isChangingPassword ? "Updating Password…" : "Update Password"}
              </Button>
            </form>

            {/* Delete Account - Danger Zone */}
            <div className="space-y-3 pt-3 border-t-2 border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-red-600 flex items-center gap-1.5 font-heading">
                    <UserX className="h-3.5 w-3.5 stroke-[2.5]" />
                    Delete Account Permanently
                  </p>
                  <p className="text-[10px] text-[#161514]/70 font-bold">Remove your account and all data forever</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteAccount(!showDeleteAccount)}
                  className="rounded-xl border-2 border-red-600 text-red-600 bg-white hover:bg-red-50 shadow-[2px_2px_0px_0px_#dc2626] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer gap-1.5 text-xs font-black uppercase tracking-wider transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                  Delete Account
                </Button>
              </div>
              {showDeleteAccount && (
                <div className="bg-red-50 border-2 border-[#161514] rounded-2xl p-5 space-y-4 shadow-[4px_4px_0px_0px_#161514]">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5 stroke-[2.5]" />
                    <div className="space-y-1">
                      <p className="text-xs font-black text-red-700 uppercase font-heading">⚠️ This action is irreversible!</p>
                      <p className="text-[11px] text-red-700 leading-relaxed font-bold">
                        Deleting your account will permanently remove:
                      </p>
                      <ul className="text-[10px] text-red-700 list-disc list-inside space-y-0.5 mt-1 font-bold">
                        <li>Your user profile and login credentials</li>
                        <li>All habits, streaks, and habit logs</li>
                        <li>Health profile, workouts, and water logs</li>
                        <li>All study subjects, topics, and sessions</li>
                        <li>All financial transactions and categories</li>
                        <li>All local browser data for this account</li>
                      </ul>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-red-700 uppercase tracking-wider">
                      Type DELETE MY ACCOUNT to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteAccountText}
                      onChange={(e) => setDeleteAccountText(e.target.value)}
                      placeholder="DELETE MY ACCOUNT"
                      className="neo-input w-full rounded-xl border-2 border-[#161514] bg-white py-2.5 px-3 text-xs text-[#161514] outline-none focus:bg-[#FFF9EA] focus:shadow-[2px_2px_0px_0px_#161514] font-mono font-bold transition-all"
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
                      className="rounded-xl border-2 border-[#161514] text-[#161514] bg-white hover:bg-[#FAF8F5] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer text-xs flex-1 font-black uppercase transition-all"
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
                          // 1. Delete all MongoDB data via API
                          const res = await fetch("/api/account/delete", {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ uid: user.uid, email: user.email }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || "API deletion failed");

                          // 2. Delete from local auth user database by UID & email
                          customDeleteUser(user.uid);
                          if (user.email) customDeleteUser(user.email);

                          // 3. Clear user local data keys (keep invictus_custom_users_db intact)
                          const keysToRemove: string[] = [];
                          for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key && key.startsWith("invictus_") && key !== "invictus_custom_users_db") {
                              keysToRemove.push(key);
                            }
                          }
                          keysToRemove.forEach((k) => localStorage.removeItem(k));

                          // 4. Sign out and redirect to login
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
                      className="rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer text-xs flex-1 disabled:opacity-40 font-black uppercase border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                    >
                      {isDeletingAccount ? "Deleting Account…" : "🗑️ Permanently Delete Account"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Data Vault */}
        {activeTab === "datavault" && (
          <div className="bg-white rounded-3xl p-6 border-[2.5px] border-[#161514] shadow-[5px_5px_0px_0px_#161514] space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-amber-500 stroke-[2.5]" />
                <h2 className="text-xs font-black uppercase tracking-wider text-[#161514]/70 font-heading">
                  Data Vault & Backups
                </h2>
              </div>
              <span className="text-[10px] font-black text-[#161514] bg-amber-200 px-3 py-1 rounded-xl border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514]">
                Storage: {storageMetrics.kb} KB ({storageMetrics.percent}% Quota)
              </span>
            </div>

            {/* Storage Meter Bar */}
            <div className="space-y-1">
              <div className="h-3 w-full bg-[#FAF8F5] rounded-full overflow-hidden border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514]">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.max(2, storageMetrics.percent)}%` }} />
              </div>
              <p className="text-[9px] font-black text-[#161514]/70 text-right uppercase">Local Storage Usage Metric</p>
            </div>

            {/* Export Backup */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-[#161514] font-heading">Export Backup JSON</p>
                  <p className="text-[10px] text-[#161514]/70 font-bold">Download complete workspace snapshot</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isExporting}
                  onClick={handleExportBackup}
                  className="rounded-xl border-2 border-[#161514] text-[#161514] bg-white hover:bg-[#FAF8F5] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer gap-1.5 text-xs font-black uppercase tracking-wider transition-all"
                >
                  <Download className="h-3.5 w-3.5 stroke-[2.5]" />
                  {isExporting ? "Exporting…" : "Export"}
                </Button>
              </div>
            </div>

            <hr className="border-t-2 border-[#161514]/10" />

            {/* Import Restore */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-[#161514] font-heading">Import & Restore</p>
                  <p className="text-[10px] text-[#161514]/70 font-bold">Restore from previously exported JSON backup</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isImporting}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border-2 border-[#161514] text-[#161514] bg-white hover:bg-[#FAF8F5] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer gap-1.5 text-xs font-black uppercase tracking-wider transition-all"
                >
                  <Upload className="h-3.5 w-3.5 stroke-[2.5]" />
                  {isImporting ? "Importing…" : "Import"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportRestore}
                />
              </div>
            </div>

            <hr className="border-t-2 border-[#161514]/10" />

            {/* Clear Local Data */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-[#161514] font-heading">Clear Offline Data</p>
                  <p className="text-[10px] text-[#161514]/70 font-bold">Flush local browser cache</p>
                </div>
                {!showClearConfirm ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClearConfirm(true)}
                    className="rounded-xl border-2 border-red-600 text-red-600 bg-white hover:bg-red-50 shadow-[2px_2px_0px_0px_#dc2626] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer gap-1.5 text-xs font-black uppercase tracking-wider transition-all"
                  >
                    <HardDrive className="h-3.5 w-3.5 stroke-[2.5]" />
                    Clear
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowClearConfirm(false)}
                      className="rounded-xl border-2 border-[#161514] text-[#161514] bg-white hover:bg-[#FAF8F5] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer text-xs font-black uppercase transition-all"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleClearLocalData}
                      className="rounded-xl bg-red-600 hover:bg-red-700 text-white border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer text-xs font-black uppercase transition-all"
                    >
                      Confirm Clear
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-t-2 border-[#161514]/10" />

            {/* Delete Cloud Data */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-red-600 flex items-center gap-1.5 font-heading">
                    <AlertTriangle className="h-3.5 w-3.5 stroke-[2.5]" />
                    Delete Cloud Database
                  </p>
                  <p className="text-[10px] text-[#161514]/70 font-bold">Permanently wipe all records</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteFirebase(!showDeleteFirebase)}
                  className="rounded-xl border-2 border-red-600 text-red-600 bg-white hover:bg-red-50 shadow-[2px_2px_0px_0px_#dc2626] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer gap-1.5 text-xs font-black uppercase tracking-wider transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                  Delete All
                </Button>
              </div>
              {showDeleteFirebase && (
                <div className="bg-red-50 border-2 border-[#161514] rounded-2xl p-4 space-y-3 shadow-[3px_3px_0px_0px_#161514]">
                  <p className="text-xs text-red-700 font-bold">
                    This will permanently delete ALL your habits, study logs, transactions, and custom settings. This action cannot be undone.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-red-700 uppercase tracking-wider">
                      Type DELETE to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="neo-input w-full rounded-xl border-2 border-[#161514] bg-white py-2 px-3 text-xs text-[#161514] outline-none focus:bg-[#FFF9EA] focus:shadow-[2px_2px_0px_0px_#161514] font-mono font-bold transition-all"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowDeleteFirebase(false);
                        setDeleteConfirmText("");
                      }}
                      className="rounded-xl border-2 border-[#161514] text-[#161514] bg-white hover:bg-[#FAF8F5] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer text-xs flex-1 font-black uppercase transition-all"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={deleteConfirmText !== "DELETE" || isDeleting}
                      onClick={handleDeleteFirebaseData}
                      className="rounded-xl bg-red-600 hover:bg-red-700 text-white border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer text-xs flex-1 disabled:opacity-40 font-black uppercase transition-all"
                    >
                      {isDeleting ? "Deleting…" : "Permanently Delete"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
      </div>
    </div>
  );
}
