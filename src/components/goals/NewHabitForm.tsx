"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HabitSchema, type Habit } from "@/lib/schemas/goals";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = [
  "Target",
  "Flame",
  "BookOpen",
  "Heart",
  "Smile",
  "Compass",
  "DollarSign",
  "Coffee",
  "Dumbbell",
  "Music",
  "Book",
  "Code",
  "Droplet",
  "Apple",
  "Moon",
];

const COLORS = ["amber", "orange", "mint", "lavender", "coral"];

const DAYS = [
  { label: "M", value: 1 },
  { label: "T", value: 2 },
  { label: "W", value: 3 },
  { label: "T", value: 4 },
  { label: "F", value: 5 },
  { label: "S", value: 6 },
  { label: "S", value: 0 },
];

interface NewHabitFormProps {
  initialValues?: Habit;
  onSubmit: (data: any) => void;
  loading?: boolean;
}

export function NewHabitForm({
  initialValues,
  onSubmit,
  loading = false,
}: NewHabitFormProps) {
  const [selectedIcon, setSelectedIcon] = useState(initialValues?.icon || "Target");
  const [selectedColor, setSelectedColor] = useState(initialValues?.color || "amber");
  const [customDays, setCustomDays] = useState<number[]>(initialValues?.frequency?.daysOfWeek || []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(HabitSchema.omit({ id: true, archived: true })),
    defaultValues: initialValues || {
      title: "",
      icon: "Target",
      color: "amber",
      frequency: {
        type: "daily" as const,
        targetPerDay: 1,
      },
      allowGraceSkip: false,
      isGoalStyle: false,
      goalTarget: undefined,
      goalUnit: "",
    },
  });

  const frequencyType = watch("frequency.type");
  const isGoalStyle = watch("isGoalStyle");

  const toggleDay = (dayValue: number) => {
    let updated: number[];
    if (customDays.includes(dayValue)) {
      updated = customDays.filter((d) => d !== dayValue);
    } else {
      updated = [...customDays, dayValue];
    }
    setCustomDays(updated);
    setValue("frequency.daysOfWeek", updated);
  };

  const handleFormSubmit = (data: any) => {
    const frequency = { ...data.frequency };
    if (frequency.type === "customDays" && (!customDays || customDays.length === 0)) {
      frequency.daysOfWeek = [1, 2, 3, 4, 5]; // Default weekdays if none selected
    } else if (frequency.type === "customDays") {
      frequency.daysOfWeek = customDays;
    }
    onSubmit({
      ...data,
      frequency,
      icon: selectedIcon,
      color: selectedColor,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Title */}
      <div className="space-y-1">
        <label className="text-xs font-bold uppercase tracking-wider text-navy-600">
          Habit Title
        </label>
        <input
          {...register("title")}
          type="text"
          placeholder="e.g. Read 15 pages, Drink Water, Gym…"
          className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all text-navy-900 placeholder:text-navy-600/50"
        />
        {errors.title?.message && (
          <p className="text-xs text-danger font-semibold mt-1">{errors.title.message as string}</p>
        )}
      </div>

      {/* Icon Picker */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-navy-600">
          Choose Icon
        </label>
        <div className="grid grid-cols-5 gap-2 bg-cream-bg/30 p-2 rounded-[var(--radius-md)] border border-border">
          {ICONS.map((iconName) => {
            const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
            const isSelected = selectedIcon === iconName;
            return (
              <button
                key={iconName}
                type="button"
                onClick={() => setSelectedIcon(iconName)}
                className={cn(
                  "p-2 rounded-[var(--radius-sm)] flex items-center justify-center border transition-all hover:bg-cream-bg/50",
                  isSelected
                    ? "bg-navy-900 border-navy-900 text-white"
                    : "border-transparent text-navy-600"
                )}
              >
                <IconComponent className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Picker */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-navy-600">
          Theme Color
        </label>
        <div className="flex gap-3">
          {COLORS.map((c) => {
            const isSelected = selectedColor === c;
            const bgClass =
              c === "amber"
                ? "bg-amber-500"
                : c === "orange"
                ? "bg-orange-500"
                : c === "mint"
                ? "bg-mint-600"
                : c === "lavender"
                ? "bg-lavender-400"
                : "bg-coral-400";
            return (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedColor(c)}
                className={cn(
                  "h-8 w-8 rounded-full transition-all flex items-center justify-center border-2 border-transparent cursor-pointer",
                  bgClass,
                  isSelected && "border-navy-900 scale-110"
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Frequency type selection */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-navy-600">
          Frequency
        </label>
        <div className="flex gap-2">
          {["daily", "weekly", "customDays"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setValue("frequency.type", type as any)}
              className={cn(
                "flex-1 py-1.5 rounded-[var(--radius-sm)] border text-xs font-bold transition-all capitalize cursor-pointer",
                frequencyType === type
                  ? "bg-navy-900 text-white border-navy-900"
                  : "bg-cream-bg/30 text-navy-600 border-input hover:bg-cream-bg/50"
              )}
            >
              {type === "customDays" ? "Custom" : type}
            </button>
          ))}
        </div>
      </div>

      {/* Custom days checkboxes */}
      {frequencyType === "customDays" && (
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-navy-600">
            Select Custom Days
          </label>
          <div className="flex gap-2 justify-between">
            {DAYS.map((day) => {
              const isSelected = customDays.includes(day.value);
              return (
                <button
                  key={day.label}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    "h-8 w-8 rounded-full border text-xs font-bold transition-all flex items-center justify-center cursor-pointer",
                    isSelected
                      ? "bg-navy-900 border-navy-900 text-white"
                      : "bg-cream-bg/30 text-navy-600 border-input"
                  )}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Goal Style Toggle */}
      <div className="flex items-center justify-between p-3 rounded-[var(--radius-sm)] border border-border bg-cream-bg/5">
        <div>
          <p className="text-xs font-bold text-navy-900">Goal Metric</p>
          <p className="text-[10px] text-navy-600 leading-tight">Enable numeric logging (e.g. 50 pages)</p>
        </div>
        <button
          type="button"
          onClick={() => setValue("isGoalStyle", !isGoalStyle)}
          className={cn(
            "h-5 w-10 rounded-full transition-all relative border cursor-pointer",
            isGoalStyle ? "bg-navy-900 border-navy-900" : "bg-input border-transparent"
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition-all",
              isGoalStyle ? "left-5" : "left-0.5"
            )}
          />
        </button>
      </div>

      {/* Goal Style Target & Unit */}
      {isGoalStyle && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-navy-600">
              Target Value
            </label>
            <input
              {...register("goalTarget", { valueAsNumber: true })}
              type="number"
              placeholder="e.g. 12"
              className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-amber-500 text-navy-900"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-navy-600">
              Unit
            </label>
            <input
              {...register("goalUnit")}
              type="text"
              placeholder="e.g. books, km, glasses"
              className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-amber-500 text-navy-900"
            />
          </div>
        </div>
      )}

      {/* Grace Skip Toggle */}
      <div className="flex items-center justify-between p-3 rounded-[var(--radius-sm)] border border-border bg-cream-bg/5">
        <div>
          <p className="text-xs font-bold text-navy-900">Streak Freeze Protection</p>
          <p className="text-[10px] text-navy-600 leading-tight">Allow one skip per week without resetting streak</p>
        </div>
        <button
          type="button"
          onClick={() => setValue("allowGraceSkip", !watch("allowGraceSkip"))}
          className={cn(
            "h-5 w-10 rounded-full transition-all relative border cursor-pointer",
            watch("allowGraceSkip") ? "bg-navy-900 border-navy-900" : "bg-input border-transparent"
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition-all",
              watch("allowGraceSkip") ? "left-5" : "left-0.5"
            )}
          />
        </button>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-amber-500 hover:bg-amber-600 text-navy-900 font-bold rounded-full py-2.5 mt-2 shadow-sm cursor-pointer"
      >
        {loading ? "Saving…" : initialValues ? "Update Habit" : "Create Habit"}
      </Button>
    </form>
  );
}
