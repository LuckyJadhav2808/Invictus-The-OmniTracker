"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TaskItem, Subtask } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/components/shared/AuthProvider";
import { getCustomSession } from "@/lib/custom-auth";

const TASKS_STORAGE_KEY = "invictus_tasks_db";
const DEFAULT_SEED_TASKS: TaskItem[] = [];

const getActiveUserId = (user: any) => {
  if (user?.uid) return user.uid;
  if (typeof window !== "undefined") {
    const session = getCustomSession();
    if (session?.uid) return session.uid;
  }
  return "user_1kapw9sad_1784744868999";
};

// Helper to get local tasks
export function getLocalTasks(): TaskItem[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(TASKS_STORAGE_KEY);
  if (!data) return [];
  try {
    const parsed: TaskItem[] = JSON.parse(data);
    if (Array.isArray(parsed)) {
      // Strip any legacy mock seed tasks
      const sanitized = parsed.filter((t) => !t.id?.startsWith("task_seed_"));
      if (sanitized.length !== parsed.length) {
        saveLocalTasks(sanitized);
      }
      return sanitized;
    }
    return [];
  } catch {
    return [];
  }
}

// Helper to save local tasks
export function saveLocalTasks(tasks: TaskItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

// 1. Fetch All Tasks Hook (MongoDB Atlas Connected + Local Fallback)
export function useTasks() {
  const { user } = useAuth();
  const userId = getActiveUserId(user);

  return useQuery<TaskItem[]>({
    queryKey: ["tasks", userId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/tasks?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            // Strip any legacy mock seed tasks
            const sanitized = data.filter((t: any) => !t.id?.startsWith("task_seed_"));
            saveLocalTasks(sanitized);
            return sanitized;
          }
        }
      } catch (err) {
        console.warn("API /api/tasks fetch error, using local database:", err);
      }
      return getLocalTasks();
    },
    staleTime: 1000 * 60 * 2,
  });
}

// 2. Create Task Mutation (MongoDB Atlas Connected)
export function useCreateTask() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTask: Omit<TaskItem, "id" | "createdAt" | "updatedAt">) => {
      const userId = getActiveUserId(user);
      const task: TaskItem = {
        ...newTask,
        id: `task_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        userId,
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
      const userId = getActiveUserId(user);
      queryClient.setQueryData<TaskItem[]>(["tasks", userId], (old = []) => [task, ...old]);
      queryClient.setQueryData<TaskItem[]>(["tasks"], (old = []) => [task, ...old]);
      toast.success("Task Created! 📋⚡", { description: `"${task.title}" added to your task space.` });
    },
  });
}

// 3. Update Task Mutation (MongoDB Atlas Connected)
export function useUpdateTask() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string; updates: Partial<TaskItem> }) => {
      const userId = getActiveUserId(user);
      const existing = getLocalTasks();
      const idx = existing.findIndex((t) => t.id === payload.id);
      if (idx === -1) throw new Error("Task not found");

      const updatedTask: TaskItem = {
        ...existing[idx],
        ...payload.updates,
        userId,
        updatedAt: new Date().toISOString(),
      };

      if (payload.updates.status === "completed" && !updatedTask.completedAt) {
        updatedTask.completedAt = new Date().toISOString();
      }

      existing[idx] = updatedTask;
      saveLocalTasks(existing);

      try {
        await fetch("/api/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...updatedTask, userId }),
        });
      } catch (err) {
        console.warn("MongoDB /api/tasks update warning:", err);
      }

      return updatedTask;
    },
    onSuccess: (updatedTask) => {
      const userId = getActiveUserId(user);
      queryClient.setQueryData<TaskItem[]>(["tasks", userId], (old = []) =>
        old.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
      queryClient.setQueryData<TaskItem[]>(["tasks"], (old = []) =>
        old.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
      toast.success("Task Updated! ✏️", { description: `"${updatedTask.title}" updated successfully.` });
    },
  });
}

// 4. Delete Task Mutation (MongoDB Atlas Connected)
export function useDeleteTask() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const userId = getActiveUserId(user);
      const existing = getLocalTasks();
      const filtered = existing.filter((t) => t.id !== taskId);
      saveLocalTasks(filtered);

      try {
        await fetch(`/api/tasks?id=${encodeURIComponent(taskId)}&userId=${encodeURIComponent(userId)}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.warn("MongoDB /api/tasks delete warning:", err);
      }

      return taskId;
    },
    onSuccess: (taskId) => {
      const userId = getActiveUserId(user);
      queryClient.setQueryData<TaskItem[]>(["tasks", userId], (old = []) =>
        old.filter((t) => t.id !== taskId)
      );
      queryClient.setQueryData<TaskItem[]>(["tasks"], (old = []) =>
        old.filter((t) => t.id !== taskId)
      );
      toast.info("Task Deleted 🗑️");
    },
  });
}

// 5. Toggle Subtask Mutation
export function useToggleSubtask() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { taskId: string; subtaskId: string }) => {
      const userId = getActiveUserId(user);
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
        userId,
        updatedAt: new Date().toISOString(),
      };

      existing[taskIdx] = updatedTask;
      saveLocalTasks(existing);

      try {
        await fetch("/api/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...updatedTask, userId }),
        });
      } catch (err) {
        console.warn("MongoDB /api/tasks toggle subtask warning:", err);
      }

      return updatedTask;
    },
    onSuccess: (updatedTask) => {
      const userId = getActiveUserId(user);
      queryClient.setQueryData<TaskItem[]>(["tasks", userId], (old = []) =>
        old.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
      queryClient.setQueryData<TaskItem[]>(["tasks"], (old = []) =>
        old.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
    },
  });
}
