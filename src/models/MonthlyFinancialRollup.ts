import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IMonthlyFinancialRollup extends Document {
  userId: string;
  monthKey: string; // "YYYY-MM"
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  dailyAllowanceRemaining: number;
  transactionCount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const MonthlyFinancialRollupSchema = new Schema<IMonthlyFinancialRollup>(
  {
    userId: { type: String, required: true, index: true },
    monthKey: { type: String, required: true, index: true },
    totalIncome: { type: Number, default: 0 },
    totalExpense: { type: Number, default: 0 },
    netCashflow: { type: Number, default: 0 },
    dailyAllowanceRemaining: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
  },
  {
    timestamps: true,
  }
);

MonthlyFinancialRollupSchema.index({ userId: 1, monthKey: 1 }, { unique: true });

export const MonthlyFinancialRollup =
  models.MonthlyFinancialRollup ||
  model<IMonthlyFinancialRollup>("MonthlyFinancialRollup", MonthlyFinancialRollupSchema);
