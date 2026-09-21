import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IHabit extends Document {
  id: string;
  userId: string;
  title: string;
  color: string;
  icon: string;
  archived: boolean;
  frequency: {
    type: "daily" | "weekly" | "custom" | "customDays";
    daysOfWeek?: number[];
    targetPerDay?: number;
  };
  reminderTime?: string;
  allowGraceSkip?: boolean;
  isGoalStyle?: boolean;
  targetValue?: number;
  unit?: string;
  goalTarget?: number;
  goalUnit?: string;
  createdAt: Date;
  updatedAt?: Date;
}

const HabitSchema = new Schema<IHabit>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    color: { type: String, default: "emerald" },
    icon: { type: String, default: "Target" },
    archived: { type: Boolean, default: false },
    frequency: {
      type: { type: String, enum: ["daily", "weekly", "custom", "customDays"], default: "daily" },
      daysOfWeek: [{ type: Number }],
      targetPerDay: { type: Number, default: 1 },
    },
    reminderTime: { type: String },
    allowGraceSkip: { type: Boolean, default: false },
    isGoalStyle: { type: Boolean, default: false },
    targetValue: { type: Number },
    unit: { type: String },
    goalTarget: { type: Number },
    goalUnit: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound Index for zero-lag listing per user
HabitSchema.index({ userId: 1, archived: 1, createdAt: -1 });

export const Habit = models.Habit || model<IHabit>("Habit", HabitSchema);
