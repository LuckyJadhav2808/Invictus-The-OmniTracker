import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IIssueReport extends Document {
  title: string;
  description?: string;
  category: "bug" | "feature" | "ui" | "other";
  severity: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved";
  reportedBy: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IssueReportSchema = new Schema<IIssueReport>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, enum: ["bug", "feature", "ui", "other"], default: "bug" },
    severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
    reportedBy: { type: String, required: true },
    userId: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const IssueReport = models.IssueReport || model<IIssueReport>("IssueReport", IssueReportSchema);
