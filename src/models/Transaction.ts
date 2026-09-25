import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ITransaction extends Document {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  type: "income" | "expense";
  date: string; // YYYY-MM-DD
  note?: string;
  paymentMethod?: string; // "UPI" | "Cash" | "Card" | "Bank"
  source?: "manual" | "bank_sms" | "recurring";
  dedupSignature?: string;
  sourceMetadata?: {
    bankName?: string;
    accountMasked?: string;
    rawSender?: string;
  };
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    categoryId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    date: { type: String, required: true, index: true },
    note: { type: String, default: "" },
    paymentMethod: { type: String, default: "UPI" },
    source: { type: String, enum: ["manual", "bank_sms", "recurring"], default: "manual" },
    dedupSignature: { type: String, index: true },
    sourceMetadata: {
      bankName: { type: String },
      accountMasked: { type: String },
      rawSender: { type: String },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, dedupSignature: 1 });

export const Transaction = models.Transaction || model<ITransaction>("Transaction", TransactionSchema);
