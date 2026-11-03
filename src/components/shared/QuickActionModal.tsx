"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useAddTransaction, useCategories } from "@/lib/queries/money";
import { useHabits, useHabitLogs, useToggleHabitLog, useStreaks } from "@/lib/queries/goals";
import { useUIStore } from "@/store/ui-store";
import { detectCategoryFromNote } from "@/lib/utils/merchant-categorizer";
import { cn } from "@/lib/utils";
import { X, Check, Zap } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const QUICK_PRESETS = [50, 100, 200, 500, 1000, 2000];

const DEFAULT_CATEGORIES = [
  { id: "cat-food", name: "Food", icon: "🍔", color: "bg-coral-200" },
  { id: "cat-transport", name: "Travel", icon: "🚕", color: "bg-amber-200" },
  { id: "cat-groceries", name: "Groceries", icon: "🛒", color: "bg-emerald-200" },
  { id: "cat-bills", name: "Bills", icon: "💡", color: "bg-sky-200" },
  { id: "cat-leisure", name: "Fun", icon: "🍿", color: "bg-purple-200" },
  { id: "cat-health", name: "Health", icon: "💊", color: "bg-rose-200" },
  { id: "cat-work", name: "Work", icon: "💼", color: "bg-indigo-200" },
  { id: "cat-other", name: "Other", icon: "📦", color: "bg-gray-200" },
];

const PAYMENT_METHODS = [
  { id: "upi", label: "⚡ UPI / GPay" },
  { id: "card", label: "💳 Card" },
  { id: "cash", label: "💵 Cash" },
];

