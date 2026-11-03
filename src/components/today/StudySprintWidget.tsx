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
        "bg-white dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] p-5 rounded-xl flex flex-col justify-between space-y-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E8E5DF] dark:border-[#383531] pb-3">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-[#F1EFEA] dark:bg-[#252321] flex items-center justify-center text-[#161514] dark:text-[#C084FC] border border-[#E8E5DF] dark:border-[#383531]">
            <GraduationCap className="size-3.5 stroke-[1.5]" />
          </div>
          <h2 className="font-sans font-semibold text-[15px] text-[#161514] dark:text-[#FAF8F5] tracking-tight">
            Study Focus
          </h2>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-medium text-[#161514] dark:text-[#FAF8F5] tabular-nums">
            {todayStudyHours}h / 4.0h
          </span>
          <span className="block text-xs text-[#6B6B6B] dark:text-[#A8A29E] tabular-nums">
            {studyCompletionPercent}% daily goal
          </span>
        </div>
      </div>

      {/* Target Progress Bar */}
      <div className="w-full bg-[#E8E5DF] dark:bg-[#383531] rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-[#03D26F] h-full transition-all duration-300"
          style={{ width: `${studyCompletionPercent}%` }}
        />
      </div>

      {/* Stopwatch Tactical Card (One Craft Moment) */}
      <div className="flex-1 p-4 sm:p-5 rounded-xl bg-[#FBF9F5] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531] text-center flex flex-col justify-between space-y-3">
        {/* Step 1: Compact Subject & Topic Configuration Row (Context First) */}
        <div className="grid grid-cols-2 gap-2 text-left pb-2.5 border-b border-[#E8E5DF] dark:border-[#383531]">
          <div>
            <label className="text-[11px] font-medium text-[#6B6B6B] dark:text-[#A8A29E] block mb-1">
              Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => onChangeSubject(e.target.value)}
              className="w-full text-xs font-normal px-2.5 py-1.5 min-h-[36px] rounded-lg border border-[#E8E5DF] dark:border-[#383531] bg-white dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] outline-none cursor-pointer focus:border-[#161514] dark:focus:border-[#FAF8F5]"
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
            <label className="text-[11px] font-medium text-[#6B6B6B] dark:text-[#A8A29E] block mb-1">
              Topic
            </label>
            <select
              value={selectedTopicId}
              onChange={(e) => onChangeTopic(e.target.value)}
              disabled={!selectedSubjectId}
              className="w-full text-xs font-normal px-2.5 py-1.5 min-h-[36px] rounded-lg border border-[#E8E5DF] dark:border-[#383531] bg-white dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] outline-none cursor-pointer focus:border-[#161514] dark:focus:border-[#FAF8F5] disabled:opacity-50"
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

        {/* Step 2: Big Stopwatch Display */}
        <div className="my-auto py-2">
          <div className="font-mono font-bold text-3xl sm:text-4xl lg:text-5xl tracking-widest text-[#161514] dark:text-[#FAF8F5] tabular-nums">
            {formatTimer(stopwatchSeconds)}
          </div>
        </div>

        {/* Step 3: Primary Action Controls */}
        <div className="flex items-center justify-center gap-2 pt-0.5">
          <Button
            onClick={onToggleTimer}
            className={cn(
              'flex-1 min-h-[40px] font-medium text-xs rounded-lg active:translate-y-px transition-colors cursor-pointer',
              isTimerRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-[#161514] dark:bg-[#CEF431] hover:bg-[#252321] dark:hover:bg-[#b5da28] text-white dark:text-[#161514] font-heading font-black'
            )}
          >
            {isTimerRunning ? (
              <>
                <span className="inline-block size-2 rounded-full bg-white mr-1" />
                <Pause className="size-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="size-3.5 fill-current" />
                <span>Start Focus</span>
              </>
            )}
          </Button>

          {stopwatchSeconds > 0 && (
            <>
              <Button
                variant="secondary"
                onClick={onSaveSession}
                className="flex-1 min-h-[40px] font-medium text-xs rounded-lg bg-[#03D26F] hover:bg-[#02B860] text-white active:translate-y-px transition-colors cursor-pointer"
              >
                <Check className="size-3.5 stroke-[2]" />
                <span>Log Session</span>
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={onResetTimer}
                aria-label="Reset Timer"
                className="min-h-[40px] min-w-[40px] border border-[#E8E5DF] dark:border-[#383531] bg-white dark:bg-[#1C1A18] hover:bg-[#F5F3EF] dark:hover:bg-[#2A2724] rounded-lg text-[#161514] dark:text-[#FAF8F5] active:translate-y-px transition-colors cursor-pointer flex items-center justify-center"
              >
                <RotateCcw className="size-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
