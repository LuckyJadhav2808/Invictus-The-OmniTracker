import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IFeatureFlag extends Document {
  key: string;
  value: boolean | string | number;
  description: string;
  category: "core" | "experimental" | "system" | "performance";
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FeatureFlagSchema = new Schema<IFeatureFlag>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true, default: true },
    description: { type: String, default: "" },
    category: {
      type: String,
      enum: ["core", "experimental", "system", "performance"],
      default: "core",
    },
    isEnabled: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const FeatureFlag =
  models.FeatureFlag || model<IFeatureFlag>("FeatureFlag", FeatureFlagSchema);
