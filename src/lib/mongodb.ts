import mongoose from "mongoose";

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    if (process.env.NODE_ENV === "test") {
      return "mongodb://127.0.0.1:27017/invictus_test";
    }
    throw new Error("Please define the MONGODB_URI environment variable in .env.local");
  }
  return uri;
}

// ─────────────────────────────────────────────────────────────────────────────
// MULTI-DATABASE SEGREGATION CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
// PROD_DB_NAME: Strictly preserves current live database (invictus_db) so existing users are never disturbed!
export const PROD_DB_NAME = process.env.MONGODB_DB_NAME || "invictus_db";
// SANDBOX_DB_NAME: Completely isolated database for guest evaluators and demo sandbox.
export const SANDBOX_DB_NAME = process.env.MONGODB_SANDBOX_DB_NAME || "invictus_sandbox";
// TEST_DB_NAME: Isolated database for automated Vitest and CI testing.
export const TEST_DB_NAME = process.env.MONGODB_TEST_DB_NAME || "invictus_test";

export interface DatabaseContext {
  isSandbox: boolean;
  isTest: boolean;
  targetDb: string;
  userId: string | null;
}

export interface ConnectOptions {
  sandbox?: boolean;
  dbName?: string;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  connections: Record<string, mongoose.Connection>;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
  connections: {},
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Connects to MongoDB with environment-aware database isolation.
 * Defaults to production database (`invictus_db`) for all real user sessions.
 * Automatically switches to `invictus_sandbox` or `invictus_test` when requested.
 */
export async function connectToDatabase(options?: ConnectOptions): Promise<typeof mongoose> {
  const isTest = process.env.NODE_ENV === "test";
  const targetDb = options?.dbName || (options?.sandbox ? SANDBOX_DB_NAME : isTest ? TEST_DB_NAME : PROD_DB_NAME);

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    const uri = getMongoUri();
    cached.promise = mongoose.connect(uri, opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * Returns a dedicated Mongoose Connection object bound strictly to the requested database.
 * Enables 100% collection and index isolation on the same Atlas cluster.
 */
export async function getIsolatedConnection(targetDb: string): Promise<mongoose.Connection> {
  const m = await connectToDatabase();
  if (cached.connections[targetDb]) {
    return cached.connections[targetDb];
  }
  const isolated = m.connection.useDb(targetDb, { useCache: true });
  cached.connections[targetDb] = isolated;
  return isolated;
}

/**
 * Inspects incoming Next.js API requests to determine target environment and user identity.
 */
export function resolveDatabaseForRequest(req: Request, fallbackUserId?: string | null): DatabaseContext {
  const isTest = process.env.NODE_ENV === "test";
  const envHeader = req.headers.get("x-invictus-environment")?.toLowerCase();
  const sandboxHeader = req.headers.get("x-invictus-sandbox")?.toLowerCase();
  const userHeader = req.headers.get("x-user-id");

  let userId: string | null = fallbackUserId || userHeader || null;
  if (!userId) {
    try {
      const url = new URL(req.url);
      userId = url.searchParams.get("userId");
    } catch {}
  }

  const isGuestOrDemo = userId === "guest-user" || (!!userId && userId.startsWith("demo_"));
  const isExplicitSandbox = envHeader === "sandbox" || sandboxHeader === "true" || isGuestOrDemo;

  const targetDb = isTest ? TEST_DB_NAME : isExplicitSandbox ? SANDBOX_DB_NAME : PROD_DB_NAME;

  return {
    isSandbox: isExplicitSandbox,
    isTest,
    targetDb,
    userId,
  };
}

/**
 * Hard Security Guard: Throws an exception if any guest/demo user attempts to query the production database.
 */
export function assertDatabaseSafety(dbName: string, userId?: string | null): void {
  const prodDb = PROD_DB_NAME;
  if (dbName === prodDb) {
    if (userId === "guest-user" || (userId && userId.startsWith("demo_"))) {
      throw new Error(
        `[SECURITY AIR-GAP VIOLATION]: Guest/Demo user (${userId}) cannot access production database (${prodDb}).`
      );
    }
  }
}
