'use client';

import React, { useState } from 'react';
import { Sparkles, MessageSquareCode } from 'lucide-react';

interface VixSpeechBubbleProps {
  completedHabitsCount: number;
  totalHabitsCount: number;
  studyMinutesToday: number;
  streakDays: number;
  isStudyingActive?: boolean;
  onMascotClick?: () => void;
  className?: string;
}

const GLADIATOR_QUIPS = [
  'Armor up, Gladiator! Today is won in the morning.',
  'Discipline is the shield; ruthless consistency is your blade.',
  'An unconquered day begins with one checked habit.',
  'Victory is not an event — it is a daily discipline.',
  'Your streak is your fortress. Defend it at all costs!',
  'The mind wants comfort; the champion chooses momentum.',
  'One focus block at a time. Total conquest!',
];

export function VixSpeechBubble({
  completedHabitsCount,
  totalHabitsCount,
  studyMinutesToday,
  streakDays,
  isStudyingActive = false,
  className = '',
}: VixSpeechBubbleProps) {
  const [quipIndex, setQuipIndex] = useState<number | null>(null);

  // Determine dynamic message based on telemetry
  const getContextualMessage = () => {
    if (quipIndex !== null) {
      return GLADIATOR_QUIPS[quipIndex];
    }

    if (isStudyingActive) {
      return 'Deep focus protocol engaged. Tactical scanner active — lock in and finish the sprint!';
    }

    if (totalHabitsCount > 0 && completedHabitsCount === totalHabitsCount) {
      return 'Glorious conquest! All scheduled habits for today are cleared. You are truly Invictus!';
    }

    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      if (completedHabitsCount === 0) {
        return `Morning Kickoff, Champion! ${totalHabitsCount} habits and your daily targets await your command.`;
      }
      return `Solid start! You have conquered ${completedHabitsCount} of ${totalHabitsCount} habits so far.`;
    } else if (hour >= 12 && hour < 18) {
      if (studyMinutesToday > 0) {
        return `Midday momentum! ${studyMinutesToday}m logged in the books. Ready for the afternoon push?`;
      }
      return 'Afternoon sprint underway! Time to knock out your high-priority targets.';
    } else {
      if (streakDays > 0) {
        return `Evening debrief. Your ${streakDays}-day streak is secured. Review your safe-to-spend budget and rest up!`;
      }
      return 'Day wrap-up time. Tally your victories, reflect on lessons, and prepare tomorrow\'s armor.';
    }
  };

  const handleNextQuip = () => {
    setQuipIndex((prev) => {
      if (prev === null) return 0;
      return (prev + 1) % GLADIATOR_QUIPS.length;
    });
  };

  return (
    <div
      onClick={handleNextQuip}
      role="button"
      tabIndex={0}
      title="Click to hear Vix's battle advice"
      className={`group relative bg-[#FFFDF8] border-2 border-[#161514] p-3 sm:p-4 rounded-md shadow-[3px_3px_0px_#161514] cursor-pointer hover:bg-[#FDFCF0] active:scale-[0.99] transition-all duration-150 ease-out ${className}`}
    >
      {/* Speech Bubble Pointer Beak (facing left on desktop, top on mobile) */}
      <div className="hidden sm:block absolute -left-2 top-6 w-3 h-3 bg-[#FFFDF8] border-l-2 border-b-2 border-[#161514] -rotate-45" />

      {/* Header telemetry metadata */}
      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#161514]/15 mb-2">
        <div className="flex items-center gap-1.5">
          <MessageSquareCode className="w-3.5 h-3.5 text-[#161514]" />
          <span className="font-mono text-[10px] font-black uppercase tracking-wider text-[#161514]">
            [ VIX TELEMETRY // GLADIATOR BOT ]
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-[#161514]/70 flex items-center gap-1 group-hover:text-[#161514]">
          <Sparkles className="w-3 h-3 text-[#FFB800]" /> Tap for tactical quip
        </span>
      </div>

      {/* Dynamic text dialogue */}
      <p className="text-xs sm:text-sm font-black text-[#161514] leading-relaxed tracking-tight">
        &ldquo;{getContextualMessage()}&rdquo;
      </p>
    </div>
  );
}
