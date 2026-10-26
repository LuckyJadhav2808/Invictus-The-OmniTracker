"use client";

import React, { useState, useDeferredValue, useEffect } from "react";
import { Search, Plus, Sparkles, X, ChevronDown, ArrowLeft, Utensils, Flame, Apple, Layers } from "lucide-react";
import { AdaptiveDrawerDialog } from "@/components/shared/AdaptiveDrawerDialog";
import { MEAL_TEMPLATE_PACKS } from "@/lib/templates-data";
import { TemplatePack } from "@/components/shared/TemplateSelectionModal";
import { useNutritionLibrary } from "@/lib/queries/nutrition";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

export const MEAL_TYPES = [
  "Breakfast",
  "Lunch",
  "Snack",
  "Dinner",
  "Pre-Workout",
  "Post-Workout",
] as const;

export type MealTypeOption = typeof MEAL_TYPES[number];

interface NutritionChoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDishFromLibrary: (dish: any) => void;
  onAddCustomMeal: (customMeal: {
    name: string;
    mealType: MealTypeOption;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    time?: string;
  }) => void;
  onApplyPresetPack: (pack: TemplatePack) => void;
  isPending?: boolean;
}

type ModalView = "menu" | "vault" | "custom" | "presets";

export function NutritionChoiceModal({
  open,
  onOpenChange,
  onSelectDishFromLibrary,
  onAddCustomMeal,
  onApplyPresetPack,
  isPending = false,
}: NutritionChoiceModalProps) {
  const [view, setView] = useState<ModalView>("menu");

  // Reset to menu when opened
  useEffect(() => {
    if (open) {
      setView("menu");
    }
  }, [open]);

  // 1,000+ Dishes Search State
  const [dishQuery, setDishQuery] = useState("");
  const deferredDishQuery = useDeferredValue(dishQuery);
  const [dishLimit, setDishLimit] = useState(30);

  const { data: nutritionData, isFetching: isNutritionFetching } = useNutritionLibrary({
    query: deferredDishQuery,
    limit: dishLimit,
  });

  // Custom Meal Form State
  const [customName, setCustomName] = useState("");
  const [customMealType, setCustomMealType] = useState<MealTypeOption>("Lunch");
  const [customCalories, setCustomCalories] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFat, setCustomFat] = useState("");
  const [customTime, setCustomTime] = useState("");

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    onAddCustomMeal({
      name: customName.trim(),
      mealType: customMealType,
      calories: Number(customCalories) || 0,
      protein: Number(customProtein) || 0,
      carbs: Number(customCarbs) || 0,
      fat: Number(customFat) || 0,
      time: customTime.trim() || format(new Date(), "hh:mm a"),
    });

    setCustomName("");
    setCustomCalories("");
    setCustomProtein("");
    setCustomCarbs("");
    setCustomFat("");
    setCustomTime("");
    soundFX.playPop();
  };

  const handleSelectVaultDish = (dish: any) => {
    onSelectDishFromLibrary(dish);
    soundFX.playPop();
    soundFX.vibrate(20);
    toast.success(`Logged '${dish.dishName}'! 🥗`);
    onOpenChange(false);
  };

  return (
    <AdaptiveDrawerDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        view === "menu"
          ? "Log Fuel & Meals"
          : view === "vault"
          ? "Dishes & Macros Vault (1,000+ DB)"
          : view === "custom"
          ? "Create Custom Meal"
          : "Curated Diet Presets"
      }
      description={
        view === "menu"
          ? "Choose how you want to log your calories and macros today."
          : view === "vault"
          ? "Search dishes, inspect calories & protein, and 1-tap log."
          : view === "custom"
          ? "Enter your own ingredients, takeout meals, or custom shake recipes."
          : "Apply battle-tested high-protein, bulking, or cutting meal packs."
      }
    >
      <div className="space-y-4 pt-1">
        {/* Navigation Bar when inside sub-screens */}
        {view !== "menu" && (
          <div className="flex items-center justify-between pb-2 border-b-2 border-[#161514]">
            <button
              type="button"
              onClick={() => {
                setView("menu");
                soundFX.playPop();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#161514] font-heading font-black text-xs border-2 border-[#161514] shadow-[2px_2px_0px_#161514] cursor-pointer transition-all active:translate-y-0.5"
            >
              <ArrowLeft className="size-3.5 stroke-[2.5]" />
              <span>Back to Options</span>
            </button>
            <span className="text-[11px] font-mono font-bold text-[#161514]/70 uppercase">
              {view === "vault" ? "Dishes Database" : view === "custom" ? "Custom Recipe" : "Presets"}
            </span>
          </div>
        )}

        {/* 1. SELECTION STAGE (3 Rich Neobrutalist Cards) */}
        {view === "menu" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card 1: 1,000+ Dishes Database */}
            <button
              type="button"
              onClick={() => {
                setView("vault");
                soundFX.playPop();
              }}
              className="p-4 rounded-2xl bg-[#03D26F] hover:bg-[#02b861] border-2 border-[#161514] shadow-[3px_3px_0px_#161514] text-left cursor-pointer transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex flex-col justify-between min-h-[160px] group"
            >
              <div>
                <div className="size-10 rounded-xl bg-[#161514] text-[#03D26F] border-2 border-[#161514] flex items-center justify-center font-black mb-3 shadow-[1.5px_1.5px_0px_#161514]">
                  <Search className="size-5 stroke-[2.5]" />
                </div>
                <h4 className="font-heading font-black text-sm text-[#161514] leading-tight">
                  Dishes & Macros Vault
                </h4>
                <p className="text-[11px] font-bold text-[#161514]/75 mt-1 leading-snug">
                  1,000+ curated Indian & global dishes with verified calories and P/C/F macros.
                </p>
              </div>
              <div className="pt-3 flex items-center justify-between text-[11px] font-black text-[#161514]">
                <span className="bg-[#161514] text-[#03D26F] px-2 py-0.5 rounded-md text-[9.5px]">1,000+ DISHES</span>
                <span className="group-hover:translate-x-1 transition-transform">Search ➔</span>
              </div>
            </button>

            {/* Card 2: Custom Food Builder */}
            <button
              type="button"
              onClick={() => {
                setView("custom");
                soundFX.playPop();
              }}
              className="p-4 rounded-2xl bg-[#FEF9C3] hover:bg-[#FEF08A] border-2 border-[#161514] shadow-[3px_3px_0px_#161514] text-left cursor-pointer transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex flex-col justify-between min-h-[160px] group"
            >
              <div>
                <div className="size-10 rounded-xl bg-amber-400 text-[#161514] border-2 border-[#161514] flex items-center justify-center font-black mb-3 shadow-[1.5px_1.5px_0px_#161514]">
                  <Plus className="size-5 stroke-[2.5]" />
                </div>
                <h4 className="font-heading font-black text-sm text-[#161514] leading-tight">
                  Custom Meal / Recipe
                </h4>
                <p className="text-[11px] font-bold text-[#161514]/70 mt-1 leading-snug">
                  Quickly log your own homemade recipes, shake formulas, or restaurant meals.
                </p>
              </div>
              <div className="pt-3 flex items-center justify-between text-[11px] font-black text-[#161514]">
                <span className="bg-[#161514] text-[#FEF9C3] px-2 py-0.5 rounded-md text-[9.5px]">FREEFORM</span>
                <span className="group-hover:translate-x-1 transition-transform">Create ➔</span>
              </div>
            </button>

            {/* Card 3: Pro Diet Packs */}
            <button
              type="button"
              onClick={() => {
                setView("presets");
                soundFX.playPop();
              }}
              className="p-4 rounded-2xl bg-[#C084FC]/30 hover:bg-[#C084FC]/40 border-2 border-[#161514] shadow-[3px_3px_0px_#161514] text-left cursor-pointer transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex flex-col justify-between min-h-[160px] group"
            >
              <div>
                <div className="size-10 rounded-xl bg-[#C084FC] text-[#161514] border-2 border-[#161514] flex items-center justify-center font-black mb-3 shadow-[1.5px_1.5px_0px_#161514]">
                  <Layers className="size-5 stroke-[2.5]" />
                </div>
                <h4 className="font-heading font-black text-sm text-[#161514] leading-tight">
                  Diet Split Packs
                </h4>
                <p className="text-[11px] font-bold text-[#161514]/70 mt-1 leading-snug">
                  1-tap apply High-Protein Bulk, Lean Cutting, or Student Budget diet splits.
                </p>
              </div>
              <div className="pt-3 flex items-center justify-between text-[11px] font-black text-[#161514]">
                <span className="bg-[#161514] text-[#C084FC] px-2 py-0.5 rounded-md text-[9.5px]">PRESETS</span>
                <span className="group-hover:translate-x-1 transition-transform">Apply ➔</span>
              </div>
            </button>
          </div>
        )}

        {/* 2. DISHES & MACROS VAULT (1,000+ DATABASE SEARCH) */}
        {view === "vault" && (
          <div className="space-y-3">
            {/* Search Input Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search dish (e.g. Garam Chai, Paneer Bhurji, Dal Tadka, Oats, Egg White)..."
                value={dishQuery}
                onChange={(e) => setDishQuery(e.target.value)}
                className="w-full bg-white rounded-xl border-2 border-[#161514] pl-3.5 pr-9 py-2.5 text-xs font-bold text-[#161514] outline-none placeholder:text-[#161514]/40 shadow-[2px_2px_0px_#161514] focus:bg-[#FFF9EA]"
                autoFocus
              />
              {dishQuery && (
                <button
                  type="button"
                  onClick={() => setDishQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#161514]/60 hover:text-[#161514] hover:bg-[#161514]/10 cursor-pointer transition-colors"
                  title="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Tags */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {["All", "Paneer", "Dal", "Rice", "Roti", "Egg", "Chai", "Shake", "Chicken", "Oats"].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setDishQuery(tag === "All" ? "" : tag)}
                  className={cn(
                    "text-[9px] font-black px-2 py-0.5 rounded-lg border-2 border-[#161514] transition-all cursor-pointer",
                    (tag === "All" && !dishQuery) || dishQuery.toLowerCase() === tag.toLowerCase()
                      ? "bg-[#161514] text-[#03D26F] shadow-[1px_1px_0px_#161514]"
                      : "bg-white text-[#161514] hover:bg-emerald-100"
                  )}
                >
                  {tag.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Counter & Status */}
            <div className="flex items-center justify-between text-[11px] font-bold text-[#161514]/70 px-0.5">
              <span>
                Showing <strong className="text-[#161514] font-black">{nutritionData?.dishes ? Math.min(nutritionData.dishes.length, nutritionData.totalCount) : 0}</strong> of <strong className="text-[#161514] font-black">{nutritionData?.totalCount || 1015}</strong> dishes
              </span>
              {isNutritionFetching && (
                <span className="text-emerald-700 font-black text-[10px] uppercase tracking-wider animate-pulse flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                  Searching...
                </span>
              )}
            </div>

            {/* Dishes Search Results List */}
            {nutritionData?.dishes && nutritionData.dishes.length > 0 ? (
              <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1 pt-1 divide-y divide-emerald-200/60 overscroll-contain">
                {nutritionData.dishes.map((dish) => (
                  <div
                    key={dish.id}
                    onClick={() => handleSelectVaultDish(dish)}
                    className="p-2.5 rounded-xl bg-white hover:bg-emerald-50 border-2 border-[#161514] cursor-pointer transition-all flex items-center justify-between gap-2.5 shadow-[1.5px_1.5px_0px_#161514] active:translate-y-0.5 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-10 rounded-xl bg-[#ECFDF5] border-2 border-[#161514] flex items-center justify-center text-sm font-black text-[#161514] shrink-0">
                        🥗
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="font-black text-xs text-[#161514] leading-snug break-words group-hover:text-emerald-700 transition-colors">
                          {dish.dishName}
                        </h5>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-900 border border-[#161514]">
                            🔥 {dish.calories} kcal
                          </span>
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#03D26F]/30 text-emerald-950 border border-[#161514]">
                            {dish.protein}g P
                          </span>
                          <span className="text-[9px] font-bold text-[#161514]/70">
                            • {dish.carbs}g C • {dish.fats}g F
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectVaultDish(dish);
                      }}
                      className="text-[9px] font-black bg-[#03D26F] hover:bg-[#02b861] active:translate-y-0.5 text-[#161514] px-2.5 py-1 rounded-lg border-2 border-[#161514] shadow-[1.5px_1.5px_0px_#161514] flex items-center gap-1 cursor-pointer transition-all shrink-0"
                    >
                      <span>LOG</span>
                      <span className="font-black">➔</span>
                    </button>
                  </div>
                ))}

                {nutritionData && nutritionData.totalCount > nutritionData.dishes.length && (
                  <div className="pt-2 pb-1 text-center">
                    <button
                      type="button"
                      onClick={() => setDishLimit((prev) => prev + 30)}
                      disabled={isNutritionFetching}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-300 hover:bg-emerald-400 text-[#161514] font-heading font-black text-xs border-2 border-[#161514] shadow-[2px_2px_0px_#161514] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                    >
                      <span>
                        {isNutritionFetching
                          ? "Loading More Dishes..."
                          : `Load More Dishes (${nutritionData.totalCount - nutritionData.dishes.length} remaining)`}
                      </span>
                      <ChevronDown className="size-4 stroke-[3]" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 text-center bg-white rounded-2xl border-2 border-dashed border-[#161514]/40 space-y-2.5">
                <p className="text-xs font-black text-[#161514]">
                  No dish found matching &ldquo;{dishQuery}&rdquo;
                </p>
                <p className="text-[11px] font-bold text-[#161514]/70">
                  Can&apos;t find this dish? Create it as a custom meal entry with your own macros.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCustomName(dishQuery);
                    setView("custom");
                  }}
                  className="text-xs font-black bg-[#CEF431] hover:bg-[#D8F74E] text-[#161514] px-3.5 py-1.5 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_#161514] cursor-pointer inline-flex items-center gap-1.5 active:translate-y-0.5 transition-all"
                >
                  <Plus className="size-3.5 stroke-[3]" />
                  <span>Create &ldquo;{dishQuery || "Custom"}&rdquo; Meal</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. CUSTOM MEAL / RECIPE BUILDER */}
        {view === "custom" && (
          <form onSubmit={handleCustomSubmit} className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <label className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514]">
                Meal Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Oatmeal with Whey & Almonds, Grilled Paneer Rice"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-white rounded-xl border-2 border-[#161514] px-3.5 py-2.5 text-xs font-bold text-[#161514] shadow-[2px_2px_0px_#161514] focus:bg-[#FFF9EA] outline-none"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514]">
                  Meal Type
                </label>
                <NeobrutalistSelect
                  value={customMealType}
                  onChange={(val) => setCustomMealType(val as MealTypeOption)}
                  options={MEAL_TYPES.map((t) => ({
                    value: t,
                    label: t,
                    icon: t === "Breakfast" ? "🍳" : t === "Lunch" ? "🍱" : t === "Dinner" ? "🍲" : t === "Snack" ? "🥪" : "⚡",
                  }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514]">
                  Time (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 01:30 PM"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-full bg-white rounded-xl border-2 border-[#161514] px-3.5 py-2 text-xs font-bold text-[#161514] shadow-[2px_2px_0px_#161514] focus:bg-[#FFF9EA] outline-none"
                />
              </div>
            </div>

            {/* Macro Inputs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="space-y-1">
                <label className="text-[9px] font-heading font-black uppercase text-[#161514]">Calories (kcal)</label>
                <input
                  type="number"
                  placeholder="450"
                  inputMode="numeric"
                  value={customCalories}
                  onChange={(e) => setCustomCalories(e.target.value)}
                  className="w-full bg-white rounded-xl border-2 border-[#161514] px-3 py-2 text-xs font-mono font-black text-[#161514] shadow-[1.5px_1.5px_0px_#161514]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-heading font-black uppercase text-emerald-800">Protein (g)</label>
                <input
                  type="number"
                  placeholder="35"
                  inputMode="numeric"
                  value={customProtein}
                  onChange={(e) => setCustomProtein(e.target.value)}
                  className="w-full bg-white rounded-xl border-2 border-[#161514] px-3 py-2 text-xs font-mono font-black text-[#161514] shadow-[1.5px_1.5px_0px_#161514]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-heading font-black uppercase text-amber-800">Carbs (g)</label>
                <input
                  type="number"
                  placeholder="50"
                  inputMode="numeric"
                  value={customCarbs}
                  onChange={(e) => setCustomCarbs(e.target.value)}
                  className="w-full bg-white rounded-xl border-2 border-[#161514] px-3 py-2 text-xs font-mono font-black text-[#161514] shadow-[1.5px_1.5px_0px_#161514]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-heading font-black uppercase text-rose-800">Fat (g)</label>
                <input
                  type="number"
                  placeholder="12"
                  inputMode="numeric"
                  value={customFat}
                  onChange={(e) => setCustomFat(e.target.value)}
                  className="w-full bg-white rounded-xl border-2 border-[#161514] px-3 py-2 text-xs font-mono font-black text-[#161514] shadow-[1.5px_1.5px_0px_#161514]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || !customName.trim()}
              className="w-full min-h-[46px] bg-[#03D26F] hover:bg-[#02b861] text-[#161514] font-heading font-black text-xs uppercase tracking-wider rounded-xl py-3 border-2 border-[#161514] shadow-[3px_3px_0px_#161514] cursor-pointer transition-all active:translate-y-0.5 disabled:opacity-50"
            >
              Log Custom Meal &amp; Save Macros ➔
            </button>
          </form>
        )}

        {/* 4. CURATED NUTRITION PRESETS */}
        {view === "presets" && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-[#161514]/70">
              Select a battle-tested nutrition pack to instantly load into today&apos;s diet:
            </p>
            <div className="grid grid-cols-1 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {MEAL_TEMPLATE_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className="p-3.5 rounded-xl bg-white border-2 border-[#161514] shadow-[2px_2px_0px_#161514] flex items-center justify-between gap-3 hover:bg-[#FAF8F5] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{pack.icon || "🥗"}</span>
                      <h5 className="font-heading font-black text-xs text-[#161514] truncate">
                        {pack.name}
                      </h5>
                    </div>
                    <p className="text-[11px] font-bold text-[#161514]/65 mt-0.5 line-clamp-1">
                      {pack.tagline}
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-mono font-black text-[#161514] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#161514]">
                      {pack.items.length} Meals included
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      onApplyPresetPack(pack);
                      soundFX.playPop();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#03D26F] hover:bg-[#02b861] text-[#161514] font-heading font-black text-xs border-2 border-[#161514] shadow-[1.5px_1.5px_0px_#161514] cursor-pointer transition-all active:translate-y-0.5 whitespace-nowrap"
                  >
                    Apply Pack ➔
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdaptiveDrawerDialog>
  );
}
