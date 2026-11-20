"use client";

import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { AdaptiveDrawerDialog } from "@/components/shared/AdaptiveDrawerDialog";
import { soundFX } from "@/components/shared/SoundFX";
import { strobiToast } from "@/lib/utils/toasts";
import { cn } from "@/lib/utils";

interface QuickWorkoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  onAddWorkout: (workout: { date: string; name: string; details: string }) => void;
  isPending?: boolean;
}

const MUSCLE_GROUPS = [
  { id: "chest", label: "Chest", emoji: "🫁" },
  { id: "back", label: "Back", emoji: "🔙" },
  { id: "legs", label: "Legs", emoji: "🦵" },
  { id: "shoulders", label: "Shoulders", emoji: "💪" },
  { id: "arms", label: "Arms", emoji: "🦾" },
  { id: "core", label: "Core", emoji: "🎯" },
  { id: "cardio", label: "Cardio", emoji: "🏃" },
  { id: "full", label: "Full Body", emoji: "⚡" },
] as const;

const QUICK_WORKOUTS = [
  { name: "Push Day", details: "Chest, Shoulders, Triceps", group: "chest" },
  { name: "Pull Day", details: "Back, Biceps, Rear Delts", group: "back" },
  { name: "Leg Day", details: "Squats, RDL, Leg Press", group: "legs" },
  { name: "Upper Body", details: "Bench, Rows, OHP, Curls", group: "full" },
  { name: "HIIT Cardio", details: "30 min interval training", group: "cardio" },
  { name: "Core & Abs", details: "Plank, Crunches, Leg Raises", group: "core" },
] as const;

export function QuickWorkoutModal({
  open,
  onOpenChange,
  selectedDate,
  onAddWorkout,
  isPending = false,
}: QuickWorkoutModalProps) {
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setDetails("");
    setSelectedGroup(null);
  };

  /** 1-tap quick workout from preset */
  const handleQuickLog = (workout: (typeof QUICK_WORKOUTS)[number]) => {
    soundFX.playPop();
    soundFX.vibrate(25);
    onAddWorkout({ date: selectedDate, name: workout.name, details: workout.details });
    strobiToast.habits(`${workout.name} logged! 💪`);
    resetForm();
    onOpenChange(false);
  };

  /** Custom workout submit */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    soundFX.playPop();
    soundFX.vibrate(25);
    onAddWorkout({
      date: selectedDate,
      name: name.trim(),
      details: details.trim() || (selectedGroup ? MUSCLE_GROUPS.find((g) => g.id === selectedGroup)?.label || "" : ""),
    });
    strobiToast.habits(`${name.trim()} logged! 🏋️`);
    resetForm();
    onOpenChange(false);
  };

  return (
    <AdaptiveDrawerDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
      title="Quick Workout Log"
      description="1-tap preset or custom entry"
    >
      <div className="space-y-4 py-1">
        {/* 1-Tap Quick Workout Presets */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-heading font-black uppercase tracking-wider text-muted-foreground">
            Quick Log (1-Tap)
          </span>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_WORKOUTS.map((workout) => (
              <button
                key={workout.name}
                type="button"
                disabled={isPending}
                onClick={() => handleQuickLog(workout)}
                className="group min-h-[52px] p-2.5 rounded-2xl border-2 border-[#161514] dark:border-[#38332E] bg-white dark:bg-[#1C1A18] hover:bg-amber-50/60 dark:hover:bg-amber-950/20 text-left shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <span className="block font-heading font-black text-xs text-foreground leading-snug">
                  {workout.name}
                </span>
                <span className="block text-[10px] font-mono text-muted-foreground leading-snug mt-0.5">
                  {workout.details}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">or custom</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Custom Workout Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Muscle Group Chips */}
          <div className="flex flex-wrap gap-1.5">
            {MUSCLE_GROUPS.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setSelectedGroup(selectedGroup === group.id ? null : group.id);
                }}
                className={cn(
                  "px-2.5 py-1.5 rounded-xl text-xs font-heading font-bold border transition-all cursor-pointer flex items-center gap-1",
                  selectedGroup === group.id
                    ? "bg-[#F59E0B] text-[#161514] border-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_#161514]"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <span>{group.emoji}</span>
                <span>{group.label}</span>
              </button>
            ))}
          </div>

          {/* Workout Name */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workout name, e.g. Bench Press 5×5"
            className="w-full h-11 px-3.5 bg-white dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#38332E] rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[#CEF431] placeholder:text-muted-foreground/50"
          />

          {/* Details */}
          <input
            type="text"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Details (optional): sets, reps, weight"
            className="w-full h-10 px-3.5 bg-white dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#38332E] rounded-xl text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[#CEF431] placeholder:text-muted-foreground/50"
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={!name.trim() || isPending}
            className={cn(
              "w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl border-2 border-[#161514] font-heading font-black text-sm transition-all shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
              name.trim()
                ? "bg-[#F59E0B] text-[#161514] cursor-pointer hover:-translate-y-0.5"
                : "bg-secondary text-muted-foreground cursor-not-allowed opacity-60"
            )}
          >
            <Dumbbell className="size-4 stroke-[2.5]" />
            <span>Log Workout</span>
          </button>
        </form>
      </div>
    </AdaptiveDrawerDialog>
  );
}
