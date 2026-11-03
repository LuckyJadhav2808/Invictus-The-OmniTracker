"use client";

import { useState } from "react";
import { TaskItem, Subtask } from "@/types";
import { CheckCircle2, Clock, AlertCircle, Plus, Edit3, Trash2, ChevronRight, ChevronLeft, Sparkles, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskKanbanBoardProps {
  tasks: TaskItem[];
  onUpdateTask: (id: string, updates: Partial<TaskItem>) => void;
  onDeleteTask: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onEditTask: (task: TaskItem) => void;
  onOpenCreateModal: () => void;
}

const COLUMNS: { id: TaskItem["status"]; title: string; headerBg: string }[] = [
  { id: "todo", title: "To Do", headerBg: "bg-[#FFF9EA]" },
  { id: "in_progress", title: "In Progress", headerBg: "bg-[#CEF431]" },
  { id: "review", title: "Under Review", headerBg: "bg-[#C084FC] text-white" },
  { id: "completed", title: "Completed", headerBg: "bg-[#03D26F]" },
];

export function TaskKanbanBoard({
  tasks,
  onUpdateTask,
  onDeleteTask,
  onToggleSubtask,
  onEditTask,
  onOpenCreateModal,
}: TaskKanbanBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const priorityStyles = {
    p1: { label: "P1 Urgent", badge: "bg-rose-500/15 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-500/30" },
    p2: { label: "P2 High", badge: "bg-amber-500/15 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-500/30" },
    p3: { label: "P3 Medium", badge: "bg-yellow-500/15 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-400 border border-yellow-500/30" },
    p4: { label: "P4 Low", badge: "bg-sky-500/15 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border border-sky-500/30" },
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskItem["status"]) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (taskId) {
      onUpdateTask(taskId, { status: targetStatus });
      setDraggedTaskId(null);
    }
  };

  const moveColumn = (task: TaskItem, direction: "prev" | "next") => {
    const statuses: TaskItem["status"][] = ["todo", "in_progress", "review", "completed"];
    const currentIdx = statuses.indexOf(task.status);
    let nextIdx = direction === "next" ? currentIdx + 1 : currentIdx - 1;
    if (nextIdx >= 0 && nextIdx < statuses.length) {
      onUpdateTask(task.id, { status: statuses[nextIdx] });
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-[#161514] dark:text-[#FAF8F5] uppercase tracking-wider flex items-center gap-2 font-heading">
            <CheckSquare className="h-5 w-5 text-[#F59E0B]" /> Production Kanban Board
          </h3>
          <p className="text-xs font-medium text-[#161514]/70 dark:text-[#FAF8F5]/70">
            Drag cards or click arrows to move tasks across workflow columns.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="bg-[#CEF431] hover:bg-[#bce028] text-[#161514] border border-[#CEF431] px-4 py-2.5 rounded-xl text-xs font-black shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 uppercase tracking-wider"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>New Task</span>
        </button>
      </div>

      {/* Kanban Grid (4 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="bg-[#FAF8F5] dark:bg-[#161514] rounded-2xl p-3.5 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-3 min-h-[440px] flex flex-col justify-between"
            >
              <div>
                {/* Column Header */}
                <div
                  className={cn(
                    "p-2.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center justify-between mb-3",
                    col.headerBg
                  )}
                >
                  <span className="text-xs font-black uppercase tracking-wider truncate font-heading text-[#161514]">
                    {col.title}
                  </span>
                  <span className="bg-[#161514] dark:bg-[#FAF8F5] text-white dark:text-[#161514] text-[10px] font-black px-2.5 py-0.5 rounded-lg border border-[#161514] dark:border-[#FAF8F5]">
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3">
                  {colTasks.length === 0 ? (
                    <div className="border border-dashed border-[#E8E5DF] dark:border-[#2A2724] bg-white/50 dark:bg-[#1C1A18]/40 rounded-xl p-6 text-center text-xs font-bold text-[#161514]/40 dark:text-[#FAF8F5]/40 select-none">
                      Drop tasks here
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const prio = priorityStyles[task.priority] || priorityStyles.p3;
                      const doneSubtasks = task.subtasks.filter((s) => s.completed).length;

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          className="bg-white dark:bg-[#1C1A18] rounded-xl p-3.5 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-2.5 hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing group"
                        >
                          {/* Top Badges */}
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <span
                              className={cn(
                                "text-[9px] font-bold px-2 py-0.5 rounded-md",
                                prio.badge
                              )}
                            >
                              {prio.label}
                            </span>

                            <span className="bg-[#CEF431]/20 dark:bg-[#CEF431]/10 text-[#161514] dark:text-[#FAF8F5] text-[9px] font-black px-2 py-0.5 rounded-md border border-[#CEF431]/30">
                              #{task.projectTag}
                            </span>
                          </div>

                          {/* Task Title & Description */}
                          <div>
                            <h4
                              className={cn(
                                "text-xs sm:text-sm font-black text-[#161514] dark:text-[#FAF8F5] tracking-tight leading-tight",
                                task.status === "completed" && "line-through opacity-60"
                              )}
                            >
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-[10px] font-medium text-[#161514]/70 dark:text-[#FAF8F5]/70 mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Subtasks Progress */}
                          {task.subtasks.length > 0 && (
                            <div className="bg-[#FAF8F5] dark:bg-[#252321] p-2 rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] space-y-1">
                              <div className="flex items-center justify-between text-[9px] font-black text-[#161514] dark:text-[#FAF8F5]">
                                <span>Checklist ({doneSubtasks}/{task.subtasks.length})</span>
                                <span>{Math.round((doneSubtasks / task.subtasks.length) * 100)}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-[#E8E5DF] dark:bg-[#1C1A18] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#03D26F]"
                                  style={{ width: `${(doneSubtasks / task.subtasks.length) * 100}%` }}
                                />
                              </div>

                              {/* Interactive Subtask Items */}
                              <div className="pt-1 space-y-1 max-h-24 overflow-y-auto no-scrollbar">
                                {task.subtasks.map((st) => (
                                  <button
                                    key={st.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggleSubtask(task.id, st.id);
                                    }}
                                    className="flex items-center gap-1.5 text-[10px] font-medium text-[#161514] dark:text-[#FAF8F5] hover:text-emerald-700 w-full text-left cursor-pointer"
                                  >
                                    <span
                                      className={cn(
                                        "h-3.5 w-3.5 rounded-md border flex items-center justify-center shrink-0 shadow-xs",
                                        st.completed
                                          ? "bg-[#03D26F] text-[#161514] border-[#03D26F]"
                                          : "bg-white dark:bg-[#1C1A18] border-[#E8E5DF] dark:border-[#2A2724]"
                                      )}
                                    >
                                      {st.completed && <CheckCircle2 className="h-2.5 w-2.5 stroke-[3]" />}
                                    </span>
                                    <span className={cn("truncate", st.completed && "line-through opacity-50")}>
                                      {st.title}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Footer Meta & Actions */}
                          <div className="flex items-center justify-between pt-1 border-t border-[#E8E5DF] dark:border-[#2A2724]">
                            {/* Due Date Indicator */}
                            {task.dueDate ? (
                              <span className="text-[9px] font-bold text-[#161514] dark:text-[#FAF8F5]/80 flex items-center gap-1">
                                <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                <span>{task.dueDate} {task.dueTime && `@ ${task.dueTime}`}</span>
                              </span>
                            ) : (
                              <span />
                            )}

                            {/* Card Control Buttons */}
                            <div className="flex items-center gap-1">
                              {task.status !== "todo" && (
                                <button
                                  type="button"
                                  onClick={() => moveColumn(task, "prev")}
                                  className="p-1 bg-white dark:bg-[#252321] hover:bg-[#FAF8F5] dark:hover:bg-[#2F2C29] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#2A2724] rounded-lg shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all"
                                  title="Move Left"
                                >
                                  <ChevronLeft className="h-3 w-3 stroke-[2.5]" />
                                </button>
                              )}
                              {task.status !== "completed" && (
                                <button
                                  type="button"
                                  onClick={() => moveColumn(task, "next")}
                                  className="p-1 bg-white dark:bg-[#252321] hover:bg-[#FAF8F5] dark:hover:bg-[#2F2C29] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#2A2724] rounded-lg shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all"
                                  title="Move Right"
                                >
                                  <ChevronRight className="h-3 w-3 stroke-[2.5]" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => onEditTask(task)}
                                className="p-1 bg-amber-400/20 dark:bg-amber-400/10 hover:bg-amber-400/30 text-amber-900 dark:text-amber-200 border border-amber-400/30 rounded-lg shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all"
                                title="Edit Task"
                              >
                                <Edit3 className="h-3 w-3 stroke-[2.5]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteTask(task.id)}
                                className="p-1 bg-rose-500/15 dark:bg-rose-950/30 hover:bg-rose-500/25 text-rose-700 dark:text-rose-400 border border-rose-500/30 rounded-lg shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all"
                                title="Delete Task"
                              >
                                <Trash2 className="h-3 w-3 stroke-[2.5]" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Column Footer CTA */}
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="w-full mt-3 p-2 bg-white dark:bg-[#1C1A18] hover:bg-[#CEF431] dark:hover:bg-[#CEF431] hover:text-[#161514] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#2A2724] rounded-xl text-xs font-bold shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-1 uppercase tracking-wider"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" /> Add Task
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
