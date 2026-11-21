"use client";

import { useState, useMemo, useEffect } from "react";
import { Utensils, Plus, Target, Trash2 } from "lucide-react";
import { SubpageLayout } from "@/components/shared/SubpageLayout";
import { SubpageTwoTabs } from "@/components/shared/SubpageTwoTabs";
import { NeobrutalistEmptyCard } from "@/components/shared/NeobrutalistEmptyCard";
import { useMealPlans, useDeleteMealPlan } from "@/lib/queries/gym";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { soundFX } from "@/components/shared/SoundFX";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

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

export default function NutritionPage() {
  const [activeTab, setActiveTab] = useState<"pacing" | "distribution">("pacing");
  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const { data: allMeals = [] } = useMealPlans();
  const deleteMealMutation = useDeleteMealPlan();

  // Filter today's meals
  const todayMeals = useMemo(() => {
    return allMeals.filter((m: any) => m.date === todayStr);
  }, [allMeals, todayStr]);

  // Target State with LocalStorage persistence
  const [targets, setTargets] = useState<MacroTargets>(DEFAULT_TARGETS);
  const [isEditingTargets, setIsEditingTargets] = useState(false);
  const [inputCals, setInputCals] = useState(String(DEFAULT_TARGETS.calories));
  const [inputProtein, setInputProtein] = useState(String(DEFAULT_TARGETS.protein));
  const [inputCarbs, setInputCarbs] = useState(String(DEFAULT_TARGETS.carbs));
  const [inputFat, setInputFat] = useState(String(DEFAULT_TARGETS.fat));

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("invictus_nutrition_targets");
        if (saved) {
          const parsed = JSON.parse(saved);
          setTargets(parsed);
          setInputCals(String(parsed.calories));
          setInputProtein(String(parsed.protein));
          setInputCarbs(String(parsed.carbs));
          setInputFat(String(parsed.fat));
        }
      } catch {}
    }
  }, []);

  const handleSaveTargets = (e: React.FormEvent) => {
    e.preventDefault();
    const newTargets: MacroTargets = {
      calories: Number(inputCals) || 2200,
      protein: Number(inputProtein) || 140,
      carbs: Number(inputCarbs) || 220,
      fat: Number(inputFat) || 65,
    };
    setTargets(newTargets);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("invictus_nutrition_targets", JSON.stringify(newTargets));
      } catch {}
    }
    soundFX.playPop();
    soundFX.vibrate(15);
    toast.success("Macro targets saved! 🎯");
    setIsEditingTargets(false);
  };

  const handleApplyPreset = (preset: "cutting" | "maintenance" | "bulking") => {
    soundFX.playPop();
    soundFX.vibrate(10);
    let c = 2200;
    let p = 140;
    let cb = 220;
    let f = 65;
    if (preset === "cutting") {
      c = 1800;
      p = 160;
      cb = 160;
      f = 50;
    } else if (preset === "bulking") {
      c = 2600;
      p = 170;
      cb = 310;
      f = 75;
    }
    setInputCals(String(c));
    setInputProtein(String(p));
    setInputCarbs(String(cb));
    setInputFat(String(f));
  };

  // Today totals
  const consumedCalories = todayMeals.reduce((sum: number, m: any) => sum + Number(m.calories || 0), 0);
  const consumedProtein = todayMeals.reduce((sum: number, m: any) => sum + Number(m.protein || 0), 0);
  const consumedCarbs = todayMeals.reduce((sum: number, m: any) => sum + Number(m.carbs || 0), 0);
  const consumedFat = todayMeals.reduce((sum: number, m: any) => sum + Number(m.fat || 0), 0);

  const caloriesRemaining = targets.calories - consumedCalories;
  const calPercent = Math.min(100, Math.round((consumedCalories / (targets.calories || 1)) * 100));

  // 7-day caloric history for distribution tab
  const last7Days = useMemo(() => {
    const end = new Date();
    const start = subDays(end, 6);
    return eachDayOfInterval({ start, end });
  }, []);

  const weeklyChartData = useMemo(() => {
    return last7Days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayMeals = allMeals.filter((m: any) => m.date === dateStr);
      const cals = dayMeals.reduce((sum: number, m: any) => sum + Number(m.calories || 0), 0);
      const prot = dayMeals.reduce((sum: number, m: any) => sum + Number(m.protein || 0), 0);
      return {
        day: format(day, "EEE"),
        date: dateStr,
        calories: cals,
        protein: prot,
      };
    });
  }, [last7Days, allMeals]);

  // Atwater factor macro calories
  const proteinCals = consumedProtein * 4;
  const carbsCals = consumedCarbs * 4;
  const fatCals = consumedFat * 9;
  const totalMacroCals = proteinCals + carbsCals + fatCals || 1;
  const proteinPct = Math.round((proteinCals / totalMacroCals) * 100);
  const carbsPct = Math.round((carbsCals / totalMacroCals) * 100);
  const fatPct = Math.max(0, 100 - proteinPct - carbsPct);

  return (
    <SubpageLayout
      appBarTitle="Diet & Fuel"
      backHref="/goals"
      backLabel="Habits"
      title="Diet & Macro Pacing"
      badge="Fuel Discipline"
      badgeColorClass="bg-amber-400/20 text-amber-700 dark:text-amber-300 border-amber-500/30"
      subtitle="Daily caloric targets, macro pacing & weekly fuel balance"
      icon={Utensils}
      rightAction={
        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            soundFX.vibrate(15);
            window.dispatchEvent(new CustomEvent("invictus:open-quick-meal"));
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[#161514] bg-[#CEF431] text-[#161514] font-heading font-black text-xs shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
        >
          <Plus className="size-3.5 stroke-[3]" />
          <span>Log Meal</span>
        </button>
      }
    >
      {/* 2-Tab Navigation */}
      <SubpageTwoTabs<"pacing" | "distribution">
        tabs={[
          { id: "pacing", label: "Macro Pacing & Targets", icon: "🎯" },
          { id: "distribution", label: "Weekly Distribution", icon: "📊" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* TAB 1: Macro Pacing & Targets */}
      {activeTab === "pacing" && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* Caloric Pace Cockpit */}
          <div className="bg-card rounded-2xl p-4 sm:p-5 border-2 border-[#161514] dark:border-white/20 shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider block">
                  Today&apos;s Energy Budget
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-heading font-black text-foreground">
                    {consumedCalories}
                  </span>
                  <span className="text-xs font-mono font-bold text-muted-foreground">
                    / {targets.calories} kcal
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider block">
                  {caloriesRemaining >= 0 ? "Remaining" : "Over Budget"}
                </span>
                <span
                  className={cn(
                    "text-lg sm:text-xl font-heading font-black font-mono",
                    caloriesRemaining >= 0 ? "text-[#03D26F]" : "text-rose-500"
                  )}
                >
                  {Math.abs(caloriesRemaining)} kcal
                </span>
              </div>
            </div>

            {/* Visual Calorie Bar */}
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border">
              <div
                className={cn(
                  "h-full transition-all duration-300 rounded-full",
                  calPercent > 100
                    ? "bg-rose-500"
                    : calPercent >= 80
                    ? "bg-[#03D26F]"
                    : "bg-[#CEF431]"
                )}
                style={{ width: `${Math.min(100, calPercent)}%` }}
              />
            </div>

            {/* 3 Macro Progress Gauges */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
              {/* Protein */}
              <div className="bg-muted/40 rounded-xl p-2.5 border border-border text-center">
                <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase block">
                  Protein
                </span>
                <p className="text-sm font-heading font-black text-foreground mt-0.5">
                  {consumedProtein}g
                  <span className="text-[10px] font-normal text-muted-foreground"> / {targets.protein}g</span>
                </p>
                <div className="w-full h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(100, (consumedProtein / (targets.protein || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Carbs */}
              <div className="bg-muted/40 rounded-xl p-2.5 border border-border text-center">
                <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase block">
                  Carbs
                </span>
                <p className="text-sm font-heading font-black text-foreground mt-0.5">
                  {consumedCarbs}g
                  <span className="text-[10px] font-normal text-muted-foreground"> / {targets.carbs}g</span>
                </p>
                <div className="w-full h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${Math.min(100, (consumedCarbs / (targets.carbs || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Fat */}
              <div className="bg-muted/40 rounded-xl p-2.5 border border-border text-center">
                <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase block">
                  Fat
                </span>
                <p className="text-sm font-heading font-black text-foreground mt-0.5">
                  {consumedFat}g
                  <span className="text-[10px] font-normal text-muted-foreground"> / {targets.fat}g</span>
                </p>
                <div className="w-full h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{ width: `${Math.min(100, (consumedFat / (targets.fat || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Target Adjustment Engine */}
          <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="size-4 text-emerald-600 dark:text-[#03D26F]" />
                <h3 className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-foreground">
                  Daily Target Settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingTargets((prev) => !prev)}
                className="text-xs font-heading font-black text-foreground px-2.5 py-1 rounded-lg border border-border hover:bg-muted cursor-pointer transition-all"
              >
                {isEditingTargets ? "Cancel" : "Edit Targets"}
              </button>
            </div>

            {isEditingTargets ? (
              <form onSubmit={handleSaveTargets} className="space-y-3 pt-2">
                {/* Presets */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                    Quick Presets:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset("cutting")}
                    className="px-2 py-0.5 rounded-md border border-border text-[10px] font-mono font-bold hover:bg-muted cursor-pointer"
                  >
                    Cut (-400)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset("maintenance")}
                    className="px-2 py-0.5 rounded-md border border-border text-[10px] font-mono font-bold hover:bg-muted cursor-pointer"
                  >
                    Maintenance
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset("bulking")}
                    className="px-2 py-0.5 rounded-md border border-border text-[10px] font-mono font-bold hover:bg-muted cursor-pointer"
                  >
                    Bulk (+400)
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase block mb-1">
                      Calories (kcal)
                    </label>
                    <input
                      type="number"
                      value={inputCals}
                      onChange={(e) => setInputCals(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-foreground font-mono text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase block mb-1">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      value={inputProtein}
                      onChange={(e) => setInputProtein(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-foreground font-mono text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase block mb-1">
                      Carbs (g)
                    </label>
                    <input
                      type="number"
                      value={inputCarbs}
                      onChange={(e) => setInputCarbs(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-foreground font-mono text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase block mb-1">
                      Fat (g)
                    </label>
                    <input
                      type="number"
                      value={inputFat}
                      onChange={(e) => setInputFat(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-foreground font-mono text-xs font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-[#161514] text-white dark:bg-white dark:text-[#161514] font-heading font-black text-xs cursor-pointer shadow-xs"
                >
                  Save Targets
                </button>
              </form>
            ) : (
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono font-bold text-muted-foreground pt-1">
                <div>
                  <span className="text-[9px] uppercase block text-muted-foreground">Calories</span>
                  <span className="text-foreground">{targets.calories} kcal</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase block text-muted-foreground">Protein</span>
                  <span className="text-foreground">{targets.protein}g</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase block text-muted-foreground">Carbs</span>
                  <span className="text-foreground">{targets.carbs}g</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase block text-muted-foreground">Fat</span>
                  <span className="text-foreground">{targets.fat}g</span>
                </div>
              </div>
            )}
          </div>

          {/* Today's Logged Meals Stream */}
          <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-foreground">
                Today&apos;s Consumed Items ({todayMeals.length})
              </h4>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("invictus:open-quick-meal"))}
                className="text-xs font-heading font-black text-emerald-600 dark:text-[#03D26F] hover:underline cursor-pointer"
              >
                + Quick Log
              </button>
            </div>

            {todayMeals.length === 0 ? (
              <NeobrutalistEmptyCard
                icon={Utensils}
                title="No meals logged today yet"
                description="Tap 'Log Meal' above or use the flower menu to quickly add from 1,000+ items."
                actionLabel="+ Log Meal"
                onAction={() => window.dispatchEvent(new CustomEvent("invictus:open-quick-meal"))}
              />
            ) : (
              <div className="divide-y divide-border">
                {todayMeals.map((meal: any) => (
                  <div key={meal.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground uppercase">
                          {meal.mealType || "Meal"}
                        </span>
                        <span className="font-heading font-bold text-xs text-foreground">
                          {meal.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {meal.protein || 0}g P • {meal.carbs || 0}g C • {meal.fat || 0}g F
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-foreground">
                        {meal.calories || 0} kcal
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          deleteMealMutation.mutate(meal.id);
                          toast.success("Meal removed");
                        }}
                        className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                        title="Delete meal"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Weekly Fuel Distribution */}
      {activeTab === "distribution" && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* Caloric Macro Ratio Split (% Calories from Protein, Carbs, Fat) */}
          <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-xs space-y-3">
            <h3 className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-foreground">
              Caloric Macro Balance Ratio
            </h3>

            {/* Proportional Bar */}
            <div className="w-full h-4 rounded-full overflow-hidden flex border border-border">
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${proteinPct}%` }}
                title={`Protein: ${proteinPct}% of calories`}
              />
              <div
                className="bg-amber-500 h-full transition-all"
                style={{ width: `${carbsPct}%` }}
                title={`Carbs: ${carbsPct}% of calories`}
              />
              <div
                className="bg-sky-500 h-full transition-all"
                style={{ width: `${fatPct}%` }}
                title={`Fat: ${fatPct}% of calories`}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono font-bold pt-1">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="size-2.5 rounded-full bg-emerald-500" />
                Protein {proteinPct}% ({proteinCals} kcal)
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <span className="size-2.5 rounded-full bg-amber-500" />
                Carbs {carbsPct}% ({carbsCals} kcal)
              </span>
              <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                <span className="size-2.5 rounded-full bg-sky-500" />
                Fat {fatPct}% ({fatCals} kcal)
              </span>
            </div>
          </div>

          {/* 7-Day Caloric Intake Bar Chart */}
          <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-xs space-y-3">
            <h3 className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-foreground">
              7-Day Energy Intake (kcal)
            </h3>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" stroke="#888888" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} domain={[0, Math.max(targets.calories + 500, 2500)]} />
                  <Tooltip
                    formatter={(v) => [`${v} kcal`, "Calories"]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #E8E5DF",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                      fontFamily: "var(--font-heading)",
                      fontSize: "12px",
                      fontWeight: 700,
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                  <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
                    {weeklyChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.calories >= targets.calories ? "#03D26F" : entry.calories > 0 ? "#CEF431" : "#E8E5DF"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </SubpageLayout>
  );
}
