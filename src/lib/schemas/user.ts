import { z } from "zod";

export const StudyTargetSchema = z.object({
  examName: z.string().min(1, "Please enter an exam or study topic name"),
  examDate: z.any(), // Firestore Timestamp
});

export const UserSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().min(1, "Name is required"),
  role: z.enum(["admin", "user"]).default("user"),
  passwordHash: z.string().optional(),
  lastLogin: z.string().optional(),
  avatarUrl: z.string().optional(),
  timezone: z.string().default("Asia/Kolkata"),
  weekStartsOn: z.union([z.literal(0), z.literal(1)]).default(1), // 0 = Sunday, 1 = Monday
  currency: z.string().default("INR"),
  onboarded: z.boolean().default(false),
  modulesEnabled: z.object({
    goals: z.boolean().default(true),
    study: z.boolean().default(true),
    money: z.boolean().default(true),
  }),
  studyTarget: StudyTargetSchema.optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export type User = z.infer<typeof UserSchema>;
export type StudyTarget = z.infer<typeof StudyTargetSchema>;
