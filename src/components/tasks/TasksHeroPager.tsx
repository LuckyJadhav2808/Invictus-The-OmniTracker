"use client";

import { useState } from "react";
import { CheckCircle2, Flame, Clock, Calendar, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { Hero, HeroSlide, HeroStatItem } from "@/components/shared/Hero";
import { StrobiCompanion, type StrobiState } from "@/components/mascot/StrobiCompanion";

export interface ProjectProgress {
  name: string;
  total: number;
  completed: number;
  color?: string;
}

export interface TasksHeroPagerProps {
  completedCount: number;
  totalCount: number;
  p1UrgentCount: number;
  p2ScheduleCount: number;
  inProgressCount: number;
  projects?: ProjectProgress[];
  strobiState?: StrobiState;
  onOpenNewTask?: () => void;
  className?: string;
}

export function TasksHeroPager({
  completedCount = 0,
  totalCount = 0,
  p1UrgentCount = 0,
  p2ScheduleCount = 0,
  inProgressCount = 0,
  projects = [],
  strobiState = "idle",
  onOpenNewTask,
  className,
}: TasksHeroPagerProps) {
  const [activeSlide, setActiveSlide] = useState(0);

  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const pendingCount = Math.max(0, totalCount - completedCount);

  // Top Left: Section Title & Micro Badge
  const topLeft = (
    <div className="flex items-center gap-2">
      <span className="font-heading font-black text-sm text-foreground tracking-tight">
        Tasks Velocity
      </span>
      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#FAF8F5] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#2A2724] rounded text-muted-foreground">
        {totalCount} Total
      </span>
    </div>
  );

  // Top Right: Strobi Companion only when queue is empty, else telemetry chip
  const topRight = (
    <div className="flex items-center gap-2">
      {totalCount === 0 ? (
        <StrobiCompanion
          state={strobiState}
          gear="tasks"
          size={28}
          className="cursor-pointer active:scale-90 transition-transform shrink-0"
        />
      ) : (
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#DCFAE5] text-[#047857] border border-[#047857]/20 dark:bg-emerald-950/40 dark:text-emerald-400">
          {completedCount}/{totalCount} Done
        </span>
      )}
    </div>
  );

  // Slide 0: Velocity Gauge (% Done + Circular Arc)
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (completionPercent / 100) * circumference;

  const slideVelocity = (
    <div className="w-full flex flex-col items-center justify-center py-1">
      <div className="relative flex items-center justify-center size-36 sm:size-40 select-none">
        <svg className="size-full -rotate-90" viewBox="0 0 100 100">
          {/* Background Track */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="7"
            className="text-[#E8E5DF] dark:text-[#252321]"
          />
          {/* Active Velocity Arc */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(
              "transition-all duration-700 ease-out",
              completionPercent === 100
                ? "text-[#03D26F]"
                : completionPercent >= 50
                ? "text-[#CEF431]"
                : "text-amber-500"
            )}
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-heading font-black text-4xl sm:text-5xl text-foreground tracking-tighter leading-none">
            {completionPercent}%
          </span>
          <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Resolved
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-2">
        <span className="font-mono text-xs font-semibold text-foreground">
          {completedCount} of {totalCount} completed
        </span>
        <span className="text-muted-foreground">•</span>
        <span className="font-mono text-xs font-bold text-muted-foreground">
          {pendingCount === 0 ? "All clear 🎉" : `${pendingCount} remaining`}
        </span>
      </div>
    </div>
  );

  // Slide 1: Priority Radar (P1 Urgent vs P2 Schedule vs Others)
  const slidePriorityRadar = (
    <div className="w-full flex flex-col items-center justify-center py-2 px-2 max-w-sm mx-auto">
      <div className="text-center mb-3">
        <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider block">
          Priority Distribution
        </span>
        <span className="font-heading font-black text-2xl text-foreground">
          {p1UrgentCount} High Priority
        </span>
      </div>

      {/* Priority Bar Breakdown */}
      <div className="w-full h-3 rounded-full bg-[#E8E5DF] dark:bg-[#252321] overflow-hidden flex mb-4">
        {totalCount > 0 ? (
          <>
            <div
              style={{ width: `${(p1UrgentCount / totalCount) * 100}%` }}
              className="bg-rose-500 h-full transition-all duration-500"
              title={`P1 Urgent: ${p1UrgentCount}`}
            />
            <div
              style={{ width: `${(p2ScheduleCount / totalCount) * 100}%` }}
              className="bg-amber-400 h-full transition-all duration-500"
              title={`P2 Schedule: ${p2ScheduleCount}`}
            />
            <div
              style={{
                width: `${
                  Math.max(0, totalCount - p1UrgentCount - p2ScheduleCount - completedCount) /
                  totalCount *
                  100
                }%`,
              }}
              className="bg-sky-400 h-full transition-all duration-500"
              title="Other Open Tasks"
            />
            <div
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
              title={`Done: ${completedCount}`}
            />
          </>
        ) : (
          <div className="w-full bg-muted h-full" />
        )}
      </div>

      {/* Priority Badges Row */}
      <div className="grid grid-cols-3 gap-2 w-full text-center">
        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 flex flex-col items-center">
          <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 text-xs font-bold mb-0.5">
            <Flame className="size-3" /> P1 Urgent
          </div>
          <span className="font-heading font-black text-lg text-rose-600 dark:text-rose-400">
            {p1UrgentCount}
          </span>
        </div>
        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center">
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-bold mb-0.5">
            <Calendar className="size-3" /> P2 Plan
          </div>
          <span className="font-heading font-black text-lg text-amber-600 dark:text-amber-400">
            {p2ScheduleCount}
          </span>
        </div>
        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center">
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-0.5">
            <CheckCircle2 className="size-3" /> Done
          </div>
          <span className="font-heading font-black text-lg text-emerald-600 dark:text-emerald-400">
            {completedCount}
          </span>
        </div>
      </div>
    </div>
  );

  // Slide 2: Project Deliverables Hub
  const defaultProjects: ProjectProgress[] =
    projects.length > 0
      ? projects
      : [
          { name: "Dev & Code", total: 4, completed: 3, color: "bg-sky-500" },
          { name: "Deep Study", total: 3, completed: 2, color: "bg-purple-500" },
          { name: "Life & Fitness", total: 2, completed: 1, color: "bg-emerald-500" },
        ];

  const slideProjects = (
    <div className="w-full flex flex-col items-center justify-center py-2 px-2 max-w-sm mx-auto">
      <div className="text-center mb-3">
        <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider block">
          Project Streams
        </span>
        <span className="font-heading font-black text-2xl text-foreground flex items-center justify-center gap-1.5">
          <FolderKanban className="size-5 text-sky-500" /> Active Deliverables
        </span>
      </div>

      <div className="w-full space-y-2">
        {defaultProjects.slice(0, 3).map((proj) => {
          const pct = proj.total > 0 ? Math.round((proj.completed / proj.total) * 100) : 0;
          return (
            <div
              key={proj.name}
              className="p-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span className={cn("size-2 rounded-full", proj.color || "bg-sky-500")} />
                <span className="font-medium text-foreground">{proj.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full bg-[#E8E5DF] dark:bg-[#252321] overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className="h-full bg-[#161514] dark:bg-[#FAF8F5] rounded-full"
                  />
                </div>
                <span className="font-mono font-bold text-[11px] text-muted-foreground w-7 text-right">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const slides: HeroSlide[] = [
    { id: "velocity", content: slideVelocity },
    { id: "priority", content: slidePriorityRadar },
    { id: "projects", content: slideProjects },
  ];

  // 3-Column Hairline Stats Row
  const stats: HeroStatItem[] = [
    {
      id: "resolved",
      icon: <CheckCircle2 className="size-3.5 text-emerald-500" />,
      label: "Resolved",
      value: `${completedCount}/${totalCount}`,
    },
    {
      id: "p1-urgent",
      icon: <Flame className="size-3.5 text-rose-500" />,
      label: "P1 Urgent",
      value: `${p1UrgentCount} Tasks`,
    },
    {
      id: "in-progress",
      icon: <Clock className="size-3.5 text-amber-500" />,
      label: "In Progress",
      value: `${inProgressCount} Active`,
    },
  ];

  return (
    <Hero
      variant="gauge"
      slides={slides}
      stats={stats}
      topLeft={topLeft}
      topRight={topRight}
      activeSlideIndex={activeSlide}
      onSlideChange={setActiveSlide}
      className={className}
    />
  );
}
