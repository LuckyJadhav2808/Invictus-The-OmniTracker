import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ISubject extends Document {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  category?: string;
  createdAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    color: { type: String, default: "indigo" },
    icon: { type: String, default: "BookOpen" },
    category: { type: String, default: "General" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SubjectSchema.index({ userId: 1, createdAt: -1 });

export const Subject = models.Subject || model<ISubject>("Subject", SubjectSchema);
