import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ICategory extends Document {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  type: "income" | "expense";
  budgetLimit?: number;
  createdAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    color: { type: String, default: "emerald" },
    icon: { type: String, default: "Wallet" },
    type: { type: String, enum: ["income", "expense"], required: true },
    budgetLimit: { type: Number },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

CategorySchema.index({ userId: 1, type: 1 });

export const Category = models.Category || model<ICategory>("Category", CategorySchema);
