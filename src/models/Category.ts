import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ICategory extends Document {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  type: "income" | "expense";
  budgetLimit?: number;
  isTemplate?: boolean;
  templatePackId?: string;
  createdAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    id: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    color: { type: String, default: "amber" },
    icon: { type: String, default: "💳" },
    type: { type: String, enum: ["income", "expense"], required: true },
    budgetLimit: { type: Number },
    isTemplate: { type: Boolean, default: false },
    templatePackId: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

CategorySchema.index({ userId: 1, id: 1 }, { unique: true });
CategorySchema.index({ userId: 1, type: 1 });

export const Category = models.Category || model<ICategory>("Category", CategorySchema);
