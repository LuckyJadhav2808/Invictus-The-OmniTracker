import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import crypto from "crypto";

const hashPassword = (password: string) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

// GET /api/admin/users - List all users in MongoDB
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(
      users.map((u: any) => ({
        ...u,
        id: u.uid || u._id,
        uid: u.uid || u._id,
        status: u.status || "active",
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
        lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString() : new Date().toISOString(),
      }))
    );
  } catch (err: any) {
    console.error("GET /api/admin/users Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch users" }, { status: 500 });
  }
}

// POST /api/admin/users - Register/Create User in MongoDB
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email, displayName, password, role } = body;

    if (!email || !displayName || !password) {
      return NextResponse.json({ error: "Email, display name, and password are required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json({ error: "A user with this email address already exists." }, { status: 409 });
    }

    const uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = hashPassword(password);

    const newUser = await User.create({
      uid,
      email: normalizedEmail,
      displayName: displayName.trim(),
      passwordHash,
      role: role === "admin" ? "admin" : "user",
      status: "active",
      timezone: "Asia/Kolkata",
      currency: "INR",
      weekStartsOn: 1,
      onboarded: true,
      modulesEnabled: { goals: true, study: true, money: true },
      createdAt: new Date(),
      lastLogin: new Date(),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.uid,
        uid: newUser.uid,
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
        status: newUser.status,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err: any) {
    console.error("POST /api/admin/users Error:", err);
    return NextResponse.json({ error: err.message || "Failed to create user" }, { status: 500 });
  }
}

// PATCH /api/admin/users - Update Role, Display Name, Email, Status, or Password Reset
export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { uid, role, displayName, email, status, newPassword } = body;

    if (!uid) {
      return NextResponse.json({ error: "User ID (uid) is required for update." }, { status: 400 });
    }

    const targetUser = await User.findOne({ $or: [{ uid }, { _id: uid }] });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Protect Primary SuperAdmin
    const PRIMARY_ADMIN = "luckymanojjadhav@gmail.com";
    if (targetUser.email.toLowerCase() === PRIMARY_ADMIN && role && role !== "admin") {
      return NextResponse.json({ error: "Primary SuperAdmin role cannot be changed." }, { status: 403 });
    }

    if (role && (role === "user" || role === "admin")) {
      targetUser.role = role;
    }

    if (status && (status === "active" || status === "suspended")) {
      targetUser.status = status;
    }

    if (displayName && displayName.trim()) {
      targetUser.displayName = displayName.trim();
    }

    if (email && email.trim()) {
      targetUser.email = email.toLowerCase().trim();
    }

    if (newPassword && newPassword.trim()) {
      targetUser.passwordHash = hashPassword(newPassword.trim());
    }

    await targetUser.save();

    return NextResponse.json({
      success: true,
      user: {
        id: targetUser.uid,
        uid: targetUser.uid,
        email: targetUser.email,
        displayName: targetUser.displayName,
        role: targetUser.role,
        status: targetUser.status,
      },
    });
  } catch (err: any) {
    console.error("PATCH /api/admin/users Error:", err);
    return NextResponse.json({ error: err.message || "Failed to update user" }, { status: 500 });
  }
}

// DELETE /api/admin/users - Delete User Account
export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "User ID parameter (uid) is required." }, { status: 400 });
    }

    const targetUser = await User.findOne({ $or: [{ uid }, { _id: uid }] });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const PRIMARY_ADMIN = "luckymanojjadhav@gmail.com";
    if (targetUser.email.toLowerCase() === PRIMARY_ADMIN) {
      return NextResponse.json({ error: "Primary SuperAdmin account cannot be deleted." }, { status: 403 });
    }

    await User.deleteOne({ _id: targetUser._id });

    return NextResponse.json({ success: true, deletedUid: uid });
  } catch (err: any) {
    console.error("DELETE /api/admin/users Error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete user" }, { status: 500 });
  }
}
