import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IMealPlan extends Document {
  id: string;
  userId: string;
  date: string; // "yyyy-MM-dd" or "Monday"
  dayOfWeek?: string;
  mealType: "Breakfast" | "Lunch" | "Snack" | "Dinner" | "Pre-Workout" | "Post-Workout";
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time?: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MealPlanSchema = new Schema<IMealPlan>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    dayOfWeek: { type: String },
    mealType: {
      type: String,
      enum: ["Breakfast", "Lunch", "Snack", "Dinner", "Pre-Workout", "Post-Workout"],
      default: "Lunch",
    },
    name: { type: String, required: true },
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    time: { type: String, default: "" },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MealPlanSchema.index({ userId: 1, date: 1 });

export const MealPlan = models.MealPlan || model<IMealPlan>("MealPlan", MealPlanSchema);
