import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IStudySession extends Document {
  id: string;
  userId: string;
  subjectId: string;
  topicId?: string;
  durationMinutes: number;
  type: string;
  date: string;
  notes?: string;
  createdAt: Date;
}

const StudySessionSchema = new Schema<IStudySession>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    subjectId: { type: String, required: true, index: true },
    topicId: { type: String, default: "" },
    durationMinutes: { type: Number, required: true },
    type: { type: String, default: "reading" },
    date: { type: String, required: true, index: true },
    notes: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

StudySessionSchema.index({ userId: 1, date: -1 });

export const StudySession = models.StudySession || model<IStudySession>("StudySession", StudySessionSchema);
