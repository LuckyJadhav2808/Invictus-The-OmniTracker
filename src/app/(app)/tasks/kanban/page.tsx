"use client";

import { useState } from "react";
import { Kanban, Plus } from "lucide-react";
import { SubpageLayout } from "@/components/shared/SubpageLayout";
import { useTasks, useUpdateTask, useDeleteTask, useToggleSubtask, useCreateTask } from "@/lib/queries/tasks";
import { TaskKanbanBoard } from "@/components/tasks/TaskKanbanBoard";
import { soundFX } from "@/components/shared/SoundFX";
import dynamic from "next/dynamic";

const NewTaskModal = dynamic(
  () => import("@/components/tasks/NewTaskModal").then((m) => m.NewTaskModal),
  { ssr: false }
);

export default function TasksKanbanPage() {
  const { data: tasks = [] } = useTasks();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const toggleSubtaskMutation = useToggleSubtask();
  const createTaskMutation = useCreateTask();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<any | null>(null);

  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <SubpageLayout
      appBarTitle="Kanban"
      backHref="/tasks"
      backLabel="Tasks"
      title="Kanban Board"
      badge="Sprint Board"
      badgeColorClass="bg-amber-400/20 text-amber-700 dark:text-amber-300 border-amber-500/30"
      subtitle="Visual drag-and-drop workflow columns & sprint progression"
      icon={Kanban}
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
      {/* Column WIP Telemetry Pill Rail */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono font-bold">
        <div className="p-2 rounded-xl bg-card border border-border shadow-2xs">
          <span className="text-[10px] text-muted-foreground uppercase block">To-Do</span>
          <span className="text-foreground font-black text-sm">{todoCount} Tasks</span>
        </div>
        <div className="p-2 rounded-xl bg-card border border-border shadow-2xs">
          <span className="text-[10px] text-muted-foreground uppercase block">In Progress</span>
          <span className="text-amber-500 font-black text-sm">{inProgressCount} Tasks</span>
        </div>
        <div className="p-2 rounded-xl bg-card border border-border shadow-2xs">
          <span className="text-[10px] text-muted-foreground uppercase block">Done</span>
          <span className="text-[#03D26F] font-black text-sm">{completedCount} Tasks</span>
        </div>
      </div>

      {/* Full Kanban Board Component */}
      <TaskKanbanBoard
        tasks={tasks}
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
      />

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
