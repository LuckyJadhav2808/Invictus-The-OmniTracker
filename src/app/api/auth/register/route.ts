import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const { email, displayName, passwordHash, uid } = body;
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      // Upsert existing user details
      existingUser.lastLogin = new Date();
      if (displayName && existingUser.displayName !== displayName) {
        existingUser.displayName = displayName;
      }
      if (passwordHash && passwordHash !== "hash_default" && existingUser.passwordHash === "hash_default") {
        existingUser.passwordHash = passwordHash;
      }
      await existingUser.save();
      return NextResponse.json({ success: true, user: existingUser, updated: true }, { status: 200 });
    }

    const newUser = await User.create({
      uid: uid || `user_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`,
      email: normalizedEmail,
      displayName: displayName || (normalizedEmail.includes("@") ? normalizedEmail.split("@")[0] : "Invictus Explorer"),
      passwordHash: passwordHash || "hash_default",
      role: normalizedEmail === "luckymanojjadhav@gmail.com" ? "admin" : "user",
      timezone: "Asia/Kolkata",
      currency: "INR",
      weekStartsOn: 1,
      onboarded: true,
      modulesEnabled: { goals: true, study: true, money: true },
      createdAt: new Date(),
      lastLogin: new Date(),
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error("Auth register API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
