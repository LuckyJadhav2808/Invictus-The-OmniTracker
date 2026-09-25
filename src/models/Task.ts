import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ISubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ITask extends Document {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: "backlog" | "todo" | "in_progress" | "review" | "completed";
  priority: "p1" | "p2" | "p3" | "p4";
  dueDate?: string;
  dueTime?: string;
  estimatedMinutes?: number;
  loggedMinutes?: number;
  projectTag: string;
  subtasks: ISubtask[];
  completedAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubtaskSchema = new Schema<ISubtask>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const TaskSchema = new Schema<ITask>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["backlog", "todo", "in_progress", "review", "completed"],
      default: "todo",
      index: true,
    },
    priority: {
      type: String,
      enum: ["p1", "p2", "p3", "p4"],
      default: "p2",
    },
    dueDate: { type: String },
    dueTime: { type: String },
    estimatedMinutes: { type: Number, default: 0 },
    loggedMinutes: { type: Number, default: 0 },
    projectTag: { type: String, default: "General" },
    subtasks: [SubtaskSchema],
    completedAt: { type: String },
  },
  { timestamps: true }
);

TaskSchema.index({ userId: 1, createdAt: -1 });

export const Task = models.Task || model<ITask>("Task", TaskSchema);
