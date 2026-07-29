import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IUser extends Document {
  uid: string;
  email: string;
  displayName: string;
  role: "user" | "admin";
  passwordHash: string;
  timezone: string;
  currency: string;
  weekStartsOn: number;
  onboarded: boolean;
  modulesEnabled: { goals: boolean; study: boolean; money: boolean };
  studyTarget?: { examName?: string; examDate?: string };
  createdAt: Date;
  lastLogin: Date;
}

const UserSchema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    passwordHash: { type: String, required: true },
    timezone: { type: String, default: "Asia/Kolkata" },
    currency: { type: String, default: "INR" },
    weekStartsOn: { type: Number, default: 1 },
    onboarded: { type: Boolean, default: true },
    modulesEnabled: {
      goals: { type: Boolean, default: true },
      study: { type: Boolean, default: true },
      money: { type: Boolean, default: true },
    },
    studyTarget: {
      examName: { type: String },
      examDate: { type: String },
    },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>("User", UserSchema);
