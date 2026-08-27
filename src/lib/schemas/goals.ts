import { z } from "zod";

export const HabitFrequencySchema = z.object({
  type: z.enum(["daily", "weekly", "customDays"]),
  daysOfWeek: z.array(z.number()).optional(), // 0 = Sunday, 1 = Monday, etc.
  targetPerDay: z.number().min(1).default(1),
});

export const HabitSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Please enter a habit title"),
  icon: z.string().default("Target"),
  color: z.string().default("amber"),
  frequency: HabitFrequencySchema.default({ type: "daily", targetPerDay: 1 }),
  reminderTime: z.string().optional().nullable(),
  allowGraceSkip: z.boolean().default(false),
  isGoalStyle: z.boolean().default(false),
  goalTarget: z
    .preprocess((val) => {
      if (val === "" || val === null || val === undefined || Number.isNaN(val)) return undefined;
      const num = Number(val);
      return Number.isNaN(num) ? undefined : num;
    }, z.number().optional())
    .optional(),
  goalUnit: z.string().optional().nullable(),
  archived: z.boolean().default(false),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export const HabitLogSchema = z.object({
  id: z.string(), // habitId_yyyy-mm-dd
  habitId: z.string(),
  date: z.string(), // "yyyy-mm-dd"
  completed: z.boolean(),
  countLogged: z.number().default(0),
  note: z.string().optional(),
  quickTags: z.array(z.string()).default([]),
  createdAt: z.any().optional(),
});

export const StreakSchema = z.object({
  habitId: z.string(),
  currentStreak: z.number().default(0),
  longestStreak: z.number().default(0),
  lastCompletedDate: z.string().optional(),
  updatedAt: z.any().optional(),
});

export type Habit = z.infer<typeof HabitSchema>;
export type HabitLog = z.infer<typeof HabitLogSchema>;
export type Streak = z.infer<typeof StreakSchema>;

export const HealthProfileSchema = z.object({
  gender: z.string().default("Female"),
  age: z.string().default("24 Years"),
  weight: z.string().default("68 kg"),
});

export const WaterLogSchema = z.object({
  id: z.string(),
  date: z.string(),
  amount: z.number().default(0),
  updatedAt: z.any().optional(),
});

export const WorkoutSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  details: z.string().default(""),
  completed: z.boolean().default(false),
  date: z.string(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export const MacrosSchema = z.object({
  id: z.string(),
  date: z.string(),
  protein: z.number().default(54),
  carbs: z.number().default(32),
  fat: z.number().default(7),
  updatedAt: z.any().optional(),
});

export const DietSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  details: z.string().default(""),
  completed: z.boolean().default(false),
  date: z.string(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export type HealthProfile = z.infer<typeof HealthProfileSchema>;
export type WaterLog = z.infer<typeof WaterLogSchema>;
export type Workout = z.infer<typeof WorkoutSchema>;
export type Macros = z.infer<typeof MacrosSchema>;
export type Diet = z.infer<typeof DietSchema>;
