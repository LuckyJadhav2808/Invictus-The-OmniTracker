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
import { Sparkles, Clock, Target, Calendar } from "lucide-react";
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
  { label: "🌅 Morning", time: "08:00 AM" },
  { label: "☀️ Noon", time: "12:00 PM" },
  { label: "🌆 Evening", time: "07:00 PM" },
  { label: "🌙 Night", time: "10:00 PM" },
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
      toast.error("Please enter a habit title 📝");
    } else {
      toast.error("Please check the required fields");
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit, handleFormError)} className="space-y-4 pt-1">
      {/* 1-Tap Quick Routine Template Chips */}
      {!initialValues && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514]/70 flex items-center gap-1">
            <Sparkles className="size-3 text-amber-500 stroke-[2.5]" />
            <span>Instant Routine Presets</span>
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {TEMPLATE_SHORTCUTS.map((tpl) => (
              <button
                key={tpl.title}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50/80 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5 text-[#161514] select-none"
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
          className="text-xs font-heading font-black uppercase tracking-wider text-[#161514] flex items-center gap-1"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <Target className="size-3.5 stroke-[2.5] text-amber-500" />
          <span>Habit Title *</span>
        </label>
        <input
          {...register("title")}
          type="text"
          placeholder="e.g. Read 15 pages, Drink Water, Gym…"
          className="w-full rounded-xl border-2 border-[#161514] bg-white py-2.5 px-3.5 text-base font-bold text-[#161514] outline-none focus:bg-[#FFF9EA] shadow-[2px_2px_0px_0px_#161514] focus:shadow-[3px_3px_0px_0px_#161514] transition-all placeholder:text-[#161514]/40"
          required
        />
        {errors.title?.message && (
          <p className="text-xs text-rose-600 font-black mt-1">{errors.title.message as string}</p>
        )}
      </div>

      {/* Reminder Time Picker with Ergonomic Quick Chips */}
      <div className="space-y-2">
        <label
          className="text-xs font-heading font-black uppercase tracking-wider text-[#161514] flex items-center gap-1"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <Clock className="size-3.5 stroke-[2.5] text-sky-600" />
          <span>Daily Reminder Time</span>
        </label>

        {/* Quick Time Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {TIME_PRESETS.map((preset) => {
            const isMatch = reminderTime === preset.time;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setValue("reminderTime", preset.time);
                }}
                className={cn(
                  "min-h-[38px] py-1.5 px-2 rounded-xl text-xs font-bold border-2 border-[#161514] transition-all cursor-pointer flex items-center justify-center text-center",
                  isMatch
                    ? "bg-[#CEF431] text-[#161514] font-black shadow-[2px_2px_0px_0px_#161514]"
                    : "bg-white hover:bg-slate-50 text-[#161514]/80 shadow-[1px_1px_0px_0px_#161514]"
                )}
              >
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
          className="w-full rounded-xl border-2 border-[#161514] bg-white py-2 px-3 text-base font-bold text-[#161514] outline-none focus:bg-[#FFF9EA] shadow-[2px_2px_0px_0px_#161514] transition-all placeholder:text-[#161514]/40 mt-1"
        />
      </div>

      {/* Icon Picker (44px touch targets) */}
      <div className="space-y-1.5">
        <label
          className="text-xs font-heading font-black uppercase tracking-wider text-[#161514]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Choose Icon
        </label>
        <div className="grid grid-cols-5 gap-2 bg-[#FAF8F5] p-2.5 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514]">
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
                  "p-2 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center border-2 transition-all cursor-pointer",
                  isSelected
                    ? "bg-[#CEF431] border-[#161514] text-[#161514] shadow-[2px_2px_0px_0px_#161514] scale-105"
                    : "border-transparent text-[#161514]/80 hover:bg-white"
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
          className="text-xs font-heading font-black uppercase tracking-wider text-[#161514]"
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
                  "min-h-[44px] min-w-[44px] size-11 rounded-xl transition-all flex items-center justify-center border-2 border-[#161514] cursor-pointer shadow-[2px_2px_0px_0px_#161514]",
                  c.bg,
                  isSelected && "ring-2 ring-[#161514] scale-105 shadow-[3px_3px_0px_0px_#161514]"
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
          className="text-xs font-heading font-black uppercase tracking-wider text-[#161514] flex items-center gap-1"
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
                "min-h-[44px] py-2 rounded-xl border-2 border-[#161514] text-xs font-heading font-black transition-all cursor-pointer shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
                frequencyType === type.id
                  ? "bg-[#CEF431] text-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514]"
                  : "bg-white text-[#161514]/80 hover:bg-[#FAF8F5]"
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
            className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514]"
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
                    "min-h-[44px] min-w-[44px] size-11 rounded-xl border-2 border-[#161514] text-xs font-black transition-all flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
                    isSelected
                      ? "bg-[#CEF431] text-[#161514]"
                      : "bg-white text-[#161514]/70 hover:bg-[#FAF8F5]"
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
      <div className="flex items-center justify-between p-3 rounded-2xl border-2 border-[#161514] bg-[#FAF8F5] shadow-[2px_2px_0px_0px_#161514]">
        <div>
          <p
            className="text-xs font-heading font-black text-[#161514]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Numeric Goal Metric (Optional)
          </p>
          <p className="text-[10px] font-bold text-[#161514]/70 leading-tight">
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
            "h-7 w-12 rounded-full transition-all relative border-2 border-[#161514] cursor-pointer shadow-[1px_1px_0px_0px_#161514]",
            isGoalStyle ? "bg-[#CEF431]" : "bg-gray-200"
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full border border-[#161514] shadow transition-all",
              isGoalStyle ? "left-6 bg-[#161514]" : "left-0.5 bg-white"
            )}
          />
        </button>
      </div>

      {/* Target Value & Unit */}
      {isGoalStyle && (
        <div className="grid grid-cols-2 gap-3 pt-0.5">
          <div className="space-y-1">
            <label
              className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Target Value
            </label>
            <input
              {...register("goalTarget")}
              type="number"
              placeholder="e.g. 15"
              className="w-full rounded-xl border-2 border-[#161514] bg-white py-2 px-3 text-base font-bold outline-none focus:bg-[#FFF9EA] text-[#161514] shadow-[2px_2px_0px_0px_#161514]"
            />
          </div>
          <div className="space-y-1">
            <label
              className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Unit
            </label>
            <input
              {...register("goalUnit")}
              type="text"
              placeholder="e.g. pages, mins, km"
              className="w-full rounded-xl border-2 border-[#161514] bg-white py-2 px-3 text-base font-bold outline-none focus:bg-[#FFF9EA] text-[#161514] shadow-[2px_2px_0px_0px_#161514]"
            />
          </div>
        </div>
      )}

      {/* Streak Freeze Protection Toggle */}
      <div className="flex items-center justify-between p-3 rounded-2xl border-2 border-[#161514] bg-[#FAF8F5] shadow-[2px_2px_0px_0px_#161514]">
        <div>
          <p
            className="text-xs font-heading font-black text-[#161514]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Streak Freeze Protection
          </p>
          <p className="text-[10px] font-bold text-[#161514]/70 leading-tight">
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
            "h-7 w-12 rounded-full transition-all relative border-2 border-[#161514] cursor-pointer shadow-[1px_1px_0px_0px_#161514]",
            allowGraceSkip ? "bg-sky-400" : "bg-gray-200"
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full border border-[#161514] shadow transition-all",
              allowGraceSkip ? "left-6 bg-[#161514]" : "left-0.5 bg-white"
            )}
          />
        </button>
      </div>

      {/* Form Submit Primary Button */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full min-h-[48px] bg-[#03D26F] hover:bg-[#02b861] text-[#161514] font-heading font-black text-sm rounded-xl py-3 mt-3 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer transition-all uppercase tracking-wider"
      >
        {loading ? "Saving…" : initialValues ? "Update Habit 🌟" : "Create Habit 💪"}
      </Button>
    </form>
  );
}
