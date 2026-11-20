"use client";

import { useState, useDeferredValue, useEffect } from "react";
import { Utensils, Sparkles, Check, Zap, X } from "lucide-react";
import { AdaptiveDrawerDialog } from "@/components/shared/AdaptiveDrawerDialog";
import { MEAL_TYPES, type MealTypeOption } from "@/components/goals/NutritionChoiceModal";
import { useNutritionLibrary } from "@/lib/queries/nutrition";
import { soundFX } from "@/components/shared/SoundFX";
import { strobiToast } from "@/lib/utils/toasts";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface QuickMealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMeal: (meal: {
    name: string;
    mealType: MealTypeOption;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    date: string;
    time: string;
  }) => void;
  isPending?: boolean;
}

/** Auto-detect meal type from current hour */
function inferMealType(): MealTypeOption {
  const hour = new Date().getHours();
  if (hour < 11) return "Breakfast";
  if (hour < 15) return "Lunch";
  if (hour < 17) return "Snack";
  return "Dinner";
}

export function QuickMealModal({
  open,
  onOpenChange,
  onAddMeal,
  isPending = false,
}: QuickMealModalProps) {
  const [name, setName] = useState("");
  const [mealType, setMealType] = useState<MealTypeOption>(inferMealType);
  const [calories, setCalories] = useState("");
  const [showMacros, setShowMacros] = useState(false);
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);

  const deferredName = useDeferredValue(name.trim());
  const shouldSearch = deferredName.length >= 2 && showSuggestions;

  const { data: searchResults, isFetching: isSearching } = useNutritionLibrary({
    query: shouldSearch ? deferredName : "",
    limit: 5,
  });

  const dishes = searchResults?.dishes || [];

  const resetForm = () => {
    setName("");
    setMealType(inferMealType());
    setCalories("");
    setShowMacros(false);
    setProtein("");
    setCarbs("");
    setFat("");
    setShowSuggestions(false);
    setSelectedDishId(null);
  };

  // Close suggestions when modal closes or resets
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  // Select a dish from 1,000+ database
  const handleSelectDish = (dish: any, autoLog = false) => {
    soundFX.playPop();
    soundFX.vibrate(20);

    setName(dish.dishName);
    setCalories(String(dish.calories || 0));
    setProtein(String(dish.protein || 0));
    setCarbs(String(dish.carbs || 0));
    setFat(String(dish.fats || 0));
    setShowMacros(true);
    setShowSuggestions(false);
    setSelectedDishId(dish.id);

    if (autoLog) {
      onAddMeal({
        name: dish.dishName,
        mealType,
        calories: Number(dish.calories) || 0,
        protein: Number(dish.protein) || 0,
        carbs: Number(dish.carbs) || 0,
        fat: Number(dish.fats) || 0,
        date: format(new Date(), "yyyy-MM-dd"),
        time: format(new Date(), "hh:mm a"),
      });

      strobiToast.habits(`${mealType} logged: ${dish.dishName} (${dish.calories} kcal)`);
      resetForm();
      onOpenChange(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    soundFX.playPop();
    soundFX.vibrate(20);

    onAddMeal({
      name: name.trim(),
      mealType,
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      date: format(new Date(), "yyyy-MM-dd"),
      time: format(new Date(), "hh:mm a"),
    });

    strobiToast.habits(`${mealType} logged: ${name.trim()}`);
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
      title="Quick Meal Log"
      description="Type any dish — instant 1,000+ database search or custom entry"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        {/* Meal Type Quick-Select */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-heading font-black uppercase tracking-wider text-muted-foreground">
            Meal Type
          </label>
          <div className="flex flex-wrap gap-1.5">
            {MEAL_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setMealType(type);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-heading font-bold border transition-all cursor-pointer",
                  mealType === type
                    ? "bg-[#161514] dark:bg-[#FAF8F5] text-white dark:text-[#161514] border-[#161514] dark:border-[#FAF8F5] font-black shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000]"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Meal Name Input with Live 1,000+ Database Autocomplete */}
        <div className="space-y-1.5 relative">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-heading font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span>What did you eat? *</span>
              {selectedDishId && (
                <span className="text-[9.5px] font-mono font-bold text-[#03D26F] dark:text-[#03D26F] bg-[#03D26F]/10 border border-[#03D26F]/30 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                  <Check className="size-2.5 stroke-[3]" /> Verified Dish
                </span>
              )}
            </label>
            <span className="text-[10px] font-mono text-muted-foreground">
              {isSearching ? "Searching 1,000+ DB…" : "1,000+ database"}
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setShowSuggestions(true);
                if (selectedDishId) setSelectedDishId(null);
              }}
              onFocus={() => {
                if (name.trim().length >= 2) setShowSuggestions(true);
              }}
              placeholder="e.g. Paneer Bhurji, Dal Tadka, Oats, Chicken Breast"
              className="w-full h-11 pl-3.5 pr-10 bg-white dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#38332E] rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[#CEF431] placeholder:text-muted-foreground/50"
              autoFocus
              required
            />
            {name.trim().length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setName("");
                  setSelectedDishId(null);
                  setShowSuggestions(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                title="Clear input"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Live Search Suggestion Overlay (1,000+ DB Hits) */}
          {showSuggestions && deferredName.length >= 2 && (
            <div className="p-2 bg-white dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#38332E] rounded-2xl shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] space-y-1 z-20 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-mono font-bold text-muted-foreground border-b border-border/60">
                <span className="flex items-center gap-1 text-[#03D26F] font-bold">
                  <Sparkles className="size-3" />
                  <span>Matches from 1,000+ Dishes DB</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowSuggestions(false)}
                  className="hover:text-foreground cursor-pointer"
                >
                  Close ✕
                </button>
              </div>

              {dishes.length > 0 ? (
                <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                  {dishes.map((dish) => (
                    <div
                      key={dish.id}
                      className="group flex items-center justify-between p-2 rounded-xl hover:bg-secondary/70 dark:hover:bg-secondary/40 border border-transparent hover:border-border transition-all cursor-pointer"
                      onClick={() => handleSelectDish(dish, false)}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="block font-heading font-black text-xs text-foreground group-hover:text-[#03D26F] transition-colors truncate">
                          {dish.dishName}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground mt-0.5">
                          <span className="font-bold text-foreground">
                            {dish.calories} kcal
                          </span>
                          <span>•</span>
                          <span>{dish.protein}g P</span>
                          <span>•</span>
                          <span>{dish.carbs}g C</span>
                          <span>•</span>
                          <span>{dish.fats}g F</span>
                        </div>
                      </div>

                      {/* 1-Tap Direct Log Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectDish(dish, true);
                        }}
                        className="px-2 py-1 rounded-lg bg-[#03D26F] text-[#161514] font-heading font-black text-[10px] border border-[#161514] shadow-[1px_1px_0px_0px_#161514] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none flex items-center gap-0.5 shrink-0 hover:scale-105 transition-all"
                        title="1-tap log this dish instantly"
                      >
                        <Zap className="size-2.5 stroke-[3]" />
                        <span>Log</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-muted-foreground font-mono space-y-1">
                  <p>No database match for &ldquo;{name}&rdquo;</p>
                  <p className="text-[10px] text-foreground font-bold">
                    ✓ Your typed word will be logged as a custom dish below!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Calories Input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-heading font-black uppercase tracking-wider text-muted-foreground">
            Calories {selectedDishId ? "(auto-calculated)" : "(approx)"}
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="5000"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="e.g. 450"
              className="w-full h-11 px-3.5 pr-14 bg-white dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#38332E] rounded-xl text-sm font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[#CEF431] placeholder:text-muted-foreground/50"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground font-bold">
              kcal
            </span>
          </div>
        </div>

        {/* Optional Macros Section */}
        {!showMacros ? (
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setShowMacros(true);
            }}
            className="w-full text-center text-[10px] font-mono font-bold text-muted-foreground hover:text-foreground py-1 cursor-pointer transition-colors"
          >
            + Add protein / carbs / fat ▾
          </button>
        ) : (
          <div className="space-y-1.5 p-3 rounded-2xl bg-secondary/30 border border-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold text-muted-foreground">
              <span>Nutrient Breakdown</span>
              <button
                type="button"
                onClick={() => setShowMacros(false)}
                className="hover:text-foreground cursor-pointer"
              >
                Hide ✕
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { label: "Protein", value: protein, setter: setProtein, unit: "g" },
                { label: "Carbs", value: carbs, setter: setCarbs, unit: "g" },
                { label: "Fat", value: fat, setter: setFat, unit: "g" },
              ] as const).map((macro) => (
                <div key={macro.label} className="space-y-1">
                  <label className="text-[9px] font-heading font-black uppercase tracking-wider text-muted-foreground">
                    {macro.label}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="500"
                      value={macro.value}
                      onChange={(e) => macro.setter(e.target.value)}
                      placeholder="0"
                      className="w-full h-9 px-2.5 pr-7 bg-white dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#38332E] rounded-lg text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[#CEF431] placeholder:text-muted-foreground/50"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-muted-foreground font-bold">
                      {macro.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!name.trim() || isPending}
          className={cn(
            "w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl border-2 border-[#161514] font-heading font-black text-sm transition-all shadow-[2px_2px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
            name.trim()
              ? "bg-[#03D26F] text-[#161514] cursor-pointer hover:-translate-y-0.5"
              : "bg-secondary text-muted-foreground cursor-not-allowed opacity-60"
          )}
        >
          <Utensils className="size-4 stroke-[2.5]" />
          <span>Log {mealType}: {name.trim() || "Meal"}</span>
        </button>
      </form>
    </AdaptiveDrawerDialog>
  );
}
