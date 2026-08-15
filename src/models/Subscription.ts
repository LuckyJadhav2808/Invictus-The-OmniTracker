import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ISubscription extends Document {
  id: string;
  userId: string;
  name: string;
  cost: number;
  billingCycle: "monthly" | "yearly";
  renewalDate: string;
  category: string;
  icon?: string;
  createdAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    cost: { type: Number, required: true },
    billingCycle: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
    renewalDate: { type: String, required: true },
    category: { type: String, default: "Entertainment" },
    icon: { type: String, default: "CreditCard" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Subscription = models.Subscription || model<ISubscription>("Subscription", SubscriptionSchema);