export function QuickActionModal() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { selectedDate } = useUIStore();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"expense" | "habits">("expense");
  const [sessionLoggedCount, setSessionLoggedCount] = useState(0);

  // Expense form state
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState("cat-food");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Queries & Mutations
  const { data: dbCategories = [] } = useCategories();
  const addTransactionMutation = useAddTransaction();
  const { data: habits = [] } = useHabits();
  const { data: logs = [] } = useHabitLogs(selectedDate);
  const { data: streaks = {} } = useStreaks();
  const toggleHabitMutation = useToggleHabitLog();

  // Watch URL params & direct URL on mount/navigation
  useEffect(() => {
    const checkAction = () => {
      const action = searchParams.get("action");
      if (action === "quick-expense" || action === "add-expense") {
        setActiveTab("expense");
        setIsOpen(true);
        return;
      } else if (action === "quick-habit" || action === "check-habits") {
        setActiveTab("habits");
        setIsOpen(true);
        return;
      }

      if (typeof window !== "undefined") {
        const href = window.location.href;
        if (href.includes("action=quick-expense") || href.includes("quick-expense")) {
          setActiveTab("expense");
          setIsOpen(true);
        } else if (href.includes("action=quick-habit") || href.includes("quick-habit")) {
          setActiveTab("habits");
          setIsOpen(true);
        }
      }
    };

    checkAction();
    window.addEventListener("popstate", checkAction);
    window.addEventListener("hashchange", checkAction);
    return () => {
      window.removeEventListener("popstate", checkAction);
      window.removeEventListener("hashchange", checkAction);
    };
  }, [searchParams]);

  // Capacitor native deep-link listener
  useEffect(() => {
    let handle: any = null;
    const setupCapacitor = async () => {
      try {
        const { App } = await import("@capacitor/app");
        handle = await App.addListener("appUrlOpen", (data: any) => {
          if (data?.url) {
            if (data.url.includes("quick-expense") || data.url.includes("action=quick-expense")) {
              setActiveTab("expense");
              setIsOpen(true);
            } else if (data.url.includes("quick-habit") || data.url.includes("action=quick-habit")) {
              setActiveTab("habits");
              setIsOpen(true);
            }
          }
        });
      } catch {}
    };
    setupCapacitor();
    return () => {
      if (handle?.remove) handle.remove();
    };
  }, []);

  // Keyboard shortcut listener (Ctrl+E or Cmd+E for expense, Ctrl+K or Cmd+K for general actions)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "e" || e.key.toLowerCase() === "k")) {
        e.preventDefault();
        if (e.key.toLowerCase() === "e") {
          setActiveTab("expense");
        }
        setIsOpen((prev) => !prev);
      }
    };

    const handleCustomOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: "expense" | "habits" }>;
      if (customEvent.detail?.tab) {
        setActiveTab(customEvent.detail.tab);
      }
      setIsOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("invictus:open-quick-actions", handleCustomOpen);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("invictus:open-quick-actions", handleCustomOpen);
    };
  }, []);

  // Auto focus amount input on open
  useEffect(() => {
    if (isOpen && activeTab === "expense") {
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, activeTab]);

  // Auto-categorize when user types note (e.g. Swiggy -> Food, Uber -> Transport)
  const handleNoteChange = (text: string) => {
    setNote(text);
    const matched = detectCategoryFromNote(text, dbCategories.length > 0 ? dbCategories : DEFAULT_CATEGORIES);
    if (matched?.categoryId) {
      setCategoryId(matched.categoryId);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setAmount("");
    setNote("");
    setSessionLoggedCount(0);
    // Clean up search query param cleanly without reloading
    if (searchParams.get("action")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      const newQuery = params.toString() ? `?${params.toString()}` : "";
      router.replace(`${pathname}${newQuery}`);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount (₹) 💰");
      return;
    }

    try {
      // Trigger Haptic feedback if on mobile
      try {
        const capacitor = (window as any).Capacitor;
        if (capacitor?.Plugins?.Haptics) {
          await capacitor.Plugins.Haptics.impact({ style: "MEDIUM" });
        }
      } catch {}

      await addTransactionMutation.mutateAsync({
        date: selectedDate || format(new Date(), "yyyy-MM-dd"),
        amount: numAmount,
        type: "expense",
        categoryId,
        note: note.trim() || "Quick Expense",
        paymentMethod,
        isRecurring: false,
      });

      setSessionLoggedCount((prev) => prev + 1);
      toast.success(`Logged ₹${numAmount.toLocaleString("en-IN")} expense! 💸`);
      
      // Clear input fields for seamless successive entries
      setAmount("");
      setNote("");

      // Automatically re-focus numeric input
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 60);
    } catch {
      toast.error("Failed to log expense");
    }
  };

  const handleToggleHabit = async (habitId: string, isDone: boolean) => {
    try {
      try {
        const capacitor = (window as any).Capacitor;
        if (capacitor?.Plugins?.Haptics) {
          await capacitor.Plugins.Haptics.impact({ style: "LIGHT" });
        }
      } catch {}

      await toggleHabitMutation.mutateAsync({
        habitId,
        date: selectedDate || format(new Date(), "yyyy-MM-dd"),
        completed: !isDone,
      });

      toast.success(!isDone ? "Habit checked! Streak glowing 🔥" : "Check removed");
    } catch {
      toast.error("Failed to update habit");
    }
  };

  const isHabitCompleted = (habitId: string) => {
    return logs.some((l) => l.habitId === habitId && l.completed);
  };

  const modalBody = (
    <div className="space-y-4">
      {/* Segmented Tab Switcher */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-[#F1EFEA] dark:bg-[#252321] rounded-xl border border-[#E8E5DF] dark:border-[#383531]">
        <button
          type="button"
          onClick={() => setActiveTab("expense")}
          className={cn(
            "py-1.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === "expense"
              ? "bg-white dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#383531] shadow-xs font-semibold"
              : "text-[#8C8882] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5]"
          )}
        >
          <span>Quick Expense</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("habits")}
          className={cn(
            "py-1.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === "habits"
              ? "bg-white dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#383531] shadow-xs font-semibold"
              : "text-[#8C8882] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5]"
          )}
        >
          <span>Check Habits ({habits.length})</span>
        </button>
      </div>

      {activeTab === "expense" ? (
        /* Quick Expense Form */
        <form onSubmit={handleExpenseSubmit} className="space-y-4 pt-1">
          {sessionLoggedCount > 0 && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-300 text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{sessionLoggedCount} {sessionLoggedCount === 1 ? "expense" : "expenses"} logged</span>
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="text-[11px] font-medium px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 hover:bg-emerald-200 dark:hover:bg-emerald-800 text-emerald-950 dark:text-emerald-200 rounded-md border border-emerald-300 dark:border-emerald-700 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          )}

          {/* Currency Amount Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#8C8882] dark:text-[#A8A29E]">
              Amount (₹) *
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-2xl font-mono font-bold text-[#161514] dark:text-[#CEF431] select-none">
                ₹
              </span>
              <input
                ref={amountInputRef}
                type="number"
                step="any"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-[#FAF8F5] dark:bg-[#121110] rounded-xl border border-[#E8E5DF] dark:border-[#383531] pl-9 pr-4 py-2.5 text-2xl font-mono font-bold text-[#161514] dark:text-[#FAF8F5] outline-none shadow-xs focus:border-[#161514] dark:focus:border-[#CEF431] focus:bg-white dark:focus:bg-[#1C1A18] transition-all placeholder:text-[#161514]/25 dark:placeholder:text-[#FAF8F5]/30"
                required
              />
            </div>
          </div>

          {/* Quick Amount Presets */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {QUICK_PRESETS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  const current = parseFloat(amount) || 0;
                  setAmount(String(current + val));
                }}
                className="px-2.5 py-1 bg-white dark:bg-[#252321] hover:bg-[#F1EFEA] dark:hover:bg-[#2A2724] text-[#161514] dark:text-[#FAF8F5] font-mono font-medium text-xs rounded-md border border-[#E8E5DF] dark:border-[#383531] shadow-xs transition-colors cursor-pointer shrink-0"
              >
                +₹{val}
              </button>
            ))}
          </div>

          {/* Category Selector Grid */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#8C8882] dark:text-[#A8A29E]">
              Category
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {DEFAULT_CATEGORIES.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={cn(
                      "p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer",
                      isSelected
                        ? "bg-[#161514] dark:bg-[#CEF431] text-white dark:text-[#161514] border-[#161514] dark:border-[#CEF431] shadow-xs"
                        : "bg-white dark:bg-[#252321] hover:bg-[#FAF8F5] dark:hover:bg-[#2A2724] text-[#161514] dark:text-[#FAF8F5] border-[#E8E5DF] dark:border-[#383531]"
                    )}
                  >
                    <span className="text-sm">{cat.icon}</span>
                    <span className="text-[10px] font-medium truncate w-full text-center">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note / Merchant Input with Auto-Categorization */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#8C8882] dark:text-[#A8A29E]">
              Note / Merchant (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="e.g. Swiggy, Metro, Grocery, Coffee"
              className="w-full bg-[#FAF8F5] dark:bg-[#121110] rounded-xl border border-[#E8E5DF] dark:border-[#383531] px-3.5 py-2 text-xs sm:text-sm font-medium text-[#161514] dark:text-[#FAF8F5] outline-none shadow-xs focus:border-[#161514] dark:focus:border-[#CEF431] focus:bg-white dark:focus:bg-[#1C1A18] transition-all placeholder:text-[#8C8882] dark:placeholder:text-[#A8A29E]/60"
            />
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#8C8882] dark:text-[#A8A29E]">
              Payment Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id)}
                  className={cn(
                    "py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer shadow-xs",
                    paymentMethod === pm.id
                      ? "bg-[#161514] dark:bg-[#CEF431] text-white dark:text-[#161514] border-[#161514] dark:border-[#CEF431]"
                      : "bg-white dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] border-[#E8E5DF] dark:border-[#383531] hover:bg-[#FAF8F5] dark:hover:bg-[#2A2724]"
                  )}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tactile Submit Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={addTransactionMutation.isPending}
              className="flex-1 bg-[#161514] dark:bg-[#CEF431] hover:bg-neutral-800 dark:hover:bg-[#b5da28] text-white dark:text-[#161514] font-medium text-xs rounded-xl py-3 shadow-xs cursor-pointer transition-colors flex items-center justify-center gap-2 font-heading font-black"
            >
              <Zap className="size-3.5 stroke-[1.75]" />
              <span>
                {addTransactionMutation.isPending
                  ? "Logging..."
                  : sessionLoggedCount > 0
                  ? amount
                    ? `Log Another (₹${amount})`
                    : "Log Another Entry"
                  : amount
                  ? `Log Expense (₹${amount})`
                  : "Log Expense"}
              </span>
            </button>

            {sessionLoggedCount > 0 && (
              <button
                type="button"
                onClick={handleClose}
                className="px-4 bg-white dark:bg-[#252321] hover:bg-[#FAF8F5] dark:hover:bg-[#2A2724] text-[#161514] dark:text-[#FAF8F5] font-medium text-xs rounded-xl py-3 border border-[#E8E5DF] dark:border-[#383531] shadow-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                title="Finished logging"
              >
                <Check className="size-3.5 stroke-[2]" />
                <span>Done</span>
              </button>
            )}
          </div>
        </form>
      ) : (
        /* Quick Habits Checklist */
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-medium text-[#8C8882] dark:text-[#A8A29E]">
              Today's Active Habits
            </span>
            <span className="text-[10px] font-mono font-medium bg-[#F1EFEA] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] px-2 py-0.5 rounded border border-[#E8E5DF] dark:border-[#383531]">
              {habits.filter((h) => isHabitCompleted(h.id)).length}/{habits.length} Done
            </span>
          </div>

          {habits.length === 0 ? (
            <div className="p-6 text-center bg-[#FAF8F5] dark:bg-[#121110] rounded-xl border border-dashed border-[#E8E5DF] dark:border-[#383531] space-y-1">
              <p className="text-xs font-medium text-[#161514] dark:text-[#FAF8F5]">No habits created yet</p>
              <p className="text-[11px] text-[#8C8882] dark:text-[#A8A29E]">Head to Goals Space to add your first habit!</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar">
              {habits.map((habit) => {
                const isDone = isHabitCompleted(habit.id);
                const habitStreak = streaks[habit.id];

                return (
                  <div
                    key={habit.id}
                    onClick={() => handleToggleHabit(habit.id, isDone)}
                    className={cn(
                      "p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors shadow-xs",
                      isDone
                        ? "bg-[#FAF8F5] dark:bg-[#161514] text-[#8C8882] dark:text-[#A8A29E] border-[#E8E5DF] dark:border-[#383531]"
                        : "bg-white dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] border-[#E8E5DF] dark:border-[#383531] hover:bg-[#FAF8F5] dark:hover:bg-[#2A2724]"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "size-6 rounded-md border flex items-center justify-center font-bold text-xs shrink-0 transition-colors",
                          isDone ? "bg-[#03D26F] text-white border-[#03D26F]" : "bg-white dark:bg-[#1C1A18] border-[#E8E5DF] dark:border-[#383531]"
                        )}
                      >
                        {isDone ? <Check className="size-3.5 stroke-[2.5]" /> : null}
                      </div>

                      <div className="min-w-0">
                        <span className={cn("text-xs font-medium block truncate", isDone && "line-through opacity-70")}>
                          {habit.title}
                        </span>
                        {habitStreak?.currentStreak ? (
                          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-0.5 mt-0.5">
                            🔥 {habitStreak.currentStreak} day streak
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border border-[#E8E5DF] dark:border-[#383531] bg-[#F1EFEA] dark:bg-[#1C1A18] text-[#8C8882] dark:text-[#A8A29E] shrink-0">
                      {habit.frequency?.type || "DAILY"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); else setIsOpen(true); }}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-[480px] bg-white dark:bg-[#1C1A18] rounded-2xl p-0 border border-[#E8E5DF] dark:border-[#383531] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 pt-4 pb-3 border-b border-[#E8E5DF] dark:border-[#383531] bg-white dark:bg-[#1C1A18] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-[#F1EFEA] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531] text-xs">
                ⚡
              </span>
              <div>
                <DialogTitle className="text-sm font-semibold text-[#161514] dark:text-[#FAF8F5] tracking-tight">
                  Instant Quick Input
                </DialogTitle>
                <p className="text-[10px] text-[#8C8882] dark:text-[#A8A29E]">
                  Shortcut & Gesture Quick Logger
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="size-7 rounded-full bg-[#F1EFEA] dark:bg-[#252321] hover:bg-[#E8E5DF] dark:hover:bg-[#383531] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#383531] flex items-center justify-center transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="size-3.5 stroke-[2]" />
            </button>
          </div>

          <div className="p-5">{modalBody}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); else setIsOpen(true); }}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="bg-white dark:bg-[#1C1A18] rounded-t-2xl px-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-3 border-t border-x border-[#E8E5DF] dark:border-[#383531] shadow-2xl outline-none max-h-[90vh] overflow-y-auto z-[150]"
      >
        <div className="mx-auto w-10 h-1 rounded-full bg-[#E8E5DF] dark:bg-[#383531] mb-3" />
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#E8E5DF] dark:border-[#383531]">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-[#F1EFEA] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531] text-xs">
              ⚡
            </span>
            <div>
              <SheetTitle className="text-sm font-semibold text-[#161514] dark:text-[#FAF8F5] tracking-tight">
                Instant Quick Input
              </SheetTitle>
              <p className="text-[10px] text-[#8C8882] dark:text-[#A8A29E]">
                Back-Tap & Shortcut Logger
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="size-7 rounded-full bg-[#F1EFEA] dark:bg-[#252321] hover:bg-[#E8E5DF] dark:hover:bg-[#383531] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#383531] flex items-center justify-center transition-colors cursor-pointer"
            title="Close popup"
          >
            <X className="size-3.5 stroke-[2]" />
          </button>
        </div>

        {modalBody}
      </SheetContent>
    </Sheet>
  );
}
