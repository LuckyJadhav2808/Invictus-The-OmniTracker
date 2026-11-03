"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HabitSchema, type Habit } from "@/lib/schemas/goals";
import { Button } from "@/components/ui/button";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { soundFX } from "@/components/shared/SoundFX";
import { Sparkles, Clock, Target, Calendar, Sun, Moon } from "lucide-react";
import { HabitCompanionSprite } from "@/components/mascot/HabitCompanionSprite";

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
  { label: "M", value: 1, full: "Monday" },
  { label: "T", value: 2, full: "Tuesday" },
  { label: "W", value: 3, full: "Wednesday" },
  { label: "T", value: 4, full: "Thursday" },
  { label: "F", value: 5, full: "Friday" },
  { label: "S", value: 6, full: "Saturday" },
  { label: "S", value: 0, full: "Sunday" },
];

const TEMPLATE_SHORTCUTS = [
  { title: "Gym / Workout", icon: "Dumbbell", color: "rose", type: "daily", time: "07:00 AM" },
  { title: "Read 15 Pages", icon: "BookOpen", color: "amber", type: "daily", time: "08:30 PM", goalTarget: 15, goalUnit: "pages" },
  { title: "Drink 2L Water", icon: "Droplet", color: "sky", type: "daily", time: "09:00 AM", goalTarget: 2000, goalUnit: "ml" },
  { title: "10,000 Steps", icon: "Flame", color: "emerald", type: "daily", time: "06:00 PM", goalTarget: 10000, goalUnit: "steps" },
  { title: "Deep Focus 60m", icon: "Code", color: "purple", type: "daily", time: "10:00 AM", goalTarget: 60, goalUnit: "mins" },
  { title: "Sleep by 11 PM", icon: "Moon", color: "purple", type: "daily", time: "10:30 PM" },
];

