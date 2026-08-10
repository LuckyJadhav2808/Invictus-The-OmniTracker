import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const { email, passwordHash, displayName } = body;
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      // Update last login
      existingUser.lastLogin = new Date();
      if (passwordHash && existingUser.passwordHash === "hash_default") {
        existingUser.passwordHash = passwordHash;
      }
      if (displayName && (!existingUser.displayName || existingUser.displayName.includes("User"))) {
        existingUser.displayName = displayName;
      }
      await existingUser.save();

      return NextResponse.json({ success: true, user: existingUser }, { status: 200 });
    }

    // If user does not exist in MongoDB Atlas yet, create cloud user
    const newUser = await User.create({
      uid: `user_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`,
      email: normalizedEmail,
      displayName: displayName || (normalizedEmail.includes("@") ? normalizedEmail.split("@")[0] : "Invictus User"),
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
    console.error("Auth login API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
