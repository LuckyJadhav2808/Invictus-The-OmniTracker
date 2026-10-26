"use client";

import { useState, useMemo, useEffect } from "react";
import { Utensils, Plus, Trash2, Edit3, CheckCircle2, Circle, Flame, Sparkles, Target, Apple, ChevronDown, ChevronUp } from "lucide-react";
import { AdaptiveDrawerDialog } from "@/components/shared/AdaptiveDrawerDialog";
import { soundFX } from "@/components/shared/SoundFX";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { TemplatePack } from "@/components/shared/TemplateSelectionModal";
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
    pack.items.forEach((item, idx) => {
      addMealMutation.mutate({
        dateStr: todayStr,
        mealName: item.title,
        mealType: idx === 0 ? "Breakfast" : idx === 1 ? "Lunch" : "Snack",
        calories: 500,
        protein: 40,
        carbs: 45,
        fat: 15,
        mealTime: "12:00 PM",
        completed: false,
      });
    });
    setIsChoiceOpen(false);
    toast.success(`Applied ${pack.name} to today's diet!`);
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
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] sm:shadow-[5px_5px_0px_0px_#161514] space-y-5">
      {/* ─── STAGE 1: DAILY CALORIC & MACRO TELEMETRY COCKPIT ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#161514]/15">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-[#03D26F] border-2 border-[#161514] text-[#161514] flex items-center justify-center font-black shadow-[2px_2px_0px_0px_#161514] shrink-0">
            <Utensils className="size-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-heading font-black text-[#161514] tracking-wider uppercase">
                THE MACRO FORGE
              </h3>
              <span className="neo-badge bg-[#03D26F] text-[#161514] text-[9.5px] font-black border border-[#161514]">
                METABOLIC OS
              </span>
            </div>
            <p className="text-[11px] text-[#161514]/80 font-bold mt-0.5 flex items-center gap-2 flex-wrap">
              <span>
                Today&apos;s Intake: <strong className="text-emerald-800 font-black">{totalCalories} / {targets.calories} kcal</strong>
              </span>
              <span>•</span>
              <span>
                Protein Target: <strong className="text-[#161514] font-black">{totalProtein} / {targets.protein}g</strong>
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
          className="text-[10px] font-heading font-black text-[#161514] bg-amber-300 hover:bg-amber-400 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-y-0.5 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Target className="size-3.5 stroke-[2.5]" />
          <span>Edit Macro Goals</span>
        </button>
      </div>

      {/* 4 Macro Gauges Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Calories Card */}
        <div className="bg-[#FAF8F5] rounded-2xl p-3 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-heading font-black uppercase text-[#161514]/70">
            <span>Calories</span>
            <span>{Math.round((totalCalories / targets.calories) * 100)}%</span>
          </div>
          <div className="text-base font-heading font-black text-[#161514] font-mono">
            {totalCalories} <span className="text-[10px] text-[#161514]/60">/ {targets.calories} kcal</span>
          </div>
          <div className="h-2 w-full bg-white rounded-full border border-[#161514] overflow-hidden p-0.5">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (totalCalories / targets.calories) * 100)}%` }}
            />
          </div>
        </div>

        {/* Protein Card */}
        <div className="bg-[#ECFDF5] rounded-2xl p-3 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-heading font-black uppercase text-emerald-800">
            <span>Protein</span>
            <span>{Math.round((totalProtein / targets.protein) * 100)}%</span>
          </div>
          <div className="text-base font-heading font-black text-[#161514] font-mono">
            {totalProtein} <span className="text-[10px] text-[#161514]/60">/ {targets.protein}g</span>
          </div>
          <div className="h-2 w-full bg-white rounded-full border border-[#161514] overflow-hidden p-0.5">
            <div
              className="h-full bg-[#03D26F] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (totalProtein / targets.protein) * 100)}%` }}
            />
          </div>
        </div>

        {/* Carbs Card */}
        <div className="bg-[#FFF9EA] rounded-2xl p-3 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-heading font-black uppercase text-amber-800">
            <span>Carbs</span>
            <span>{Math.round((totalCarbs / targets.carbs) * 100)}%</span>
          </div>
          <div className="text-base font-heading font-black text-[#161514] font-mono">
            {totalCarbs} <span className="text-[10px] text-[#161514]/60">/ {targets.carbs}g</span>
          </div>
          <div className="h-2 w-full bg-white rounded-full border border-[#161514] overflow-hidden p-0.5">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (totalCarbs / targets.carbs) * 100)}%` }}
            />
          </div>
        </div>

        {/* Fat Card */}
        <div className="bg-[#FFF1F2] rounded-2xl p-3 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-heading font-black uppercase text-rose-800">
            <span>Fat</span>
            <span>{Math.round((totalFat / targets.fat) * 100)}%</span>
          </div>
          <div className="text-base font-heading font-black text-[#161514] font-mono">
            {totalFat} <span className="text-[10px] text-[#161514]/60">/ {targets.fat}g</span>
          </div>
          <div className="h-2 w-full bg-white rounded-full border border-[#161514] overflow-hidden p-0.5">
            <div
              className="h-full bg-sky-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (totalFat / targets.fat) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── STAGE 2: VISUAL MACRO FUEL DISTRIBUTION BAR ─── */}
      <div className="bg-[#FAF8F5] rounded-2xl p-4 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚡</span>
            <span className="text-xs font-heading font-black text-[#161514] uppercase tracking-wider">
              Caloric Ratio Breakdown:
            </span>
          </div>
          <div className="text-xs font-mono font-bold text-[#161514] flex items-center gap-2 flex-wrap">
            <span className="text-emerald-800">🟢 {proteinPct}% Protein</span>
            <span>•</span>
            <span className="text-amber-700">🟡 {carbsPct}% Carbs</span>
            <span>•</span>
            <span className="text-sky-700">🔵 {fatPct}% Fat</span>
          </div>
        </div>

        {/* Proportional Segmented Bar */}
        <div className="h-3.5 w-full bg-white rounded-full border-2 border-[#161514] overflow-hidden flex shadow-[1px_1px_0px_0px_#161514]">
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
        <div className="flex items-center justify-between text-[11px] font-bold text-[#161514]/75 pt-0.5">
          <span>
            {totalProtein >= targets.protein ? (
              <span className="text-emerald-700 font-black">
                🔥 ANABOLIC OPTIMIZED: {totalProtein}g/{targets.protein}g Protein Target Conquered!
              </span>
            ) : (
              <span>
                Need <strong>{targets.protein - totalProtein}g</strong> more protein to conquer today&apos;s target.
              </span>
            )}
          </span>
          <span className="font-mono text-[10px] text-[#161514]/60">
            {totalCalories <= targets.calories
              ? `${targets.calories - totalCalories} kcal buffer left`
              : `${totalCalories - targets.calories} kcal surplus`}
          </span>
        </div>
      </div>

      {/* ─── STAGE 3: IN BETWEEN: IMMERSIVE FOOD CHOICE ACTION BAR (ZERO OVERFLOW) ─── */}
      <div className="bg-cream-bg/60 rounded-2xl p-3.5 sm:p-4 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-heading font-black text-[#161514]">
              Today&apos;s Consumed Meals
            </span>
            <span className="bg-[#161514] text-white text-[10px] font-mono font-black px-2 py-0.5 rounded-full">
              {meals.length} Logged
            </span>
          </div>
          <p className="text-[11px] font-bold text-[#161514]/65 mt-0.5">
            Tap &apos;+ Log Fuel / Meal&apos; to pick from 1,000+ dishes or create custom meal recipes.
          </p>
        </div>

        {/* Action Buttons Container with flex-wrap ensuring ZERO OVERFLOW */}
        <div className="flex flex-wrap items-center justify-end gap-2 shrink min-w-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setIsChoiceOpen(true);
              soundFX.playPop();
            }}
            className="bg-[#03D26F] hover:bg-[#02b861] text-[#161514] font-heading font-black rounded-xl py-2 px-4 text-xs border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer flex items-center gap-1.5 transition-all whitespace-nowrap"
          >
            <Plus className="size-3.5 stroke-[3]" />
            <span>Log Fuel / Meal</span>
          </button>
        </div>
      </div>

      {/* ─── STAGE 4: TODAY'S CONSUMED MEALS STREAM ─── */}
      {isLoading ? (
        <div className="h-24 animate-pulse bg-cream-bg/60 rounded-2xl border-2 border-[#161514]" />
      ) : meals.length === 0 ? (
        <div className="bg-[#FFF9EA] rounded-2xl p-6 border-2 border-dashed border-[#161514] text-center space-y-2 shadow-[2px_2px_0px_0px_#161514]">
          <p className="text-xs font-heading font-black text-[#161514]">No meals logged for today yet! 🥗</p>
          <p className="text-[10px] text-[#161514]/80 font-bold max-w-sm mx-auto">
            Log your breakfast, lunch, pre/post workout meals, and dinner to keep your metabolic engine running strong.
          </p>
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
                  "bg-white rounded-2xl p-3 sm:p-3.5 border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514] transition-all",
                  m.completed && "bg-[#F0FDF4]"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Consumed Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleMeal(m)}
                      className={cn(
                        "size-8 rounded-xl border-2 border-[#161514] flex items-center justify-center cursor-pointer shadow-[1.5px_1.5px_0px_#161514] active:translate-y-0.5 transition-all shrink-0",
                        m.completed ? "bg-[#03D26F] text-[#161514]" : "bg-white hover:bg-[#FAF8F5]"
                      )}
                      title={m.completed ? "Mark meal incomplete" : "Mark meal consumed"}
                    >
                      {m.completed ? "✓" : <Circle className="size-4 text-[#161514]/40" />}
                    </button>

                    {/* Meal Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm">{mealEmoji}</span>
                        <h5 className="font-heading font-black text-xs sm:text-sm text-[#161514] truncate">
                          {m.name}
                        </h5>
                        <span className="neo-badge bg-[#ECFDF5] text-emerald-800 text-[8.5px]">
                          {m.mealType}
                        </span>
                        {m.time && (
                          <span className="text-[9px] font-mono font-bold text-[#161514]/60">
                            ({m.time})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-[#161514]/75 flex-wrap">
                        <span className="text-rose-700 font-black">🔥 {m.calories} kcal</span>
                        <span>•</span>
                        <span className="text-emerald-800 font-black">{m.protein}g Protein</span>
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
                      className="size-7 rounded-lg border border-[#161514] bg-[#FAF8F5] hover:bg-amber-100 flex items-center justify-center text-[#161514] cursor-pointer shadow-[1px_1px_0px_#161514]"
                      title="Edit meal"
                    >
                      <Edit3 className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteMealId(m.id)}
                      className="size-7 rounded-lg border border-[#161514] bg-[#FAF8F5] hover:bg-rose-100 flex items-center justify-center text-[#161514] hover:text-rose-600 cursor-pointer shadow-[1px_1px_0px_#161514]"
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
            <label className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514]">
              Daily Calorie Target (kcal)
            </label>
            <input
              type="number"
              placeholder="2200"
              inputMode="numeric"
              value={targetCaloriesInput}
              onChange={(e) => setTargetCaloriesInput(e.target.value)}
              className="w-full bg-white rounded-xl border-2 border-[#161514] px-3.5 py-2 text-xs font-mono font-black text-[#161514] shadow-[2px_2px_0px_#161514] outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="text-[9px] font-heading font-black uppercase text-emerald-800">
                Protein (g)
              </label>
              <input
                type="number"
                placeholder="140"
                inputMode="numeric"
                value={targetProteinInput}
                onChange={(e) => setTargetProteinInput(e.target.value)}
                className="w-full bg-white rounded-xl border-2 border-[#161514] px-3 py-2 text-xs font-mono font-black text-[#161514] shadow-[1.5px_1.5px_0px_#161514] outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-heading font-black uppercase text-amber-800">
                Carbs (g)
              </label>
              <input
                type="number"
                placeholder="220"
                inputMode="numeric"
                value={targetCarbsInput}
                onChange={(e) => setTargetCarbsInput(e.target.value)}
                className="w-full bg-white rounded-xl border-2 border-[#161514] px-3 py-2 text-xs font-mono font-black text-[#161514] shadow-[1.5px_1.5px_0px_#161514] outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-heading font-black uppercase text-rose-800">
                Fat (g)
              </label>
              <input
                type="number"
                placeholder="65"
                inputMode="numeric"
                value={targetFatInput}
                onChange={(e) => setTargetFatInput(e.target.value)}
                className="w-full bg-white rounded-xl border-2 border-[#161514] px-3 py-2 text-xs font-mono font-black text-[#161514] shadow-[1.5px_1.5px_0px_#161514] outline-none"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full min-h-[46px] bg-[#03D26F] hover:bg-[#02b861] text-[#161514] font-heading font-black text-xs uppercase tracking-wider rounded-xl py-3 border-2 border-[#161514] shadow-[3px_3px_0px_#161514] cursor-pointer mt-2"
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
            <label className="text-xs font-heading font-black uppercase tracking-wider text-[#161514]">
              Meal / Dish Name *
            </label>
            <input
              type="text"
              value={editMealName}
              onChange={(e) => setEditMealName(e.target.value)}
              className="w-full bg-white rounded-xl border-2 border-[#161514] px-4 py-2.5 text-base font-bold text-[#161514] shadow-[2px_2px_0px_0px_#161514] focus:outline-none focus:ring-2 focus:ring-[#161514]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-heading font-black uppercase tracking-wider text-[#161514]">
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
              <label className="text-xs font-heading font-black uppercase tracking-wider text-[#161514]">
                Time
              </label>
              <input
                type="text"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                className="w-full bg-white rounded-xl border-2 border-[#161514] px-4 py-2.5 text-base font-bold text-[#161514] shadow-[2px_2px_0px_0px_#161514] focus:outline-none focus:ring-2 focus:ring-[#161514]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-heading font-black text-[#161514] uppercase">Calories</label>
              <input
                type="number"
                value={editCalories}
                onChange={(e) => setEditCalories(e.target.value)}
                className="w-full bg-white rounded-xl border-2 border-[#161514] px-3 py-2 text-base font-bold text-[#161514] shadow-[2px_2px_0px_0px_#161514]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-heading font-black text-[#161514] uppercase">Protein (g)</label>
              <input
                type="number"
                value={editProtein}
                onChange={(e) => setEditProtein(e.target.value)}
                className="w-full bg-white rounded-xl border-2 border-[#161514] px-3 py-2 text-base font-bold text-[#161514] shadow-[2px_2px_0px_0px_#161514]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-heading font-black text-[#161514] uppercase">Carbs (g)</label>
              <input
                type="number"
                value={editCarbs}
                onChange={(e) => setEditCarbs(e.target.value)}
                className="w-full bg-white rounded-xl border-2 border-[#161514] px-3 py-2 text-base font-bold text-[#161514] shadow-[2px_2px_0px_0px_#161514]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-heading font-black text-[#161514] uppercase">Fat (g)</label>
              <input
                type="number"
                value={editFat}
                onChange={(e) => setEditFat(e.target.value)}
                className="w-full bg-white rounded-xl border-2 border-[#161514] px-3 py-2 text-base font-bold text-[#161514] shadow-[2px_2px_0px_0px_#161514]"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={updateMealMutation.isPending}
            className="w-full min-h-[48px] bg-[#03D26F] hover:bg-[#02b861] text-[#161514] font-heading font-black text-sm rounded-xl py-3 mt-3 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer transition-all uppercase tracking-wider"
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
