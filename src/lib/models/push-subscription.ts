import mongoose, { Schema, Document } from "mongoose";

export interface IPushSubscription extends Document {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  timezone: string;
  moneyEnabled: boolean;
  moneyTime: string;
  habitsEnabled: boolean;
  habitsTime: string;
  studyEnabled: boolean;
  studyTime: string;
  examEnabled: boolean;
  examTime: string;
  soundEnabled: boolean;
  lastSentKeys: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId: { type: String, required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    timezone: { type: String, default: "Asia/Kolkata" },
    moneyEnabled: { type: Boolean, default: false },
    moneyTime: { type: String, default: "20:00" },
    habitsEnabled: { type: Boolean, default: false },
    habitsTime: { type: String, default: "21:00" },
    studyEnabled: { type: Boolean, default: false },
    studyTime: { type: String, default: "18:00" },
    examEnabled: { type: Boolean, default: false },
    examTime: { type: String, default: "10:00" },
    soundEnabled: { type: Boolean, default: true },
    lastSentKeys: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const PushSubscriptionModel =
  mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);
