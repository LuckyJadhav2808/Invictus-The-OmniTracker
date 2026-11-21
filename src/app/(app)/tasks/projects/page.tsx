"use client";

import { useState, useMemo } from "react";
import { FolderKanban, Plus } from "lucide-react";
import { SubpageLayout } from "@/components/shared/SubpageLayout";
import { useTasks, useUpdateTask, useDeleteTask, useToggleSubtask, useCreateTask } from "@/lib/queries/tasks";
import { TasksPrimaryList } from "@/components/tasks/TasksPrimaryList";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const NewTaskModal = dynamic(
  () => import("@/components/tasks/NewTaskModal").then((m) => m.NewTaskModal),
  { ssr: false }
);

export default function TasksProjectsPage() {
  const { data: tasks = [] } = useTasks();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const toggleSubtaskMutation = useToggleSubtask();
  const createTaskMutation = useCreateTask();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<any | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>("all");

  // Group tasks by project tag
  const projectTags = useMemo(() => {
    const map = new Map<string, { total: number; completed: number }>();
    tasks.forEach((t) => {
      const tag = t.projectTag || "General";
      const curr = map.get(tag) || { total: 0, completed: 0 };
      curr.total += 1;
      if (t.status === "completed") curr.completed += 1;
      map.set(tag, curr);
    });
    return Array.from(map.entries()).map(([name, stats]) => ({
      name,
      ...stats,
      pct: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    }));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (selectedTag === "all") return tasks;
    return tasks.filter((t) => (t.projectTag || "General") === selectedTag);
  }, [tasks, selectedTag]);

  return (
    <SubpageLayout
      appBarTitle="Projects"
      backHref="/tasks"
      backLabel="Tasks"
      title="Project Deliverables Hub"
      badge="Streams & Tags"
      badgeColorClass="bg-sky-400/20 text-sky-700 dark:text-sky-300 border-sky-500/30"
      subtitle="Manage deliverables grouped by project tag & stream progress"
      icon={FolderKanban}
      maxWidthClass="max-w-xl lg:max-w-6xl"
      rightAction={
        <button
          type="button"
          onClick={() => {
            soundFX.playPop();
            soundFX.vibrate(15);
            setTaskToEdit(null);
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[#161514] bg-[#CEF431] text-[#161514] font-heading font-black text-xs shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
        >
          <Plus className="size-3.5 stroke-[3]" />
          <span>New Task</span>
        </button>
      }
    >
      {/* Project Tags Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedTag("all")}
          className={cn(
            "px-3 py-1.5 rounded-xl text-xs font-heading font-black border transition-all cursor-pointer shrink-0",
            selectedTag === "all"
              ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] border-[#161514] dark:border-white shadow-xs"
              : "bg-card text-muted-foreground border-border hover:text-foreground"
          )}
        >
          All Streams ({tasks.length})
        </button>
        {projectTags.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => setSelectedTag(p.name)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-heading font-black border transition-all cursor-pointer shrink-0 flex items-center gap-1.5",
              selectedTag === p.name
                ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] border-[#161514] dark:border-white shadow-xs"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            )}
          >
            <span>{p.name}</span>
            <span className="font-mono text-[10px] opacity-75">
              {p.completed}/{p.total}
            </span>
          </button>
        ))}
      </div>

      {/* Project Progress Cards Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {projectTags.map((p) => (
          <div
            key={p.name}
            onClick={() => setSelectedTag(p.name)}
            className={cn(
              "p-3.5 rounded-2xl border transition-all cursor-pointer bg-card shadow-xs space-y-2",
              selectedTag === p.name ? "border-foreground ring-2 ring-foreground/20" : "border-border hover:border-foreground/40"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-heading font-black text-xs text-foreground uppercase tracking-wider">
                {p.name}
              </span>
              <span className="font-mono text-xs font-bold text-muted-foreground">
                {p.pct}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border">
              <div
                className="h-full bg-[#03D26F] rounded-full transition-all"
                style={{ width: `${p.pct}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground block">
              {p.completed} of {p.total} completed
            </span>
          </div>
        ))}
      </div>

      {/* Filtered Tasks Stream */}
      <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-xs space-y-3">
        <h3 className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-foreground">
          {selectedTag === "all" ? "All Project Deliverables" : `${selectedTag} Tasks`} ({filteredTasks.length})
        </h3>
        <TasksPrimaryList
          tasks={filteredTasks}
          onUpdateTask={(id, updates) => updateTaskMutation.mutate({ id, updates })}
          onDeleteTask={(id) => deleteTaskMutation.mutate(id)}
          onToggleSubtask={(taskId, subtaskId) => toggleSubtaskMutation.mutate({ taskId, subtaskId })}
          onEditTask={(task) => {
            setTaskToEdit(task);
            setIsCreateModalOpen(true);
          }}
          onOpenCreateModal={() => {
            setTaskToEdit(null);
            setIsCreateModalOpen(true);
          }}
          showAllByDefault={true}
        />
      </div>

      <NewTaskModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        taskToEdit={taskToEdit}
        onSubmit={(data) => {
          if (taskToEdit) {
            updateTaskMutation.mutate({ id: taskToEdit.id, updates: data });
          } else {
            createTaskMutation.mutate(data);
          }
          setTaskToEdit(null);
        }}
      />
    </SubpageLayout>
  );
}
