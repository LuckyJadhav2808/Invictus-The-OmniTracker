import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { IssueReport } from "@/models/IssueReport";

// GET /api/admin/issues - Fetch all issue reports from MongoDB
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const issues = await IssueReport.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(
      issues.map((i: any) => ({
        ...i,
        id: i._id.toString(),
        createdAt: i.createdAt ? new Date(i.createdAt).toISOString() : new Date().toISOString(),
      }))
    );
  } catch (err: any) {
    console.error("GET /api/admin/issues Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch issues" }, { status: 500 });
  }
}

// POST /api/admin/issues - Submit a new issue report (User or Admin)
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { title, description, category, severity, reportedBy, userId } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Issue title is required." }, { status: 400 });
    }

    const newIssue = await IssueReport.create({
      title: title.trim(),
      description: (description || "").trim(),
      category: category || "bug",
      severity: severity || "medium",
      status: "open",
      reportedBy: reportedBy || "Anonymous User",
      userId: userId || "guest",
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      issue: {
        id: newIssue._id.toString(),
        title: newIssue.title,
        description: newIssue.description,
        category: newIssue.category,
        severity: newIssue.severity,
        status: newIssue.status,
        reportedBy: newIssue.reportedBy,
        createdAt: newIssue.createdAt,
      },
    });
  } catch (err: any) {
    console.error("POST /api/admin/issues Error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit issue report" }, { status: 500 });
  }
}

// PATCH /api/admin/issues - Update Issue Status or Details (Admin)
export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, status, severity, category } = body;

    if (!id) {
      return NextResponse.json({ error: "Issue ID is required." }, { status: 400 });
    }

    const issue = await IssueReport.findById(id);
    if (!issue) {
      return NextResponse.json({ error: "Issue report not found." }, { status: 404 });
    }

    if (status) issue.status = status;
    if (severity) issue.severity = severity;
    if (category) issue.category = category;

    await issue.save();

    return NextResponse.json({ success: true, issue });
  } catch (err: any) {
    console.error("PATCH /api/admin/issues Error:", err);
    return NextResponse.json({ error: err.message || "Failed to update issue" }, { status: 500 });
  }
}

// DELETE /api/admin/issues - Delete Issue Report (Admin)
export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Issue ID parameter is required." }, { status: 400 });
    }

    await IssueReport.findByIdAndDelete(id);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error("DELETE /api/admin/issues Error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete issue" }, { status: 500 });
  }
}
