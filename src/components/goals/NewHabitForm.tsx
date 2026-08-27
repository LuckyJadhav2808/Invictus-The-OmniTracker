"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HabitSchema, type Habit } from "@/lib/schemas/goals";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

const COLORS = [
  { name: "amber", bg: "bg-amber-400" },
  { name: "emerald", bg: "bg-emerald-400" },
  { name: "sky", bg: "bg-sky-400" },
  { name: "purple", bg: "bg-purple-400" },
  { name: "rose", bg: "bg-rose-400" },
];

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
  const [customDays, setCustomDays] = useState<number[]>(initialValues?.frequency?.daysOfWeek || [1, 2, 3, 4, 5]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(HabitSchema.omit({ id: true, archived: true, createdAt: true, updatedAt: true })),
    defaultValues: {
      title: initialValues?.title || "",
      icon: initialValues?.icon || "Target",
      color: initialValues?.color || "amber",
      frequency: initialValues?.frequency || {
        type: "daily" as const,
        targetPerDay: 1,
      },
      reminderTime: initialValues?.reminderTime || "",
      allowGraceSkip: initialValues?.allowGraceSkip ?? false,
      isGoalStyle: initialValues?.isGoalStyle ?? false,
      goalTarget: initialValues?.goalTarget ?? undefined,
      goalUnit: initialValues?.goalUnit || "",
    },
  });

  const frequencyType = watch("frequency.type");
  const isGoalStyle = watch("isGoalStyle");
  const allowGraceSkip = watch("allowGraceSkip");

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
    if (frequency.type === "customDays") {
      frequency.daysOfWeek = customDays && customDays.length > 0 ? customDays : [1, 2, 3, 4, 5];
    } else {
      delete frequency.daysOfWeek;
    }

    const payload = {
      ...data,
      title: data.title.trim(),
      frequency,
      icon: selectedIcon,
      color: selectedColor,
      goalTarget: isGoalStyle && data.goalTarget && !isNaN(Number(data.goalTarget)) ? Number(data.goalTarget) : undefined,
      goalUnit: isGoalStyle ? data.goalUnit : "",
    };

    onSubmit(payload);
  };

  const handleFormError = (formErrors: any) => {
    console.error("Habit Form Validation Error:", formErrors);
    if (formErrors.title) {
      toast.error("Please enter a habit title 📝");
    } else {
      toast.error("Please check the form inputs");
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit, handleFormError)} className="space-y-4 pt-1">
      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-xs font-black uppercase tracking-wider text-navy-950">
          Habit Title *
        </label>
        <input
          {...register("title")}
          type="text"
          placeholder="e.g. Read 15 pages, Drink Water, Gym…"
          className="w-full rounded-2xl border-2 border-navy-950 bg-white py-2.5 px-3.5 text-xs sm:text-sm font-bold text-navy-950 outline-none focus:bg-amber-50/50 shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] transition-all placeholder:text-navy-950/40"
        />
        {errors.title?.message && (
          <p className="text-xs text-rose-600 font-black mt-1">{errors.title.message as string}</p>
        )}
      </div>

      {/* Reminder Time (Optional) */}
      <div className="space-y-1.5">
        <label className="text-xs font-black uppercase tracking-wider text-navy-950">
          Daily Reminder Time (Optional)
        </label>
        <input
          {...register("reminderTime")}
          type="text"
          placeholder="e.g. 08:00 AM or 21:30"
          className="w-full rounded-2xl border-2 border-navy-950 bg-white py-2.5 px-3.5 text-xs sm:text-sm font-bold text-navy-950 outline-none focus:bg-amber-50/50 shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] transition-all placeholder:text-navy-950/40"
        />
      </div>

      {/* Icon Picker */}
      <div className="space-y-1.5">
        <label className="text-xs font-black uppercase tracking-wider text-navy-950">
          Choose Icon
        </label>
        <div className="grid grid-cols-5 gap-2 bg-[#FAF8F5] p-2.5 rounded-2xl border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(22,21,20,1)]">
          {ICONS.map((iconName) => {
            const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
            const isSelected = selectedIcon === iconName;
            return (
              <button
                key={iconName}
                type="button"
                onClick={() => setSelectedIcon(iconName)}
                className={cn(
                  "p-2 rounded-xl flex items-center justify-center border-2 transition-all cursor-pointer",
                  isSelected
                    ? "bg-[#CEF431] border-navy-950 text-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] scale-105"
                    : "border-transparent text-navy-800 hover:bg-white"
                )}
              >
                <IconComponent className="h-4 w-4 stroke-[2.5]" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Picker */}
      <div className="space-y-1.5">
        <label className="text-xs font-black uppercase tracking-wider text-navy-950">
          Theme Color
        </label>
        <div className="flex gap-2.5">
          {COLORS.map((c) => {
            const isSelected = selectedColor === c.name;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => setSelectedColor(c.name)}
                className={cn(
                  "h-8 w-8 rounded-xl transition-all flex items-center justify-center border-2 border-navy-950 cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]",
                  c.bg,
                  isSelected && "ring-2 ring-[#161514] scale-110 shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]"
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Frequency type selection */}
      <div className="space-y-1.5">
        <label className="text-xs font-black uppercase tracking-wider text-navy-950">
          Frequency
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "daily", label: "Daily" },
            { id: "weekly", label: "Weekly" },
            { id: "customDays", label: "Custom Days" },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setValue("frequency.type", type.id as any)}
              className={cn(
                "py-2 rounded-xl border-2 border-navy-950 text-xs font-black transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]",
                frequencyType === type.id
                  ? "bg-[#CEF431] text-navy-950 shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)]"
                  : "bg-white text-navy-800 hover:bg-[#FAF8F5]"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom days checkboxes */}
      {frequencyType === "customDays" && (
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-navy-950">
            Select Active Days
          </label>
          <div className="flex gap-1.5 justify-between">
            {DAYS.map((day) => {
              const isSelected = customDays.includes(day.value);
              return (
                <button
                  key={day.label + day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    "h-9 w-9 rounded-xl border-2 border-navy-950 text-xs font-black transition-all flex items-center justify-center cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]",
                    isSelected
                      ? "bg-amber-300 text-navy-950"
                      : "bg-white text-navy-600 hover:bg-[#FAF8F5]"
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
      <div className="flex items-center justify-between p-3 rounded-2xl border-2 border-navy-950 bg-[#FAF8F5] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)]">
        <div>
          <p className="text-xs font-black text-navy-950">Numeric Target (Optional)</p>
          <p className="text-[10px] font-medium text-navy-700 leading-tight">Enable numeric logging (e.g. 50 pages, 30 mins)</p>
        </div>
        <button
          type="button"
          onClick={() => setValue("isGoalStyle", !isGoalStyle)}
          className={cn(
            "h-6 w-11 rounded-full transition-all relative border-2 border-navy-950 cursor-pointer shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]",
            isGoalStyle ? "bg-[#CEF431]" : "bg-gray-200"
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-navy-950 shadow transition-all",
              isGoalStyle ? "left-5 bg-navy-950" : "left-0.5 bg-white"
            )}
          />
        </button>
      </div>

      {/* Goal Style Target & Unit */}
      {isGoalStyle && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-navy-950">
              Target Value
            </label>
            <input
              {...register("goalTarget")}
              type="number"
              placeholder="e.g. 15"
              className="w-full rounded-xl border-2 border-navy-950 bg-white py-2 px-3 text-xs font-bold outline-none focus:bg-amber-50 text-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-navy-950">
              Unit
            </label>
            <input
              {...register("goalUnit")}
              type="text"
              placeholder="e.g. pages, mins, km"
              className="w-full rounded-xl border-2 border-navy-950 bg-white py-2 px-3 text-xs font-bold outline-none focus:bg-amber-50 text-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)]"
            />
          </div>
        </div>
      )}

      {/* Grace Skip Toggle */}
      <div className="flex items-center justify-between p-3 rounded-2xl border-2 border-navy-950 bg-[#FAF8F5] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)]">
        <div>
          <p className="text-xs font-black text-navy-950">Streak Freeze Protection</p>
          <p className="text-[10px] font-medium text-navy-700 leading-tight">Allow 1 missed day without losing streak</p>
        </div>
        <button
          type="button"
          onClick={() => setValue("allowGraceSkip", !allowGraceSkip)}
          className={cn(
            "h-6 w-11 rounded-full transition-all relative border-2 border-navy-950 cursor-pointer shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]",
            allowGraceSkip ? "bg-sky-400" : "bg-gray-200"
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-navy-950 shadow transition-all",
              allowGraceSkip ? "left-5 bg-navy-950" : "left-0.5 bg-white"
            )}
          />
        </button>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#CEF431] hover:bg-[#b8dd25] text-navy-950 font-black text-sm rounded-2xl py-3 mt-3 border-2 border-navy-950 shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all uppercase tracking-wider"
      >
        {loading ? "Saving…" : initialValues ? "Update Habit 🌟" : "Create Habit 💪"}
      </Button>
    </form>
  );
}
