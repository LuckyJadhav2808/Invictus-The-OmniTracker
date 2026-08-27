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

  // Keyboard shortcut listener (Ctrl+E or Cmd+E for instant expense modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setActiveTab("expense");
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

      toast.success(`Logged ₹${numAmount.toLocaleString("en-IN")} expense! 💸`);
      handleClose();
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
      {/* Neobrutalist Tab Switcher */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)]">
        <button
          type="button"
          onClick={() => setActiveTab("expense")}
          className={cn(
            "py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === "expense"
              ? "bg-[#CEF431] text-[#161514] border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]"
              : "text-[#161514]/70 hover:text-[#161514]"
          )}
        >
          <span>💰</span>
          <span>Quick Expense</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("habits")}
          className={cn(
            "py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === "habits"
              ? "bg-[#CEF431] text-[#161514] border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]"
              : "text-[#161514]/70 hover:text-[#161514]"
          )}
        >
          <span>🔥</span>
          <span>Check Habits ({habits.length})</span>
        </button>
      </div>

      {activeTab === "expense" ? (
        /* Quick Expense Form */
        <form onSubmit={handleExpenseSubmit} className="space-y-4 pt-1">
          {/* Big Currency Amount Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#161514]/80">
              Amount (₹) *
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-2xl sm:text-3xl font-black text-[#161514] select-none">
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
                className="w-full bg-[#FAF8F5] rounded-2xl border-2 sm:border-[2.5px] border-[#161514] pl-10 pr-4 py-3 sm:py-3.5 text-2xl sm:text-3xl font-black text-[#161514] outline-none shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] focus:bg-amber-50/50 transition-all placeholder:text-[#161514]/25"
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
                className="px-2.5 py-1 bg-white hover:bg-amber-200 text-[#161514] font-black text-[11px] rounded-xl border-1.5 border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer shrink-0"
              >
                +₹{val}
              </button>
            ))}
          </div>

          {/* Category Selector Grid */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#161514]/80">
              Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DEFAULT_CATEGORIES.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={cn(
                      "p-2 rounded-2xl border-2 border-[#161514] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer",
                      isSelected
                        ? "bg-[#CEF431] shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)] scale-[1.03]"
                        : "bg-white hover:bg-[#FAF8F5] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] opacity-85"
                    )}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span className="text-[10px] font-black text-[#161514] truncate w-full text-center">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note / Merchant Input with Auto-Categorization */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#161514]/80">
              Note / Merchant (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="e.g. Swiggy, Metro, Grocery, Coffee"
              className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-3.5 py-2 text-xs sm:text-sm font-bold text-[#161514] outline-none shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:bg-amber-50/50 transition-all placeholder:text-[#161514]/40"
            />
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#161514]/80">
              Payment Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id)}
                  className={cn(
                    "py-2 rounded-xl border-2 border-[#161514] text-[11px] font-black transition-all cursor-pointer shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]",
                    paymentMethod === pm.id
                      ? "bg-amber-300 text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] scale-[1.02]"
                      : "bg-white text-[#161514]/80 hover:bg-[#FAF8F5]"
                  )}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Big Tactile Submit Button */}
          <button
            type="submit"
            disabled={addTransactionMutation.isPending}
            className="w-full bg-[#CEF431] hover:bg-[#b8dd25] text-[#161514] font-black text-sm rounded-2xl py-3.5 mt-2 border-2 sm:border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Zap className="h-4 w-4 fill-current" />
            <span>{addTransactionMutation.isPending ? "Logging..." : `Log Expense ${amount ? `(₹${amount})` : ""}`}</span>
          </button>
        </form>
      ) : (
        /* Quick Habits Checklist */
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#161514]/70">
              Today's Active Habits
            </span>
            <span className="text-[10px] font-black bg-[#CEF431] text-[#161514] px-2 py-0.5 rounded-full border border-[#161514]">
              {habits.filter((h) => isHabitCompleted(h.id)).length}/{habits.length} Done
            </span>
          </div>

          {habits.length === 0 ? (
            <div className="p-6 text-center bg-[#FAF8F5] rounded-2xl border-2 border-dashed border-[#161514] space-y-1">
              <p className="text-xs font-black text-[#161514]">No habits created yet 🌱</p>
              <p className="text-[10px] text-[#161514]/70 font-medium">Head to Goals Space to add your first habit!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar">
              {habits.map((habit) => {
                const isDone = isHabitCompleted(habit.id);
                const habitStreak = streaks[habit.id];

                return (
                  <div
                    key={habit.id}
                    onClick={() => handleToggleHabit(habit.id, isDone)}
                    className={cn(
                      "p-3 rounded-2xl border-2 border-[#161514] flex items-center justify-between gap-3 cursor-pointer transition-all shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5",
                      isDone
                        ? "bg-[#03D26F]/25 text-[#161514]"
                        : "bg-white text-[#161514] hover:bg-[#FAF8F5]"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-xl border-2 border-[#161514] flex items-center justify-center font-black text-sm shrink-0 transition-all shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]",
                          isDone ? "bg-[#03D26F] text-[#161514]" : "bg-white"
                        )}
                      >
                        {isDone ? <Check className="h-4 w-4 stroke-[3]" /> : null}
                      </div>

                      <div className="min-w-0">
                        <span className={cn("text-xs font-black block truncate", isDone && "line-through opacity-70")}>
                          {habit.title}
                        </span>
                        {habitStreak?.currentStreak ? (
                          <span className="text-[9px] font-black text-amber-600 flex items-center gap-0.5 mt-0.5">
                            🔥 {habitStreak.currentStreak} day streak
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border border-[#161514] bg-amber-200 text-[#161514] shrink-0">
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
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-[480px] bg-white rounded-3xl p-0 border-2.5 border-[#161514] shadow-[6px_6px_0px_0px_rgba(22,21,20,1)] overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b-2 border-[#161514]/20 bg-[#FAF8F5] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#CEF431] border-1.5 border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] text-xs">
                ⚡
              </span>
              <div>
                <DialogTitle className="text-base font-black text-[#161514] uppercase tracking-tight">
                  Instant Quick Input
                </DialogTitle>
                <p className="text-[10px] font-bold text-[#161514]/70">
                  Shortcut & Gesture Quick Logger
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-xl bg-rose-100 hover:bg-rose-300 text-[#161514] border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              title="Close modal"
            >
              <X className="h-4 w-4 stroke-[3]" />
            </button>
          </div>

          <div className="p-5">{modalBody}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="bg-white rounded-t-3xl px-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-3 border-t-2.5 border-x-2.5 border-[#161514] shadow-[0px_-6px_0px_0px_rgba(22,21,20,1)] outline-none max-h-[90vh] overflow-y-auto z-[150]"
      >
        <div className="mx-auto w-12 h-1.5 rounded-full bg-[#161514] mb-3" />
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b-2 border-[#161514]/20">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#CEF431] border-1.5 border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] text-xs">
              ⚡
            </span>
            <div>
              <SheetTitle className="text-base font-black text-[#161514] uppercase tracking-tight">
                Instant Quick Input
              </SheetTitle>
              <p className="text-[10px] font-bold text-[#161514]/70">
                Back-Tap & Shortcut Logger
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-rose-100 hover:bg-rose-300 text-[#161514] border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            title="Close popup"
          >
            <X className="h-4 w-4 stroke-[3]" />
          </button>
        </div>

        {modalBody}
      </SheetContent>
    </Sheet>
  );
}
