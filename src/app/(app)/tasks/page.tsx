"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useToggleSubtask,
} from "@/lib/queries/tasks";
import { TaskKanbanBoard } from "@/components/tasks/TaskKanbanBoard";
import { EisenhowerMatrixWidget } from "@/components/tasks/EisenhowerMatrixWidget";
import { TasksHeroPager, ProjectProgress } from "@/components/tasks/TasksHeroPager";
import { TasksDoorTileRow } from "@/components/tasks/TasksDoorTileRow";
import { TasksPrimaryList } from "@/components/tasks/TasksPrimaryList";
import { MobileAppBar } from "@/components/mobile/MobileAppBar";
import { TaskItem } from "@/types";
import {
  Flame,
  Plus,
  ArrowLeft,
  Sparkles,
  Send,
  FolderKanban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";
import { TasksCockpitSkeleton } from "@/components/shared/NeobrutalistSkeleton";
import dynamic from "next/dynamic";

const NewTaskModal = dynamic(
  () => import("@/components/tasks/NewTaskModal").then((m) => m.NewTaskModal),
  { ssr: false }
);
const DeleteConfirmationModal = dynamic(
  () =>
    import("@/components/shared/DeleteConfirmationModal").then(
      (m) => m.DeleteConfirmationModal
    ),
  { ssr: false }
);

export default function TasksPage() {
  const router = useRouter();
  const { data: tasks = [], isLoading } = useTasks();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const toggleSubtaskMutation = useToggleSubtask();

  // Mobile L2 Portal sub-view state
  const [activePortal, setActivePortal] = useState<"none" | "kanban" | "matrix" | "projects" | "archive">("none");

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);

  // Rapid Inline Task Capture State
  const [quickTitle, setQuickTitle] = useState("");
  const [quickPriority, setQuickPriority] = useState<"p1" | "p2" | "p3" | "p4">("p2");
  const [quickTag, setQuickTag] = useState("Dev");

  // Popstate history listener for native mobile back gestures + Flower Menu Listeners
  useEffect(() => {
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const action = params?.get("action");
    if (action === "new-task") {
      setTaskToEdit(null);
      setIsCreateModalOpen(true);
    } else if (action === "new-project") {
      setActivePortal("projects");
    }

    const handlePopState = (e: PopStateEvent) => {
      if (activePortal !== "none") {
        setActivePortal("none");
      }
    };
    const handleNewTaskEvent = () => {
      soundFX.playPop();
      soundFX.vibrate(15);
      setTaskToEdit(null);
      setIsCreateModalOpen(true);
    };
    const handleNewProjectEvent = () => {
      soundFX.playPop();
      soundFX.vibrate(15);
      openMobilePortal("projects");
    };

    const handleQuickWaterEvent = (e: any) => {
      const amt = e.detail?.amount || 250;
      const todayStr = new Date().toISOString().split("T")[0];
      try {
        const current = Number(localStorage.getItem(`invictus_water_${todayStr}`) || 0);
        localStorage.setItem(`invictus_water_${todayStr}`, String(current + amt));
      } catch {}
      soundFX.playSplash();
      soundFX.vibrate(20);
      toast.success(`+${amt}ml Water Logged! Hydration synced.`);
    };

    const handleOpenMatrixEvent = () => {
      openMobilePortal("matrix");
    };
    const handleOpenKanbanEvent = () => {
      openMobilePortal("kanban");
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("invictus:tasks-new-task", handleNewTaskEvent);
    window.addEventListener("invictus:tasks-new-project", handleNewProjectEvent);
    window.addEventListener("invictus:tasks-open-matrix", handleOpenMatrixEvent);
    window.addEventListener("invictus:tasks-open-kanban", handleOpenKanbanEvent);
    window.addEventListener("invictus:quick-log-water", handleQuickWaterEvent);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("invictus:tasks-new-task", handleNewTaskEvent);
      window.removeEventListener("invictus:tasks-new-project", handleNewProjectEvent);
      window.removeEventListener("invictus:tasks-open-matrix", handleOpenMatrixEvent);
      window.removeEventListener("invictus:tasks-open-kanban", handleOpenKanbanEvent);
      window.removeEventListener("invictus:quick-log-water", handleQuickWaterEvent);
    };
  }, [activePortal]);

  const openMobilePortal = (portal: "kanban" | "matrix" | "projects" | "archive") => {
    soundFX.playPop();
    soundFX.vibrate(15);
    setActivePortal(portal);
    if (typeof window !== "undefined") {
      window.history.pushState({ portal }, "");
    }
  };

  const closeMobilePortal = useCallback(() => {
    soundFX.playPop();
    setActivePortal("none");
  }, []);

  const handleCreateOrUpdateTask = (data: Omit<TaskItem, "id" | "createdAt" | "updatedAt">) => {
    if (taskToEdit) {
      updateTaskMutation.mutate({ id: taskToEdit.id, updates: data });
    } else {
      createTaskMutation.mutate(data);
    }
    setTaskToEdit(null);
  };

  const handleEditTask = (task: TaskItem) => {
    setTaskToEdit(task);
    setIsCreateModalOpen(true);
  };

  const handleDeleteTask = (id: string) => {
    setTaskToDeleteId(id);
  };

  const confirmDelete = () => {
    if (taskToDeleteId) {
      deleteTaskMutation.mutate(taskToDeleteId);
      setTaskToDeleteId(null);
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    toggleSubtaskMutation.mutate({ taskId, subtaskId });
  };

  const handleQuickTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    soundFX.playPop();
    soundFX.vibrate(20);
    createTaskMutation.mutate({
      title: quickTitle.trim(),
      priority: quickPriority,
      projectTag: quickTag,
      status: "todo",
      subtasks: [],
    });
    setQuickTitle("");
  };

  // Stats calculation
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const p1UrgentTasks = tasks.filter((t) => t.priority === "p1" && t.status !== "completed").length;
  const p2ScheduleTasks = tasks.filter((t) => t.priority === "p2" && t.status !== "completed").length;

  // Project progress breakdown
  const projectSummaries = useMemo<ProjectProgress[]>(() => {
    const map = new Map<string, { total: number; completed: number }>();
    tasks.forEach((t) => {
      const tag = t.projectTag || "General";
      const current = map.get(tag) || { total: 0, completed: 0 };
      current.total += 1;
      if (t.status === "completed") current.completed += 1;
      map.set(tag, current);
    });

    const colors = ["bg-sky-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
    let idx = 0;
    return Array.from(map.entries()).map(([name, stats]) => ({
      name,
      total: stats.total,
      completed: stats.completed,
      color: colors[idx++ % colors.length],
    }));
  }, [tasks]);

  if (isLoading) {
    return <TasksCockpitSkeleton />;
  }

  // =========================================================================
  // MOBILE L2 PORTAL VIEW (When user clicks a Door Tile on mobile)
  // =========================================================================
  if (activePortal !== "none") {
    return (
      <div className="w-full max-w-xl mx-auto min-h-screen px-2.5 py-3 safe-top-pad space-y-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] select-none">
        {/* L2 Portal Header with back button */}
        <div className="flex items-center justify-between gap-2 p-2.5 bg-card border border-border rounded-2xl shadow-2xs">
          <button
            type="button"
            onClick={closeMobilePortal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-heading font-black cursor-pointer transition-all active:scale-95 shadow-2xs"
          >
            <ArrowLeft className="size-4" />
            <span>Tasks</span>
          </button>

          <span className="font-heading font-black text-xs text-foreground uppercase tracking-wider">
            {activePortal === "kanban" && "📋 Kanban Board"}
            {activePortal === "matrix" && "🔥 Eisenhower Matrix"}
            {activePortal === "projects" && "🎯 Project Deliverables"}
            {activePortal === "archive" && "✅ Task History"}
          </span>

          <Button
            size="sm"
            onClick={() => {
              setTaskToEdit(null);
              setIsCreateModalOpen(true);
            }}
            className="h-8 px-2.5 rounded-xl bg-[#CEF431] text-[#161514] font-heading font-black text-[11px] border border-[#CEF431] shadow-2xs cursor-pointer"
          >
            <Plus className="size-3.5 stroke-[3]" />
            <span>New</span>
          </Button>
        </div>

        {/* Portal Body */}
        {activePortal === "kanban" && (
          <TaskKanbanBoard
            tasks={tasks}
            onUpdateTask={(id, updates) => updateTaskMutation.mutate({ id, updates })}
            onDeleteTask={handleDeleteTask}
            onToggleSubtask={handleToggleSubtask}
            onEditTask={handleEditTask}
            onOpenCreateModal={() => {
              setTaskToEdit(null);
              setIsCreateModalOpen(true);
            }}
          />
        )}

        {activePortal === "matrix" && (
          <EisenhowerMatrixWidget
            tasks={tasks}
            onUpdateTask={(id, updates) => updateTaskMutation.mutate({ id, updates })}
            onOpenCreateModal={() => {
              setTaskToEdit(null);
              setIsCreateModalOpen(true);
            }}
          />
        )}

        {activePortal === "projects" && (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs space-y-3">
              <h3 className="font-heading font-black text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
                <FolderKanban className="size-4 text-sky-500" /> Project Streams
              </h3>
              <div className="space-y-2.5">
                {projectSummaries.map((p) => {
                  const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
                  return (
                    <div
                      key={p.name}
                      className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-foreground">#{p.name}</span>
                        <span className="font-mono text-muted-foreground">
                          {p.completed}/{p.total} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={cn("h-full rounded-full transition-all duration-500", p.color || "bg-sky-500")}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <TasksPrimaryList
              tasks={tasks}
              onUpdateTask={(id, updates) => updateTaskMutation.mutate({ id, updates })}
              onDeleteTask={handleDeleteTask}
              onToggleSubtask={handleToggleSubtask}
              onEditTask={handleEditTask}
              showAllByDefault={true}
            />
          </div>
        )}

        {activePortal === "archive" && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-2xs">
              <span className="font-heading font-black text-xs uppercase tracking-wider text-muted-foreground">
                Archived & Completed ({completedTasks})
              </span>
            </div>
            <TasksPrimaryList
              tasks={tasks.filter((t) => t.status === "completed")}
              onUpdateTask={(id, updates) => updateTaskMutation.mutate({ id, updates })}
              onDeleteTask={handleDeleteTask}
              onToggleSubtask={handleToggleSubtask}
              onEditTask={handleEditTask}
              showAllByDefault={true}
            />
          </div>
        )}

        {/* Modals */}
        <NewTaskModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          taskToEdit={taskToEdit}
          onSubmit={handleCreateOrUpdateTask}
        />
        <DeleteConfirmationModal
          open={!!taskToDeleteId}
          onOpenChange={(open) => !open && setTaskToDeleteId(null)}
          onConfirm={confirmDelete}
          title="Delete Task"
          description="Are you sure you want to delete this task? This action cannot be undone."
        />
      </div>
    );
  }

  // =========================================================================
  // MAIN VIEW: UNIFIED STUDIO COCKPIT FLOW
  // =========================================================================
  return (
    <div className="w-full max-w-xl lg:max-w-4xl xl:max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-3 sm:space-y-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] select-none overflow-x-hidden">
      {/* ================= SLOT 1: UNIFIED APP BAR ================= */}
      <div className="-mx-2 -mt-2 sm:-mx-4 sm:-mt-4">
        <MobileAppBar
          title="Tasks"
          dueCount={p1UrgentTasks}
          dateShortLabel={`${completedTasks}/${totalTasks}`}
          onCheckAllDue={() => {
            soundFX.playPop();
            soundFX.vibrate(25);
            // Mark all pending tasks as completed
            tasks.forEach((t) => {
              if (t.status !== "completed") {
                updateTaskMutation.mutate({
                  id: t.id,
                  updates: { status: "completed", completedAt: new Date().toISOString() },
                });
              }
            });
          }}
          isAllDueCompleted={totalTasks > 0 && completedTasks === totalTasks}
        />
      </div>

      {/* ================= UNIFIED STUDIO FLOW (Universal Mobile & Desktop) ================= */}
      <div className="space-y-3 sm:space-y-4">
        {/* SLOT 3: BORDERLESS HERO CAROUSEL */}
        <TasksHeroPager
          completedCount={completedTasks}
          totalCount={totalTasks}
          p1UrgentCount={p1UrgentTasks}
          p2ScheduleCount={p2ScheduleTasks}
          inProgressCount={inProgressTasks}
          projects={projectSummaries}
          strobiState={
            p1UrgentTasks > 0
              ? "focus"
              : totalTasks > 0 && completedTasks === totalTasks
              ? "celebrate"
              : "idle"
          }
          onOpenNewTask={() => {
            setTaskToEdit(null);
            setIsCreateModalOpen(true);
          }}
        />

        {/* SLOT 4: DOOR TILE ROW (Universal 4 Tiles to Dedicated Subpages) */}
        <TasksDoorTileRow
          totalCount={totalTasks}
          completedCount={completedTasks}
          p1UrgentCount={p1UrgentTasks}
          projectsCount={projectSummaries.length}
          onOpenKanban={() => router.push("/tasks/kanban")}
          onOpenMatrix={() => router.push("/tasks/matrix")}
          onOpenProjects={() => router.push("/tasks/projects")}
          onOpenArchive={() => router.push("/tasks/archive")}
        />

        {/* RAPID INLINE TASK DOCK (Studio-Grade Linear style) */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#383531] shadow-[2.5px_2.5px_0px_0px_#161514] dark:shadow-[2.5px_2.5px_0px_0px_#000000] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-heading font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-amber-500" /> Rapid Task Dock
            </span>
            <span className="text-[9px] font-mono text-muted-foreground">↵ Enter to add</span>
          </div>

          <form onSubmit={handleQuickTaskSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="What needs to get done next?"
              className="flex-1 bg-[#FAF8F5] dark:bg-[#141312] rounded-xl px-3.5 py-2 text-xs font-bold text-[#161514] dark:text-[#FAF8F5] border-2 border-[#161514] dark:border-[#383531] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#CEF431] shadow-2xs transition-all"
            />

            <div className="flex items-center justify-between sm:justify-start gap-1.5 shrink-0">
              <div className="flex items-center gap-1">
                {(["p1", "p2", "p3", "p4"] as const).map((prio) => (
                  <button
                    key={prio}
                    type="button"
                    onClick={() => {
                      soundFX.playPop();
                      setQuickPriority(prio);
                    }}
                    className={cn(
                      "px-2 py-1 rounded-lg text-[9px] font-mono font-black border-2 cursor-pointer transition-all uppercase",
                      quickPriority === prio
                        ? "bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] border-[#161514] dark:border-[#CEF431] shadow-[1px_1px_0px_0px_#161514]"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                    )}
                  >
                    {prio}
                  </button>
                ))}
              </div>

              <select
                value={quickTag}
                onChange={(e) => setQuickTag(e.target.value)}
                className="h-8 px-2 text-[10px] font-mono font-bold bg-[#FAF8F5] dark:bg-[#252220] border-2 border-[#161514] dark:border-[#383531] rounded-lg text-[#161514] dark:text-[#FAF8F5] focus:outline-none cursor-pointer"
              >
                <option value="Dev">#Dev</option>
                <option value="Study">#Study</option>
                <option value="Life">#Life</option>
                <option value="Work">#Work</option>
              </select>

              <button
                type="submit"
                disabled={!quickTitle.trim()}
                className="h-8 px-3 rounded-lg bg-[#CEF431] hover:bg-[#bce028] text-[#161514] text-[10px] font-heading font-black uppercase tracking-wider border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer disabled:opacity-40 transition-all flex items-center gap-1"
              >
                <Send className="size-2.5 stroke-[2.5]" />
                <span>Add</span>
              </button>
            </div>
          </form>
        </div>

        {/* SLOT 5: PRIMARY TASK CHECKLIST */}
        <TasksPrimaryList
          tasks={tasks}
          onUpdateTask={(id, updates) => updateTaskMutation.mutate({ id, updates })}
          onDeleteTask={handleDeleteTask}
          onToggleSubtask={handleToggleSubtask}
          onEditTask={handleEditTask}
          onOpenCreateModal={() => {
            setTaskToEdit(null);
            setIsCreateModalOpen(true);
          }}
          showAllByDefault={false}
        />
      </div>

      {/* Task Creation & Editing Modal */}
      <NewTaskModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        taskToEdit={taskToEdit}
        onSubmit={handleCreateOrUpdateTask}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={!!taskToDeleteId}
        onOpenChange={(open) => !open && setTaskToDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
      />
    </div>
  );
}
