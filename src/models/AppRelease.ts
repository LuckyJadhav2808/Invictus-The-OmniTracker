import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IAppRelease extends Document {
  version: string;
  buildNumber: number;
  releaseDate: string;
  channel: "stable" | "beta";
  changelog: string[];
  minSupportedVersion: string;
  isMandatory: boolean;
  apkDownloadUrl: string;
  apkSha256?: string;
  apkSizeBytes?: number;
  otaBundleUrl?: string;
  otaSha256?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AppReleaseSchema = new Schema<IAppRelease>(
  {
    version: { type: String, required: true, unique: true, index: true },
    buildNumber: { type: Number, required: true, index: true },
    releaseDate: { type: String, required: true },
    channel: { type: String, enum: ["stable", "beta"], default: "stable" },
    changelog: [{ type: String }],
    minSupportedVersion: { type: String, default: "1.0.0" },
    isMandatory: { type: Boolean, default: false },
    apkDownloadUrl: { type: String, required: true },
    apkSha256: { type: String, default: "" },
    apkSizeBytes: { type: Number, default: 0 },
    otaBundleUrl: { type: String, default: "" },
    otaSha256: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

export const AppRelease =
  models.AppRelease || model<IAppRelease>("AppRelease", AppReleaseSchema);
