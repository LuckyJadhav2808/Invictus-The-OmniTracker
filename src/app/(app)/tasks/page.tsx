"use client";

import { useState } from "react";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useToggleSubtask } from "@/lib/queries/tasks";
import { SpaceHeroBanner } from "@/components/shared/SpaceHeroBanner";
import { DraggableDashboardGrid, DashboardWidget } from "@/components/shared/DraggableDashboardGrid";
import { TaskKanbanBoard } from "@/components/tasks/TaskKanbanBoard";
import { TaskListWidget } from "@/components/tasks/TaskListWidget";
import { EisenhowerMatrixWidget } from "@/components/tasks/EisenhowerMatrixWidget";
import { NewTaskModal } from "@/components/tasks/NewTaskModal";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { TaskItem } from "@/types";
import { CheckSquare, LayoutGrid, List, Flame, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TasksPage() {
  const { data: tasks = [], isLoading } = useTasks();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const toggleSubtaskMutation = useToggleSubtask();

  const [activeTab, setActiveTab] = useState<"kanban" | "list" | "matrix">("kanban");
  const [activeFilter, setActiveFilter] = useState("All");

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);

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

  // Stats calculation
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const p1UrgentTasks = tasks.filter((t) => t.priority === "p1" && t.status !== "completed").length;

  // Filter tasks based on banner filter capsule
  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === "P1 Urgent") return t.priority === "p1" && t.status !== "completed";
    if (activeFilter === "To Do") return t.status === "todo";
    if (activeFilter === "In Progress") return t.status === "in_progress";
    if (activeFilter === "Completed") return t.status === "completed";
    return true;
  });

  const dashboardWidgets: DashboardWidget[] = [
    {
      id: "tasks-primary-view",
      title: activeTab === "kanban" ? "Kanban Board" : activeTab === "list" ? "Task List" : "Priority Matrix",
      component: (
        <div id="kanban-board" className="space-y-4">
          {activeTab === "kanban" && (
            <TaskKanbanBoard
              tasks={filteredTasks}
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

          {activeTab === "list" && (
            <div id="task-list">
              <TaskListWidget
                tasks={filteredTasks}
                onUpdateTask={(id, updates) => updateTaskMutation.mutate({ id, updates })}
                onDeleteTask={handleDeleteTask}
                onToggleSubtask={handleToggleSubtask}
                onEditTask={handleEditTask}
                onOpenCreateModal={() => {
                  setTaskToEdit(null);
                  setIsCreateModalOpen(true);
                }}
              />
            </div>
          )}

          {activeTab === "matrix" && (
            <div id="matrix-view">
              <EisenhowerMatrixWidget
                tasks={filteredTasks}
                onUpdateTask={(id, updates) => updateTaskMutation.mutate({ id, updates })}
                onOpenCreateModal={() => {
                  setTaskToEdit(null);
                  setIsCreateModalOpen(true);
                }}
              />
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 p-3 sm:p-6 md:p-8 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Space Hero Banner */}
        <SpaceHeroBanner
          space="tasks"
          badgeText="Tasks & Projects Space"
          title="Master Your Daily Workflow"
          subtitle="Organize tasks into Kanban columns, track P1-P4 priorities, and check off subtasks with ease."
          activeFilter={activeFilter}
          onFilterChange={(flt) => setActiveFilter(flt)}
          stats={[
            { label: "Total Tasks", value: totalTasks, icon: "📋" },
            { label: "In Progress", value: inProgressTasks, icon: "⚡" },
            { label: "P1 Urgent", value: p1UrgentTasks, icon: "🔥" },
            { label: "Completed", value: completedTasks, icon: "✅" },
          ]}
          actionButton={{
            label: "New Task",
            onClick: () => {
              setTaskToEdit(null);
              setIsCreateModalOpen(true);
            },
            icon: <Plus className="h-4 w-4 stroke-[3]" />,
          }}
        />

        {/* View Tab Switcher (Kanban ↔ List ↔ Matrix) */}
        <div className="flex items-center justify-between gap-3 bg-white p-2 rounded-3xl border-2.5 border-[#161514] shadow-[4px_4px_0px_0px_rgba(22,21,20,1)] overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: "kanban", label: "Kanban Board", icon: LayoutGrid },
              { id: "list", label: "Task List", icon: List },
              { id: "matrix", label: "Eisenhower Matrix", icon: Flame },
            ].map((tb) => {
              const Icon = tb.icon;
              const isActive = activeTab === tb.id;
              return (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setActiveTab(tb.id as any)}
                  className={cn(
                    "px-3.5 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider shrink-0 border-2 border-[#161514]",
                    isActive
                      ? "bg-[#F59E0B] text-white shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] scale-[1.02]"
                      : "bg-[#FAF8F5] text-[#161514]/70 hover:bg-cream-bg"
                  )}
                >
                  <Icon className="h-4 w-4 stroke-[2.5]" />
                  <span>{tb.label}</span>
                </button>
              );
            })}
          </div>

          <span className="text-[10px] font-black bg-[#CEF431] text-[#161514] px-3 py-1.5 rounded-xl border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] hidden sm:inline-block">
            {filteredTasks.length} Tasks Active
          </span>
        </div>

        {/* Customizable Draggable Dashboard Grid */}
        <DraggableDashboardGrid storageKey="tasks" widgets={dashboardWidgets} />

      </div>

      {/* Task Creation & Editing Modal (Powered by ResponsiveFormContainer) */}
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