const TIME_PRESETS = [
  { label: "Morning", time: "08:00 AM", icon: Sun },
  { label: "Noon", time: "12:00 PM", icon: Clock },
  { label: "Evening", time: "07:00 PM", icon: Clock },
  { label: "Night", time: "10:00 PM", icon: Moon },
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
  const [customDays, setCustomDays] = useState<number[]>(
    initialValues?.frequency?.daysOfWeek || [1, 2, 3, 4, 5]
  );
  const [isCelebrating, setIsCelebrating] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(
      HabitSchema.omit({ id: true, archived: true, createdAt: true, updatedAt: true })
    ),
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

  const habitTitle = watch("title");
  const frequencyType = watch("frequency.type");
  const isGoalStyle = watch("isGoalStyle");
  const allowGraceSkip = watch("allowGraceSkip");
  const reminderTime = watch("reminderTime");

  const applyTemplate = (tpl: typeof TEMPLATE_SHORTCUTS[0]) => {
    soundFX.playPop();
    setValue("title", tpl.title);
    setValue("icon", tpl.icon);
    setValue("color", tpl.color);
    setValue("frequency.type", tpl.type as any);
    if (tpl.time) setValue("reminderTime", tpl.time);
    if (tpl.goalTarget) {
      setValue("isGoalStyle", true);
      setValue("goalTarget", tpl.goalTarget);
      setValue("goalUnit", tpl.goalUnit || "");
    }
    setSelectedIcon(tpl.icon);
    setSelectedColor(tpl.color);
    toast.success(`Preset loaded: ${tpl.title}! ✨`);
  };

  const toggleDay = (dayValue: number) => {
    soundFX.playPop();
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
    soundFX.playCompleteChime();
    soundFX.vibrate(25);
    setIsCelebrating(true);

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
      goalTarget:
        isGoalStyle && data.goalTarget && !isNaN(Number(data.goalTarget))
          ? Number(data.goalTarget)
          : undefined,
      goalUnit: isGoalStyle ? data.goalUnit : "",
    };

    setTimeout(() => {
      onSubmit(payload);
    }, 450);
  };

  const handleFormError = (formErrors: any) => {
    console.error("Habit Form Validation Error:", formErrors);
    soundFX.playPop();
    if (formErrors.title) {
      toast.error("Please enter a habit title");
    } else {
      toast.error("Please check the required fields");
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit, handleFormError)} className="space-y-4 pt-1">
      {/* 1-Tap Quick Routine Template Chips */}
      {!initialValues && (
        <div className="space-y-1.5 pb-1">
          <span className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514]/70 dark:text-[#A8A29E] flex items-center gap-1">
            <Sparkles className="size-3 text-amber-500 stroke-[2.5]" />
            <span>Instant Routine Presets</span>
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {TEMPLATE_SHORTCUTS.map((tpl) => (
              <button
                key={tpl.title}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C1A18] hover:bg-[#FAF8F5] dark:hover:bg-[#252321] border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 text-[#161514] dark:text-[#FAF8F5] select-none"
              >
                <span>{tpl.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reactive 2D Character Sprite Companion */}
      <HabitCompanionSprite
        iconName={selectedIcon}
        habitTitle={habitTitle}
        isCelebrating={isCelebrating}
      />

      {/* Habit Title Input (16px font to prevent mobile auto-zoom) */}
      <div className="space-y-1.5">
        <label
          className="text-xs font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <Target className="size-3.5 stroke-[2.5] text-amber-500" />
          <span>Habit Title *</span>
        </label>
        <input
          {...register("title")}
          type="text"
          placeholder="e.g. Read 15 pages, Drink Water, Gym…"
          className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#1C1A18] py-2.5 px-3.5 text-base font-bold text-[#161514] dark:text-[#FAF8F5] outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5] shadow-xs transition-all placeholder:text-[#6B6B6B]/40 dark:placeholder:text-[#A8A29E]/40"
          required
        />
        {errors.title?.message && (
          <p className="text-xs text-rose-600 font-black mt-1">{errors.title.message as string}</p>
        )}
      </div>

      {/* Reminder Time Picker with Ergonomic Quick Chips */}
      <div className="space-y-2">
        <label
          className="text-xs font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <Clock className="size-3.5 stroke-[2.5] text-sky-600" />
          <span>Daily Reminder Time</span>
        </label>

        {/* Quick Time Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {TIME_PRESETS.map((preset) => {
            const isMatch = reminderTime === preset.time;
            const PresetIcon = preset.icon;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setValue("reminderTime", preset.time);
                }}
                className={cn(
                  "min-h-[38px] py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center shadow-xs",
                  isMatch
                    ? "bg-[#161514] dark:bg-[#FAF8F5] text-white dark:text-[#161514] font-black border-[#161514] dark:border-[#FAF8F5]"
                    : "bg-white dark:bg-[#1C1A18] hover:bg-[#FAF8F5] dark:hover:bg-[#252321] text-[#161514]/80 dark:text-[#A8A29E] border-[#E8E5DF] dark:border-[#2A2724]"
                )}
              >
                <PresetIcon className="size-3 stroke-[2.5]" />
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Time Field */}
        <input
          {...register("reminderTime")}
          type="text"
          placeholder="Or custom: e.g. 08:30 AM or 21:00"
          className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#1C1A18] py-2 px-3 text-base font-bold text-[#161514] dark:text-[#FAF8F5] outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5] shadow-xs transition-all placeholder:text-[#6B6B6B]/40 dark:placeholder:text-[#A8A29E]/40 mt-1"
        />
      </div>

      {/* Icon Picker (44px touch targets) */}
      <div className="space-y-1.5">
        <label
          className="text-xs font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Choose Icon
        </label>
        <div className="grid grid-cols-5 gap-2 bg-[#FAF8F5] dark:bg-[#1C1A18] p-2.5 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs">
          {ICONS.map((iconName) => {
            const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
            const isSelected = selectedIcon === iconName;
            return (
              <button
                key={iconName}
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setSelectedIcon(iconName);
                }}
                className={cn(
                  "p-2 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center border transition-all cursor-pointer",
                  isSelected
                    ? "bg-[#CEF431] border-[#161514] text-[#161514] shadow-xs scale-105"
                    : "border-transparent text-[#161514]/80 dark:text-[#FAF8F5]/80 hover:bg-white dark:hover:bg-[#252321]"
                )}
                title={iconName}
              >
                <IconComponent className="size-5 stroke-[2.5]" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme Color Picker */}
      <div className="space-y-1.5">
        <label
          className="text-xs font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Theme Color
        </label>
        <div className="flex gap-2.5">
          {COLORS.map((c) => {
            const isSelected = selectedColor === c.name;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setSelectedColor(c.name);
                }}
                className={cn(
                  "min-h-[44px] min-w-[44px] size-11 rounded-xl transition-all flex items-center justify-center border border-black/20 dark:border-white/20 cursor-pointer shadow-xs",
                  c.bg,
                  isSelected && "ring-2 ring-[#161514] dark:ring-[#FAF8F5] ring-offset-2 dark:ring-offset-[#161514] scale-105"
                )}
                title={`Theme: ${c.name}`}
              />
            );
          })}
        </div>
      </div>

      {/* Frequency Type Selection */}
      <div className="space-y-1.5">
        <label
          className="text-xs font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <Calendar className="size-3.5 stroke-[2.5] text-emerald-600" />
          <span>Frequency</span>
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
              onClick={() => {
                soundFX.playPop();
                setValue("frequency.type", type.id as any);
              }}
              className={cn(
                "min-h-[44px] py-2 rounded-xl border text-xs font-heading font-black transition-all cursor-pointer shadow-xs active:scale-95",
                frequencyType === type.id
                  ? "bg-[#161514] dark:bg-[#FAF8F5] text-white dark:text-[#161514] border-[#161514] dark:border-[#FAF8F5]"
                  : "bg-white dark:bg-[#1C1A18] text-[#161514]/80 dark:text-[#A8A29E] border-[#E8E5DF] dark:border-[#2A2724] hover:bg-[#FAF8F5] dark:hover:bg-[#252321]"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Days Checkboxes (44px touch targets) */}
      {frequencyType === "customDays" && (
        <div className="space-y-1.5">
          <label
            className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
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
                    "min-h-[44px] min-w-[44px] size-11 rounded-xl border text-xs font-black transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95",
                    isSelected
                      ? "bg-[#CEF431] text-[#161514] border-[#161514]"
                      : "bg-white dark:bg-[#1C1A18] text-[#161514]/70 dark:text-[#A8A29E] border-[#E8E5DF] dark:border-[#2A2724] hover:bg-[#FAF8F5] dark:hover:bg-[#252321]"
                  )}
                  title={day.full}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Numeric Goal Target Toggle */}
      <div className="flex items-center justify-between p-3 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] shadow-xs">
        <div>
          <p
            className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Numeric Goal Metric (Optional)
          </p>
          <p className="text-[10px] font-bold text-[#6B6B6B] dark:text-[#A8A29E] leading-tight">
            Track quantitative amounts (e.g. 50 pages, 30 mins)
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            setValue("isGoalStyle", !isGoalStyle);
          }}
          className={cn(
            "h-7 w-12 rounded-full transition-all relative border border-[#E8E5DF] dark:border-[#2A2724] cursor-pointer shadow-xs",
            isGoalStyle ? "bg-[#03D26F]" : "bg-gray-200 dark:bg-stone-700"
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full border border-black/10 shadow transition-all",
              isGoalStyle ? "left-6 bg-white" : "left-0.5 bg-white"
            )}
          />
        </button>
      </div>

      {/* Target Value & Unit */}
      {isGoalStyle && (
        <div className="grid grid-cols-2 gap-3 pt-0.5">
          <div className="space-y-1">
            <label
              className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Target Value
            </label>
            <input
              {...register("goalTarget")}
              type="number"
              placeholder="e.g. 15"
              className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#1C1A18] py-2 px-3 text-base font-bold outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5] text-[#161514] dark:text-[#FAF8F5] shadow-xs"
            />
          </div>
          <div className="space-y-1">
            <label
              className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Unit
            </label>
            <input
              {...register("goalUnit")}
              type="text"
              placeholder="e.g. pages, mins, km"
              className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#1C1A18] py-2 px-3 text-base font-bold outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5] text-[#161514] dark:text-[#FAF8F5] shadow-xs"
            />
          </div>
        </div>
      )}

      {/* Streak Freeze Protection Toggle */}
      <div className="flex items-center justify-between p-3 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#1C1A18] shadow-xs">
        <div>
          <p
            className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Streak Freeze Protection
          </p>
          <p className="text-[10px] font-bold text-[#6B6B6B] dark:text-[#A8A29E] leading-tight">
            Allow 1 grace skip day without breaking streak
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            setValue("allowGraceSkip", !allowGraceSkip);
          }}
          className={cn(
            "h-7 w-12 rounded-full transition-all relative border border-[#E8E5DF] dark:border-[#2A2724] cursor-pointer shadow-xs",
            allowGraceSkip ? "bg-sky-400" : "bg-gray-200 dark:bg-stone-700"
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full border border-black/10 shadow transition-all",
              allowGraceSkip ? "left-6 bg-white" : "left-0.5 bg-white"
            )}
          />
        </button>
      </div>

      {/* Form Submit Primary Button */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full min-h-[48px] bg-[#161514] hover:bg-[#252321] dark:bg-[#FAF8F5] dark:hover:bg-[#E8E5DF] text-white dark:text-[#161514] font-heading font-black text-sm rounded-xl py-3 mt-3 shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all uppercase tracking-wider"
      >
        {loading ? "Saving…" : initialValues ? "Update habit" : "Create habit"}
      </Button>
    </form>
  );
}
