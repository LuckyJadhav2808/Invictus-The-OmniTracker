"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "@/components/shared/AuthProvider";
import {
  customUpdateUser,
  customUpdatePassword,
  getGlobalAnnouncement,
  type GlobalAnnouncement,
} from "@/lib/custom-auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/utils/toasts";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { useQueryClient } from "@tanstack/react-query";
import { useBudgetPreferences } from "@/lib/queries/money";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { SettingsSkeleton } from "@/components/shared/NeobrutalistSkeleton";
import { playCompletionSound, type SoundEffectType } from "@/lib/utils/completion-sound";
import { enableWebPushNotifications, triggerTestPushNotification } from "@/lib/utils/push-client";
import {
  Target,
  Kanban,
  Wallet,
  Globe,
  Calendar,
  Save,
  Download,
  Upload,
  Trash2,
  Database,
  HardDrive,
  User,
  UserX,
  Sliders,
  ShieldCheck,
  Megaphone,
  KeyRound,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  BarChart3,
  Bell,
  Volume2,
  AlarmClock,
  Smartphone,
  ChevronDown,
  ChevronUp,
  LifeBuoy,
  Check,
  RefreshCw,
  Palette,
} from "lucide-react";
import { toast } from "sonner";
import { BankSmsSettingsSection } from "@/components/settings/BankSmsSettingsSection";
import { AmbientQuickLogCard } from "@/components/money/AmbientQuickLogCard";
import { ReminderManagerModal } from "@/components/shared/ReminderManagerModal";
import { getReminderConfig, type ReminderConfig } from "@/lib/utils/reminder-scheduler";
import { ReportIssueModal } from "@/components/shared/ReportIssueModal";
import { UpdateCheckModal } from "@/components/shared/UpdateCheckModal";
import { InAppDiagnosticsModal } from "@/components/shared/InAppDiagnosticsModal";
import { DeveloperInfoCard } from "@/components/settings/DeveloperInfoCard";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ThemeColorSelector } from "@/components/settings/ThemeColorSelector";
import { APP_VERSION_CONFIG } from "@/config/version";
import { Capacitor } from "@capacitor/core";
import { encryptVaultPayload, decryptVaultPayload } from "@/lib/vault/vault-crypto";
import { soundFX } from "@/components/shared/SoundFX";
import {
  loadEvaluatorDemoData,
  clearEvaluatorDemoData,
  isDemoDataActive,
} from "@/lib/demo/demo-data-seed";
import { MobileAppBar } from "@/components/mobile/MobileAppBar";
import { SegmentedSubNav, type SubNavTab } from "@/components/mobile/SegmentedSubNav";
import { SettingsHeroSummary } from "@/components/settings/SettingsHeroSummary";
import { SettingsDoorTileRow } from "@/components/settings/SettingsDoorTileRow";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

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

const SETTINGS_SUBNAV_TABS: SubNavTab[] = [
  { id: "preferences", label: "General", shortLabel: "General", icon: Sliders },
  { id: "modules", label: "Spaces", shortLabel: "Spaces", icon: LayoutGrid },
  { id: "reminders", label: "Alerts", shortLabel: "Alerts", icon: Bell },
  { id: "security", label: "Security", shortLabel: "Security", icon: ShieldCheck },
  { id: "datavault", label: "Vault", shortLabel: "Vault", icon: Database },
];

