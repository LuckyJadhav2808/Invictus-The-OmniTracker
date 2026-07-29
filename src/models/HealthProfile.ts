import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IHealthProfile extends Document {
  userId: string;
  weight?: string;
  height?: string;
  gender?: string;
  age?: string;
  waterGoal?: number;
  calorieGoal?: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatGoal?: number;
  sleepGoalHours?: number;
  updatedAt: Date;
}

const HealthProfileSchema = new Schema<IHealthProfile>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    weight: { type: String, default: "68 kg" },
    height: { type: String, default: "175 cm" },
    gender: { type: String, default: "Not Set" },
    age: { type: String, default: "Not Set" },
    waterGoal: { type: Number, default: 1000 },
    calorieGoal: { type: Number, default: 2200 },
    proteinGoal: { type: Number, default: 130 },
    carbsGoal: { type: Number, default: 250 },
    fatGoal: { type: Number, default: 70 },
    sleepGoalHours: { type: Number, default: 8 },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const HealthProfile = models.HealthProfile || model<IHealthProfile>("HealthProfile", HealthProfileSchema);
