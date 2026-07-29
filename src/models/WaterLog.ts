import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IWaterLog extends Document {
  userId: string;
  date: string;
  amount: number;
  waterGoal?: number;
  updatedAt: Date;
}

const WaterLogSchema = new Schema<IWaterLog>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    amount: { type: Number, default: 1000 },
    waterGoal: { type: Number, default: 1000 },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

WaterLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export const WaterLog = models.WaterLog || model<IWaterLog>("WaterLog", WaterLogSchema);
