import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IAnnouncement extends Document {
  message: string;
  type: "info" | "warning" | "success" | "alert";
  active: boolean;
  createdBy: string;
  createdAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ["info", "warning", "success", "alert"], default: "info" },
    active: { type: Boolean, default: true },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Announcement = models.Announcement || model<IAnnouncement>("Announcement", AnnouncementSchema);
