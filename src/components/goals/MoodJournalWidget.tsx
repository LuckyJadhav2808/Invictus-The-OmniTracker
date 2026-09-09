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

  const handleSave = async (overrideMood?: string | null, overrideEnergy?: number, overrideNote?: string) => {
    const moodToSave = overrideMood !== undefined ? (overrideMood || "okay") : (selectedMood || "okay");
    const energyToSave = overrideEnergy !== undefined ? overrideEnergy : energyLevel;
    const noteToSave = overrideNote !== undefined ? overrideNote : journalNote;

    try {
      await saveMoodMutation.mutateAsync({
        date: targetDate,
        mood: moodToSave,
        energy: energyToSave,
        note: noteToSave,
      });
      setSavedSuccess(true);
      toast.success("Mood & energy saved! 🌟");
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {
      toast.error("Failed to save mood & energy log");
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 md:p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-4 my-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-amber-300 border-2 border-[#161514] text-[#161514] flex items-center justify-center font-black shadow-[2px_2px_0px_0px_#161514]">
            <Smile className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-sm font-heading font-black text-[#161514] tracking-tight">Daily Mood & Journal</h4>
            <p className="text-[10px] text-[#161514]/80 font-bold">Log feelings & daily reflections</p>
          </div>
        </div>

        {savedSuccess ? (
          <span className="text-[10px] font-heading font-black text-[#161514] bg-[#03D26F] border-2 border-[#161514] px-3 py-1 rounded-full flex items-center gap-1 shadow-[2px_2px_0px_0px_#161514] animate-in fade-in">
            <Check className="h-3 w-3 stroke-[3]" /> Saved
          </span>
        ) : (
          <button
            onClick={() => handleSave()}
            className="text-[10px] font-heading font-black text-[#161514] bg-[#CEF431] hover:bg-[#D8F74E] px-3.5 py-1.5 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer transition-all uppercase tracking-wider"
          >
            Save Log
          </button>
        )}
      </div>

      {/* Mood Selector Buttons */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514]/70">How are you feeling today?</label>
        <div className="grid grid-cols-5 gap-2">
          {MOODS.map((m) => {
            const isSelected = selectedMood === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelectedMood(m.id);
                  handleSave(m.id, energyLevel, journalNote);
                }}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-xl border-2 border-[#161514] transition-all cursor-pointer select-none shadow-[2.5px_2.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
                  isSelected
                    ? "bg-[#CEF431] shadow-[3px_3px_0px_0px_#161514] scale-105"
                    : "bg-white hover:bg-amber-100"
                )}
              >
                <span className="text-xl mb-0.5">{m.emoji}</span>
                <span className="text-[9px] font-heading font-black text-[#161514]">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Energy Level Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between items-center text-[10px] font-heading font-black text-[#161514]/70">
          <span className="flex items-center gap-1 uppercase tracking-wider">
            <Zap className="h-3 w-3 text-amber-500 fill-amber-500" /> Energy Level
          </span>
          <span className="text-[#161514] font-black">{energyLevel} / 5</span>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => {
                setEnergyLevel(level);
                handleSave(selectedMood, level, journalNote);
              }}
              className={cn(
                "h-3 flex-1 rounded-full transition-all cursor-pointer border border-[#161514]",
                level <= energyLevel ? "bg-[#03D26F] shadow-[1px_1px_0px_0px_#161514]" : "bg-gray-100"
              )}
            />
          ))}
        </div>
      </div>

      {/* Journal Reflection Note */}
      <div className="space-y-1 pt-1">
        <label className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514]/70 flex items-center gap-1">
          <PenTool className="h-3 w-3" /> Quick Journal Note
        </label>
        <input
          type="text"
          value={journalNote}
          onChange={(e) => setJournalNote(e.target.value)}
          onBlur={(e) => handleSave(selectedMood, energyLevel, e.target.value)}
          placeholder="What went well today? Any thoughts..."
          className="neo-input w-full text-xs font-medium"
        />
      </div>
    </div>
  );
}
