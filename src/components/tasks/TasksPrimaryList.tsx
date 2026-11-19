"use client";

import React, { useState, useMemo } from "react";
import { TaskItem } from "@/types";
import {
  CheckCircle2,
  Circle,
  Flame,
  Calendar,
  Clock,
  Search,
  Filter,
  Plus,
  ChevronDown,
  ChevronUp,
  Tag,
  CheckSquare,
  Sparkles,
  Edit3,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

export interface TasksPrimaryListProps {
  tasks: TaskItem[];
  onUpdateTask: (id: string, updates: Partial<TaskItem>) => void;
  onDeleteTask: (id: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onEditTask: (task: TaskItem) => void;
  onOpenCreateModal?: () => void;
  showAllByDefault?: boolean;
  className?: string;
}

export function TasksPrimaryList({
  tasks,
  onUpdateTask,
  onDeleteTask,
  onToggleSubtask,
  onEditTask,
  onOpenCreateModal,
  showAllByDefault = false,
  className,
}: TasksPrimaryListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "p1" | "completed">("pending");
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [isExpanded, setIsExpanded] = useState(showAllByDefault);
  const [expandedSubtaskId, setExpandedSubtaskId] = useState<string | null>(null);

  // Extract unique project tags
  const projectTags = useMemo(() => {
    const tags = new Set<string>();
    tasks.forEach((t) => {
      if (t.projectTag) tags.add(t.projectTag);
    });
    return Array.from(tags);
  }, [tasks]);

  // Counts for filter pills
  const counts = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const pending = total - completed;
    const p1 = tasks.filter((t) => t.priority === "p1" && t.status !== "completed").length;
    return { total, completed, pending, p1 };
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const isDone = t.status === "completed";
      // Status filter
      if (statusFilter === "pending" && isDone) return false;
      if (statusFilter === "completed" && !isDone) return false;
      if (statusFilter === "p1" && (t.priority !== "p1" || isDone)) return false;

      // Project tag filter
      if (selectedTag !== "All" && t.projectTag !== selectedTag) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = (t.description || "").toLowerCase().includes(q);
        const matchesTag = (t.projectTag || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesTag) return false;
      }

      return true;
    });
  }, [tasks, statusFilter, selectedTag, searchQuery]);

  // Cap at 6 on mobile if not expanded
  const visibleTasks = isExpanded || showAllByDefault ? filteredTasks : filteredTasks.slice(0, 6);
  const hasHiddenTasks = !showAllByDefault && filteredTasks.length > 6;

  const priorityConfig = {
    p1: { label: "P1", color: "bg-rose-500 text-white border-rose-600", icon: Flame },
    p2: { label: "P2", color: "bg-amber-400 text-[#161514] border-amber-500", icon: Calendar },
    p3: { label: "P3", color: "bg-yellow-300 text-[#161514] border-yellow-400", icon: Clock },
    p4: { label: "P4", color: "bg-sky-200 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-300", icon: Clock },
  };

  const handleToggleTask = (task: TaskItem) => {
    const isDone = task.status === "completed";
    soundFX.playPop();
    soundFX.vibrate(20);
    onUpdateTask(task.id, {
      status: isDone ? "todo" : "completed",
      completedAt: isDone ? undefined : new Date().toISOString(),
    });
  };

  return (
    <div className={cn("w-full space-y-3 select-none", className)}>
      {/* Search & Filter Strip */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, notes, or tags..."
              className="w-full bg-card rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#CEF431] shadow-2xs transition-all"
            />
          </div>

          {/* Quick Tag Filter if any */}
          {projectTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => {
                soundFX.playPop();
                setSelectedTag(e.target.value);
              }}
              className="h-8 px-2 text-[11px] font-mono font-bold bg-card border border-border rounded-xl text-foreground cursor-pointer focus:outline-none shadow-2xs"
            >
              <option value="All">All Streams</option>
              {projectTags.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setStatusFilter("pending");
            }}
            className={cn(
              "px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 shrink-0",
              statusFilter === "pending"
                ? "bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] font-black shadow-2xs"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <span>To Do</span>
            <span className="opacity-80">({counts.pending})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setStatusFilter("p1");
            }}
            className={cn(
              "px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 shrink-0",
              statusFilter === "p1"
                ? "bg-rose-500 text-white font-black shadow-2xs"
                : "text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
            )}
          >
            <Flame className="size-3" />
            <span>P1 Urgent</span>
            <span className="opacity-80">({counts.p1})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setStatusFilter("all");
            }}
            className={cn(
              "px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 shrink-0",
              statusFilter === "all"
                ? "bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] font-black shadow-2xs"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <span>All</span>
            <span className="opacity-80">({counts.total})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setStatusFilter("completed");
            }}
            className={cn(
              "px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 shrink-0",
              statusFilter === "completed"
                ? "bg-emerald-600 text-white font-black shadow-2xs"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <span>Done</span>
            <span className="opacity-80">({counts.completed})</span>
          </button>
        </div>
      </div>

      {/* Task Rows List */}
      <div className="space-y-1.5">
        {filteredTasks.length === 0 ? (
          <div className="p-6 rounded-2xl bg-card border border-dashed border-border text-center space-y-1.5">
            <CheckSquare className="size-6 text-muted-foreground mx-auto stroke-[1.5]" />
            <p className="text-xs font-black text-foreground uppercase tracking-wider font-heading">
              No tasks found
            </p>
            <p className="text-[11px] text-muted-foreground">
              {searchQuery ? "Try clearing search or filters" : "You're all caught up! Great work."}
            </p>
          </div>
        ) : (
          visibleTasks.map((task) => {
            const isDone = task.status === "completed";
            const prio = priorityConfig[task.priority] || priorityConfig.p3;
            const PrioIcon = prio.icon;
            const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
            const hasSubtasks = task.subtasks.length > 0;
            const isSubtasksOpen = expandedSubtaskId === task.id;

            return (
              <div
                key={task.id}
                className={cn(
                  "rounded-xl border transition-all shadow-2xs group overflow-hidden",
                  isDone
                    ? "bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-500/20"
                    : "bg-card border-border hover:border-[#161514]/30 dark:hover:border-[#FAF8F5]/30"
                )}
              >
                {/* Main 56-64px single-line row */}
                <div className="px-3 py-2.5 flex items-center justify-between gap-2.5 min-h-[56px]">
                  {/* Left: 24px Physical Tactile Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task)}
                    className={cn(
                      "size-6 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-90 shadow-xs",
                      isDone
                        ? "bg-[#03D26F] text-[#161514] border-[#161514] dark:border-[#03D26F]"
                        : "bg-white dark:bg-[#252321] border-[#161514] dark:border-[#FAF8F5]/40 hover:bg-[#FAF8F5]"
                    )}
                    aria-label={`Mark "${task.title}" as ${isDone ? "incomplete" : "complete"}`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="size-4 stroke-[3]" />
                    ) : (
                      <Circle className="size-3.5 opacity-20" />
                    )}
                  </button>

                  {/* Middle: Title & Meta Info */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onEditTask(task)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "text-xs sm:text-sm font-heading font-black tracking-tight text-foreground truncate",
                          isDone && "line-through opacity-50"
                        )}
                      >
                        {task.title}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      {/* Priority pill */}
                      <span
                        className={cn(
                          "text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border flex items-center gap-0.5",
                          prio.color
                        )}
                      >
                        <PrioIcon className="size-2.5" />
                        {prio.label}
                      </span>

                      {/* Project Tag */}
                      {task.projectTag && (
                        <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border">
                          #{task.projectTag}
                        </span>
                      )}

                      {/* Due Date */}
                      {task.dueDate && (
                        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-0.5">
                          <Clock className="size-2.5" />
                          {task.dueDate}
                        </span>
                      )}

                      {/* Subtasks trigger pill */}
                      {hasSubtasks && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            soundFX.playPop();
                            setExpandedSubtaskId(isSubtasksOpen ? null : task.id);
                          }}
                          className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 hover:bg-sky-500/20 transition-colors flex items-center gap-0.5"
                        >
                          <span>
                            {completedSubtasks}/{task.subtasks.length}
                          </span>
                          {isSubtasksOpen ? (
                            <ChevronUp className="size-2.5" />
                          ) : (
                            <ChevronDown className="size-2.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick Edit / Delete */}
                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onEditTask(task)}
                      className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Edit Task"
                      aria-label="Edit Task"
                    >
                      <Edit3 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playPop();
                        onDeleteTask(task.id);
                      }}
                      className="size-7 rounded-lg hover:bg-rose-500/10 flex items-center justify-center text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                      title="Delete Task"
                      aria-label="Delete Task"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Inline Subtasks Accordion */}
                {hasSubtasks && isSubtasksOpen && (
                  <div className="px-3 pb-2.5 pt-1 border-t border-border/60 bg-muted/30 space-y-1 text-xs">
                    {task.subtasks.map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => onToggleSubtask?.(task.id, sub.id)}
                        className="flex items-center gap-2 py-1 px-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
                      >
                        <div
                          className={cn(
                            "size-4 rounded border flex items-center justify-center shrink-0",
                            sub.completed
                              ? "bg-[#03D26F] text-[#161514] border-[#03D26F]"
                              : "border-border bg-card"
                          )}
                        >
                          {sub.completed && <CheckCircle2 className="size-3 stroke-[3]" />}
                        </div>
                        <span
                          className={cn(
                            "font-medium text-foreground text-xs",
                            sub.completed && "line-through opacity-50"
                          )}
                        >
                          {sub.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Show All Toggle for Mobile Budget */}
      {hasHiddenTasks && (
        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            setIsExpanded(!isExpanded);
          }}
          className="w-full py-2 px-3 rounded-xl bg-card border border-border text-xs font-heading font-black text-foreground hover:bg-muted flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
        >
          <span>
            {isExpanded
              ? "Collapse to Top Priorities"
              : `Show All (${filteredTasks.length} Tasks)`}
          </span>
          {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      )}
    </div>
  );
}
