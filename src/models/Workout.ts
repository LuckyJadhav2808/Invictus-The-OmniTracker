import { Schema, model, models, Document } from "mongoose";

export interface IWorkout extends Document {
  userId: string;
  date: string;
  name: string;
  details: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkoutSchema = new Schema<IWorkout>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    name: { type: String, required: true },
    details: { type: String, default: "" },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

WorkoutSchema.index({ userId: 1, date: 1 });

export const Workout = models.Workout || model<IWorkout>("Workout", WorkoutSchema);
