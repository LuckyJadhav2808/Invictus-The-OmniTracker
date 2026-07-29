"use client";

import { useState, useEffect } from "react";
import { Moon, Flame, Activity, Clock, Sparkles, Plus, Trash2, Zap, Brain, Coffee } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { predictCircadianProductivity } from "@/lib/utils/circadian-predictor";

export function SleepAndActiveWidgets() {
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const [sleepHours, setSleepHours] = useState(0);
  const [sleepMinutes, setSleepMinutes] = useState(0);
  const [sleepScore, setSleepScore] = useState(0);

  const [activeMins, setActiveMins] = useState(0);
  const [activeTarget, setActiveTarget] = useState(60);
  const [caloriesBurnt, setCaloriesBurnt] = useState(0);
  const [distanceKm, setDistanceKm] = useState("0");

  const [isEditingSleep, setIsEditingSleep] = useState(false);
  const [isEditingActive, setIsEditingActive] = useState(false);

  // Load persisted entries on mount
  useEffect(() => {
    try {
      const savedSleep = localStorage.getItem(`invictus_sleep_log_${todayStr}`);
      if (savedSleep) {
        const parsed = JSON.parse(savedSleep);
        setSleepHours(parsed.hours || 0);
        setSleepMinutes(parsed.minutes || 0);
        setSleepScore(parsed.score || 0);
      }

      const savedActive = localStorage.getItem(`invictus_active_log_${todayStr}`);
      if (savedActive) {
        const parsed = JSON.parse(savedActive);
        setActiveMins(parsed.mins || 0);
        setActiveTarget(parsed.target || 60);
        setCaloriesBurnt(parsed.calories || 0);
        setDistanceKm(parsed.distance || "0");
      }
    } catch {}
  }, [todayStr]);

  // Persist sleep updates
  const saveSleepLog = (hours: number, minutes: number, score: number) => {
    setSleepHours(hours);
    setSleepMinutes(minutes);
    setSleepScore(score);
    try {
      localStorage.setItem(
        `invictus_sleep_log_${todayStr}`,
        JSON.stringify({ hours, minutes, score })
      );
    } catch {}
  };

  const clearSleepLog = () => {
    saveSleepLog(0, 0, 0);
    setIsEditingSleep(false);
  };

  // Persist active updates
  const saveActiveLog = (mins: number, target: number, calories: number, distance: string) => {
    setActiveMins(mins);
    setActiveTarget(target);
    setCaloriesBurnt(calories);
    setDistanceKm(distance);
    try {
      localStorage.setItem(
        `invictus_active_log_${todayStr}`,
        JSON.stringify({ mins, target, calories, distance })
      );
    } catch {}
  };

  const clearActiveLog = () => {
    saveActiveLog(0, 60, 0, "0");
    setIsEditingActive(false);
  };

  const hasLoggedSleep = sleepHours > 0 || sleepMinutes > 0;
  const hasLoggedActive = activeMins > 0 || caloriesBurnt > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
      {/* Sleep Tracker Card */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-300 border-2 border-navy-950 text-navy-950 flex items-center justify-center font-black shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]">
              <Moon className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-black text-navy-950 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Sleep Tracker</h4>
              <p className="text-[10px] text-navy-700 font-bold">Last night's sleep analysis</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditingSleep(!isEditingSleep)}
            className="text-[10px] font-black text-navy-950 bg-amber-300 hover:bg-amber-400 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 flex items-center gap-1"
          >
            {isEditingSleep ? "Done" : <><Plus className="h-3.5 w-3.5 stroke-[3]" /> Log Sleep</>}
          </button>
        </div>

        {isEditingSleep ? (
          <div className="space-y-3 bg-amber-50/60 p-3.5 rounded-2xl border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)]">
            <div className="grid grid-cols-3 gap-2 text-xs font-bold">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-navy-700 font-black">Hours</label>
                <input
                  type="number"
                  value={sleepHours || ""}
                  placeholder="e.g. 7"
                  onChange={(e) => saveSleepLog(Number(e.target.value), sleepMinutes, sleepScore)}
                  className="w-full bg-white rounded-xl p-2 border-2 border-navy-950 font-black text-navy-950"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-navy-700 font-black">Minutes</label>
                <input
                  type="number"
                  value={sleepMinutes || ""}
                  placeholder="e.g. 30"
                  onChange={(e) => saveSleepLog(sleepHours, Number(e.target.value), sleepScore)}
                  className="w-full bg-white rounded-xl p-2 border-2 border-navy-950 font-black text-navy-950"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-navy-700 font-black">Score (0-100)</label>
                <input
                  type="number"
                  value={sleepScore || ""}
                  placeholder="e.g. 85"
                  onChange={(e) => saveSleepLog(sleepHours, sleepMinutes, Number(e.target.value))}
                  className="w-full bg-white rounded-xl p-2 border-2 border-navy-950 font-black text-navy-950"
                />
              </div>
            </div>
            {hasLoggedSleep && (
              <button
                onClick={clearSleepLog}
                className="text-[10px] text-rose-600 font-black hover:underline flex items-center gap-1 cursor-pointer pt-1"
              >
                <Trash2 className="h-3 w-3 stroke-[2.5]" /> Clear Sleep Entry
              </button>
            )}
          </div>
        ) : !hasLoggedSleep ? (
          /* Empty Encouragement State */
          <div className="bg-amber-50/60 rounded-2xl p-4 border-2 border-dashed border-navy-950 text-center space-y-2 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)]">
            <p className="text-xs font-black text-navy-950">No sleep logged for today yet! 😴</p>
            <p className="text-[10px] text-navy-700 font-bold">
              Click <span className="font-black text-amber-900">'Log Sleep'</span> above to capture your rest hours & recovery score.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-navy-950">
                  {sleepHours}<span className="text-xs font-bold text-navy-700">h </span>
                  {sleepMinutes}<span className="text-xs font-bold text-navy-700">m</span>
                </span>
                <span className="text-[10px] text-navy-700 block font-bold">Last logged rest duration</span>
              </div>
              <div className="flex items-center gap-1.5 bg-indigo-200 border-2 border-navy-950 px-3 py-1 rounded-xl shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]">
                <Sparkles className="h-3.5 w-3.5 text-navy-950 stroke-[2.5]" />
                <span className="text-xs font-black text-navy-950">Score: {sleepScore || 80}/100</span>
              </div>
            </div>

            {/* Sleep Stages Multi-Segment Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-black text-navy-950">
                <span>Sleep Stage Breakdown</span>
                <span className="text-indigo-800 font-black">Good Recovery</span>
              </div>
              <div className="h-3.5 w-full bg-white rounded-full overflow-hidden flex gap-0.5 p-0.5 border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]">
                <div className="h-full bg-amber-400 rounded-l-full" style={{ width: "10%" }} title="Awake: 30m" />
                <div className="h-full bg-indigo-400" style={{ width: "25%" }} title="REM: 1h 30m" />
                <div className="h-full bg-sky-400" style={{ width: "45%" }} title="Light: 3h 30m" />
                <div className="h-full bg-indigo-700 rounded-r-full" style={{ width: "20%" }} title="Deep: 1h 15m" />
              </div>
              <div className="flex justify-between text-[9px] font-black text-navy-950 pt-0.5">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400 border border-black" /> Awake (10%)</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-400 border border-black" /> REM (25%)</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-400 border border-black" /> Light (45%)</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-700 border border-black" /> Deep (20%)</span>
              </div>
            </div>

            {/* 💤 DATASET ENGINE: CIRCADIAN RHYTHM ENERGY & FOCUS PREDICTOR */}
            {(() => {
              const circadian = predictCircadianProductivity(sleepHours + sleepMinutes / 60);
              return (
                <div className="bg-indigo-950 text-white rounded-2xl p-3.5 border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                        Circadian Focus Predictor
                      </span>
                    </div>
                    <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-lg border border-black", circadian.badgeColor)}>
                      {circadian.energyScore}% • {circadian.focusRating}
                    </span>
                  </div>

                  <p className="text-[10px] font-semibold text-indigo-100 leading-snug">
                    {circadian.recommendation}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-indigo-800">
                    <div className="flex items-center gap-1.5">
                      <Brain className="h-3.5 w-3.5 text-sky-300 shrink-0" />
                      <div>
                        <span className="text-[8px] font-black text-indigo-300 uppercase block">Peak Focus Window</span>
                        <span className="text-[10px] font-extrabold text-white">{circadian.peakFocusWindow}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Coffee className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-[8px] font-black text-indigo-300 uppercase block">Caffeine Cutoff</span>
                        <span className="text-[10px] font-extrabold text-white">{circadian.caffeineCutoff}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Active Time & Calories Burnt Card */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-rose-300 border-2 border-navy-950 text-navy-950 flex items-center justify-center font-black shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]">
              <Activity className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-black text-navy-950 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Active Time & Calories</h4>
              <p className="text-[10px] text-navy-700 font-bold">Daily movement status</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditingActive(!isEditingActive)}
            className="text-[10px] font-black text-navy-950 bg-amber-300 hover:bg-amber-400 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 flex items-center gap-1"
          >
            {isEditingActive ? "Done" : <><Plus className="h-3.5 w-3.5 stroke-[3]" /> Log Active</>}
          </button>
        </div>

        {isEditingActive ? (
          <div className="space-y-3 bg-cream-bg/50 p-3 rounded-2xl border border-amber-200/60">
            <div className="grid grid-cols-3 gap-2 text-xs font-bold">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-navy-600">Active Mins</label>
                <input
                  type="number"
                  value={activeMins || ""}
                  placeholder="e.g. 45"
                  onChange={(e) => saveActiveLog(Number(e.target.value), activeTarget, caloriesBurnt, distanceKm)}
                  className="w-full bg-white rounded-xl p-2 border text-navy-900"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-navy-600">Calories (kcal)</label>
                <input
                  type="number"
                  value={caloriesBurnt || ""}
                  placeholder="e.g. 350"
                  onChange={(e) => saveActiveLog(activeMins, activeTarget, Number(e.target.value), distanceKm)}
                  className="w-full bg-white rounded-xl p-2 border text-navy-900"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-navy-600">Distance (km)</label>
                <input
                  type="text"
                  value={distanceKm || ""}
                  placeholder="e.g. 2.5"
                  onChange={(e) => saveActiveLog(activeMins, activeTarget, caloriesBurnt, e.target.value)}
                  className="w-full bg-white rounded-xl p-2 border text-navy-900"
                />
              </div>
            </div>
            {hasLoggedActive && (
              <button
                onClick={clearActiveLog}
                className="text-[10px] text-rose-600 font-bold hover:underline flex items-center gap-1 cursor-pointer pt-1"
              >
                <Trash2 className="h-3 w-3" /> Clear Active Entry
              </button>
            )}
          </div>
        ) : !hasLoggedActive ? (
          /* Empty Encouragement State */
          <div className="bg-amber-50/60 rounded-2xl p-4 border-2 border-dashed border-navy-950 text-center space-y-2 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)]">
            <p className="text-xs font-black text-navy-950">No active movement logged today! 🏃</p>
            <p className="text-[10px] text-navy-700 font-bold">
              Click <span className="font-black text-amber-900">'Log Active'</span> above to record your workout minutes & calories burnt.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-black text-navy-950">
                  {activeMins} <span className="text-xs text-navy-700 font-bold">/ {activeTarget || 60} mins</span>
                </span>
                <span className="text-xs font-black text-navy-950 bg-rose-200 px-2.5 py-0.5 rounded-xl border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]">
                  {Math.round((activeMins / (activeTarget || 60)) * 100)}% Reached
                </span>
              </div>
              <div className="h-3.5 w-full bg-white rounded-full overflow-hidden p-0.5 border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]">
                <div
                  className="h-full bg-rose-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (activeMins / (activeTarget || 60)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="bg-amber-100 p-3 rounded-2xl border-2 border-navy-950 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)]">
                <Flame className="h-5 w-5 text-amber-600 fill-amber-500 stroke-[2.5]" />
                <div>
                  <span className="text-[9px] font-black text-navy-950 block uppercase tracking-wider">Calories</span>
                  <span className="text-xs font-black text-navy-950 block">{caloriesBurnt} kcal</span>
                </div>
              </div>
              <div className="bg-sky-100 p-3 rounded-2xl border-2 border-navy-950 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)]">
                <Clock className="h-5 w-5 text-sky-600 stroke-[2.5]" />
                <div>
                  <span className="text-[9px] font-black text-navy-950 block uppercase tracking-wider">Distance</span>
                  <span className="text-xs font-black text-navy-950 block">{distanceKm} km</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
