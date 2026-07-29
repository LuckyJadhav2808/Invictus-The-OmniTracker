import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IMoodLog extends Document {
  userId: string;
  date: string; // YYYY-MM-DD
  mood: string;
  energy: number;
  note?: string;
  createdAt: Date;
}

const MoodLogSchema = new Schema<IMoodLog>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    mood: { type: String, required: true },
    energy: { type: Number, default: 3 },
    note: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

MoodLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export const MoodLog = models.MoodLog || model<IMoodLog>("MoodLog", MoodLogSchema);
