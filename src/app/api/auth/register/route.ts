import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const { email, displayName, passwordHash, uid } = body;
    if (!email || !displayName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const newUser = await User.create({
      uid: uid || `user_${Date.now()}`,
      email: email.toLowerCase(),
      displayName,
      passwordHash: passwordHash || "hash_default",
      role: email.toLowerCase() === "luckymanojjadhav@gmail.com" ? "admin" : "user",
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
