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
      <div className="bg-white dark:bg-[#1C1A18] rounded-xl p-5 border border-[#E8E5DF] dark:border-[#383531] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-[#F1EFEA] dark:bg-[#252321] flex items-center justify-center text-[#161514] dark:text-[#FAF8F5] shrink-0">
              <Moon className="size-4 stroke-[1.5]" />
            </div>
            <div>
              <h4 className="text-[15px] font-sans font-semibold text-[#161514] dark:text-[#FAF8F5] tracking-tight">Sleep tracker</h4>
              <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E]">Last night's sleep analysis</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditingSleep(!isEditingSleep)}
            className="text-xs font-medium text-[#161514] dark:text-[#FAF8F5] bg-white dark:bg-[#252321] hover:bg-[#F5F3EF] dark:hover:bg-[#2e2b28] px-3 py-1.5 rounded-lg cursor-pointer transition-colors border border-[#E8E5DF] dark:border-[#383531] flex items-center gap-1"
          >
            {isEditingSleep ? "Done" : <><Plus className="size-3.5 stroke-[1.5]" /> Log sleep</>}
          </button>
        </div>

        {isEditingSleep ? (
          <div className="space-y-3 bg-[#FAF8F5] dark:bg-[#161514] p-3.5 rounded-lg border border-[#E8E5DF] dark:border-[#383531]">
            <div className="grid grid-cols-3 gap-2 text-xs font-medium">
              <div>
                <label className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] block mb-1">Hours</label>
                <input
                  type="number"
                  value={sleepHours || ""}
                  placeholder="e.g. 7"
                  onChange={(e) => saveSleepLog(Number(e.target.value), sleepMinutes, sleepScore)}
                  className="w-full bg-white dark:bg-[#252321] rounded-lg p-2 border border-[#E8E5DF] dark:border-[#383531] font-medium text-xs text-[#161514] dark:text-[#FAF8F5] focus:border-[#161514] dark:focus:border-[#CEF431] outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] block mb-1">Minutes</label>
                <input
                  type="number"
                  value={sleepMinutes || ""}
                  placeholder="e.g. 30"
                  onChange={(e) => saveSleepLog(sleepHours, Number(e.target.value), sleepScore)}
                  className="w-full bg-white dark:bg-[#252321] rounded-lg p-2 border border-[#E8E5DF] dark:border-[#383531] font-medium text-xs text-[#161514] dark:text-[#FAF8F5] focus:border-[#161514] dark:focus:border-[#CEF431] outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] block mb-1">Score (0-100)</label>
                <input
                  type="number"
                  value={sleepScore || ""}
                  placeholder="e.g. 85"
                  onChange={(e) => saveSleepLog(sleepHours, sleepMinutes, Number(e.target.value))}
                  className="w-full bg-white dark:bg-[#252321] rounded-lg p-2 border border-[#E8E5DF] dark:border-[#383531] font-medium text-xs text-[#161514] dark:text-[#FAF8F5] focus:border-[#161514] dark:focus:border-[#CEF431] outline-none"
                />
              </div>
            </div>
            {hasLoggedSleep && (
              <button
                onClick={clearSleepLog}
                className="text-xs text-rose-600 hover:underline flex items-center gap-1 cursor-pointer pt-1 font-medium"
              >
                <Trash2 className="size-3 stroke-[1.5]" /> Clear Sleep Entry
              </button>
            )}
          </div>
        ) : !hasLoggedSleep ? (
          /* Empty Encouragement State */
          <div className="bg-[#FAF8F5] dark:bg-[#161514] rounded-lg p-4 border border-dashed border-[#E8E5DF] dark:border-[#383531] text-center space-y-1.5">
            <div className="size-7 rounded-md bg-white dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531] flex items-center justify-center mx-auto text-[#6B6B6B] dark:text-[#A8A29E]">
              <Moon className="size-3.5 stroke-[1.5]" />
            </div>
            <p className="text-xs font-sans font-medium text-[#161514] dark:text-[#FAF8F5]">No sleep logged for today yet</p>
            <p className="text-[11px] text-[#6B6B6B] dark:text-[#A8A29E]">
              Click <span className="font-semibold text-[#161514] dark:text-[#FAF8F5]">'Log sleep'</span> above to capture rest hours and recovery score.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-mono text-2xl font-semibold text-[#161514] dark:text-[#FAF8F5]">
                  {sleepHours}<span className="text-xs font-normal text-[#6B6B6B] dark:text-[#A8A29E]">h </span>
                  {sleepMinutes}<span className="text-xs font-normal text-[#6B6B6B] dark:text-[#A8A29E]">m</span>
                </span>
                <span className="text-[11px] text-[#6B6B6B] dark:text-[#A8A29E] block">Last logged rest duration</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#DCFAE5] dark:bg-[#03D26F]/20 border border-[#03D26F]/30 px-2.5 py-1 rounded-md text-[#04250e] dark:text-[#03D26F]">
                <Sparkles className="size-3 stroke-[1.5]" />
                <span className="text-xs font-mono font-medium">Score: {sleepScore || 80}/100</span>
              </div>
            </div>

            {/* Sleep Stages Multi-Segment Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-[#161514] dark:text-[#FAF8F5]">
                <span>Sleep Stage Breakdown</span>
                <span className="text-[#047857] dark:text-[#03D26F] text-[11px]">Good Recovery</span>
              </div>
              <div className="h-2 w-full bg-[#E8E5DF] dark:bg-[#383531] rounded-full overflow-hidden flex gap-0.5">
                <div className="h-full bg-amber-400 rounded-l-full" style={{ width: "10%" }} title="Awake: 30m" />
                <div className="h-full bg-indigo-400" style={{ width: "25%" }} title="REM: 1h 30m" />
                <div className="h-full bg-sky-400" style={{ width: "45%" }} title="Light: 3h 30m" />
                <div className="h-full bg-indigo-700 rounded-r-full" style={{ width: "20%" }} title="Deep: 1h 15m" />
              </div>
              <div className="flex justify-between text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] pt-0.5 font-mono">
                <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-amber-400" /> Awake (10%)</span>
                <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-indigo-400" /> REM (25%)</span>
                <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-sky-400" /> Light (45%)</span>
                <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-indigo-700" /> Deep (20%)</span>
              </div>
            </div>

            {/* CIRCADIAN RHYTHM ENERGY & FOCUS PREDICTOR */}
            {(() => {
              const circadian = predictCircadianProductivity(sleepHours + sleepMinutes / 60);
              return (
                <div className="bg-[#161514] dark:bg-[#121110] text-white rounded-xl p-3 border border-[#161514] dark:border-[#383531] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-amber-300 flex items-center gap-1.5">
                      <Brain className="size-3 text-amber-300" /> Energy & Focus Window
                    </span>
                    <span className="text-[10px] font-mono font-medium bg-[#03D26F] px-2 py-0.5 rounded text-white">
                      {circadian.focusRating} • {circadian.energyScore}%
                    </span>
                  </div>
                  <p className="text-xs font-normal leading-relaxed text-zinc-300">
                    {circadian.recommendation}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800 text-[10px]">
                    <div className="flex items-center gap-1.5 text-amber-300 font-mono">
                      <Zap className="size-3" />
                      <span>Peak: {circadian.peakFocusWindow}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-rose-300 font-mono">
                      <Coffee className="size-3" />
                      <span>Cutoff: {circadian.caffeineCutoff}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Active Time & Calories Burnt Card */}
      <div className="bg-white dark:bg-[#1C1A18] rounded-xl p-5 border border-[#E8E5DF] dark:border-[#383531] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-[#F1EFEA] dark:bg-[#252321] flex items-center justify-center text-[#161514] dark:text-[#FAF8F5] shrink-0">
              <Activity className="size-4 stroke-[1.5]" />
            </div>
            <div>
              <h4 className="text-[15px] font-sans font-semibold text-[#161514] dark:text-[#FAF8F5] tracking-tight">Active time & calories</h4>
              <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E]">Daily movement status</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditingActive(!isEditingActive)}
            className="text-xs font-medium text-[#161514] dark:text-[#FAF8F5] bg-white dark:bg-[#252321] hover:bg-[#F5F3EF] dark:hover:bg-[#2e2b28] px-3 py-1.5 rounded-lg cursor-pointer transition-colors border border-[#E8E5DF] dark:border-[#383531] flex items-center gap-1"
          >
            {isEditingActive ? "Done" : <><Plus className="size-3.5 stroke-[1.5]" /> Log active</>}
          </button>
        </div>

        {isEditingActive ? (
          <div className="space-y-3 bg-[#FAF8F5] dark:bg-[#161514] p-3.5 rounded-lg border border-[#E8E5DF] dark:border-[#383531]">
            <div className="grid grid-cols-3 gap-2 text-xs font-medium">
              <div>
                <label className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] block mb-1">Active Mins</label>
                <input
                  type="number"
                  value={activeMins || ""}
                  placeholder="e.g. 45"
                  onChange={(e) => saveActiveLog(Number(e.target.value), activeTarget, caloriesBurnt, distanceKm)}
                  className="w-full bg-white dark:bg-[#252321] rounded-lg p-2 border border-[#E8E5DF] dark:border-[#383531] font-medium text-xs text-[#161514] dark:text-[#FAF8F5] focus:border-[#161514] dark:focus:border-[#CEF431] outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] block mb-1">Calories (kcal)</label>
                <input
                  type="number"
                  value={caloriesBurnt || ""}
                  placeholder="e.g. 350"
                  onChange={(e) => saveActiveLog(activeMins, activeTarget, Number(e.target.value), distanceKm)}
                  className="w-full bg-white dark:bg-[#252321] rounded-lg p-2 border border-[#E8E5DF] dark:border-[#383531] font-medium text-xs text-[#161514] dark:text-[#FAF8F5] focus:border-[#161514] dark:focus:border-[#CEF431] outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] block mb-1">Distance (km)</label>
                <input
                  type="text"
                  value={distanceKm || ""}
                  placeholder="e.g. 2.5"
                  onChange={(e) => saveActiveLog(activeMins, activeTarget, caloriesBurnt, e.target.value)}
                  className="w-full bg-white dark:bg-[#252321] rounded-lg p-2 border border-[#E8E5DF] dark:border-[#383531] font-medium text-xs text-[#161514] dark:text-[#FAF8F5] focus:border-[#161514] dark:focus:border-[#CEF431] outline-none"
                />
              </div>
            </div>
            {hasLoggedActive && (
              <button
                onClick={clearActiveLog}
                className="text-xs text-rose-600 hover:underline flex items-center gap-1 cursor-pointer pt-1 font-medium"
              >
                <Trash2 className="size-3 stroke-[1.5]" /> Clear Active Entry
              </button>
            )}
          </div>
        ) : !hasLoggedActive ? (
          /* Empty Encouragement State */
          <div className="bg-[#FAF8F5] dark:bg-[#161514] rounded-lg p-4 border border-dashed border-[#E8E5DF] dark:border-[#383531] text-center space-y-1.5">
            <div className="size-7 rounded-md bg-white dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531] flex items-center justify-center mx-auto text-[#6B6B6B] dark:text-[#A8A29E]">
              <Activity className="size-3.5 stroke-[1.5]" />
            </div>
            <p className="text-xs font-sans font-medium text-[#161514] dark:text-[#FAF8F5]">No active movement logged today</p>
            <p className="text-[11px] text-[#6B6B6B] dark:text-[#A8A29E]">
              Click <span className="font-semibold text-[#161514] dark:text-[#FAF8F5]">'Log active'</span> above to record workout minutes and calories burnt.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="font-mono text-2xl font-semibold text-[#161514] dark:text-[#FAF8F5]">
                  {activeMins} <span className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] font-normal">/ {activeTarget || 60} mins</span>
                </span>
                <span className="text-xs font-mono font-medium text-[#04250e] dark:text-[#03D26F] bg-[#DCFAE5] dark:bg-[#03D26F]/20 px-2 py-0.5 rounded border border-[#03D26F]/30">
                  {Math.round((activeMins / (activeTarget || 60)) * 100)}% Reached
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#E8E5DF] dark:bg-[#383531] rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (activeMins / (activeTarget || 60)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="bg-[#FAF8F5] dark:bg-[#161514] p-3 rounded-lg border border-[#E8E5DF] dark:border-[#383531] flex items-center gap-2.5">
                <Flame className="size-4 text-orange-500 fill-orange-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] block">Calories</span>
                  <span className="text-xs font-mono font-semibold text-[#161514] dark:text-[#FAF8F5] block tabular-nums">{caloriesBurnt} kcal</span>
                </div>
              </div>
              <div className="bg-[#FAF8F5] dark:bg-[#161514] p-3 rounded-lg border border-[#E8E5DF] dark:border-[#383531] flex items-center gap-2.5">
                <Clock className="size-4 text-sky-600 dark:text-sky-400 stroke-[1.5] shrink-0" />
                <div>
                  <span className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] block">Distance</span>
                  <span className="text-xs font-mono font-semibold text-[#161514] dark:text-[#FAF8F5] block tabular-nums">{distanceKm} km</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
