"use client";

import { useState, useEffect } from "react";
import { Smile, Frown, Meh, Sun, Moon, Zap, PenTool, Sparkles, Check, SmilePlus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMoodLog, useSaveMoodLog } from "@/lib/queries/goals";
import { toast } from "sonner";

interface MoodJournalWidgetProps {
  dateStr?: string;
}

const MOODS = [
  { id: "great", label: "Great", icon: SmilePlus, color: "text-emerald-700" },
  { id: "good", label: "Good", icon: Smile, color: "text-sky-700" },
  { id: "okay", label: "Okay", icon: Meh, color: "text-amber-700" },
  { id: "low", label: "Low", icon: Frown, color: "text-rose-700" },
  { id: "tired", label: "Tired", icon: Moon, color: "text-indigo-700" },
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
      toast.success("Mood & energy logged");
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {
      toast.error("Failed to save mood log");
    }
  };

  return (
    <div className="bg-white dark:bg-[#1C1A18] rounded-xl p-5 border border-[#E8E5DF] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] space-y-4 my-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-[#F1EFEA] dark:bg-[#252321] flex items-center justify-center text-[#161514] dark:text-[#CEF431] shrink-0 border border-[#E8E5DF] dark:border-[#383531]">
            <Smile className="size-4 stroke-[1.5]" />
          </div>
          <div>
            <h4 className="text-[15px] font-sans font-semibold text-[#161514] dark:text-[#FAF8F5] tracking-tight">Daily mood & reflection</h4>
            <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E]">Log mental state & energy levels</p>
          </div>
        </div>

        {savedSuccess ? (
          <span className="text-xs font-mono font-medium text-[#04250e] dark:text-[#03D26F] bg-[#DCFAE5] dark:bg-[#03D26F]/20 border border-[#03D26F]/30 px-2.5 py-1 rounded-md flex items-center gap-1 animate-in fade-in">
            <Check className="size-3 stroke-[2]" /> Saved
          </span>
        ) : (
          <button
            onClick={() => handleSave()}
            className="text-xs font-medium text-[#161514] dark:text-[#FAF8F5] bg-white dark:bg-[#252321] hover:bg-[#F5F3EF] dark:hover:bg-[#2A2724] px-3 py-1.5 rounded-lg border border-[#E8E5DF] dark:border-[#383531] transition-colors cursor-pointer"
          >
            Save log
          </button>
        )}
      </div>

      {/* Mood Selector Buttons */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#161514] dark:text-[#FAF8F5]">How are you feeling today?</label>
        <div className="grid grid-cols-5 gap-2">
          {MOODS.map((m) => {
            const isSelected = selectedMood === m.id;
            const MoodIcon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelectedMood(m.id);
                  handleSave(m.id, energyLevel, journalNote);
                }}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-lg border transition-colors cursor-pointer select-none min-h-[54px]",
                  isSelected
                    ? "bg-[#F1EFEA] dark:bg-[#252321] border-[#161514] dark:border-[#CEF431] font-medium text-[#161514] dark:text-[#FAF8F5]"
                    : "bg-white dark:bg-[#1C1A18] border-[#E8E5DF] dark:border-[#383531] text-[#6B6B6B] dark:text-[#A8A29E] hover:bg-[#FAF8F5] dark:hover:bg-[#2A2724] hover:text-[#161514] dark:hover:text-[#FAF8F5]"
                )}
              >
                <MoodIcon className={cn("size-4 stroke-[1.5] mb-1", isSelected ? "text-[#161514] dark:text-[#FAF8F5]" : m.color)} />
                <span className="text-[11px]">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Energy Level Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between items-center text-xs font-medium text-[#161514] dark:text-[#FAF8F5]">
          <span className="flex items-center gap-1">
            <Zap className="size-3 text-amber-500 fill-amber-500" /> Energy level
          </span>
          <span className="font-mono text-xs tabular-nums text-[#6B6B6B] dark:text-[#A8A29E]">{energyLevel} / 5</span>
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
                "h-2 flex-1 rounded-full transition-colors cursor-pointer",
                level <= energyLevel ? "bg-[#03D26F]" : "bg-[#E8E5DF] dark:bg-[#383531]"
              )}
            />
          ))}
        </div>
      </div>

      {/* Journal Reflection Note */}
      <div className="space-y-1 pt-1">
        <label className="text-xs font-medium text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1">
          <PenTool className="size-3 stroke-[1.5]" /> Reflection note
        </label>
        <input
          type="text"
          value={journalNote}
          onChange={(e) => setJournalNote(e.target.value)}
          onBlur={(e) => handleSave(selectedMood, energyLevel, e.target.value)}
          placeholder="What went well today? Any reflections..."
          className="w-full bg-white dark:bg-[#252321] rounded-lg p-2.5 border border-[#E8E5DF] dark:border-[#383531] text-xs font-medium text-[#161514] dark:text-[#FAF8F5] focus:border-[#161514] dark:focus:border-[#CEF431] outline-none placeholder:text-[#6B6B6B]/60 dark:placeholder:text-[#A8A29E]/60 transition-colors"
        />
      </div>
    </div>
  );
}
