"use client";

import { useState } from "react";
import { TaskItem, Subtask } from "@/types";
import { CheckSquare, Search, Filter, Plus, Clock, Tag, Edit3, Trash2, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskListWidgetProps {
  tasks: TaskItem[];
  onUpdateTask: (id: string, updates: Partial<TaskItem>) => void;
  onDeleteTask: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onEditTask: (task: TaskItem) => void;
  onOpenCreateModal: () => void;
}

export function TaskListWidget({
  tasks,
  onUpdateTask,
  onDeleteTask,
  onToggleSubtask,
  onEditTask,
  onOpenCreateModal,
}: TaskListWidgetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [selectedPriority, setSelectedPriority] = useState<string>("All");

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === "All" || t.projectTag === selectedTag;
    const matchesPriority = selectedPriority === "All" || t.priority === selectedPriority;
    return matchesSearch && matchesTag && matchesPriority;
  });

  const priorityBadges = {
    p1: "bg-rose-500/15 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-500/30",
    p2: "bg-amber-500/15 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-500/30",
    p3: "bg-yellow-500/15 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-400 border border-yellow-500/30",
    p4: "bg-sky-500/15 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border border-sky-500/30",
  };

  return (
    <div className="bg-white dark:bg-[#1C1A18] rounded-2xl p-4 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E5DF] dark:border-[#2A2724] pb-4">
        <div>
          <h3 className="text-base font-black text-[#161514] dark:text-[#FAF8F5] uppercase tracking-wider flex items-center gap-2 font-heading">
            <CheckSquare className="h-5 w-5 text-[#F59E0B]" /> Task List & Checklist Engine
          </h3>
          <p className="text-xs font-medium text-[#161514]/70 dark:text-[#FAF8F5]/70">
            Search, filter by priority or project label, and check off items.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="bg-[#CEF431] hover:bg-[#bce028] text-[#161514] border border-[#CEF431] px-4 py-2 rounded-xl text-xs font-black shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 uppercase tracking-wider"
        >
          <Plus className="h-4 w-4 stroke-[3]" /> Add Task
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#161514]/40 dark:text-[#FAF8F5]/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search task title, notes, or tags..."
            className="w-full bg-[#FAF8F5] dark:bg-[#252321] rounded-xl pl-9 pr-3 py-2.5 border border-[#E8E5DF] dark:border-[#2A2724] text-xs font-medium text-[#161514] dark:text-[#FAF8F5] placeholder:text-[#161514]/40 dark:placeholder:text-[#FAF8F5]/30 shadow-xs focus:ring-1 focus:ring-[#CEF431] outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {["All", "p1", "p2", "p3", "p4"].map((prio) => (
            <button
              key={prio}
              type="button"
              onClick={() => setSelectedPriority(prio)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold border shadow-xs transition-all cursor-pointer uppercase shrink-0",
                selectedPriority === prio
                  ? "bg-[#161514] dark:bg-[#FAF8F5] text-white dark:text-[#161514] border-[#161514] dark:border-[#FAF8F5]"
                  : "bg-white dark:bg-[#1C1A18] text-[#161514]/70 dark:text-[#FAF8F5]/70 hover:bg-[#FAF8F5] dark:hover:bg-[#252321] border-[#E8E5DF] dark:border-[#2A2724]"
              )}
            >
              {prio === "All" ? "All Prio" : prio.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Task Rows List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="bg-[#FAF8F5] dark:bg-[#252321] rounded-xl p-8 border border-dashed border-[#E8E5DF] dark:border-[#2A2724] text-center space-y-2">
            <p className="text-xs font-black text-[#161514]/60 dark:text-[#FAF8F5]/60 uppercase tracking-wider font-heading">No Tasks Found</p>
            <p className="text-[11px] font-medium text-[#161514]/50 dark:text-[#FAF8F5]/50">
              Create your first task or clear your search filters.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === "completed";
            const doneSubtasks = task.subtasks.filter((s) => s.completed).length;

            return (
              <div
                key={task.id}
                className={cn(
                  "p-3.5 rounded-xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:-translate-y-0.5",
                  isDone
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/20"
                    : "bg-white dark:bg-[#1C1A18] border-[#E8E5DF] dark:border-[#2A2724]"
                )}
              >
                {/* Left Side: Checkbox & Info */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateTask(task.id, {
                        status: isDone ? "todo" : "completed",
                        completedAt: isDone ? undefined : new Date().toISOString(),
                      })
                    }
                    className={cn(
                      "mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer shadow-xs transition-all",
                      isDone
                        ? "bg-[#03D26F] text-[#161514] border-[#03D26F]"
                        : "bg-white dark:bg-[#252321] border-[#E8E5DF] dark:border-[#2A2724] hover:bg-[#FAF8F5] dark:hover:bg-[#2F2C29]"
                    )}
                  >
                    {isDone ? <CheckCircle2 className="h-3.5 w-3.5 stroke-[3]" /> : <Circle className="h-3.5 w-3.5 opacity-30" />}
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-md", priorityBadges[task.priority])}>
                        {task.priority.toUpperCase()}
                      </span>
                      <span className="bg-[#CEF431]/20 dark:bg-[#CEF431]/10 text-[#161514] dark:text-[#FAF8F5] text-[9px] font-black px-2 py-0.5 rounded-md border border-[#CEF431]/30">
                        #{task.projectTag}
                      </span>
                      {task.dueDate && (
                        <span className="text-[9px] font-bold text-[#161514] dark:text-[#FAF8F5]/80 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" /> {task.dueDate}
                        </span>
                      )}
                    </div>

                    <h4 className={cn("text-xs sm:text-sm font-black text-[#161514] dark:text-[#FAF8F5] tracking-tight leading-tight", isDone && "line-through opacity-60")}>
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-[11px] font-medium text-[#161514]/70 dark:text-[#FAF8F5]/70 line-clamp-1">
                        {task.description}
                      </p>
                    )}

                    {/* Subtasks pill overview */}
                    {task.subtasks.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1 text-[10px] font-bold text-[#161514]/60 dark:text-[#FAF8F5]/60">
                        <span>Checklist: {doneSubtasks}/{task.subtasks.length} done</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8E5DF] dark:border-[#2A2724]">
                  <button
                    type="button"
                    onClick={() => onEditTask(task)}
                    className="bg-amber-400/20 dark:bg-amber-400/10 hover:bg-amber-400/30 text-amber-900 dark:text-amber-200 border border-amber-400/30 px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center gap-1 transition-all"
                  >
                    <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" /> Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteTask(task.id)}
                    className="bg-rose-500/15 dark:bg-rose-950/30 hover:bg-rose-500/25 text-rose-700 dark:text-rose-400 border border-rose-500/30 px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center gap-1 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" /> Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
