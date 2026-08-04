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

const COLUMNS: { id: TaskItem["status"]; title: string; icon: string; headerBg: string }[] = [
  { id: "todo", title: "⏳ To Do", icon: "⏳", headerBg: "bg-[#FFF9EA]" },
  { id: "in_progress", title: "⚡ In Progress", icon: "⚡", headerBg: "bg-[#CEF431]" },
  { id: "review", title: "👀 Under Review", icon: "👀", headerBg: "bg-[#C084FC] text-white" },
  { id: "completed", title: "✅ Completed", icon: "✅", headerBg: "bg-[#03D26F]" },
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
    p1: { label: "P1 Urgent 🔥", badge: "bg-rose-500 text-white border-[#161514]" },
    p2: { label: "P2 High 🟠", badge: "bg-amber-400 text-[#161514] border-[#161514]" },
    p3: { label: "P3 Medium 🟡", badge: "bg-yellow-300 text-[#161514] border-[#161514]" },
    p4: { label: "P4 Low 🔵", badge: "bg-sky-300 text-[#161514] border-[#161514]" },
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
          <h3 className="text-base font-black text-[#161514] uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
            <CheckSquare className="h-5 w-5 text-[#F59E0B]" /> Production Kanban Board
          </h3>
          <p className="text-xs font-bold text-[#161514]/70">
            Drag cards or click arrows to move tasks across workflow columns.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="bg-[#F59E0B] hover:bg-[#d98206] text-white border-2 border-[#161514] px-4 py-2 rounded-2xl text-xs font-black shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 uppercase tracking-wider"
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
              className="bg-[#FAF8F5] rounded-3xl p-3.5 border-2.5 border-[#161514] shadow-[4px_4px_0px_0px_rgba(22,21,20,1)] space-y-3 min-h-[420px] flex flex-col justify-between"
            >
              <div>
                {/* Column Header */}
                <div
                  className={cn(
                    "p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] flex items-center justify-between mb-3",
                    col.headerBg
                  )}
                >
                  <span className="text-xs font-black uppercase tracking-wider truncate">
                    {col.title}
                  </span>
                  <span className="bg-[#161514] text-white text-[10px] font-black px-2 py-0.5 rounded-lg border border-[#161514]">
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3">
                  {colTasks.length === 0 ? (
                    <div className="border-2 border-dashed border-[#161514]/20 rounded-2xl p-6 text-center text-[11px] font-bold text-[#161514]/50 select-none">
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
                          className="bg-white rounded-2xl p-3.5 border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] space-y-2.5 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing group"
                        >
                          {/* Top Badges */}
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <span
                              className={cn(
                                "text-[9px] font-black px-2 py-0.5 rounded-lg border shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]",
                                prio.badge
                              )}
                            >
                              {prio.label}
                            </span>

                            <span className="bg-[#CEF431] text-[#161514] text-[9px] font-black px-2 py-0.5 rounded-lg border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]">
                              #{task.projectTag}
                            </span>
                          </div>

                          {/* Task Title & Description */}
                          <div>
                            <h4
                              className={cn(
                                "text-xs sm:text-sm font-black text-[#161514] tracking-tight leading-tight",
                                task.status === "completed" && "line-through opacity-60"
                              )}
                            >
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-[10px] font-bold text-[#161514]/70 mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Subtasks Progress */}
                          {task.subtasks.length > 0 && (
                            <div className="bg-[#FAF8F5] p-2 rounded-xl border border-[#161514]/20 space-y-1">
                              <div className="flex items-center justify-between text-[9px] font-black text-[#161514]">
                                <span>Checklist ({doneSubtasks}/{task.subtasks.length})</span>
                                <span>{Math.round((doneSubtasks / task.subtasks.length) * 100)}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-200 rounded-full border border-[#161514]/30 overflow-hidden">
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
                                    className="flex items-center gap-1.5 text-[10px] font-bold text-[#161514] hover:text-emerald-700 w-full text-left cursor-pointer"
                                  >
                                    <span
                                      className={cn(
                                        "h-3 w-3 rounded-md border border-[#161514] flex items-center justify-center shrink-0",
                                        st.completed ? "bg-[#03D26F] text-[#161514]" : "bg-white"
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
                          <div className="flex items-center justify-between pt-1 border-t border-[#161514]/15">
                            {/* Due Date Indicator */}
                            {task.dueDate ? (
                              <span className="text-[9px] font-black text-[#161514]/80 flex items-center gap-1">
                                <Clock className="h-3 w-3 text-amber-600" />
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
                                  className="p-1 bg-white hover:bg-cream-bg text-[#161514] border border-[#161514] rounded-lg shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] cursor-pointer"
                                  title="Move Left"
                                >
                                  <ChevronLeft className="h-3 w-3 stroke-[3]" />
                                </button>
                              )}
                              {task.status !== "completed" && (
                                <button
                                  type="button"
                                  onClick={() => moveColumn(task, "next")}
                                  className="p-1 bg-white hover:bg-cream-bg text-[#161514] border border-[#161514] rounded-lg shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] cursor-pointer"
                                  title="Move Right"
                                >
                                  <ChevronRight className="h-3 w-3 stroke-[3]" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => onEditTask(task)}
                                className="p-1 bg-amber-200 hover:bg-amber-300 text-[#161514] border border-[#161514] rounded-lg shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] cursor-pointer"
                                title="Edit Task"
                              >
                                <Edit3 className="h-3 w-3 stroke-[2.5]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteTask(task.id)}
                                className="p-1 bg-rose-200 hover:bg-rose-300 text-rose-900 border border-[#161514] rounded-lg shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] cursor-pointer"
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
                className="w-full mt-3 p-2 bg-white hover:bg-[#CEF431] text-[#161514] border-2 border-[#161514] rounded-2xl text-xs font-black shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] transition-all cursor-pointer flex items-center justify-center gap-1 uppercase tracking-wider"
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
