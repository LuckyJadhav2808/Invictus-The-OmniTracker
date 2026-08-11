import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Announcement } from "@/models/Announcement";

// GET /api/admin/announcement - Get current active announcement from MongoDB
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const activeAnn = await Announcement.findOne({ active: true }).sort({ createdAt: -1 }).lean();
    if (!activeAnn) {
      return NextResponse.json(null);
    }
    return NextResponse.json({
      id: activeAnn._id.toString(),
      message: activeAnn.message,
      type: activeAnn.type || "info",
      active: activeAnn.active,
      createdBy: activeAnn.createdBy,
      createdAt: activeAnn.createdAt ? new Date(activeAnn.createdAt).toISOString() : new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("GET /api/admin/announcement Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch announcement" }, { status: 500 });
  }
}

// POST /api/admin/announcement - Publish or Clear global announcement in MongoDB
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { message, type, createdBy, clear } = body;

    // Deactivate all previous announcements first
    await Announcement.updateMany({}, { active: false });

    if (clear || !message || !message.trim()) {
      return NextResponse.json({ success: true, message: "Announcement banner cleared." });
    }

    const newAnn = await Announcement.create({
      message: message.trim(),
      type: type || "info",
      active: true,
      createdBy: createdBy || "Admin",
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      announcement: {
        id: newAnn._id.toString(),
        message: newAnn.message,
        type: newAnn.type,
        active: newAnn.active,
        createdBy: newAnn.createdBy,
        createdAt: newAnn.createdAt,
      },
    });
  } catch (err: any) {
    console.error("POST /api/admin/announcement Error:", err);
    return NextResponse.json({ error: err.message || "Failed to publish announcement" }, { status: 500 });
  }
}
