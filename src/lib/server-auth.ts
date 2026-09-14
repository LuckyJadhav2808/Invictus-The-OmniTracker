import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import crypto from "crypto";

export const ADMIN_EMAIL = "luckymanojjadhav@gmail.com";
export const PASSWORD_SALT = "_invictus_salt_2026";

/**
 * Deterministic, salted SHA-256 password hash function.
 * Matches client-side hashing in `custom-auth.ts`.
 */
export function hashPasswordWithSalt(password: string): string {
  return crypto.createHash("sha256").update(password + PASSWORD_SALT).digest("hex");
}

/**
 * Verifies if the incoming request comes from an authenticated administrator.
 */
export async function verifyAdminRequest(req: Request): Promise<{ isAdmin: boolean; error?: string; status?: number }> {
  const adminEmail = req.headers.get("x-admin-email")?.trim().toLowerCase();
  const adminUid = req.headers.get("x-admin-uid")?.trim();

  // Allow optional bearer token if configured
  const authHeader = req.headers.get("authorization");
  if (process.env.ADMIN_SECRET && authHeader === `Bearer ${process.env.ADMIN_SECRET}`) {
    return { isAdmin: true };
  }

  if (!adminEmail || !adminUid) {
    return {
      isAdmin: false,
      error: "Unauthorized: Admin identity headers missing.",
      status: 401,
    };
  }

  if (adminEmail !== ADMIN_EMAIL.toLowerCase()) {
    return {
      isAdmin: false,
      error: "Forbidden: You do not have administrator permissions.",
      status: 403,
    };
  }

  await connectToDatabase();
  const user = await User.findOne({ uid: adminUid, email: adminEmail });
  if (!user || (user.role !== "admin" && user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
    return {
      isAdmin: false,
      error: "Forbidden: Admin privileges could not be verified.",
      status: 403,
    };
  }

  return { isAdmin: true };
}
