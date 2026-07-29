import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IHabitLog extends Document {
  id: string;
  userId: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  value?: number;
  isGraceSkip?: boolean;
  loggedAt: Date;
}

const HabitLogSchema = new Schema<IHabitLog>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    habitId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    completed: { type: Boolean, default: false },
    value: { type: Number, default: 0 },
    isGraceSkip: { type: Boolean, default: false },
    loggedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound Unique Index: prevents duplicate logs for same habit on same date per user
HabitLogSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });

export const HabitLog = models.HabitLog || model<IHabitLog>("HabitLog", HabitLogSchema);
