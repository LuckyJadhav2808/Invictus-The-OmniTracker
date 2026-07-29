import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ITopic extends Document {
  id: string;
  userId: string;
  subjectId: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  status: string;
  confidence: number;
  estimatedHours: number;
  revisionsCount?: number;
  satisfactionRate?: number;
  notes?: string;
  createdAt: Date;
}

const TopicSchema = new Schema<ITopic>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    subjectId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    status: {
      type: String,
      enum: ["notStarted", "inProgress", "completed", "needsRevision", "not_started", "in_progress", "revised"],
      default: "notStarted",
    },
    confidence: { type: Number, default: 1 },
    estimatedHours: { type: Number, default: 1 },
    revisionsCount: { type: Number, default: 0 },
    satisfactionRate: { type: Number, default: 5 },
    notes: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

TopicSchema.index({ userId: 1, subjectId: 1, status: 1 });

export const Topic = models.Topic || model<ITopic>("Topic", TopicSchema);
