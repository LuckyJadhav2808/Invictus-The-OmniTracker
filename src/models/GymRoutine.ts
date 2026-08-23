import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IExerciseSet {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface IGymExercise {
  id: string;
  name: string;
  machineName?: string;
  targetMuscle: string;
  equipment?: string;
  gifUrl?: string;
  instructions?: string[];
  secondaryMuscles?: string[];
  notes?: string;
  sets: IExerciseSet[];
}

export interface IGymRoutine extends Document {
  id: string;
  userId: string;
  dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  routineTitle: string;
  exercises: IGymExercise[];
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseSetSchema = new Schema<IExerciseSet>({
  id: { type: String, required: true },
  setNumber: { type: Number, required: true },
  weight: { type: Number, default: 0 },
  reps: { type: Number, default: 10 },
  completed: { type: Boolean, default: false },
});

const GymExerciseSchema = new Schema<IGymExercise>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  machineName: { type: String, default: "" },
  targetMuscle: { type: String, default: "General" },
  equipment: { type: String, default: "" },
  gifUrl: { type: String, default: "" },
  instructions: { type: [String], default: [] },
  secondaryMuscles: { type: [String], default: [] },
  notes: { type: String, default: "" },
  sets: [ExerciseSetSchema],
});

const GymRoutineSchema = new Schema<IGymRoutine>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    dayOfWeek: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      required: true,
    },
    routineTitle: { type: String, required: true },
    exercises: [GymExerciseSchema],
  },
  { timestamps: true }
);

GymRoutineSchema.index({ userId: 1, dayOfWeek: 1 });

export const GymRoutine = models.GymRoutine || model<IGymRoutine>("GymRoutine", GymRoutineSchema);
