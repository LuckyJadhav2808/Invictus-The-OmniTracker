import { z } from "zod";

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Please enter a category name"),
  type: z.enum(["income", "expense"]),
  icon: z.string().default("Wallet"),
  color: z.string().default("mint"),
  monthlyBudget: z.number().min(0).optional(),
  archived: z.boolean().default(false),
  createdAt: z.any().optional(),
});

export const TransactionSchema = z.object({
  id: z.string(),
  amount: z.number().min(0.01, "Amount must be greater than zero"),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().min(1, "Please select a category"),
  date: z.string(), // "yyyy-mm-dd"
  note: z.string().optional(),
  paymentMethod: z.string().optional(), // e.g. "cash", "card", "upi"
  attachmentUrl: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringRuleId: z.string().optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export const RecurringRuleSchema = z.object({
  id: z.string(),
  amount: z.number().min(0.01),
  type: z.enum(["income", "expense"]),
  categoryId: z.string(),
  dayOfMonth: z.number().min(1).max(28),
  note: z.string().optional(),
  active: z.boolean().default(true),
  createdAt: z.any().optional(),
});

export type Category = z.infer<typeof CategorySchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type RecurringRule = z.infer<typeof RecurringRuleSchema>;
