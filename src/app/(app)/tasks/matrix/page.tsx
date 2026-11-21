"use client";

import { useState } from "react";
import { Flame, Plus, CheckCircle2 } from "lucide-react";
import { SubpageLayout } from "@/components/shared/SubpageLayout";
import { SubpageTwoTabs } from "@/components/shared/SubpageTwoTabs";
import { NeobrutalistEmptyCard } from "@/components/shared/NeobrutalistEmptyCard";
import { useTasks, useUpdateTask, useDeleteTask, useToggleSubtask, useCreateTask } from "@/lib/queries/tasks";
import { EisenhowerMatrixWidget } from "@/components/tasks/EisenhowerMatrixWidget";
import { TasksPrimaryList } from "@/components/tasks/TasksPrimaryList";
import { soundFX } from "@/components/shared/SoundFX";
import dynamic from "next/dynamic";

const NewTaskModal = dynamic(
  () => import("@/components/tasks/NewTaskModal").then((m) => m.NewTaskModal),
  { ssr: false }
);

export default function TasksMatrixPage() {
  const [activeTab, setActiveTab] = useState<"quadrants" | "urgent">("quadrants");
  const { data: tasks = [] } = useTasks();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const toggleSubtaskMutation = useToggleSubtask();
  const createTaskMutation = useCreateTask();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<any | null>(null);

  const p1Tasks = tasks.filter((t) => t.priority === "p1" && t.status !== "completed");

  return (
    <SubpageLayout
      appBarTitle="Priority Matrix"
      backHref="/tasks"
      backLabel="Tasks"
      title="Eisenhower Matrix"
      badge="Priority Triage"
      badgeColorClass="bg-rose-400/20 text-rose-700 dark:text-rose-300 border-rose-500/30"
      subtitle="Urgent vs Important quadrants & ruthless deep-work focus"
      icon={Flame}
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
      {/* 2-Tab Navigation */}
      <SubpageTwoTabs<"quadrants" | "urgent">
        tabs={[
          { id: "quadrants", label: "4 Quadrants", icon: "🔲" },
          { id: "urgent", label: "P1 Urgent Triage", icon: "🔥", count: p1Tasks.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* TAB 1: 4 Quadrants */}
      {activeTab === "quadrants" && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          <EisenhowerMatrixWidget
            tasks={tasks}
            onUpdateTask={(id, updates) => updateTaskMutation.mutate({ id, updates })}
            onOpenCreateModal={() => {
              setTaskToEdit(null);
              setIsCreateModalOpen(true);
            }}
          />
        </div>
      )}

      {/* TAB 2: Urgent Focus List */}
      {activeTab === "urgent" && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-xs space-y-3">
            <h3 className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <Flame className="size-4 fill-rose-500" />
              <span>Priority 1: Do Immediately</span>
            </h3>
            {p1Tasks.length === 0 ? (
              <NeobrutalistEmptyCard
                icon={CheckCircle2}
                title="Zero urgent fires right now!"
                description="All P1 tasks are cleared. Focus on scheduled P2 work."
              />
            ) : (
              <TasksPrimaryList
                tasks={p1Tasks}
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
            )}
          </div>
        </div>
      )}

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
