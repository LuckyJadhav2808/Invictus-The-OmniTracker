"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TaskItem, Subtask } from "@/types";
import { toast } from "sonner";

const TASKS_STORAGE_KEY = "invictus_tasks_db";

const DEFAULT_SEED_TASKS: TaskItem[] = [
  {
    id: "task_seed_1",
    title: "Design Invictus Production Task Board & Kanban",
    description: "Build a sleek Neobrutalist task tracker space with full CRUD, P1-P4 priority matrix, and subtask checklists.",
    status: "in_progress",
    priority: "p1",
    dueDate: new Date().toISOString().split("T")[0],
    dueTime: "18:00",
    estimatedMinutes: 120,
    loggedMinutes: 45,
    projectTag: "Dev",
    subtasks: [
      { id: "sub_1", title: "Create TaskItem Schema & React Query hooks", completed: true },
      { id: "sub_2", title: "Build TaskKanbanBoard & TaskListWidget", completed: true },
      { id: "sub_3", title: "Integrate Robot Taskmaster Mascot & Header Switcher", completed: false },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task_seed_2",
    title: "Review Weekly Habits & Gym Workout Log",
    description: "Check off weekly streak targets and log today's Push/Pull workout session.",
    status: "todo",
    priority: "p2",
    dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    estimatedMinutes: 45,
    loggedMinutes: 0,
    projectTag: "Health",
    subtasks: [
      { id: "sub_4", title: "Log 3L water target", completed: false },
      { id: "sub_5", title: "Track Gym Bench Press sets", completed: false },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task_seed_3",
    title: "GATE Syllabus Engineering Maths Revision",
    description: "Solve 25 previous year questions on Linear Algebra and Calculus.",
    status: "todo",
    priority: "p1",
    dueDate: new Date().toISOString().split("T")[0],
    dueTime: "21:00",
    estimatedMinutes: 90,
    loggedMinutes: 0,
    projectTag: "Study",
    subtasks: [
      { id: "sub_6", title: "Eigenvalues PyQ practice", completed: false },
      { id: "sub_7", title: "Review Formula Sheet", completed: false },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task_seed_4",
    title: "Monthly Budget & Wallet Allocation Check",
    description: "Verify category budgets and record recent subscriptions.",
    status: "completed",
    priority: "p3",
    dueDate: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    estimatedMinutes: 30,
    loggedMinutes: 30,
    projectTag: "Finance",
    subtasks: [
      { id: "sub_8", title: "Log monthly bills", completed: true },
    ],
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Helper to get local tasks
export function getLocalTasks(): TaskItem[] {
  if (typeof window === "undefined") return DEFAULT_SEED_TASKS;
  const data = localStorage.getItem(TASKS_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(DEFAULT_SEED_TASKS));
    return DEFAULT_SEED_TASKS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_SEED_TASKS;
  }
}

// Helper to save local tasks
export function saveLocalTasks(tasks: TaskItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

// 1. Fetch All Tasks Hook
export function useTasks() {
  return useQuery<TaskItem[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/tasks");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            saveLocalTasks(data);
            return data;
          }
        }
      } catch (err) {
        console.warn("API /api/tasks fetch error, using local database:", err);
      }
      return getLocalTasks();
    },
    staleTime: 1000 * 60 * 5, // 5 mins
  });
}

// 2. Create Task Mutation
export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newTask: Omit<TaskItem, "id" | "createdAt" | "updatedAt">) => {
      const task: TaskItem = {
        ...newTask,
        id: `task_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const existing = getLocalTasks();
      const updated = [task, ...existing];
      saveLocalTasks(updated);

      try {
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(task),
        });
      } catch (err) {
        console.warn("MongoDB /api/tasks sync warning:", err);
      }

      return task;
    },
    onSuccess: (task) => {
      queryClient.setQueryData<TaskItem[]>(["tasks"], (old = []) => [task, ...old]);
      toast.success("Task Created! 📋⚡", { description: `"${task.title}" added to your task space.` });
    },
  });
}

// 3. Update Task Mutation
export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; updates: Partial<TaskItem> }) => {
      const existing = getLocalTasks();
      const idx = existing.findIndex((t) => t.id === payload.id);
      if (idx === -1) throw new Error("Task not found");

      const updatedTask: TaskItem = {
        ...existing[idx],
        ...payload.updates,
        updatedAt: new Date().toISOString(),
      };

      if (payload.updates.status === "completed" && !updatedTask.completedAt) {
        updatedTask.completedAt = new Date().toISOString();
      }

      existing[idx] = updatedTask;
      saveLocalTasks(existing);

      try {
        await fetch(`/api/tasks/${payload.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedTask),
        });
      } catch (err) {
        console.warn("MongoDB /api/tasks update warning:", err);
      }

      return updatedTask;
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<TaskItem[]>(["tasks"], (old = []) =>
        old.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
      toast.success("Task Updated! ✏️", { description: `"${updatedTask.title}" updated successfully.` });
    },
  });
}

// 4. Delete Task Mutation
export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const existing = getLocalTasks();
      const filtered = existing.filter((t) => t.id !== taskId);
      saveLocalTasks(filtered);

      try {
        await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      } catch (err) {
        console.warn("MongoDB /api/tasks delete warning:", err);
      }

      return taskId;
    },
    onSuccess: (taskId) => {
      queryClient.setQueryData<TaskItem[]>(["tasks"], (old = []) =>
        old.filter((t) => t.id !== taskId)
      );
      toast.info("Task Deleted 🗑️");
    },
  });
}

// 5. Toggle Subtask Mutation
export function useToggleSubtask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { taskId: string; subtaskId: string }) => {
      const existing = getLocalTasks();
      const taskIdx = existing.findIndex((t) => t.id === payload.taskId);
      if (taskIdx === -1) throw new Error("Task not found");

      const task = existing[taskIdx];
      const updatedSubtasks = task.subtasks.map((s) =>
        s.id === payload.subtaskId ? { ...s, completed: !s.completed } : s
      );

      // Check if all subtasks completed
      const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.completed);
      const updatedTask: TaskItem = {
        ...task,
        subtasks: updatedSubtasks,
        status: allDone ? "completed" : task.status === "completed" ? "in_progress" : task.status,
        updatedAt: new Date().toISOString(),
      };

      existing[taskIdx] = updatedTask;
      saveLocalTasks(existing);

      return updatedTask;
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<TaskItem[]>(["tasks"], (old = []) =>
        old.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
    },
  });
}
