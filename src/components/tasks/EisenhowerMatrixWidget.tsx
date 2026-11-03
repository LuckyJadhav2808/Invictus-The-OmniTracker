"use client";

import { TaskItem } from "@/types";
import { Flame, Calendar, Users, CheckSquare, Plus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface EisenhowerMatrixWidgetProps {
  tasks: TaskItem[];
  onUpdateTask: (id: string, updates: Partial<TaskItem>) => void;
  onOpenCreateModal: () => void;
}

export function EisenhowerMatrixWidget({ tasks, onUpdateTask, onOpenCreateModal }: EisenhowerMatrixWidgetProps) {
  const quadrants = [
    {
      id: "p1",
      title: "Do First (Urgent & Important)",
      badge: "P1 Urgent",
      icon: Flame,
      color: "bg-rose-500/10 dark:bg-rose-950/20 border-rose-500/20 dark:border-rose-900/30 text-rose-950 dark:text-rose-200",
      headerBg: "bg-rose-500 text-white",
      filterFn: (t: TaskItem) => t.priority === "p1" && t.status !== "completed",
    },
    {
      id: "p2",
      title: "Schedule (Important, Not Urgent)",
      badge: "P2 Schedule",
      icon: Calendar,
      color: "bg-amber-500/10 dark:bg-amber-950/20 border-amber-500/20 dark:border-amber-900/30 text-amber-950 dark:text-amber-200",
      headerBg: "bg-amber-400 dark:bg-amber-500 text-[#161514]",
      filterFn: (t: TaskItem) => t.priority === "p2" && t.status !== "completed",
    },
    {
      id: "p3",
      title: "Delegate (Urgent, Not Important)",
      badge: "P3 Delegate",
      icon: Users,
      color: "bg-yellow-500/10 dark:bg-yellow-950/20 border-yellow-500/20 dark:border-yellow-900/30 text-yellow-950 dark:text-yellow-200",
      headerBg: "bg-yellow-300 dark:bg-yellow-400 text-[#161514]",
      filterFn: (t: TaskItem) => t.priority === "p3" && t.status !== "completed",
    },
    {
      id: "p4",
      title: "Backlog / Low (Low Priority)",
      badge: "P4 Low",
      icon: Clock,
      color: "bg-sky-500/10 dark:bg-sky-950/20 border-sky-500/20 dark:border-sky-900/30 text-sky-950 dark:text-sky-200",
      headerBg: "bg-sky-300 dark:bg-sky-400 text-[#161514]",
      filterFn: (t: TaskItem) => t.priority === "p4" && t.status !== "completed",
    },
  ];

  return (
    <div className="bg-white dark:bg-[#1C1A18] rounded-2xl p-4 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-4 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E5DF] dark:border-[#2A2724] pb-4">
        <div>
          <h3 className="text-sm sm:text-base font-black text-[#161514] dark:text-[#FAF8F5] uppercase tracking-wider flex items-center gap-2 font-heading">
            <Flame className="h-4 sm:h-5 w-4 sm:w-5 text-rose-500" /> Eisenhower Priority Matrix
          </h3>
          <p className="text-xs font-medium text-[#161514]/70 dark:text-[#FAF8F5]/70 mt-0.5">
            Categorizes tasks by urgency & impact to maximize productivity flow.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="bg-[#CEF431] hover:bg-[#bce028] text-[#161514] border border-[#161514]/20 px-3.5 py-2 rounded-xl text-xs font-black shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 uppercase tracking-wider"
        >
          <Plus className="h-4 w-4 stroke-[3]" /> Add Task
        </button>
      </div>

      {/* 4 Quadrants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quadrants.map((q) => {
          const qTasks = tasks.filter(q.filterFn);
          const QuadrantIcon = q.icon;

          return (
            <div
              key={q.id}
              className={cn("rounded-2xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-3 min-h-[220px] transition-colors", q.color)}
            >
              {/* Quadrant Header */}
              <div className={cn("p-2.5 rounded-xl border border-black/10 dark:border-white/10 shadow-xs flex items-center justify-between", q.headerBg)}>
                <span className="text-xs font-black uppercase tracking-wider font-heading flex items-center gap-1.5">
                  <QuadrantIcon className="h-3.5 w-3.5" />
                  {q.title}
                </span>
                <span className="bg-[#161514] text-white dark:bg-[#161514] dark:text-white text-[10px] font-black px-2 py-0.5 rounded-lg border border-black/20">
                  {qTasks.length}
                </span>
              </div>

              {/* Quadrant Task Items */}
              <div className="space-y-2">
                {qTasks.length === 0 ? (
                  <p className="text-[11px] font-medium opacity-60 text-center py-6 font-heading">
                    No active tasks in this quadrant.
                  </p>
                ) : (
                  qTasks.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white dark:bg-[#1C1A18] rounded-xl p-3 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center justify-between gap-2.5 hover:border-[#161514]/30 dark:hover:border-white/30 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-[#161514] dark:text-[#FAF8F5] block truncate">{t.title}</span>
                        {t.dueDate && (
                          <span className="text-[10px] font-medium text-[#161514]/60 dark:text-[#FAF8F5]/60 mt-0.5 block">Due: {t.dueDate}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onUpdateTask(t.id, { status: "completed", completedAt: new Date().toISOString() })}
                        className="bg-[#03D26F] hover:bg-[#02b35d] text-[#161514] border border-[#161514]/20 shadow-xs px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer shrink-0 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1"
                      >
                        <CheckSquare className="h-3 w-3 stroke-[2.5]" /> Done
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
