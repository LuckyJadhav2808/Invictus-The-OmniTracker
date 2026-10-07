'use client';

import React from 'react';
import { Smile, Sparkles, Send, Zap, Meh, Frown, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EveningReflectionCardProps {
  currentMood: string;
  reflectionNote: string;
  onChangeNote: (note: string) => void;
  onSaveMood: (newMood?: string) => Promise<void>;
  isSaving: boolean;
}

const MOOD_OPTIONS = [
  { id: 'awesome', label: 'Great', Icon: Zap, bg: 'bg-emerald-300' },
  { id: 'good', label: 'Good', Icon: Smile, bg: 'bg-[#CEF431]' },
  { id: 'okay', label: 'Okay', Icon: Meh, bg: 'bg-cyan-200' },
  { id: 'low', label: 'Low', Icon: Frown, bg: 'bg-amber-200' },
  { id: 'tired', label: 'Tired', Icon: Moon, bg: 'bg-rose-200' },
];

export function EveningReflectionCard({
  currentMood,
  reflectionNote,
  onChangeNote,
  onSaveMood,
  isSaving,
}: EveningReflectionCardProps) {
  return (
    <section className="bg-white border-2 border-[#161514] p-4 sm:p-5 rounded-xl shadow-[3px_3px_0px_#161514] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#161514]/15 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-[#CEF431] border-2 border-[#161514] flex items-center justify-center">
            <Smile className="size-3.5 text-[#161514] stroke-[2.5]" />
          </div>
          <h2 className="font-heading font-black text-sm sm:text-base text-[#161514] tracking-tight">
            Daily Reflection & Mindset
          </h2>
        </div>
        <span className="text-[11px] font-heading font-bold text-[#161514]/65">
          Evening Pulse
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
        {/* 5-scale Neobrutalist Sentiment Icons */}
        <div className="md:col-span-5 grid grid-cols-5 gap-2">
          {MOOD_OPTIONS.map((m) => {
            const Icon = m.Icon;
            const isSelected = currentMood === m.id;

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSaveMood(m.id)}
                className={cn(
                  'min-h-[48px] p-1.5 rounded-lg border-2 border-[#161514] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95',
                  isSelected
                    ? `${m.bg} shadow-[2px_2px_0px_#161514] -translate-y-0.5`
                    : 'bg-[#F1EFEA] hover:bg-white shadow-none opacity-75'
                )}
              >
                <Icon className="size-4 text-[#161514] stroke-[2.5]" />
                <span className="font-heading font-black text-[9px] text-[#161514]">
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* 1-Line Win / Reflection Note Box */}
        <div className="md:col-span-7 flex items-center gap-2 min-w-0 w-full">
          <input
            type="text"
            placeholder="Today's win or takeaway? (1 line reflection)"
            value={reflectionNote}
            onChange={(e) => onChangeNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveMood();
            }}
            className="flex-1 min-w-0 w-full neo-input text-base md:text-xs py-1.5"
          />
          <Button
            variant="default"
            size="sm"
            onClick={() => onSaveMood()}
            disabled={isSaving}
            className="border-2 border-[#161514] bg-[#CEF431] text-[#161514] hover:bg-[#D8F74E] shadow-[2px_2px_0px_#161514] active:scale-95 shrink-0 px-3 cursor-pointer"
          >
            <Send className="size-3.5" />
            <span>Save</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
