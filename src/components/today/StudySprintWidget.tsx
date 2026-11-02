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
        "bg-white border border-[#E8E5DF] p-5 rounded-xl flex flex-col justify-between space-y-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E8E5DF] pb-3">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-[#F1EFEA] flex items-center justify-center text-[#161514]">
            <GraduationCap className="size-3.5 stroke-[1.5]" />
          </div>
          <h2 className="font-sans font-semibold text-[15px] text-[#161514] tracking-tight">
            Study Focus
          </h2>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-medium text-[#161514] tabular-nums">
            {todayStudyHours}h / 4.0h
          </span>
          <span className="block text-xs text-[#6B6B6B] tabular-nums">
            {studyCompletionPercent}% daily goal
          </span>
        </div>
      </div>

      {/* Target Progress Bar */}
      <div className="w-full bg-[#E8E5DF] rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-[#03D26F] h-full transition-all duration-300"
          style={{ width: `${studyCompletionPercent}%` }}
        />
      </div>

      {/* Stopwatch Tactical Card (One Craft Moment) */}
      <div className="flex-1 p-4 sm:p-5 rounded-xl bg-[#FBF9F5] border border-[#E8E5DF] text-center flex flex-col justify-between space-y-3">
        <div className="my-auto py-2">
          <div className="font-mono font-bold text-3xl sm:text-4xl lg:text-5xl tracking-widest text-[#161514] tabular-nums">
            {formatTimer(stopwatchSeconds)}
          </div>
        </div>

        {/* Primary Action Controls */}
        <div className="flex items-center justify-center gap-2 pt-0.5">
          <Button
            onClick={onToggleTimer}
            className={cn(
              'flex-1 min-h-[40px] font-medium text-xs rounded-lg active:translate-y-px transition-colors cursor-pointer',
              isTimerRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-[#161514] hover:bg-[#252321] text-white'
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
                className="min-h-[40px] min-w-[40px] border border-[#E8E5DF] bg-white hover:bg-[#F5F3EF] rounded-lg text-[#161514] active:translate-y-px transition-colors cursor-pointer flex items-center justify-center"
              >
                <RotateCcw className="size-3.5" />
              </Button>
            </>
          )}
        </div>

        {/* Compact Subject & Topic Configuration Row */}
        <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-[#E8E5DF]">
          <div>
            <label className="text-xs font-medium text-[#6B6B6B] block mb-1">
              Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => onChangeSubject(e.target.value)}
              className="w-full text-xs font-normal px-2.5 py-1.5 min-h-[36px] rounded-lg border border-[#E8E5DF] bg-white text-[#161514] outline-none cursor-pointer focus:border-[#161514]"
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
            <label className="text-xs font-medium text-[#6B6B6B] block mb-1">
              Topic
            </label>
            <select
              value={selectedTopicId}
              onChange={(e) => onChangeTopic(e.target.value)}
              className="w-full text-xs font-normal px-2.5 py-1.5 min-h-[36px] rounded-lg border border-[#E8E5DF] bg-white text-[#161514] outline-none cursor-pointer focus:border-[#161514]"
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
