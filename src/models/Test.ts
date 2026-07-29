import { Schema, Document, models, model } from "mongoose";

export interface ITest extends Document {
  id: string;
  userId: string;
  name: string;
  date: string;
  score: number;
  totalScore: number;
  subjectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TestSchema = new Schema<ITest>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    date: { type: String, required: true },
    score: { type: Number, default: 0 },
    totalScore: { type: Number, default: 100 },
    subjectId: { type: String, default: "" },
  },
  { timestamps: true }
);

TestSchema.index({ userId: 1, date: -1 });

export const Test = models.Test || model<ITest>("Test", TestSchema);
