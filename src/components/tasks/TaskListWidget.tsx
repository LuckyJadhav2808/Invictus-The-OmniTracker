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
    p1: "bg-rose-500 text-white",
    p2: "bg-amber-400 text-[#161514]",
    p3: "bg-yellow-300 text-[#161514]",
    p4: "bg-sky-300 text-[#161514]",
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 border-2.5 border-[#161514] shadow-[4px_4px_0px_0px_rgba(22,21,20,1)] space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#161514]/15 pb-4">
        <div>
          <h3 className="text-base font-black text-[#161514] uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
            <CheckSquare className="h-5 w-5 text-[#F59E0B]" /> Task List & Checklist Engine
          </h3>
          <p className="text-xs font-bold text-[#161514]/70">
            Search, filter by priority or project label, and check off items.
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

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#161514]/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search task title, notes, or tags..."
            className="w-full bg-[#FAF8F5] rounded-2xl pl-9 pr-3 py-2 border-2 border-[#161514] text-xs font-bold text-[#161514] outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {["All", "p1", "p2", "p3", "p4"].map((prio) => (
            <button
              key={prio}
              type="button"
              onClick={() => setSelectedPriority(prio)}
              className={cn(
                "px-2.5 py-1 rounded-xl text-[10px] font-black border border-[#161514] transition-all cursor-pointer uppercase shrink-0",
                selectedPriority === prio
                  ? "bg-[#161514] text-white shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]"
                  : "bg-white text-[#161514]/70 hover:bg-cream-bg"
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
          <div className="bg-[#FAF8F5] rounded-2xl p-8 border-2 border-dashed border-[#161514]/20 text-center space-y-2">
            <p className="text-xs font-black text-[#161514]/60 uppercase tracking-wider">No Tasks Found</p>
            <p className="text-[11px] font-bold text-[#161514]/50">
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
                  "p-3.5 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5",
                  isDone ? "bg-emerald-50/60" : "bg-white"
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
                      "mt-0.5 h-5 w-5 rounded-lg border-2 border-[#161514] flex items-center justify-center shrink-0 cursor-pointer shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] transition-all",
                      isDone ? "bg-[#03D26F] text-[#161514]" : "bg-white hover:bg-amber-100"
                    )}
                  >
                    {isDone ? <CheckCircle2 className="h-3.5 w-3.5 stroke-[3]" /> : <Circle className="h-3.5 w-3.5 opacity-30" />}
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-md border border-[#161514]", priorityBadges[task.priority])}>
                        {task.priority.toUpperCase()}
                      </span>
                      <span className="bg-[#CEF431] text-[#161514] text-[9px] font-black px-2 py-0.5 rounded-md border border-[#161514]">
                        #{task.projectTag}
                      </span>
                      {task.dueDate && (
                        <span className="text-[9px] font-bold text-[#161514]/70 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-amber-600" /> {task.dueDate}
                        </span>
                      )}
                    </div>

                    <h4 className={cn("text-xs sm:text-sm font-black text-[#161514] tracking-tight", isDone && "line-through opacity-60")}>
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-[11px] font-bold text-[#161514]/70 line-clamp-1">
                        {task.description}
                      </p>
                    )}

                    {/* Subtasks pill overview */}
                    {task.subtasks.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1 text-[10px] font-bold text-[#161514]/70">
                        <span>Checklist: {doneSubtasks}/{task.subtasks.length} done</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#161514]/15">
                  <button
                    type="button"
                    onClick={() => onEditTask(task)}
                    className="bg-amber-100 hover:bg-amber-200 text-[#161514] border border-[#161514] px-2.5 py-1 rounded-xl text-xs font-black shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" /> Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteTask(task.id)}
                    className="bg-rose-100 hover:bg-rose-200 text-rose-900 border border-[#161514] px-2.5 py-1 rounded-xl text-xs font-black shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] cursor-pointer flex items-center gap-1"
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
