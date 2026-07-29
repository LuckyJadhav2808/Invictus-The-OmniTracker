"use client";

import { useState, useEffect } from "react";
import { Smile, Frown, Meh, Sun, Moon, Zap, PenTool, Sparkles, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMoodLog, useSaveMoodLog } from "@/lib/queries/goals";
import { toast } from "sonner";

interface MoodJournalWidgetProps {
  dateStr?: string;
}

const MOODS = [
  { id: "great", label: "Great", emoji: "😄", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "good", label: "Good", emoji: "🙂", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { id: "okay", label: "Okay", emoji: "😐", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "low", label: "Low", emoji: "😔", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { id: "tired", label: "Tired", emoji: "😴", color: "bg-purple-50 text-purple-700 border-purple-200" },
];

export function MoodJournalWidget({ dateStr }: MoodJournalWidgetProps) {
  const targetDate = dateStr || format(new Date(), "yyyy-MM-dd");

  const { data: moodData } = useMoodLog(targetDate);
  const saveMoodMutation = useSaveMoodLog();

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number>(3); // 1-5
  const [journalNote, setJournalNote] = useState<string>("");
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Sync loaded MongoDB data
  useEffect(() => {
    if (moodData) {
      setSelectedMood(moodData.mood || null);
      setEnergyLevel(moodData.energy || 3);
      setJournalNote(moodData.note || "");
    } else {
      setSelectedMood(null);
      setEnergyLevel(3);
      setJournalNote("");
    }
  }, [moodData]);

  const handleSave = async (overrideMood?: string) => {
    const moodToSave = overrideMood || selectedMood || "okay";
    try {
      await saveMoodMutation.mutateAsync({
        date: targetDate,
        mood: moodToSave,
        energy: energyLevel,
        note: journalNote,
      });
      setSavedSuccess(true);
      toast.success("Mood & journal saved! 🌟");
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch {
      toast.error("Failed to save mood log");
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 md:p-6 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-4 my-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-amber-300 border-2 border-navy-950 text-navy-950 flex items-center justify-center font-black shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]">
            <Smile className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-sm font-black text-navy-950 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Daily Mood & Journal</h4>
            <p className="text-[10px] text-navy-700 font-bold">Log feelings & daily reflections</p>
          </div>
        </div>

        {savedSuccess ? (
          <span className="text-[10px] font-black text-navy-950 bg-emerald-300 border-2 border-navy-950 px-3 py-1 rounded-xl flex items-center gap-1 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] animate-in fade-in">
            <Check className="h-3 w-3 stroke-[3]" /> Saved
          </span>
        ) : (
          <button
            onClick={() => handleSave()}
            className="text-[10px] font-black text-navy-950 bg-amber-400 hover:bg-amber-500 px-3.5 py-1.5 rounded-xl border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
          >
            Save Log
          </button>
        )}
      </div>

      {/* Mood Selector Buttons */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-wider text-navy-700">How are you feeling today?</label>
        <div className="grid grid-cols-5 gap-2">
          {MOODS.map((m) => {
            const isSelected = selectedMood === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelectedMood(m.id);
                  handleSave(m.id);
                }}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-2xl border-2 border-navy-950 transition-all cursor-pointer select-none shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5",
                  isSelected
                    ? "bg-amber-300 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)] scale-105"
                    : "bg-white hover:bg-amber-100"
                )}
              >
                <span className="text-xl mb-0.5">{m.emoji}</span>
                <span className="text-[9px] font-black text-navy-950">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Energy Level Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between items-center text-[10px] font-black text-navy-600">
          <span className="flex items-center gap-1 uppercase tracking-wider">
            <Zap className="h-3 w-3 text-amber-500 fill-amber-500" /> Energy Level
          </span>
          <span className="text-navy-900">{energyLevel} / 5</span>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => {
                setEnergyLevel(level);
                handleSave();
              }}
              className={cn(
                "h-2.5 flex-1 rounded-full transition-all cursor-pointer",
                level <= energyLevel ? "bg-amber-500 shadow-2xs" : "bg-gray-100"
              )}
            />
          ))}
        </div>
      </div>

      {/* Journal Reflection Note */}
      <div className="space-y-1 pt-1">
        <label className="text-[10px] font-black uppercase tracking-wider text-navy-600 flex items-center gap-1">
          <PenTool className="h-3 w-3" /> Quick Journal Note
        </label>
        <input
          type="text"
          value={journalNote}
          onChange={(e) => setJournalNote(e.target.value)}
          onBlur={() => handleSave()}
          placeholder="What went well today? Any thoughts..."
          className="w-full bg-cream-bg/50 rounded-xl px-3 py-2 text-xs text-navy-900 font-medium border border-border/60 focus:outline-none focus:border-amber-500"
        />
      </div>
    </div>
  );
}
