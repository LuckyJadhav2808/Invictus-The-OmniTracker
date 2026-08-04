"use client";

import { TaskItem } from "@/types";
import { Flame, Calendar, Users, Trash, CheckSquare, Plus } from "lucide-react";
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
      title: "DO FIRST (Urgent & Important)",
      badge: "P1 🔥",
      color: "bg-rose-50 border-rose-950 text-rose-950",
      headerBg: "bg-rose-500 text-white",
      filterFn: (t: TaskItem) => t.priority === "p1" && t.status !== "completed",
    },
    {
      id: "p2",
      title: "SCHEDULE (Important, Not Urgent)",
      badge: "P2 📅",
      color: "bg-amber-50 border-amber-950 text-amber-950",
      headerBg: "bg-amber-400 text-[#161514]",
      filterFn: (t: TaskItem) => t.priority === "p2" && t.status !== "completed",
    },
    {
      id: "p3",
      title: "DELEGATE (Urgent, Not Important)",
      badge: "P3 ⚡",
      color: "bg-yellow-50 border-yellow-950 text-yellow-950",
      headerBg: "bg-yellow-300 text-[#161514]",
      filterFn: (t: TaskItem) => t.priority === "p3" && t.status !== "completed",
    },
    {
      id: "p4",
      title: "DONT DO / LOW (Low Priority)",
      badge: "P4 🔵",
      color: "bg-sky-50 border-sky-950 text-sky-950",
      headerBg: "bg-sky-300 text-[#161514]",
      filterFn: (t: TaskItem) => t.priority === "p4" && t.status !== "completed",
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 border-2.5 border-[#161514] shadow-[4px_4px_0px_0px_rgba(22,21,20,1)] space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#161514]/15 pb-4">
        <div>
          <h3 className="text-base font-black text-[#161514] uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
            <Flame className="h-5 w-5 text-rose-500" /> Eisenhower Priority Matrix
          </h3>
          <p className="text-xs font-bold text-[#161514]/70">
            Categorizes tasks by urgency & impact to maximize productivity flow.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="bg-[#F59E0B] hover:bg-[#d98206] text-white border-2 border-[#161514] px-4 py-2 rounded-2xl text-xs font-black shadow-[2.5px_2.5px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 uppercase tracking-wider"
        >
          <Plus className="h-4 w-4 stroke-[3]" /> Add Task
        </button>
      </div>

      {/* 4 Quadrants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quadrants.map((q) => {
          const qTasks = tasks.filter(q.filterFn);

          return (
            <div
              key={q.id}
              className={cn("rounded-3xl p-4 border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] space-y-3 min-h-[220px]", q.color)}
            >
              {/* Quadrant Header */}
              <div className={cn("p-2.5 rounded-2xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] flex items-center justify-between", q.headerBg)}>
                <span className="text-xs font-black uppercase tracking-wider">{q.title}</span>
                <span className="bg-[#161514] text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                  {qTasks.length}
                </span>
              </div>

              {/* Quadrant Task Items */}
              <div className="space-y-2">
                {qTasks.length === 0 ? (
                  <p className="text-[11px] font-bold opacity-60 text-center py-6">
                    No active tasks in this quadrant.
                  </p>
                ) : (
                  qTasks.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white rounded-xl p-2.5 border-1.5 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-black text-[#161514] block truncate">{t.title}</span>
                        {t.dueDate && (
                          <span className="text-[9px] font-bold text-[#161514]/70">Due: {t.dueDate}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onUpdateTask(t.id, { status: "completed", completedAt: new Date().toISOString() })}
                        className="bg-[#03D26F] hover:bg-emerald-500 text-[#161514] border border-[#161514] px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer shrink-0"
                      >
                        Done ✅
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
