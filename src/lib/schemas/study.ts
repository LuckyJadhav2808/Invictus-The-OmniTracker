import { z } from "zod";

export const SubjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Please enter a subject name"),
  color: z.string().default("orange"),
  icon: z.string().default("BookOpen"),
  archived: z.boolean().default(false),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export const TopicSchema = z.object({
  id: z.string(),
  subjectId: z.string().optional(),
  title: z.string().min(1, "Please enter a topic title"),
  status: z.enum(["notStarted", "inProgress", "completed", "needsRevision"]).default("notStarted"),
  estimatedHours: z.number().min(0).default(0),
  loggedHours: z.number().min(0).default(0), // denormalized sum of session durations
  confidence: z.number().min(1).max(5).default(1),
  notes: z.string().optional(),
  resourceLinks: z.array(z.string()).default([]),
  lastStudiedAt: z.any().optional(),
  order: z.number().default(0),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export const StudySessionSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  topicId: z.string(),
  date: z.string(), // "yyyy-mm-dd"
  durationMinutes: z.number().min(1, "Duration must be at least 1 minute"),
  type: z.enum(["reading", "practice", "revision", "mockTest"]).default("reading"),
  notes: z.string().optional(),
  createdAt: z.any().optional(),
});

export const TestSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Please enter a test name"),
  date: z.string(), // "yyyy-mm-dd"
  scope: z.array(z.string()).default([]), // subjectIds
  score: z.number().min(0, "Score cannot be negative"),
  totalScore: z.number().min(1, "Total score must be at least 1"),
  timeTakenMinutes: z.number().optional(),
  weakAreas: z.array(z.string()).default([]),
  attachmentUrl: z.string().optional(),
  createdAt: z.any().optional(),
});

export type Subject = z.infer<typeof SubjectSchema>;
export type Topic = z.infer<typeof TopicSchema>;
export type StudySession = z.infer<typeof StudySessionSchema>;
export type Test = z.infer<typeof TestSchema>;
