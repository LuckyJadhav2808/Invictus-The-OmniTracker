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

    if (!passwordHash) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (!existingUser) {
      return NextResponse.json(
        { error: "No account found with this email. Please check your email or sign up." },
        { status: 404 }
      );
    }

    // Verify Password Hash
    const hasExistingHash = existingUser.passwordHash && existingUser.passwordHash !== "hash_default";
    if (hasExistingHash && existingUser.passwordHash !== passwordHash) {
      return NextResponse.json(
        { error: "Incorrect password. Please check your credentials and try again." },
        { status: 401 }
      );
    }

    // If first login on an uninitialized account, set the password hash
    if (!hasExistingHash && passwordHash) {
      existingUser.passwordHash = passwordHash;
    }

    // Update last login & profile info
    existingUser.lastLogin = new Date();
    if (displayName && (!existingUser.displayName || existingUser.displayName.includes("User"))) {
      existingUser.displayName = displayName;
    }
    await existingUser.save();

    return NextResponse.json({ success: true, user: existingUser }, { status: 200 });
  } catch (error: any) {
    console.error("Auth login API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
