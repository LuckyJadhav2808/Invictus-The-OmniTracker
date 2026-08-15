import mongoose, { Schema, Document } from "mongoose";

export interface IStreakFreeze extends Document {
  userId: string;
  tokensAvailable: number;
  lastMonthlyCredit: string;
  frozenDates: string[];
  createdAt: Date;
  updatedAt: Date;
}

const StreakFreezeSchema = new Schema<IStreakFreeze>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    tokensAvailable: { type: Number, default: 1, min: 0, max: 2 },
    lastMonthlyCredit: { type: String, default: "" },
    frozenDates: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const StreakFreezeModel =
  mongoose.models.StreakFreeze ||
  mongoose.model<IStreakFreeze>("StreakFreeze", StreakFreezeSchema);
