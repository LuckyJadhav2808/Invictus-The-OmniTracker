"use client";

import { useState } from "react";
import { CheckSquare, Plus, Target, Sparkles, Flame, CheckCircle2, Circle, BookOpen, Layers } from "lucide-react";
import { SubpageHeader } from "@/components/shared/SubpageHeader";
import { MobileAppBar } from "@/components/mobile/MobileAppBar";
import { useHabits, useToggleHabitLog, useStreaks } from "@/lib/queries/goals";
import { ATOMIC_HABITS_VAULT } from "@/components/goals/HabitChoiceModal";
import { HABIT_TEMPLATE_PACKS } from "@/lib/templates-data";
import { soundFX } from "@/components/shared/SoundFX";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function HabitVaultPage() {
  const [activeTab, setActiveTab] = useState<"roster" | "presets">("roster");
  const { data: habits = [] } = useHabits();
  const { data: streaks = {} } = useStreaks();
  const toggleHabitMutation = useToggleHabitLog();
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const handleToggle = (id: string, currentCompleted: boolean) => {
    soundFX.playPop();
    soundFX.vibrate(15);
    toggleHabitMutation.mutate({
      habitId: id,
      date: todayStr,
      completed: !currentCompleted,
    });
  };

  return (
    <div className="w-full max-w-xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-3.5 select-none animate-in fade-in duration-200 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      {/* Dynamic Strobi Top App Bar */}
      <div className="-mx-2 -mt-2 sm:-mx-4 sm:-mt-4 lg:hidden">
        <MobileAppBar title="Habit Vault" showDynamicIsland={true} />
      </div>

      {/* 1. Title Bar with inline back button */}
      <SubpageHeader
        backHref="/goals"
        backLabel="Habits"
        title="Habit Vault & Roster"
        badge="Atomic Habits"
        badgeColorClass="bg-lime-400/20 text-lime-700 dark:text-[#CEF431] border-lime-500/30"
        subtitle="Manage daily routines, frequency schedules, cues & template packs"
        icon={CheckSquare}
        rightAction={
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              soundFX.vibrate(15);
              window.dispatchEvent(new CustomEvent("invictus:open-new-habit"));
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[#161514] bg-[#CEF431] text-[#161514] font-heading font-black text-xs shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            <Plus className="size-3.5 stroke-[3]" />
            <span>New Habit</span>
          </button>
        }
      />

      {/* 2. Strict 2-Tab Navigation */}
      <div className="grid grid-cols-2 p-1 bg-muted/60 dark:bg-card border-2 border-[#161514] dark:border-white/20 rounded-xl shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] gap-1">
        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            soundFX.vibrate(10);
            setActiveTab("roster");
          }}
          className={cn(
            "py-2 text-xs font-heading font-black rounded-lg transition-all text-center cursor-pointer",
            activeTab === "roster"
              ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          📋 Active Roster ({habits.length})
        </button>
        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            soundFX.vibrate(10);
            setActiveTab("presets");
          }}
          className={cn(
            "py-2 text-xs font-heading font-black rounded-lg transition-all text-center cursor-pointer",
            activeTab === "presets"
              ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          ⚡ Curated Presets ({ATOMIC_HABITS_VAULT.length}+)
        </button>
      </div>

      {/* TAB 1: Active Roster */}
      {activeTab === "roster" && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-foreground">
                Current Active Habits
              </h3>
              <span className="text-[11px] font-mono text-muted-foreground">
                Today: {todayStr}
              </span>
            </div>

            {habits.length === 0 ? (
              <div className="p-5 rounded-xl border border-dashed border-border text-center space-y-2">
                <CheckSquare className="size-6 text-muted-foreground mx-auto" />
                <p className="text-xs font-heading font-bold text-foreground">No habits created yet</p>
                <p className="text-[11px] text-muted-foreground">
                  Tap &ldquo;New Habit&rdquo; above or pick from curated presets in the second tab.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {habits.map((habit) => {
                  const streak = streaks[habit.id]?.currentStreak || 0;
                  const isCompleted = (habit as any).completedToday || false;
                  const desc = (habit as any).description || (habit as any).cue || "";

                  return (
                    <div
                      key={habit.id}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-muted/30 px-2 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggle(habit.id, isCompleted)}
                          className="shrink-0 cursor-pointer"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="size-5 text-[#03D26F] fill-[#03D26F]/20" />
                          ) : (
                            <Circle className="size-5 text-muted-foreground hover:text-foreground" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <h4
                            className={cn(
                              "font-heading font-bold text-xs sm:text-sm text-foreground truncate",
                              isCompleted && "line-through text-muted-foreground"
                            )}
                          >
                            {habit.title}
                          </h4>
                          {desc && (
                            <p className="text-[11px] text-muted-foreground truncate max-w-sm">
                              {desc}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold">
                          <Flame className="size-3 fill-amber-400 text-amber-500" />
                          {streak}d
                        </span>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase px-1.5 py-0.5 bg-muted rounded">
                          {habit.frequency?.type || "daily"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Curated Presets */}
      {activeTab === "presets" && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* Protocol Packs */}
          <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-purple-600 dark:text-purple-400" />
              <h3 className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-foreground">
                Protocol Split Packs
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {HABIT_TEMPLATE_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className="p-3 rounded-xl border border-border bg-muted/20 space-y-1.5 hover:border-foreground/30 transition-all"
                >
                  <h4 className="font-heading font-black text-xs text-foreground">{pack.name}</h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{pack.tagline}</p>
                  <span className="text-[10px] font-mono font-bold text-muted-foreground block">
                    {pack.items.length} Habit Protocol
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Atomic Vault Presets */}
          <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-[#03D26F]" />
              <h3 className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-foreground">
                Atomic Habits Encyclopedia
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ATOMIC_HABITS_VAULT.slice(0, 10).map((preset) => (
                <div
                  key={preset.id}
                  className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground uppercase">
                        {preset.category}
                      </span>
                      <h4 className="font-heading font-bold text-xs text-foreground truncate">
                        {preset.title}
                      </h4>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {preset.desc}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      window.dispatchEvent(new CustomEvent("invictus:open-new-habit"));
                    }}
                    className="shrink-0 p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-heading font-black cursor-pointer"
                    title="Adopt habit"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
