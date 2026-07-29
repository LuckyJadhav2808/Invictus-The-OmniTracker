import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ISavingsGoal extends Document {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  targetDate?: string;
  createdAt: Date;
}

const SavingsGoalSchema = new Schema<ISavingsGoal>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    category: { type: String, default: "Safety" },
    targetDate: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SavingsGoalSchema.index({ userId: 1 });

export const SavingsGoal = models.SavingsGoal || model<ISavingsGoal>("SavingsGoal", SavingsGoalSchema);
