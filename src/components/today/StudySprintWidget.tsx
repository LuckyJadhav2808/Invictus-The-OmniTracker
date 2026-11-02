'use client';

import React from 'react';
import { GraduationCap, Play, Pause, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SubjectOption {
  id: string;
  name: string;
}

interface TopicOption {
  id: string;
  title: string;
  subjectId?: string;
}

interface StudySprintWidgetProps {
  stopwatchSeconds: number;
  isTimerRunning: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSaveSession: () => void;
  selectedSubjectId: string;
  onChangeSubject: (id: string) => void;
  selectedTopicId: string;
  onChangeTopic: (id: string) => void;
  subjects: SubjectOption[];
  allTopics: TopicOption[];
  todayStudyHours: string;
  studyCompletionPercent: number;
  className?: string;
}

export function StudySprintWidget({
  stopwatchSeconds,
  isTimerRunning,
  onToggleTimer,
  onResetTimer,
  onSaveSession,
  selectedSubjectId,
  onChangeSubject,
  selectedTopicId,
  onChangeTopic,
  subjects,
  allTopics,
  todayStudyHours,
  studyCompletionPercent,
  className,
}: StudySprintWidgetProps) {
  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredTopics = allTopics.filter(
    (t) => !selectedSubjectId || t.subjectId === selectedSubjectId
  );

  return (
    <div
      id="study-section"
      className={cn(
        "bg-white border-2 border-[#161514] p-5 rounded-xl shadow-[3px_3px_0px_#161514] flex flex-col justify-between space-y-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#161514]/15 pb-3">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-[#C084FC] border-2 border-[#161514] flex items-center justify-center">
            <GraduationCap className="size-3.5 text-[#161514] stroke-[2.5]" />
          </div>
          <h2 className="font-heading font-black text-base text-[#161514] tracking-tight">
            Study Focus
          </h2>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-black text-[#161514] tabular-nums">
            {todayStudyHours}h / 4.0h
          </span>
          <span className="block text-[10px] text-[#161514]/65 font-bold tabular-nums">
            {studyCompletionPercent}% Daily Goal
          </span>
        </div>
      </div>

      {/* Target Progress Bar */}
      <div className="w-full bg-[#F1EFEA] rounded-full h-2 border border-[#161514]/20 overflow-hidden">
        <div
          className="bg-[#C084FC] h-full transition-all duration-300"
          style={{ width: `${studyCompletionPercent}%` }}
        />
      </div>

      {/* Stopwatch Tactical Card (Flex-1 to dynamically match sibling height) */}
      <div className="flex-1 p-4 sm:p-5 rounded-xl bg-[#FBF9F5] border-2 border-[#161514] shadow-[2px_2px_0px_#161514] text-center flex flex-col justify-between space-y-3">
        <div className="my-auto py-2">
          <div className="font-mono font-black text-3xl sm:text-4xl lg:text-5xl tracking-widest text-[#161514] tabular-nums">
            {formatTimer(stopwatchSeconds)}
          </div>
        </div>

        {/* Primary Action Controls (Thumb-Zone Priority) */}
        <div className="flex items-center justify-center gap-2 pt-0.5">
          <Button
            onClick={onToggleTimer}
            className={cn(
              'flex-1 min-h-[42px] font-heading font-black text-xs border-2 border-[#161514] shadow-[2px_2px_0px_#161514] active:scale-[0.97] transition-all cursor-pointer',
              isTimerRunning
                ? 'bg-[#161514] text-white hover:bg-[#252321]'
                : 'bg-[#CEF431] hover:bg-[#D8F74E] text-[#161514]'
            )}
          >
            {isTimerRunning ? (
              <>
                <span className="relative flex size-2 shrink-0">
                  <span className="animate-ping absolute inline-flex size-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-red-500" />
                </span>
                <Pause className="size-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="size-4 fill-current" />
                <span>Start Focus</span>
              </>
            )}
          </Button>

          {stopwatchSeconds > 0 && (
            <>
              <Button
                variant="secondary"
                onClick={onSaveSession}
                className="flex-1 min-h-[42px] font-heading font-black text-xs border-2 border-[#161514] bg-[#03D26F] hover:bg-[#02B860] text-[#161514] shadow-[2px_2px_0px_#161514] active:scale-[0.97] transition-all cursor-pointer"
              >
                <Check className="size-4 stroke-[3]" />
                <span>Log</span>
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={onResetTimer}
                aria-label="Reset Timer"
                className="min-h-[42px] min-w-[42px] border-2 border-[#161514] bg-white hover:bg-[#F1EFEA] shadow-[2px_2px_0px_#161514] active:scale-[0.97] transition-all cursor-pointer flex items-center justify-center"
              >
                <RotateCcw className="size-4" />
              </Button>
            </>
          )}
        </div>

        {/* Compact Subject & Topic Configuration Row */}
        <div className="grid grid-cols-2 gap-2 text-left pt-1 border-t border-[#161514]/10">
          <div>
            <label className="text-[10px] font-heading font-extrabold uppercase text-[#161514]/70 block mb-1">
              Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => onChangeSubject(e.target.value)}
              className="w-full text-xs font-bold px-2 py-1.5 min-h-[36px] rounded-lg border-2 border-[#161514] bg-white outline-none cursor-pointer shadow-[1px_1px_0px_#161514] focus:ring-1 focus:ring-[#161514]"
            >
              <option value="">General Focus</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-heading font-extrabold uppercase text-[#161514]/70 block mb-1">
              Topic
            </label>
            <select
              value={selectedTopicId}
              onChange={(e) => onChangeTopic(e.target.value)}
              className="w-full text-xs font-bold px-2 py-1.5 min-h-[36px] rounded-lg border-2 border-[#161514] bg-white outline-none cursor-pointer shadow-[1px_1px_0px_#161514] focus:ring-1 focus:ring-[#161514]"
            >
              <option value="">Current Topic</option>
              {filteredTopics.map((top) => (
                <option key={top.id} value={top.id}>
                  {top.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
