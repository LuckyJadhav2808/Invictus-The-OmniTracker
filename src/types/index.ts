// Re-export all types from Zod schemas
export type { User, StudyTarget } from "@/lib/schemas/user";
export type { Habit, HabitLog, Streak, HealthProfile, WaterLog, Workout, Macros, Diet } from "@/lib/schemas/goals";
export type { Subject, Topic, StudySession, Test } from "@/lib/schemas/study";
export type { Category, Transaction, RecurringRule, Debt } from "@/lib/schemas/money";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: "backlog" | "todo" | "in_progress" | "review" | "completed";
  priority: "p1" | "p2" | "p3" | "p4";
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  estimatedMinutes?: number;
  loggedMinutes?: number;
  projectTag: string; // e.g. "Work", "Personal", "Code", "Health"
  subtasks: Subtask[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StreakFreezeData {
  userId: string;
  tokensAvailable: number;
  lastMonthlyCredit: string;
  frozenDates: string[];
}
