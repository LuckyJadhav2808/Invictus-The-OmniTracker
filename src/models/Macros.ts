import { Schema, model, models, Document } from "mongoose";

export interface IMacros extends Document {
  userId: string;
  date: string;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: Date;
  updatedAt: Date;
}

const MacrosSchema = new Schema<IMacros>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
  },
  { timestamps: true }
);

MacrosSchema.index({ userId: 1, date: 1 }, { unique: true });

export const Macros = models.Macros || model<IMacros>("Macros", MacrosSchema);
