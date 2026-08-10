"use client";

import { useState, useMemo } from "react";
import { Utensils, Plus, Trash2, Edit3, CheckCircle2, Circle, Flame, Sparkles } from "lucide-react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { TemplateSelectionModal, TemplatePack } from "@/components/shared/TemplateSelectionModal";
import { MEAL_TEMPLATE_PACKS } from "@/lib/templates-data";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { useMealPlans, useAddMealPlan, useUpdateMealPlan, useDeleteMealPlan } from "@/lib/queries/gym";
import { useNutritionLibrary } from "@/lib/queries/nutrition";
import { Search } from "lucide-react";

const MEAL_TYPES = ["Breakfast", "Lunch", "Snack", "Dinner", "Pre-Workout", "Post-Workout"] as const;

export function MealTracker() {
  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const { data: meals = [], isLoading } = useMealPlans(todayStr);
  const addMealMutation = useAddMealPlan();
  const updateMealMutation = useUpdateMealPlan();
  const deleteMealMutation = useDeleteMealPlan();

  // Modals state
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [isChoiceOpen, setIsChoiceOpen] = useState(false);

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
    toast.success(`Applied ${pack.name} to today's diet!`);
  };
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState<typeof MEAL_TYPES[number]>("Lunch");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [mealTime, setMealTime] = useState("");

  // 1,000+ Indian Dishes Dataset Search State
  const [dishQuery, setDishQuery] = useState("");
  const { data: nutritionData } = useNutritionLibrary({
    query: dishQuery,
    limit: 20,
  });

  const [editingMeal, setEditingMeal] = useState<any | null>(null);
  const [editMealName, setEditMealName] = useState("");
  const [editMealType, setEditMealType] = useState<typeof MEAL_TYPES[number]>("Lunch");
  const [editCalories, setEditCalories] = useState("");
  const [editProtein, setEditProtein] = useState("");
  const [editCarbs, setEditCarbs] = useState("");
  const [editFat, setEditFat] = useState("");
  const [editTime, setEditTime] = useState("");

  const [deleteMealId, setDeleteMealId] = useState<string | null>(null);

  // Totals
  const totalCalories = useMemo(() => meals.reduce((sum: number, m: any) => sum + (m.calories || 0), 0), [meals]);
  const totalProtein = useMemo(() => meals.reduce((sum: number, m: any) => sum + (m.protein || 0), 0), [meals]);
  const totalCarbs = useMemo(() => meals.reduce((sum: number, m: any) => sum + (m.carbs || 0), 0), [meals]);
  const totalFat = useMemo(() => meals.reduce((sum: number, m: any) => sum + (m.fat || 0), 0), [meals]);

  const handleAddMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName.trim()) return;

    try {
      await addMealMutation.mutateAsync({
        date: todayStr,
        name: mealName.trim(),
        mealType,
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        time: mealTime.trim() || format(new Date(), "hh:mm a"),
        completed: false,
      });
      toast.success("Meal logged! 🥗");
      setIsAddMealOpen(false);
      setMealName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setMealTime("");
    } catch {
      toast.error("Failed to add meal");
    }
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
      toast.success(!meal.completed ? "Meal consumed! 🍎" : "Meal unchecked");
    } catch {
      toast.error("Failed to update meal status");
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 md:p-6 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-5 my-4">
      {/* Header & Log Action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-emerald-300 border-2 border-navy-950 text-navy-950 flex items-center justify-center font-black shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]">
            <Utensils className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-navy-950 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Daily Meal Routine & Nutrition</h3>
            <p className="text-[10px] text-navy-700 font-bold">
              Today's Intake: <strong className="text-emerald-800 font-black">{totalCalories} kcal</strong> | {totalProtein}g P | {totalCarbs}g C | {totalFat}g F
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsChoiceOpen(true)}
          className="bg-emerald-400 hover:bg-emerald-500 text-navy-950 font-black rounded-xl py-1.5 px-3.5 text-xs border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center gap-1 transition-all"
        >
          <Plus className="h-3.5 w-3.5 stroke-[3]" /> Log Meal
        </button>
      </div>

      {/* Daily Macro Progress Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white rounded-2xl p-3 border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] text-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-navy-700 block">Calories</span>
          <span className="text-base font-black text-navy-950 block mt-0.5">{totalCalories} kcal</span>
        </div>
        <div className="bg-emerald-200 rounded-2xl p-3 border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] text-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-navy-950 block">Protein</span>
          <span className="text-base font-black text-navy-950 block mt-0.5">{totalProtein} g</span>
        </div>
        <div className="bg-amber-200 rounded-2xl p-3 border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] text-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-navy-950 block">Carbs</span>
          <span className="text-base font-black text-navy-950 block mt-0.5">{totalCarbs} g</span>
        </div>
        <div className="bg-rose-200 rounded-2xl p-3 border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] text-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-navy-950 block">Fat</span>
          <span className="text-base font-black text-navy-950 block mt-0.5">{totalFat} g</span>
        </div>
      </div>

      {/* Meal List */}
      {isLoading ? (
        <div className="h-24 animate-pulse bg-cream-bg/60 rounded-2xl border-2 border-navy-950" />
      ) : meals.length === 0 ? (
        <div className="bg-amber-50/60 rounded-2xl p-6 border-2 border-dashed border-navy-950 text-center space-y-2 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)]">
          <p className="text-xs font-black text-navy-950">No meals logged for today yet! 🥗</p>
          <p className="text-[10px] text-navy-700 font-bold max-w-sm mx-auto">
            Log your breakfast, pre-workout meal, lunch, and dinner to track daily calories and protein goals.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {meals.map((m: any) => (
            <div
              key={m.id}
              className="bg-cream-bg/40 rounded-2xl p-3.5 border border-border/80 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleMeal(m)}
                  className="cursor-pointer border-none bg-transparent outline-none"
                >
                  {m.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 fill-emerald-100" />
                  ) : (
                    <Circle className="h-5 w-5 text-navy-600/40 hover:text-navy-900" />
                  )}
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-extrabold text-xs text-navy-900">{m.name}</h5>
                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
                      {m.mealType}
                    </span>
                    {m.time && <span className="text-[9px] font-semibold text-navy-600">({m.time})</span>}
                  </div>
                  <div className="text-[10px] text-navy-600 font-semibold mt-0.5 flex gap-2">
                    <span>🔥 {m.calories} kcal</span>
                    <span>• {m.protein}g Protein</span>
                    <span>• {m.carbs}g Carbs</span>
                    <span>• {m.fat}g Fat</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
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
                  className="text-navy-600 hover:text-navy-900 p-1 cursor-pointer transition-colors border-none bg-transparent"
                  title="Edit meal"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleteMealId(m.id)}
                  className="text-navy-600 hover:text-rose-600 p-1 cursor-pointer transition-colors border-none bg-transparent"
                  title="Delete meal"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Meal Choice Modal */}
      <TemplateSelectionModal
        open={isChoiceOpen}
        onOpenChange={setIsChoiceOpen}
        title="ADD MEAL ROUTINE"
        subtitle="START FROM SCRATCH OR APPLY A NUTRITION MEAL PACK."
        blankLabel="BLANK MEAL"
        blankDesc="CUSTOM MEAL NAME, CALORIES & MACROS"
        templatesLabel="MEAL PACKS"
        templatesDesc="HIGH PROTEIN BULK, LEAN MUSCLE CUT..."
        templatePacks={MEAL_TEMPLATE_PACKS}
        onSelectBlank={() => setIsAddMealOpen(true)}
        onApplyTemplatePack={handleApplyMealPack}
      />

      {/* Add Meal Modal */}
      <ResponsiveFormContainer
        open={isAddMealOpen}
        onOpenChange={setIsAddMealOpen}
        title="Log Meal & Macros"
        description="Search 1,000+ Indian Dishes & Macros or enter custom values"
      >
        <div className="space-y-4 pt-2">
          {/* 🥗 DATASET 2: 1,000+ INDIAN DISHES & MACRO SEARCH PICKER */}
          <div className="bg-emerald-50 rounded-2xl p-3.5 border-2 border-navy-950 shadow-[2.5px_2.5px_0px_0px_rgba(31,36,48,1)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-navy-950 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-navy-950 stroke-[3]" />
                🥗 Search 1,000+ Indian Dishes & Macros
              </span>
              <span className="text-[9px] font-black bg-emerald-400 text-navy-950 px-2 py-0.5 rounded-md border border-navy-950">
                {nutritionData?.totalCount || 1015} Dishes
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search dish name (e.g. Garam Chai, Aam Panna, Paneer, Dal, Oats)..."
                value={dishQuery}
                onChange={(e) => setDishQuery(e.target.value)}
                className="w-full bg-white rounded-xl border-2 border-navy-950 px-3.5 py-2 text-xs font-bold text-navy-950 outline-none placeholder:text-navy-400 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]"
              />
            </div>

            {/* Live Search Results List */}
            {nutritionData?.dishes && nutritionData.dishes.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 pt-1 divide-y divide-emerald-200/60">
                {nutritionData.dishes.map((dish) => (
                  <div
                    key={dish.id}
                    onClick={() => {
                      setMealName(dish.dishName);
                      setCalories(String(dish.calories));
                      setProtein(String(dish.protein));
                      setCarbs(String(dish.carbs));
                      setFat(String(dish.fats));
                      toast.success(`Loaded macros for '${dish.dishName}'! 🥗`);
                    }}
                    className="p-2 rounded-xl bg-white hover:bg-emerald-100/80 border border-navy-950 cursor-pointer transition-all flex items-center justify-between gap-2 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]"
                  >
                    <div>
                      <h5 className="font-black text-xs text-navy-950">{dish.dishName}</h5>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-black text-emerald-800">
                          🔥 {dish.calories} kcal
                        </span>
                        <span className="text-[8px] font-black uppercase text-navy-600">
                          P: {dish.protein}g • C: {dish.carbs}g • F: {dish.fats}g
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black bg-emerald-400 text-navy-950 px-2 py-0.5 rounded-lg border border-navy-950 shrink-0">
                      AUTO-FILL ➔
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleAddMealSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Meal Name</label>
              <input
                type="text"
                placeholder="e.g. Oatmeal with Whey & Almonds, Grilled Chicken Rice"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Meal Type</label>
              <NeobrutalistSelect
                value={mealType}
                onChange={(val) => setMealType(val as any)}
                options={MEAL_TYPES.map((t) => ({
                  value: t,
                  label: t,
                  icon: t === "Breakfast" ? "🍳" : t === "Lunch" ? "🍱" : t === "Dinner" ? "🍲" : t === "Snack" ? "🥪" : "⚡",
                }))}
              />
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Time (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 08:30 AM"
                  value={mealTime}
                  onChange={(e) => setMealTime(e.target.value)}
                  className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-navy-600 uppercase">Calories (kcal)</label>
                <input
                  type="number"
                  placeholder="450"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full bg-cream-bg rounded-xl border border-border/85 px-3 py-2 text-xs text-navy-900 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-navy-600 uppercase">Protein (g)</label>
                <input
                  type="number"
                  placeholder="35"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="w-full bg-cream-bg rounded-xl border border-border/85 px-3 py-2 text-xs text-navy-900 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-navy-600 uppercase">Carbs (g)</label>
                <input
                  type="number"
                  placeholder="50"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  className="w-full bg-cream-bg rounded-xl border border-border/85 px-3 py-2 text-xs text-navy-900 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-navy-600 uppercase">Fat (g)</label>
                <input
                  type="number"
                  placeholder="12"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className="w-full bg-cream-bg rounded-xl border border-border/85 px-3 py-2 text-xs text-navy-900 font-bold"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={addMealMutation.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full py-2.5 mt-2 border-none cursor-pointer"
            >
              Log Meal & Save Macros
            </Button>
          </form>
        </div>
      </ResponsiveFormContainer>

      {/* Edit Meal Modal */}
      <ResponsiveFormContainer
        open={editingMeal !== null}
        onOpenChange={(open) => {
          if (!open) setEditingMeal(null);
        }}
        title="Edit Meal & Macros"
        description="Update your logged food item"
      >
        <form onSubmit={handleUpdateMealSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Meal / Dish Name *</label>
            <input
              type="text"
              value={editMealName}
              onChange={(e) => setEditMealName(e.target.value)}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Meal Type</label>
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
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Time</label>
              <input
                type="text"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-navy-600 uppercase">Calories</label>
              <input
                type="number"
                value={editCalories}
                onChange={(e) => setEditCalories(e.target.value)}
                className="w-full bg-cream-bg rounded-xl border border-border/85 px-3 py-2 text-xs text-navy-900 font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-navy-600 uppercase">Protein (g)</label>
              <input
                type="number"
                value={editProtein}
                onChange={(e) => setEditProtein(e.target.value)}
                className="w-full bg-cream-bg rounded-xl border border-border/85 px-3 py-2 text-xs text-navy-900 font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-navy-600 uppercase">Carbs (g)</label>
              <input
                type="number"
                value={editCarbs}
                onChange={(e) => setEditCarbs(e.target.value)}
                className="w-full bg-cream-bg rounded-xl border border-border/85 px-3 py-2 text-xs text-navy-900 font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-navy-600 uppercase">Fat (g)</label>
              <input
                type="number"
                value={editFat}
                onChange={(e) => setEditFat(e.target.value)}
                className="w-full bg-cream-bg rounded-xl border border-border/85 px-3 py-2 text-xs text-navy-900 font-bold"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={updateMealMutation.isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full py-2.5 mt-2 border-none cursor-pointer"
          >
            Save Changes
          </Button>
        </form>
      </ResponsiveFormContainer>

      {/* Delete Meal Modal */}
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
