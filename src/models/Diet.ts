import { Schema, model, models, Document } from "mongoose";

export interface IDiet extends Document {
  userId: string;
  date: string;
  name: string;
  details: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DietSchema = new Schema<IDiet>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    name: { type: String, required: true },
    details: { type: String, default: "" },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

DietSchema.index({ userId: 1, date: 1 });

export const Diet = models.Diet || model<IDiet>("Diet", DietSchema);
