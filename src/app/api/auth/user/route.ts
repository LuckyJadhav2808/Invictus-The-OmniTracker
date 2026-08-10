import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const uid = searchParams.get("uid");

    if (!email && !uid) {
      return NextResponse.json({ error: "Email or UID parameter is required" }, { status: 400 });
    }

    let user = null;
    if (email) {
      user = await User.findOne({ email: email.trim().toLowerCase() });
    } else if (uid) {
      user = await User.findOne({ uid });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 44 });
    }

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
