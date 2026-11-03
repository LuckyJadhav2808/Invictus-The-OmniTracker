"use client";

import { useState, useMemo, useEffect } from "react";
import { Utensils, Plus, Trash2, Edit3, CheckCircle2, Circle, Flame, Sparkles, Target, Apple, ChevronDown, ChevronUp } from "lucide-react";
import { AdaptiveDrawerDialog } from "@/components/shared/AdaptiveDrawerDialog";
import { soundFX } from "@/components/shared/SoundFX";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { TemplatePack } from "@/components/shared/TemplateSelectionModal";
import { MEAL_TEMPLATE_PACKS } from "@/lib/templates-data";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { NutritionChoiceModal, MEAL_TYPES, MealTypeOption } from "@/components/goals/NutritionChoiceModal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { useMealPlans, useAddMealPlan, useUpdateMealPlan, useDeleteMealPlan } from "@/lib/queries/gym";
import { cn } from "@/lib/utils";

interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const DEFAULT_TARGETS: MacroTargets = {
  calories: 2200,
  protein: 140,
  carbs: 220,
  fat: 65,
};

export function MealTracker() {
  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const { data: meals = [], isLoading } = useMealPlans(todayStr);
  const addMealMutation = useAddMealPlan();
  const updateMealMutation = useUpdateMealPlan();
  const deleteMealMutation = useDeleteMealPlan();

  // Modals state
  const [isChoiceOpen, setIsChoiceOpen] = useState(false);
  const [isTargetsOpen, setIsTargetsOpen] = useState(false);

  // Targets state with LocalStorage persistence
  const [targets, setTargets] = useState<MacroTargets>(DEFAULT_TARGETS);
  const [targetCaloriesInput, setTargetCaloriesInput] = useState(String(DEFAULT_TARGETS.calories));
  const [targetProteinInput, setTargetProteinInput] = useState(String(DEFAULT_TARGETS.protein));
  const [targetCarbsInput, setTargetCarbsInput] = useState(String(DEFAULT_TARGETS.carbs));
  const [targetFatInput, setTargetFatInput] = useState(String(DEFAULT_TARGETS.fat));

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("invictus_nutrition_targets");
        if (saved) {
          const parsed = JSON.parse(saved);
          setTargets(parsed);
          setTargetCaloriesInput(String(parsed.calories));
          setTargetProteinInput(String(parsed.protein));
          setTargetCarbsInput(String(parsed.carbs));
          setTargetFatInput(String(parsed.fat));
        }
      } catch {}
    }
  }, []);

  const handleSaveTargets = (e: React.FormEvent) => {
    e.preventDefault();
    const newTargets: MacroTargets = {
      calories: Number(targetCaloriesInput) || 2200,
      protein: Number(targetProteinInput) || 140,
      carbs: Number(targetCarbsInput) || 220,
      fat: Number(targetFatInput) || 65,
    };
    setTargets(newTargets);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("invictus_nutrition_targets", JSON.stringify(newTargets));
      } catch {}
    }
    toast.success("Daily macro targets saved! 🎯");
    setIsTargetsOpen(false);
    soundFX.playPop();
  };

  // Editing Meal state
  const [editingMeal, setEditingMeal] = useState<any | null>(null);
  const [editMealName, setEditMealName] = useState("");
  const [editMealType, setEditMealType] = useState<MealTypeOption>("Lunch");
  const [editCalories, setEditCalories] = useState("");
  const [editProtein, setEditProtein] = useState("");
  const [editCarbs, setEditCarbs] = useState("");
  const [editFat, setEditFat] = useState("");
  const [editTime, setEditTime] = useState("");

  const [deleteMealId, setDeleteMealId] = useState<string | null>(null);

  // Collapsed meal items (Default to collapsed receipts)
  const [collapsedMeals, setCollapsedMeals] = useState<Record<string, boolean>>({});

  const toggleMealCollapse = (id: string) => {
    setCollapsedMeals((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? true),
    }));
  };

  // Totals
  const totalCalories = useMemo(() => meals.reduce((sum: number, m: any) => sum + (m.calories || 0), 0), [meals]);
  const totalProtein = useMemo(() => meals.reduce((sum: number, m: any) => sum + (m.protein || 0), 0), [meals]);
  const totalCarbs = useMemo(() => meals.reduce((sum: number, m: any) => sum + (m.carbs || 0), 0), [meals]);
  const totalFat = useMemo(() => meals.reduce((sum: number, m: any) => sum + (m.fat || 0), 0), [meals]);

  // Caloric distribution percentages
  const proteinCals = totalProtein * 4;
  const carbsCals = totalCarbs * 4;
  const fatCals = totalFat * 9;
  const macroCalsSum = proteinCals + carbsCals + fatCals || 1;

  const proteinPct = Math.round((proteinCals / macroCalsSum) * 100);
  const carbsPct = Math.round((carbsCals / macroCalsSum) * 100);
  const fatPct = Math.max(0, 100 - proteinPct - carbsPct);

  // 1-Tap Log from Library
  const handleSelectDishFromLibrary = async (dish: any) => {
    try {
      await addMealMutation.mutateAsync({
        date: todayStr,
        name: dish.dishName,
        mealType: "Lunch",
        calories: Number(dish.calories) || 0,
        protein: Number(dish.protein) || 0,
        carbs: Number(dish.carbs) || 0,
        fat: Number(dish.fats) || 0,
        time: format(new Date(), "hh:mm a"),
        completed: true,
      });
      soundFX.playCompleteChime();
      soundFX.vibrate(20);
    } catch {
      toast.error("Failed to log dish");
    }
  };

  // Log Custom Meal
  const handleAddCustomMeal = async (custom: {
    name: string;
    mealType: MealTypeOption;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    time?: string;
  }) => {
    try {
      await addMealMutation.mutateAsync({
        date: todayStr,
        name: custom.name,
        mealType: custom.mealType,
        calories: custom.calories,
        protein: custom.protein,
        carbs: custom.carbs,
        fat: custom.fat,
        time: custom.time || format(new Date(), "hh:mm a"),
        completed: true,
      });
      soundFX.playPop();
      soundFX.vibrate(20);
      toast.success(`Logged '${custom.name}'! 🥗`);
      setIsChoiceOpen(false);
    } catch {
      toast.error("Failed to add meal");
    }
  };

  // Apply Template Pack
  const handleApplyMealPack = (pack: TemplatePack) => {
    const mealTypes: MealTypeOption[] = ["Breakfast", "Lunch", "Snack", "Dinner"];
    const defaultTimes = ["08:30 AM", "01:30 PM", "05:00 PM", "08:30 PM"];

    pack.items.forEach((item, idx) => {
      let calories = 500;
      let protein = 35;
      let carbs = 45;
      let fat = 15;

      if (item.desc) {
        const calMatch = item.desc.match(/(\d+)\s*kcal/i);
        const pMatch = item.desc.match(/(\d+)g\s*Protein/i);
        if (calMatch) calories = Number(calMatch[1]);
        if (pMatch) protein = Number(pMatch[1]);
        carbs = Math.max(10, Math.round((calories * 0.4) / 4));
        fat = Math.max(5, Math.round((calories * 0.25) / 9));
      }

      addMealMutation.mutate({
        date: todayStr,
        name: item.title,
        mealType: mealTypes[idx % mealTypes.length],
        calories,
        protein,
        carbs,
        fat,
        time: defaultTimes[idx % defaultTimes.length],
        completed: false,
      });
    });
    setIsChoiceOpen(false);
    soundFX.playPop();
    soundFX.vibrate(20);
    toast.success(`Applied ${pack.name} to today's diet! 🥗`);
  };

  const handleUpdateMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeal || !editMealName.trim()) return;

    try {
      await updateMealMutation.mutateAsync({
        id: editingMeal.id,
        name: editMealName.trim(),
        mealType: editMealType,
        calories: Number(editCalories) || 0,
        protein: Number(editProtein) || 0,
        carbs: Number(editCarbs) || 0,
        fat: Number(editFat) || 0,
        time: editTime.trim(),
      });
      toast.success("Meal updated! 📝");
      setEditingMeal(null);
    } catch {
      toast.error("Failed to update meal");
    }
  };

  const handleDeleteMeal = async () => {
    if (!deleteMealId) return;
    try {
      await deleteMealMutation.mutateAsync(deleteMealId);
      toast.success("Meal entry deleted 🗑️");
      setDeleteMealId(null);
    } catch {
      toast.error("Failed to delete meal");
    }
  };

  const handleToggleMeal = async (meal: any) => {
    try {
      await updateMealMutation.mutateAsync({
        id: meal.id,
        completed: !meal.completed,
      });
      if (!meal.completed) {
        soundFX.playPop();
        soundFX.vibrate(20);
        toast.success("Meal consumed! 🍎");
      } else {
        toast.info("Meal unchecked");
      }
    } catch {
      toast.error("Failed to update meal status");
    }
  };

  return (
    <div className="bg-white dark:bg-[#161514] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-5">
      {/* ─── STAGE 1: DAILY CALORIC & MACRO TELEMETRY COCKPIT ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E5DF] dark:border-[#2A2724]">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-[#03D26F]/10 border border-[#03D26F]/20 text-[#047857] dark:text-[#03D26F] flex items-center justify-center font-black shadow-xs shrink-0">
            <Utensils className="size-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-heading font-black text-[#161514] dark:text-stone-100 tracking-wider uppercase">
                THE MACRO FORGE
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#03D26F]/15 text-[#047857] dark:text-[#03D26F] border border-[#03D26F]/30">
                METABOLIC OS
              </span>
            </div>
            <p className="text-[11px] text-[#6B6B6B] dark:text-[#A8A29E] font-medium mt-0.5 flex items-center gap-2 flex-wrap">
              <span>
                Today&apos;s Intake: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{totalCalories} / {targets.calories} kcal</strong>
              </span>
              <span>•</span>
              <span>
                Protein Target: <strong className="text-[#161514] dark:text-stone-200 font-bold">{totalProtein} / {targets.protein}g</strong>
              </span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsTargetsOpen(true);
            soundFX.playPop();
          }}
          className="text-[11px] font-heading font-black text-[#161514] dark:text-stone-200 bg-white dark:bg-[#1C1A18] hover:bg-[#FAF8F5] dark:hover:bg-[#252321] px-3.5 py-1.5 rounded-xl cursor-pointer transition-all border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs hover:-translate-y-0.5 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Target className="size-3.5 stroke-[2.2]" />
          <span>Edit Macro Goals</span>
        </button>
      </div>

      {/* 4 Macro Gauges Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Calories Card */}
        <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl p-3 border border-[#E8E5DF] dark:border-[#2A2724] space-y-1.5 shadow-none">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase text-[#6B6B6B] dark:text-[#A8A29E]">
            <span>Calories</span>
            <span className="text-[#161514] dark:text-stone-200 font-black">{Math.round((totalCalories / targets.calories) * 100)}%</span>
          </div>
          <div className="text-base font-heading font-black text-[#161514] dark:text-stone-100 font-mono">
            {totalCalories} <span className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] font-normal">/ {targets.calories} kcal</span>
          </div>
          <div className="h-1.5 w-full bg-[#E8E5DF] dark:bg-[#2A2724] rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (totalCalories / targets.calories) * 100)}%` }}
            />
          </div>
        </div>

        {/* Protein Card */}
        <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl p-3 border border-[#E8E5DF] dark:border-[#2A2724] space-y-1.5 shadow-none">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase text-emerald-700 dark:text-emerald-400">
            <span>Protein</span>
            <span className="font-black">{Math.round((totalProtein / targets.protein) * 100)}%</span>
          </div>
          <div className="text-base font-heading font-black text-[#161514] dark:text-stone-100 font-mono">
            {totalProtein} <span className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] font-normal">/ {targets.protein}g</span>
          </div>
          <div className="h-1.5 w-full bg-[#E8E5DF] dark:bg-[#2A2724] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#03D26F] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (totalProtein / targets.protein) * 100)}%` }}
            />
          </div>
        </div>

        {/* Carbs Card */}
        <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl p-3 border border-[#E8E5DF] dark:border-[#2A2724] space-y-1.5 shadow-none">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase text-amber-700 dark:text-amber-400">
            <span>Carbs</span>
            <span className="font-black">{Math.round((totalCarbs / targets.carbs) * 100)}%</span>
          </div>
          <div className="text-base font-heading font-black text-[#161514] dark:text-stone-100 font-mono">
            {totalCarbs} <span className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] font-normal">/ {targets.carbs}g</span>
          </div>
          <div className="h-1.5 w-full bg-[#E8E5DF] dark:bg-[#2A2724] rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (totalCarbs / targets.carbs) * 100)}%` }}
            />
          </div>
        </div>

        {/* Fat Card */}
        <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl p-3 border border-[#E8E5DF] dark:border-[#2A2724] space-y-1.5 shadow-none">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase text-sky-700 dark:text-sky-400">
            <span>Fat</span>
            <span className="font-black">{Math.round((totalFat / targets.fat) * 100)}%</span>
          </div>
          <div className="text-base font-heading font-black text-[#161514] dark:text-stone-100 font-mono">
            {totalFat} <span className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] font-normal">/ {targets.fat}g</span>
          </div>
          <div className="h-1.5 w-full bg-[#E8E5DF] dark:bg-[#2A2724] rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (totalFat / targets.fat) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── STAGE 2: VISUAL MACRO FUEL DISTRIBUTION BAR ─── */}
      <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl p-3.5 border border-[#E8E5DF] dark:border-[#2A2724] space-y-2.5 shadow-none">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚡</span>
            <span className="text-xs font-heading font-black text-[#161514] dark:text-stone-100 uppercase tracking-wider">
              Caloric Ratio Breakdown:
            </span>
          </div>
          <div className="text-xs font-mono font-bold text-[#161514] dark:text-stone-200 flex items-center gap-2 flex-wrap">
            <span className="text-emerald-700 dark:text-emerald-400">🟢 {proteinPct}% Protein</span>
            <span>•</span>
            <span className="text-amber-700 dark:text-amber-400">🟡 {carbsPct}% Carbs</span>
            <span>•</span>
            <span className="text-sky-700 dark:text-sky-400">🔵 {fatPct}% Fat</span>
          </div>
        </div>

        {/* Proportional Segmented Bar */}
        <div className="h-2.5 w-full bg-[#E8E5DF] dark:bg-[#2A2724] rounded-full overflow-hidden flex">
          <div
            className="h-full bg-[#03D26F] transition-all duration-300"
            style={{ width: `${totalCalories > 0 ? proteinPct : 33}%` }}
            title={`Protein: ${proteinPct}%`}
          />
          <div
            className="h-full bg-amber-400 transition-all duration-300"
            style={{ width: `${totalCalories > 0 ? carbsPct : 34}%` }}
            title={`Carbs: ${carbsPct}%`}
          />
          <div
            className="h-full bg-sky-400 transition-all duration-300"
            style={{ width: `${totalCalories > 0 ? fatPct : 33}%` }}
            title={`Fat: ${fatPct}%`}
          />
        </div>

        {/* Motivational Metabolic Status Badge */}
        <div className="flex items-center justify-between text-[11px] font-medium text-[#6B6B6B] dark:text-[#A8A29E] pt-0.5">
          <span>
            {totalProtein >= targets.protein ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                🔥 ANABOLIC OPTIMIZED: {totalProtein}g/{targets.protein}g Protein Target Conquered!
              </span>
            ) : (
              <span>
                Need <strong className="text-[#161514] dark:text-stone-200 font-bold">{targets.protein - totalProtein}g</strong> more protein to conquer today&apos;s target.
              </span>
            )}
          </span>
          <span className="font-mono text-[10px]">
            {totalCalories <= targets.calories
              ? `${targets.calories - totalCalories} kcal buffer left`
              : `${totalCalories - targets.calories} kcal surplus`}
          </span>
        </div>
      </div>

      {/* ─── STAGE 3: FOOD CHOICE ACTION BAR ─── */}
      <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl p-3 sm:p-3.5 border border-[#E8E5DF] dark:border-[#2A2724] flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0 shadow-none">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-heading font-black text-[#161514] dark:text-stone-100">
              Today&apos;s Consumed Meals
            </span>
            <span className="bg-[#161514] dark:bg-stone-800 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
              {meals.length} Logged
            </span>
          </div>
          <p className="text-[11px] text-[#6B6B6B] dark:text-[#A8A29E] mt-0.5">
            Log your dishes from the 1,000+ vault or create custom meal recipes.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsChoiceOpen(true);
              soundFX.playPop();
            }}
            className="bg-[#161514] hover:bg-[#2A2724] dark:bg-white dark:hover:bg-stone-200 text-white dark:text-[#161514] font-heading font-black rounded-xl py-2 px-3.5 text-xs border border-[#161514] dark:border-white shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center gap-1.5 transition-all whitespace-nowrap"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>+ Log Fuel / Meal</span>
          </button>
        </div>
      </div>

      {/* ─── STAGE 4: TODAY'S CONSUMED MEALS STREAM ─── */}
      {isLoading ? (
        <div className="h-24 animate-pulse bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724]" />
      ) : meals.length === 0 ? (
        /* ─── ZERO-CONFUSION FIRST-RUN ONBOARDING COCKPIT ─── */
        <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-2xl p-5 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] space-y-4 shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#03D26F] animate-pulse" />
                <h4 className="text-sm font-heading font-black text-[#161514] dark:text-stone-100 uppercase tracking-wider">
                  Start Today&apos;s Nutrition Log 🥗
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 font-bold">
                  1-TAP SETUP
                </span>
              </div>
              <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] max-w-lg leading-relaxed">
                Track what you eat to hit your daily {targets.calories} kcal &amp; {targets.protein}g protein targets. Pick a proven diet pack or quickly log your first meal.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsChoiceOpen(true);
                soundFX.playPop();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161514] text-white hover:bg-[#2A2724] dark:bg-white dark:text-[#161514] dark:hover:bg-stone-200 text-xs font-heading font-black shadow-xs cursor-pointer transition-all self-start sm:self-auto shrink-0"
            >
              <Sparkles className="size-3.5 text-[#03D26F]" />
              <span>Browse 1,000+ Dish Vault</span>
            </button>
          </div>

          {/* 1-Tap Curated Meal Packs Grid */}
          <div className="space-y-2 pt-1">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6B6B] dark:text-[#A8A29E]">
              Quick-Load Battle-Tested Meal Plans
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {MEAL_TEMPLATE_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => handleApplyMealPack(pack)}
                  className="text-left p-3.5 rounded-xl bg-white dark:bg-[#161514] border border-[#E8E5DF] dark:border-[#2A2724] hover:border-[#161514]/40 dark:hover:border-stone-500 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-base">{pack.icon === "Target" ? "🎯" : pack.icon === "Sparkles" ? "⚡" : "🥗"}</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#252321] text-[#161514] dark:text-stone-300 border border-[#E8E5DF] dark:border-[#2A2724]">
                        {pack.badge}
                      </span>
                    </div>
                    <h5 className="font-heading font-black text-xs text-[#161514] dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {pack.name}
                    </h5>
                    <p className="text-[11px] text-[#6B6B6B] dark:text-[#A8A29E] mt-1 line-clamp-2 leading-snug">
                      {pack.tagline}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#E8E5DF]/60 dark:border-[#2A2724] flex items-center justify-between text-[10px] font-bold text-[#161514] dark:text-stone-200">
                    <span className="font-mono text-[9px] text-[#6B6B6B] dark:text-[#A8A29E]">{pack.items.length} meals</span>
                    <span className="group-hover:translate-x-0.5 transition-transform text-emerald-800 dark:text-emerald-400 font-black">Load Plan ➔</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 1-Tap Quick Add Row for standard meals */}
          <div className="pt-2 border-t border-[#E8E5DF] dark:border-[#2A2724] flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono font-bold text-[#6B6B6B] dark:text-[#A8A29E] uppercase mr-1">
              Or quick log:
            </span>
            {[
              { label: "🍳 Breakfast", type: "Breakfast" as MealTypeOption, name: "Morning Breakfast", cal: 450, p: 25, c: 45, f: 12 },
              { label: "🍱 Lunch", type: "Lunch" as MealTypeOption, name: "Lunch Bowl", cal: 650, p: 40, c: 65, f: 18 },
              { label: "🥪 Snack / Shake", type: "Snack" as MealTypeOption, name: "Protein Shake", cal: 280, p: 30, c: 15, f: 4 },
              { label: "🍲 Dinner", type: "Dinner" as MealTypeOption, name: "Nutritious Dinner", cal: 600, p: 45, c: 50, f: 16 },
            ].map((quick) => (
              <button
                key={quick.type}
                type="button"
                onClick={() => {
                  handleAddCustomMeal({
                    name: quick.name,
                    mealType: quick.type,
                    calories: quick.cal,
                    protein: quick.p,
                    carbs: quick.c,
                    fat: quick.f,
                  });
                }}
                className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-[#161514] border border-[#E8E5DF] dark:border-[#2A2724] hover:bg-[#FAF8F5] dark:hover:bg-[#252321] text-[#161514] dark:text-stone-200 shadow-none hover:shadow-xs transition-all cursor-pointer"
              >
                + {quick.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {meals.map((m: any) => {
            const isCollapsed = collapsedMeals[m.id] ?? true;
            const mealEmoji =
              m.mealType === "Breakfast"
                ? "🍳"
                : m.mealType === "Lunch"
                ? "🍱"
                : m.mealType === "Dinner"
                ? "🍲"
                : m.mealType === "Snack"
                ? "🥪"
                : "⚡";

            return (
              <div
                key={m.id}
                className={cn(
                  "bg-white dark:bg-[#1C1A18] rounded-xl p-3 sm:p-3.5 border border-[#E8E5DF] dark:border-[#2A2724] shadow-none hover:border-[#161514]/30 dark:hover:border-stone-500 transition-all",
                  m.completed && "bg-[#ECFDF5]/50 dark:bg-[#03D26F]/10 border-[#03D26F]/30"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Consumed Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleMeal(m)}
                      className={cn(
                        "size-7 rounded-lg border flex items-center justify-center cursor-pointer transition-all shrink-0",
                        m.completed
                          ? "bg-[#03D26F] text-[#161514] border-[#03D26F]"
                          : "bg-[#FAF8F5] dark:bg-[#252321] border-[#E8E5DF] dark:border-[#2A2724] hover:border-[#161514]/40"
                      )}
                      title={m.completed ? "Mark meal incomplete" : "Mark meal consumed"}
                    >
                      {m.completed ? (
                        <CheckCircle2 className="size-4 stroke-[2.5]" />
                      ) : (
                        <Circle className="size-3.5 text-[#161514]/40 dark:text-stone-400" />
                      )}
                    </button>

                    {/* Meal Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm">{mealEmoji}</span>
                        <h5 className="font-heading font-black text-xs sm:text-sm text-[#161514] dark:text-stone-100 truncate">
                          {m.name}
                        </h5>
                        <span className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-[#FAF8F5] dark:bg-[#252321] text-[#161514] dark:text-stone-300 border border-[#E8E5DF] dark:border-[#2A2724]">
                          {m.mealType}
                        </span>
                        {m.time && (
                          <span className="text-[9px] font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
                            ({m.time})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[10px] font-medium text-[#6B6B6B] dark:text-[#A8A29E] flex-wrap">
                        <span className="text-rose-600 dark:text-rose-400 font-bold">🔥 {m.calories} kcal</span>
                        <span>•</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">{m.protein}g Protein</span>
                        <span>•</span>
                        <span>{m.carbs}g Carbs</span>
                        <span>•</span>
                        <span>{m.fat}g Fat</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMeal(m);
                        setEditMealName(m.name);
                        setEditMealType(m.mealType || "Lunch");
                        setEditCalories(String(m.calories || 0));
                        setEditProtein(String(m.protein || 0));
                        setEditCarbs(String(m.carbs || 0));
                        setEditFat(String(m.fat || 0));
                        setEditTime(m.time || "");
                      }}
                      className="size-7 rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#252321] hover:bg-[#E8E5DF] dark:hover:bg-[#2A2724] flex items-center justify-center text-[#161514] dark:text-stone-300 cursor-pointer shadow-none transition-colors"
                      title="Edit meal"
                    >
                      <Edit3 className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteMealId(m.id)}
                      className="size-7 rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#252321] hover:bg-rose-100 dark:hover:bg-rose-950/40 flex items-center justify-center text-[#161514] dark:text-stone-300 hover:text-rose-600 cursor-pointer shadow-none transition-colors"
                      title="Delete meal"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── IMMERSIVE NUTRITION CHOICE MODAL (1,000+ DB, CUSTOM, PRESETS) ─── */}
      <NutritionChoiceModal
        open={isChoiceOpen}
        onOpenChange={setIsChoiceOpen}
        onSelectDishFromLibrary={handleSelectDishFromLibrary}
        onAddCustomMeal={handleAddCustomMeal}
        onApplyPresetPack={handleApplyMealPack}
        isPending={addMealMutation.isPending}
      />

      {/* ─── EDIT MACRO TARGETS MODAL ─── */}
      <AdaptiveDrawerDialog
        open={isTargetsOpen}
        onOpenChange={setIsTargetsOpen}
        title="Edit Daily Macro Targets"
        description="Set your caloric ceiling and nutrient goals for athletic performance."
      >
        <form onSubmit={handleSaveTargets} className="space-y-3.5 pt-1">
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#161514] dark:text-stone-200">
              Daily Calorie Target (kcal)
            </label>
            <input
              type="number"
              placeholder="2200"
              inputMode="numeric"
              value={targetCaloriesInput}
              onChange={(e) => setTargetCaloriesInput(e.target.value)}
              className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3.5 py-2 text-xs font-mono font-bold text-[#161514] dark:text-stone-100 outline-none focus:border-[#161514] dark:focus:border-white shadow-none"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold uppercase text-emerald-700 dark:text-emerald-400">
                Protein (g)
              </label>
              <input
                type="number"
                placeholder="140"
                inputMode="numeric"
                value={targetProteinInput}
                onChange={(e) => setTargetProteinInput(e.target.value)}
                className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3 py-2 text-xs font-mono font-bold text-[#161514] dark:text-stone-100 outline-none focus:border-[#161514] dark:focus:border-white shadow-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold uppercase text-amber-700 dark:text-amber-400">
                Carbs (g)
              </label>
              <input
                type="number"
                placeholder="220"
                inputMode="numeric"
                value={targetCarbsInput}
                onChange={(e) => setTargetCarbsInput(e.target.value)}
                className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3 py-2 text-xs font-mono font-bold text-[#161514] dark:text-stone-100 outline-none focus:border-[#161514] dark:focus:border-white shadow-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold uppercase text-sky-700 dark:text-sky-400">
                Fat (g)
              </label>
              <input
                type="number"
                placeholder="65"
                inputMode="numeric"
                value={targetFatInput}
                onChange={(e) => setTargetFatInput(e.target.value)}
                className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3 py-2 text-xs font-mono font-bold text-[#161514] dark:text-stone-100 outline-none focus:border-[#161514] dark:focus:border-white shadow-none"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full min-h-[44px] bg-[#161514] hover:bg-[#2A2724] dark:bg-white dark:text-[#161514] dark:hover:bg-stone-200 text-white font-heading font-black text-xs uppercase tracking-wider rounded-xl py-2.5 border border-[#161514] dark:border-white shadow-xs cursor-pointer mt-2"
          >
            Save Target Goals ➔
          </Button>
        </form>
      </AdaptiveDrawerDialog>

      {/* ─── EDIT MEAL MODAL ─── */}
      <AdaptiveDrawerDialog
        open={editingMeal !== null}
        onOpenChange={(open) => {
          if (!open) setEditingMeal(null);
        }}
        title="Edit Meal & Macros"
        description="Update your logged food item"
      >
        <form onSubmit={handleUpdateMealSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#161514] dark:text-stone-200">
              Meal / Dish Name *
            </label>
            <input
              type="text"
              value={editMealName}
              onChange={(e) => setEditMealName(e.target.value)}
              className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3.5 py-2.5 text-xs font-bold text-[#161514] dark:text-stone-100 shadow-none focus:border-[#161514] dark:focus:border-white outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#161514] dark:text-stone-200">
                Meal Type
              </label>
              <NeobrutalistSelect
                value={editMealType}
                onChange={(val) => setEditMealType(val as any)}
                options={MEAL_TYPES.map((t) => ({
                  value: t,
                  label: t,
                  icon: t === "Breakfast" ? "🍳" : t === "Lunch" ? "🍱" : t === "Dinner" ? "🍲" : t === "Snack" ? "🥪" : "⚡",
                }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#161514] dark:text-stone-200">
                Time
              </label>
              <input
                type="text"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3.5 py-2 text-xs font-bold text-[#161514] dark:text-stone-100 shadow-none focus:border-[#161514] dark:focus:border-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-[#161514] dark:text-stone-200 uppercase">Calories</label>
              <input
                type="number"
                value={editCalories}
                onChange={(e) => setEditCalories(e.target.value)}
                className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3 py-2 text-xs font-mono font-bold text-[#161514] dark:text-stone-100 shadow-none focus:border-[#161514] dark:focus:border-white outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase">Protein (g)</label>
              <input
                type="number"
                value={editProtein}
                onChange={(e) => setEditProtein(e.target.value)}
                className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3 py-2 text-xs font-mono font-bold text-[#161514] dark:text-stone-100 shadow-none focus:border-[#161514] dark:focus:border-white outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 uppercase">Carbs (g)</label>
              <input
                type="number"
                value={editCarbs}
                onChange={(e) => setEditCarbs(e.target.value)}
                className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3 py-2 text-xs font-mono font-bold text-[#161514] dark:text-stone-100 shadow-none focus:border-[#161514] dark:focus:border-white outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-sky-700 dark:text-sky-400 uppercase">Fat (g)</label>
              <input
                type="number"
                value={editFat}
                onChange={(e) => setEditFat(e.target.value)}
                className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3 py-2 text-xs font-mono font-bold text-[#161514] dark:text-stone-100 shadow-none focus:border-[#161514] dark:focus:border-white outline-none"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={updateMealMutation.isPending}
            className="w-full min-h-[44px] bg-[#161514] hover:bg-[#2A2724] dark:bg-white dark:text-[#161514] dark:hover:bg-stone-200 text-white font-heading font-black text-xs rounded-xl py-2.5 mt-3 border border-[#161514] dark:border-white shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all uppercase tracking-wider"
          >
            Save Changes
          </Button>
        </form>
      </AdaptiveDrawerDialog>

      {/* ─── DELETE MEAL CONFIRMATION MODAL ─── */}
      <DeleteConfirmationModal
        open={deleteMealId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteMealId(null);
        }}
        onConfirm={handleDeleteMeal}
        title="Delete Meal Log"
        description="Are you sure you want to delete this meal entry?"
      />
    </div>
  );
}
