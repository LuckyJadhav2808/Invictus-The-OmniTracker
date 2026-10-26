import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().optional(),
  MONGODB_DB_NAME: z.string().default("invictus_db"),
  MONGODB_SANDBOX_DB_NAME: z.string().default("invictus_sandbox"),
  MONGODB_TEST_DB_NAME: z.string().default("invictus_test"),
  MONGODB_DEMO_URI: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || "invictus_db",
  MONGODB_SANDBOX_DB_NAME: process.env.MONGODB_SANDBOX_DB_NAME || "invictus_sandbox",
  MONGODB_TEST_DB_NAME: process.env.MONGODB_TEST_DB_NAME || "invictus_test",
  MONGODB_DEMO_URI: process.env.MONGODB_DEMO_URI,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
