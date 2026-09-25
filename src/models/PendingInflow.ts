import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IPendingInflow extends Document {
  id: string;
  userId: string;
  amount: number;
  merchant: string;
  date: string;
  bankName?: string;
  accountLast4?: string;
  rawSender?: string;
  dedupSignature: string;
  status: "pending" | "approved" | "dismissed";
  createdAt: Date;
}

const PendingInflowSchema = new Schema<IPendingInflow>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    merchant: { type: String, required: true },
    date: { type: String, required: true },
    bankName: { type: String, default: "Bank" },
    accountLast4: { type: String },
    rawSender: { type: String },
    dedupSignature: { type: String, index: true },
    status: {
      type: String,
      enum: ["pending", "approved", "dismissed"],
      default: "pending",
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

PendingInflowSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const PendingInflow =
  models.PendingInflow || model<IPendingInflow>("PendingInflow", PendingInflowSchema);
