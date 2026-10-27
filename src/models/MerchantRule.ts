import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IMerchantRule extends Document {
  id: string;
  userId: string;
  merchantPattern: string;
  displayName: string;
  categoryId: string;
  categoryName: string;
  matchCount: number;
  isUserDefined: boolean;
  lastMatchedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantRuleSchema = new Schema<IMerchantRule>(
  {
    id: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    merchantPattern: { type: String, required: true, index: true },
    displayName: { type: String, required: true },
    categoryId: { type: String, required: true },
    categoryName: { type: String, required: true },
    matchCount: { type: Number, default: 0 },
    isUserDefined: { type: Boolean, default: true },
    lastMatchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

MerchantRuleSchema.index({ userId: 1, merchantPattern: 1 }, { unique: true });
MerchantRuleSchema.index({ userId: 1, matchCount: -1 });

export const MerchantRule =
  models.MerchantRule || model<IMerchantRule>("MerchantRule", MerchantRuleSchema);
