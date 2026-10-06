"use client";

import { useState } from "react";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useToggleSubtask } from "@/lib/queries/tasks";
import { TaskKanbanBoard } from "@/components/tasks/TaskKanbanBoard";
import { TaskListWidget } from "@/components/tasks/TaskListWidget";
import { EisenhowerMatrixWidget } from "@/components/tasks/EisenhowerMatrixWidget";
import { NewTaskModal } from "@/components/tasks/NewTaskModal";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { VixPixelCompanion } from "@/components/mascot/VixPixelCompanion";
import { TaskItem } from "@/types";
import { CheckSquare, LayoutGrid, List, Flame, Plus, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  // Filter tasks based on active filter
  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === "P1 Urgent") return t.priority === "p1" && t.status !== "completed";
    if (activeFilter === "To Do") return t.status === "todo";
    if (activeFilter === "In Progress") return t.status === "in_progress";
    if (activeFilter === "Completed") return t.status === "completed";
    return true;
  });

  return (
    <div className="min-h-screen bg-cream-bg p-4 md:p-8 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Clean Neobrutalist Tasks Header Card */}
        <div className="neo-card p-5 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-heading font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border-2 border-[#161514] bg-[#F59E0B] text-white shadow-[1.5px_1.5px_0px_0px_#161514] flex items-center gap-1">
                <CheckSquare className="size-3 stroke-[2.5]" />
                <span>Tasks & Projects</span>
              </span>
              <span className="text-[10px] font-heading font-black text-[#161514]/70">
                {completedTasks}/{totalTasks} Completed
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-heading font-black text-[#161514] tracking-tight">
              Tasks & Workflows
            </h1>
            <p className="text-xs font-medium text-[#161514]/70 max-w-lg">
              Organize tasks into Kanban pipelines, priority checklists, and Eisenhower matrices.
            </p>
          </div>

          {/* Quick Metrics & Action */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="px-3 py-2 rounded-xl border-2 border-[#161514] bg-[#FAF8F5] shadow-[2px_2px_0px_0px_#161514] text-center min-w-[65px]">
              <span className="text-[9px] font-heading font-black uppercase text-[#161514]/60 block leading-tight">Total</span>
              <span className="text-sm font-heading font-black text-[#161514]">{totalTasks}</span>
            </div>
            <div className="px-3 py-2 rounded-xl border-2 border-[#161514] bg-amber-50 shadow-[2px_2px_0px_0px_#161514] text-center min-w-[65px]">
              <span className="text-[9px] font-heading font-black uppercase text-amber-700 block leading-tight">Active</span>
              <span className="text-sm font-heading font-black text-[#161514] flex items-center justify-center gap-1">
                <Clock className="size-3 text-amber-700" />
                {inProgressTasks}
              </span>
            </div>
            <div className="px-3 py-2 rounded-xl border-2 border-[#161514] bg-rose-50 shadow-[2px_2px_0px_0px_#161514] text-center min-w-[65px]">
              <span className="text-[9px] font-heading font-black uppercase text-rose-700 block leading-tight">Urgent</span>
              <span className="text-sm font-heading font-black text-rose-700 flex items-center justify-center gap-1">
                <AlertCircle className="size-3" />
                {p1UrgentTasks}
              </span>
            </div>
            <Button
              onClick={() => {
                setTaskToEdit(null);
                setIsCreateModalOpen(true);
              }}
              className="bg-[#CEF431] hover:bg-[#D8F74E] text-[#161514] font-heading font-black text-xs px-3.5 py-2.5 h-auto rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center gap-1.5"
            >
              <Plus className="size-4 stroke-[3]" />
              <span>New Task</span>
            </Button>

            {/* Interactive Taskmaster Vix Companion */}
            <VixPixelCompanion
              gear="tasks"
              state={p1UrgentTasks > 0 ? "focus" : completedTasks > 0 && completedTasks === totalTasks ? "celebrate" : "idle"}
              size={42}
              onClick={() => {
                setTaskToEdit(null);
                setIsCreateModalOpen(true);
              }}
              title="Vix: Taskmaster Companion (Click for New Task)"
            />
          </div>
        </div>

        {/* View Switcher & Status Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514]">
          {/* View Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: "kanban", label: "Kanban", icon: LayoutGrid },
              { id: "list", label: "List", icon: List },
              { id: "matrix", label: "Matrix", icon: Flame },
            ].map((tb) => {
              const Icon = tb.icon;
              const isActive = activeTab === tb.id;
              return (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setActiveTab(tb.id as any)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-heading font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border-2",
                    isActive
                      ? "bg-[#03D26F] text-[#161514] border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]"
                      : "bg-[#FAF8F5] text-[#161514]/70 border-transparent hover:border-[#161514]/20 hover:text-[#161514]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 stroke-[2.2]" />
                  <span>{tb.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 sm:pt-0 border-t sm:border-t-0 border-[#161514]/10">
            {["All", "To Do", "In Progress", "P1 Urgent", "Completed"].map((filter) => {
              const isSelected = activeFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-heading font-black border-2 transition-all cursor-pointer shrink-0",
                    isSelected
                      ? "bg-[#161514] text-white border-[#161514] shadow-[1px_1px_0px_0px_#161514]"
                      : "bg-white text-[#161514]/70 border-[#161514]/20 hover:border-[#161514] hover:text-[#161514]"
                  )}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary View Content */}
        <div className="space-y-4">
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