export default function SettingsPage() {
  const { user, signOut, refreshUser, isGuest } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const {
    playfulToastsEnabled,
    setPlayfulToastsEnabled,
  } = useUIStore();
  const queryClient = useQueryClient();

  // Evaluator Demo Data State
  const isGuestActive =
    isGuest ||
    (typeof window !== "undefined" && localStorage.getItem("invictus_guest_mode") === "true");
  const [isDemoActive, setIsDemoActive] = useState(false);

  // Active Tab State (5-Tab Sub-navigation Dock)
  const [activeTab, setActiveTab] = useState<SettingsTab>("preferences");
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [reminderConfig, setReminderConfig] = useState<ReminderConfig | null>(null);

  useEffect(() => {
    setIsDemoActive(isDemoDataActive());
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const search = new URLSearchParams(window.location.search);
      const tabParam = search.get("tab") as SettingsTab | null;
      if (tabParam && ["preferences", "modules", "reminders", "security", "datavault"].includes(tabParam)) {
        setActiveTab(tabParam);
      } else if (hash === "#bank-sms") {
        setActiveTab("security");
        setTimeout(() => {
          document.getElementById("bank-sms")?.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }
    }
  }, []);

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
    tasks: true,
    money: true,
  });

  // Cloud Budget Preferences & Daily Spending Limit State
  // Cloud Budget Preferences (used for AmbientQuickLogCard)
  const { data: cloudBudgetPrefs } = useBudgetPreferences();

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

  // Password Change State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Feature modals state
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [isReportIssueOpen, setIsReportIssueOpen] = useState(false);
  const [isUpdateCheckOpen, setIsUpdateCheckOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  // Reminders & Audio feedback states
  const [smartReminders, setSmartReminders] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [wakeUpAlarm, setWakeUpAlarm] = useState(true);
  const [completionSound, setCompletionSound] = useState<SoundEffectType>("tap");
  const [cloudSync, setCloudSync] = useState(true);

  // Native 1-Tap PWA Installation Support
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      toast.info(
        "To install on your phone: Tap browser menu (⋮) -> 'Add to Home screen' or 'Install App' 📱"
      );
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      toast.success("Invictus installed to your Home Screen! 🎉");
    }
    setDeferredPrompt(null);
  };

  const downloadCSVReport = (reportType: "habits" | "finance" | "tasks" | "bundle") => {
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
    if (reportType === "tasks" || reportType === "bundle") {
      csvContent += "Title,Priority,Status,DueDate\n";
      csvContent += "Launch MVP,p1,in_progress,2026-11-20\n";
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
          setModulesEnabled(data.modulesEnabled || { goals: true, tasks: true, money: true });
        } catch {}
      }
    } else {
      setDisplayName(user.displayName || "");
      setTimezone(user.timezone || "Asia/Kolkata");
      setWeekStartsOn(user.weekStartsOn ?? 1);
      setCurrency(user.currency || "INR");
      setModulesEnabled(user.modulesEnabled || { goals: true, tasks: true, money: true });
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

  const toggleModule = (mod: "goals" | "tasks" | "money") => {
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
          txRes,
          catRes,
          debtsRes,
          tasksRes,
          gymRes,
        ] = await Promise.allSettled([
          fetch(`/api/goals/habits?userId=${uid}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/goals/logs?userId=${uid}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/money/transactions?userId=${uid}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/money/categories?userId=${uid}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/money/debts?userId=${uid}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/tasks`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/gym/routines`).then((r) => (r.ok ? r.json() : null)),
        ]);

        cloudData = {
          habits: habitsRes.status === "fulfilled" ? habitsRes.value : null,
          habitLogs: logsRes.status === "fulfilled" ? logsRes.value : null,
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

  const handleBackNavigation = () => {
    soundFX.playPop();
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/today");
    }
  };

  return (
    <div className="w-full max-w-xl lg:max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-3 sm:space-y-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] select-none max-w-full overflow-x-hidden">
      {/* ================= SLOT 1: MOBILE APP BAR (Mobile Only) ================= */}
      <div className="-mx-2 -mt-2 sm:-mx-4 sm:-mt-4 lg:hidden">
        <MobileAppBar
          title="Settings"
          onBack={handleBackNavigation}
          dateShortLabel={`v${APP_VERSION_CONFIG.version}`}
          customMenuItems={
            <>
              <DropdownMenuItem
                onClick={() => {
                  soundFX.playPop();
                  setActiveTab("datavault");
                }}
                className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-heading font-black cursor-pointer hover:bg-secondary focus:bg-secondary"
              >
                <span className="flex items-center gap-2">
                  <Database className="size-3.5 stroke-[2] text-amber-500" />
                  Data Vault & Cloud Purge
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  soundFX.playPop();
                  handleExportBackup();
                }}
                className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-heading font-black cursor-pointer hover:bg-secondary focus:bg-secondary"
              >
                <span className="flex items-center gap-2">
                  <Download className="size-3.5 stroke-[2]" />
                  Export Vault Backup
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  soundFX.playPop();
                  setIsDiagnosticsOpen(true);
                }}
                className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-heading font-black cursor-pointer hover:bg-secondary focus:bg-secondary"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="size-3.5 stroke-[2]" />
                  System Diagnostics
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  soundFX.playPop();
                  setIsUpdateCheckOpen(true);
                }}
                className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-heading font-black cursor-pointer hover:bg-secondary focus:bg-secondary"
              >
                <span className="flex items-center gap-2">
                  <RefreshCw className="size-3.5 stroke-[2]" />
                  Check Updates
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  soundFX.playPop();
                  setPlayfulToastsEnabled(!playfulToastsEnabled);
                }}
                className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-heading font-black cursor-pointer hover:bg-secondary focus:bg-secondary"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="size-3.5 stroke-[2]" />
                  Playful Toasts
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {playfulToastsEnabled ? "ON" : "OFF"}
                </span>
              </DropdownMenuItem>
            </>
          }
        />
      </div>

      {/* Global Announcement Banner if active */}
      {activeAnnouncement && (
        <div className="bg-amber-100 dark:bg-amber-950/40 text-[#161514] dark:text-amber-200 rounded-2xl p-3 sm:p-4 shadow-xs flex items-start gap-3 border border-amber-300 dark:border-amber-800/50">
          <Megaphone className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="min-w-0">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              System Announcement
            </p>
            <p className="text-xs font-medium mt-0.5">{activeAnnouncement.message}</p>
          </div>
        </div>
      )}

      {/* ================= SLOT 2: SEGMENTED SUBNAV ================= */}
      <SegmentedSubNav
        tabs={SETTINGS_SUBNAV_TABS}
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as SettingsTab)}
        sticky={false}
      />

      {/* ================= MAIN CONTENT: RESPONSIVE BENTO ================= */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-6 items-start">
        {/* LEFT COLUMN: HERO SUMMARY + ACTIVE CONFIGURATION CANVAS */}
        <div className="lg:col-span-8 space-y-3 sm:space-y-4">
          {/* ================= SLOT 3: BORDERLESS HERO SUMMARY ================= */}
          <SettingsHeroSummary
            displayName={displayName}
            isGuest={isGuestActive}
            userEmail={user?.email}
            storageKb={storageMetrics.kb}
            currency={currency}
            timezone={timezone}
            version={APP_VERSION_CONFIG.version}
            onSelectTab={(tab) => setActiveTab(tab)}
          />

          {/* ================= SLOT 4: DOOR TILE ROW (Mobile Only) ================= */}
          <div className="lg:hidden">
            <SettingsDoorTileRow
              storageKb={storageMetrics.kb}
              onOpenReminders={() => setIsRemindersOpen(true)}
              onOpenTheme={() => {
                setActiveTab("preferences");
                setIsAppearanceOpen(true);
                setTimeout(() => {
                  document.getElementById("theme-settings")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              onOpenBackup={handleExportBackup}
              onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
            />
          </div>

          {/* ================= SLOT 5: ACTIVE TAB CONFIGURATION CANVAS ================= */}
          {/* TAB 1: GENERAL PREFERENCES */}
          {activeTab === "preferences" && (
            <div className="bg-white dark:bg-[#161514] rounded-3xl p-4 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-[#E8E5DF] dark:border-[#2A2724] pb-3">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-amber-500 stroke-[2.5]" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-[#161514]/70 dark:text-[#FAF8F5]/60 font-heading">
                    Account & Regional Preferences
                  </h2>
                </div>
                <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                  General
                </span>
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
                    placeholder="e.g. Lucky Manoj"
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
                <div className="space-y-1.5 pt-1">
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
                        onClick={() => {
                          soundFX.playPop();
                          setWeekStartsOn(opt.value);
                        }}
                        className={cn(
                          "flex-1 rounded-xl border py-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs",
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

                {/* Interface Theme & Appearance Accordion on Mobile (Always Open on Desktop) */}
                <div id="theme-settings" className="border-t border-[#E8E5DF] dark:border-[#2A2724] pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setIsAppearanceOpen(!isAppearanceOpen);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] hover:bg-white dark:hover:bg-[#252220] transition-colors cursor-pointer lg:hidden"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Palette className="size-4 stroke-[2.5]" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5] uppercase tracking-wide block">
                          Appearance & Sound
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          Themes, Colors & Audio Feedback
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground">
                        {isAppearanceOpen ? "Hide" : "Customize"}
                      </span>
                      {isAppearanceOpen ? (
                        <ChevronUp className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  <div className={cn("space-y-4 pt-3 lg:pt-0", !isAppearanceOpen && "hidden lg:block")}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block font-heading">
                          Interface Theme & Appearance
                        </span>
                      </div>
                      <ThemeToggle variant="segmented" />
                    </div>

                    {/* Color Palette & Action Punch Theme Selector */}
                    <ThemeColorSelector className="pt-2 border-t border-[#E8E5DF]/60 dark:border-[#2A2724]/60" />

                    {/* Completion Sound Selector */}
                    <div className="space-y-2 border-t border-[#E8E5DF] dark:border-[#2A2724] pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5 font-heading">
                            <Volume2 className="h-3.5 w-3.5 stroke-[2.5]" /> Habit Audio Feedback
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {[
                          { type: "tap" as const, label: "Crisp Pop", icon: "🎵" },
                          { type: "chime" as const, label: "Chords", icon: "🎶" },
                          { type: "haptic" as const, label: "Thud", icon: "🥊" },
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
                  </div>
                </div>

                {/* Playful Toast Feedback Toggle */}
                <div className="space-y-1.5 flex items-center justify-between border-t border-[#E8E5DF] dark:border-[#2A2724] pt-4">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block font-heading">
                      Playful Toast Feedback
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setPlayfulToastsEnabled(!playfulToastsEnabled);
                    }}
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
                onClick={() => {
                  soundFX.playPop();
                  handleSave();
                }}
                disabled={saving}
                className="w-full bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-fg)] font-black rounded-2xl py-3.5 border-2 border-[var(--btn-primary-border)] shadow-[3px_3px_0px_0px_var(--btn-primary-shadow)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all uppercase tracking-wider"
              >
                <Save className="h-4 w-4 mr-2 stroke-[2.5]" />
                {saving ? "Saving Preferences…" : "Save Preferences"}
              </Button>
            </div>
          )}

          {/* TAB 2: SPACES & WORKSPACES */}
          {activeTab === "modules" && (
            <div className="bg-white dark:bg-[#161514] rounded-3xl p-4 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-[#E8E5DF] dark:border-[#2A2724] pb-3">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="size-4 text-amber-500 stroke-[2.5]" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-[#161514]/70 dark:text-[#FAF8F5]/60 font-heading">
                    Active Spaces & Workspaces
                  </h2>
                </div>
                <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                  Workspaces
                </span>
              </div>

              {/* Active Workspace Switches */}
              <div className="space-y-3">
                {[
                  { key: "goals" as const, label: "Goals & Habits Space", desc: "Streaks, gym tracking & nutrition", Icon: Target },
                  { key: "tasks" as const, label: "Tasks & Projects Space", desc: "Kanban board, priorities & subtasks", Icon: Kanban },
                  { key: "money" as const, label: "Money & Ledger Space", desc: "Daily spending, budgets & SMS telemetry", Icon: Wallet },
                ].map(({ key, label, desc, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      toggleModule(key);
                    }}
                    className={cn(
                      "w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 shadow-xs cursor-pointer",
                      modulesEnabled[key]
                        ? "bg-[#FAF8F5] dark:bg-[#1C1A18] border-[#161514] dark:border-white/30"
                        : "bg-white dark:bg-[#161514] border-[#E8E5DF] dark:border-[#2A2724] opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "size-10 rounded-xl border flex items-center justify-center shrink-0 shadow-xs",
                          modulesEnabled[key]
                            ? "bg-[#CEF431] border-[#161514] text-[#161514]"
                            : "bg-[#E8E5DF] dark:bg-[#252220] border-transparent text-[#8C8882]"
                        )}
                      >
                        <Icon className="size-5 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-heading font-black text-xs text-[#161514] dark:text-[#FAF8F5] uppercase tracking-wide leading-tight break-words">
                          {label}
                        </h4>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                        modulesEnabled[key]
                          ? "bg-[#161514] border-[#161514] text-white dark:bg-white dark:border-white dark:text-[#161514]"
                          : "border-[#8C8882] bg-transparent"
                      )}
                    >
                      {modulesEnabled[key] && <Check className="size-3 stroke-[3]" />}
                    </div>
                  </button>
                ))}
              </div>

              {/* Ambient Zero-App Quick-Log & Pull-Down Notification Shade Configuration */}
              <div className="border-t border-[#E8E5DF] dark:border-[#2A2724] pt-4">
                <AmbientQuickLogCard
                  safeDailyPace={cloudBudgetPrefs?.customDailyBudget || 657}
                  currencySymbol={currencySymbol}
                />
              </div>

              <Button
                onClick={() => {
                  soundFX.playPop();
                  handleSave();
                }}
                disabled={saving}
                className="w-full bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-fg)] font-black rounded-2xl py-3.5 border-2 border-[var(--btn-primary-border)] shadow-[3px_3px_0px_0px_var(--btn-primary-shadow)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all uppercase tracking-wider"
              >
                <Save className="h-4 w-4 mr-2 stroke-[2.5]" />
                {saving ? "Saving Configuration…" : "Save Workspace Configuration"}
              </Button>
            </div>
          )}

          {/* TAB 3: ALERTS & SCHEDULE */}
          {activeTab === "reminders" && (
            <div className="bg-white dark:bg-[#161514] rounded-3xl p-4 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-[#E8E5DF] dark:border-[#2A2724] pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="size-4 text-amber-500 stroke-[2.5]" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-[#161514]/70 dark:text-[#FAF8F5]/60 font-heading">
                    Alerts & Daily Schedule
                  </h2>
                </div>
                <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                  Alerts
                </span>
              </div>

              {/* GLOBAL WAKE-UP CARD */}
              <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-2xl p-4 sm:p-5 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-xl bg-amber-400 border border-[#161514] flex items-center justify-center text-[#161514] shadow-xs">
                      <AlarmClock className="size-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-xs uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]">
                        Global Wake-Up Schedule
                      </h3>
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
                          : "border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#252220] text-[#161514]/60 dark:text-[#FAF8F5]/50"
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
                          : "border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#252220] text-[#161514]/60 dark:text-[#FAF8F5]/50"
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
                    soundFX.playCompleteChime();
                    toast.success(`Global Wake-Up updated to ${wakeHour}:${wakeMinute} ${wakePeriod}! ⏰`);
                  }}
                  className="w-full bg-[#161514] dark:bg-white text-white dark:text-[#161514] hover:bg-[#2a2725] dark:hover:bg-neutral-100 font-black text-xs uppercase tracking-widest py-3 px-4 rounded-xl border border-[#161514] dark:border-white shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all"
                >
                  Update Wake-Up Schedule
                </button>
              </div>

              {/* Daily Log Reminders Manager Trigger */}
              <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-2xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 rounded-xl bg-purple-100 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 flex items-center justify-center text-purple-700 dark:text-purple-400 shadow-xs shrink-0">
                    <Bell className="size-5 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-heading font-black text-xs uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] leading-snug break-words">
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
                      {(!reminderConfig ||
                        (!reminderConfig.habitsEnabled &&
                          !reminderConfig.moneyEnabled)) && (
                        <span className="text-[10px] text-[#8C8882] dark:text-[#A8A29E] font-medium">
                          No reminders active • Tap to set times
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setIsRemindersOpen(true);
                  }}
                  className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-[#161514] dark:border-white bg-[#161514] dark:bg-white text-white dark:text-[#161514] font-black text-xs uppercase shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shrink-0 text-center"
                >
                  Configure
                </button>
              </div>

              {/* Notification & Sync Toggles */}
              <div className="space-y-3 border-t border-[#E8E5DF] dark:border-[#2A2724] pt-4">
                {/* Push Notifications */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] shadow-xs gap-3">
                  <div className="min-w-0">
                    <h4 className="font-heading font-black text-xs text-[#161514] dark:text-[#FAF8F5] uppercase">
                      Web Push Notifications
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {pushNotifications && (
                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playPop();
                          triggerTestPushNotification(user?.uid);
                        }}
                        className="bg-white dark:bg-[#252220] text-[#161514] dark:text-[#FAF8F5] font-black text-[10px] uppercase px-2.5 py-1.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all"
                      >
                        Test Ping
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playPop();
                        const nextVal = !pushNotifications;
                        setPushNotifications(nextVal);
                        localStorage.setItem("invictus_push_notifications", String(nextVal));
                        if (nextVal) enableWebPushNotifications(user?.uid);
                        toast.success(`Push Notifications ${nextVal ? "ENABLED 🔔" : "MUTED"}`);
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] shadow-xs gap-3">
                  <div className="min-w-0">
                    <h4 className="font-heading font-black text-xs text-[#161514] dark:text-[#FAF8F5] uppercase">
                      Smart Daily Reminders
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      const nextVal = !smartReminders;
                      setSmartReminders(nextVal);
                      localStorage.setItem("invictus_smart_reminders", String(nextVal));
                      toast.success(`Smart Reminders ${nextVal ? "ENABLED ⚡" : "DISABLED"}`);
                    }}
                    className={cn(
                      "font-black text-xs px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer shadow-xs shrink-0",
                      smartReminders
                        ? "bg-[#CEF431] text-[#161514] border-[#161514]"
                        : "border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#252220] text-[#161514]/60 dark:text-[#FAF8F5]/50"
                    )}
                  >
                    {smartReminders ? "ON" : "OFF"}
                  </button>
                </div>

                {/* Cloud Sync */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] shadow-xs gap-3">
                  <div className="min-w-0">
                    <h4 className="font-heading font-black text-xs text-[#161514] dark:text-[#FAF8F5] uppercase">
                      Cloud Vault Synchronization
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      const nextVal = !cloudSync;
                      setCloudSync(nextVal);
                      localStorage.setItem("invictus_cloud_sync", String(nextVal));
                      toast.success(`Cloud Sync ${nextVal ? "ENABLED (Connected) ☁️" : "DISABLED"}`);
                    }}
                    className={cn(
                      "font-black text-xs px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer shadow-xs shrink-0",
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

          {/* TAB 4: SECURITY & AUTH */}
          {activeTab === "security" && (
            <div className="bg-white dark:bg-[#161514] rounded-3xl p-4 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-[#E8E5DF] dark:border-[#2A2724] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-amber-500 stroke-[2.5]" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-[#161514]/70 dark:text-[#FAF8F5]/60 font-heading">
                    Security & Session Management
                  </h2>
                </div>
                <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                  Security
                </span>
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
                    Cryptographic Engine
                  </span>
                  <span className="text-[10px] font-black text-emerald-950 dark:text-emerald-300 bg-emerald-200 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-400/50">
                    SHA-256 Auth & AES-256 Vault
                  </span>
                </div>
              </div>

              {/* Password Change Form or Guest Prompt */}
              {isGuestActive ? (
                <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/30 text-xs font-medium text-amber-800 dark:text-amber-200 space-y-1">
                  <p className="font-heading font-black uppercase tracking-wider">Guest Session Active</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    You are exploring Invictus in air-gapped guest mode. Register an account to enable password-protected cloud synchronization!
                  </p>
                </div>
              ) : user ? (
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
              ) : null}

              {/* Bank SMS Telemetry & Engine Section */}
              <div id="bank-sms" className="border-t border-[#E8E5DF] dark:border-[#2A2724] pt-4">
                <BankSmsSettingsSection />
              </div>

              {/* Danger Zone: Sign Out & Clear/Delete Account */}
              <div className="space-y-3 pt-3 border-t border-rose-200 dark:border-rose-900/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <h4 className="font-heading font-black text-xs text-rose-600 dark:text-rose-400 uppercase">
                      Session Control
                    </h4>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      soundFX.playPop();
                      signOut();
                    }}
                    className="w-full sm:w-auto rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 bg-white dark:bg-[#252220] hover:bg-rose-50 shadow-xs cursor-pointer gap-1.5 text-xs font-black uppercase tracking-wider transition-all shrink-0"
                  >
                    <UserX className="size-3.5 stroke-[2.5]" />
                    Sign Out
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-rose-100 dark:border-rose-950/40 gap-3">
                  <div className="min-w-0">
                    <h4 className="font-heading font-black text-xs text-rose-600 dark:text-rose-400 uppercase">
                      {isGuestActive ? "Purge Guest Session" : "Delete Cloud Data & Account"}
                    </h4>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      soundFX.playPop();
                      setShowDeleteFirebase(true);
                    }}
                    className="w-full sm:w-auto rounded-xl bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 shadow-xs cursor-pointer gap-1.5 text-xs font-black uppercase tracking-wider transition-all shrink-0"
                  >
                    <Trash2 className="size-3.5 stroke-[2.5]" />
                    {isGuestActive ? "Clear Guest" : "Delete Cloud Data"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DATA VAULT & BACKUPS */}
          {activeTab === "datavault" && (
            <div className="bg-white dark:bg-[#161514] rounded-3xl p-4 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-[#E8E5DF] dark:border-[#2A2724] pb-3">
                <div className="flex items-center gap-2">
                  <Database className="size-4 text-amber-500 stroke-[2.5]" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-[#161514]/70 dark:text-[#FAF8F5]/60 font-heading">
                    Data Vault & Snapshots
                  </h2>
                </div>
                <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                  Vault
                </span>
              </div>

              {/* Storage Allocation Meter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#161514] dark:text-[#FAF8F5]">
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="size-3.5 text-amber-500 stroke-[2.5]" /> Local Vault Storage
                  </span>
                  <span className="font-mono text-[11px] text-[#8C8882] dark:text-[#A8A29E]">
                    {storageMetrics.kb} KB / 5120 KB ({storageMetrics.percent}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-full overflow-hidden border border-[#E8E5DF] dark:border-[#2A2724]">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${Math.max(2, storageMetrics.percent)}%` }}
                  />
                </div>
              </div>

              {/* Evaluator Demo Data Showcase (Exclusively for Guests & Evaluators) */}
              {isGuestActive && (
                <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-2xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-amber-500 stroke-[2.5]" />
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
                      <span className={cn("size-1.5 rounded-full", isDemoActive ? "bg-[#161514]" : "bg-neutral-400")} />
                      {isDemoActive ? "Showcase Loaded" : "Blank Canvas"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearDemoData}
                      className="rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 bg-white dark:bg-[#252220] hover:bg-rose-50 shadow-xs cursor-pointer gap-1.5 text-xs font-black uppercase tracking-wider transition-all"
                    >
                      <Trash2 className="size-3.5 stroke-[2.5]" />
                      Delete Demo Data
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleLoadDemoData}
                      className="rounded-xl bg-[#CEF431] hover:bg-[#bce028] text-[#161514] border border-[#161514] shadow-xs cursor-pointer gap-1.5 text-xs font-black uppercase tracking-wider transition-all"
                    >
                      <Sparkles className="size-3.5 stroke-[2.5]" />
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
                      <h4 className="font-heading font-black text-xs text-[#161514] dark:text-[#FAF8F5] uppercase">
                        Export Encrypted Vault
                      </h4>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isExporting}
                      onClick={handleExportBackup}
                      className="w-full rounded-xl bg-[#161514] dark:bg-white text-white dark:text-[#161514] hover:bg-[#2a2725] dark:hover:bg-neutral-100 shadow-xs cursor-pointer gap-1.5 text-xs font-black uppercase tracking-wider transition-all"
                    >
                      <Download className="size-3.5 stroke-[2.5]" />
                      {isExporting ? "Exporting…" : "Export Vault (.invictus.json)"}
                    </Button>
                  </div>

                  {/* Restore */}
                  <div className="p-4 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] shadow-xs flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-heading font-black text-xs text-[#161514] dark:text-[#FAF8F5] uppercase">
                        Restore from Vault
                      </h4>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isImporting}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full rounded-xl border border-[#161514] dark:border-white text-[#161514] dark:text-[#FAF8F5] bg-white dark:bg-[#252220] hover:bg-neutral-50 shadow-xs cursor-pointer gap-1.5 text-xs font-black uppercase tracking-wider transition-all"
                    >
                      <Upload className="size-3.5 stroke-[2.5]" />
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

              {/* Data Export (CSV) */}
              <div className="space-y-2 border-t border-[#E8E5DF] dark:border-[#2A2724] pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] shadow-xs gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-xl bg-amber-400 border border-[#161514] flex items-center justify-center text-[#161514] shadow-xs shrink-0">
                      <BarChart3 className="size-4 stroke-[2.5]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-heading font-black text-xs text-[#161514] dark:text-[#FAF8F5] uppercase">
                        Spreadsheet Export (CSV)
                      </h4>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setIsCSVModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-[#161514] dark:border-white bg-[#161514] dark:bg-white text-white dark:text-[#161514] font-black text-xs uppercase shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shrink-0 text-center"
                  >
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Clear Local Cache */}
              <div className="space-y-2 border-t border-[#E8E5DF] dark:border-[#2A2724] pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] shadow-xs gap-3">
                  <div className="min-w-0">
                    <h4 className="font-heading font-black text-xs text-[#161514] dark:text-[#FAF8F5] uppercase">
                      Local Offline Cache
                    </h4>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      soundFX.playPop();
                      setShowClearConfirm(true);
                    }}
                    className="w-full sm:w-auto rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 bg-white dark:bg-[#252220] hover:bg-rose-50 shadow-xs cursor-pointer gap-1.5 text-xs font-black uppercase tracking-wider transition-all shrink-0"
                  >
                    <Trash2 className="size-3.5 stroke-[2.5]" />
                    Clear Cache
                  </Button>
                </div>
              </div>

              {/* Danger Zone: Cloud Database Purge */}
              <div className="space-y-2 border-t border-rose-200 dark:border-rose-900/40 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 shadow-xs gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Trash2 className="size-4 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                      <h4 className="font-heading font-black text-xs text-rose-600 dark:text-rose-400 uppercase">
                        Delete Cloud Data for User
                      </h4>
                      <span className="text-[9px] font-mono font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                        IRREVERSIBLE
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      soundFX.playPop();
                      setShowDeleteFirebase(true);
                    }}
                    className="w-full sm:w-auto rounded-xl border border-rose-400 dark:border-rose-800 text-white bg-rose-600 hover:bg-rose-700 shadow-xs cursor-pointer gap-1.5 text-xs font-black uppercase tracking-wider transition-all shrink-0"
                  >
                    <Trash2 className="size-3.5 stroke-[2.5]" />
                    Delete Cloud Data
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DESKTOP BENTO DOCK (Laptop / Widescreen Only) */}
        <div className="hidden lg:flex lg:col-span-4 flex-col space-y-4">
          {/* Bento Card 1: System Health & Diagnostics */}
          <div className="bg-white dark:bg-[#161514] rounded-3xl p-5 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E5DF] dark:border-[#2A2724] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-sky-500 stroke-[2.5]" />
                <h3 className="font-heading font-black text-xs uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]">
                  System Diagnostics
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Healthy
              </span>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  soundFX.playPop();
                  setIsDiagnosticsOpen(true);
                }}
                className="w-full justify-between rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] hover:bg-secondary text-xs font-heading font-black uppercase"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-sky-500" />
                  Run Diagnostics Report
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  soundFX.playPop();
                  setIsUpdateCheckOpen(true);
                }}
                className="w-full justify-between rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] hover:bg-secondary text-xs font-heading font-black uppercase"
              >
                <span className="flex items-center gap-2">
                  <RefreshCw className="size-4 text-amber-500" />
                  Check Engine Updates
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  soundFX.playPop();
                  setIsReportIssueOpen(true);
                }}
                className="w-full justify-between rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] hover:bg-secondary text-xs font-heading font-black uppercase"
              >
                <span className="flex items-center gap-2">
                  <LifeBuoy className="size-4 text-rose-500" />
                  Report Issue / Bug
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Bento Card 2: 1-Tap PWA & Native Android */}
          <div className="bg-white dark:bg-[#161514] rounded-3xl p-5 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-[#CEF431] border border-[#161514] flex items-center justify-center text-[#161514] shadow-xs shrink-0">
                <Smartphone className="size-4 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="font-heading font-black text-xs uppercase text-[#161514] dark:text-[#FAF8F5]">
                  Install Invictus
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleInstallPWA}
                className="bg-[#CEF431] hover:bg-[#bce028] text-[#161514] font-black text-xs uppercase py-2 px-3 rounded-xl border border-[#161514] shadow-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Smartphone className="size-3.5" />
                <span>Install PWA</span>
              </button>

              <a
                href="/api/download/android"
                onClick={handleDownloadApk}
                className="bg-white dark:bg-[#252220] hover:bg-neutral-50 text-[#161514] dark:text-[#FAF8F5] font-black text-xs uppercase py-2 px-3 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Download className="size-3.5" />
                <span>APK (v{APP_VERSION_CONFIG.version})</span>
              </a>
            </div>
          </div>

          {/* Bento Card 3: Developer Info Card */}
          <DeveloperInfoCard />
        </div>
      </div>

      {/* ================= MODALS & CONFIRMATION DIALOGS ================= */}
      {/* Clear Cache Confirmation Dialog */}
      <ResponsiveFormContainer
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title="⚠️ Clear Local Cache?"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Purge offline cache on this browser? Your cloud database records remain intact.
          </p>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowClearConfirm(false)}
              className="rounded-xl font-heading font-black text-xs uppercase"
            >
              Cancel
            </Button>
            <Button
              onClick={handleClearLocalData}
              className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-heading font-black text-xs uppercase"
            >
              Confirm Clear
            </Button>
          </div>
        </div>
      </ResponsiveFormContainer>

      {/* Delete Account & Cloud Data Confirmation Dialog */}
      <ResponsiveFormContainer
        open={showDeleteFirebase}
        onOpenChange={setShowDeleteFirebase}
        title="🚨 Delete Cloud Data & Account"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-rose-600 dark:text-rose-400 font-bold leading-relaxed">
            Irreversible. Permanently purges all cloud habits, finances, tasks, and workouts.
          </p>
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Type &quot;DELETE&quot; to proceed:
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-4 py-2.5 text-xs font-mono font-black text-rose-600 dark:text-rose-400 outline-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDeleteFirebase(false)}
              className="rounded-xl font-heading font-black text-xs uppercase"
            >
              Cancel
            </Button>
            <Button
              disabled={deleteConfirmText !== "DELETE" || isDeleting}
              onClick={handleDeleteFirebaseData}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-heading font-black text-xs uppercase disabled:opacity-50"
            >
              {isDeleting ? "Deleting…" : "Delete Cloud Data"}
            </Button>
          </div>
        </div>
      </ResponsiveFormContainer>

      {/* CSV Exporter Modal */}
      <ResponsiveFormContainer
        open={isCSVModalOpen}
        onOpenChange={setIsCSVModalOpen}
        title="Data Export (CSV)"
      >
        <div className="space-y-3 pt-2">
          {[
            {
              title: "🌱 Habits & Streaks CSV Report",
              type: "habits" as const,
            },
            {
              title: "💰 Financial Ledger CSV Report",
              type: "finance" as const,
            },
            {
              title: "📋 Tasks & Projects CSV Report",
              type: "tasks" as const,
            },
            {
              title: "📦 Lifetime Master Bundle CSV",
              type: "bundle" as const,
            },
          ].map((rep, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#161514] rounded-2xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center justify-between gap-3"
            >
              <h5 className="font-heading font-black text-xs text-[#161514] dark:text-[#FAF8F5]">
                {rep.title}
              </h5>
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
  );
}
