import mongoose, { Schema, Document } from "mongoose";

export interface IDebt extends Document {
  userId: string;
  personName: string;
  type: "lent" | "borrowed";
  amount: number;
  dueDate?: string;
  note?: string;
  status: "pending" | "settled";
  settledAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DebtSchema = new Schema<IDebt>(
  {
    userId: { type: String, required: true, index: true },
    personName: { type: String, required: true, trim: true },
    type: { type: String, enum: ["lent", "borrowed"], required: true },
    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: String, default: "" },
    note: { type: String, default: "" },
    status: { type: String, enum: ["pending", "settled"], default: "pending" },
    settledAt: { type: String, default: "" },
  },
  { timestamps: true }
);

export const DebtModel =
  mongoose.models.Debt || mongoose.model<IDebt>("Debt", DebtSchema);
