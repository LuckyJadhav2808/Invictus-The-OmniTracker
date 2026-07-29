import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IHabit extends Document {
  id: string;
  userId: string;
  title: string;
  color: string;
  icon: string;
  archived: boolean;
  frequency: {
    type: "daily" | "weekly" | "custom";
    daysOfWeek?: number[];
    targetPerDay?: number;
  };
  allowGraceSkip?: boolean;
  isGoalStyle?: boolean;
  targetValue?: number;
  unit?: string;
  createdAt: Date;
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
      type: { type: String, enum: ["daily", "weekly", "custom"], default: "daily" },
      daysOfWeek: [{ type: Number }],
      targetPerDay: { type: Number, default: 1 },
    },
    allowGraceSkip: { type: Boolean, default: false },
    isGoalStyle: { type: Boolean, default: false },
    targetValue: { type: Number },
    unit: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound Index for zero-lag listing per user
HabitSchema.index({ userId: 1, archived: 1, createdAt: -1 });

export const Habit = models.Habit || model<IHabit>("Habit", HabitSchema);
