import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DebtModel } from "@/models/Debt";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "user-admin-default";

    await connectToDatabase();

    const debts = await DebtModel.find({ userId }).sort({ createdAt: -1 });

    const formatted = debts.map((d) => ({
      id: d._id.toString(),
      userId: d.userId,
      personName: d.personName,
      type: d.type,
      amount: d.amount,
      dueDate: d.dueDate || "",
      note: d.note || "",
      status: d.status || "pending",
      settledAt: d.settledAt || "",
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, debts: formatted });
  } catch (err: any) {
    console.error("GET Debts API error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch debts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId = "user-admin-default", personName, type, amount, dueDate, note } = body;

    if (!personName || !type || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();

    const newDebt = await DebtModel.create({
      userId,
      personName: personName.trim(),
      type,
      amount: Number(amount),
      dueDate: dueDate || "",
      note: note || "",
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      debt: {
        id: newDebt._id.toString(),
        userId: newDebt.userId,
        personName: newDebt.personName,
        type: newDebt.type,
        amount: newDebt.amount,
        dueDate: newDebt.dueDate || "",
        note: newDebt.note || "",
        status: newDebt.status,
        createdAt: newDebt.createdAt.toISOString(),
        updatedAt: newDebt.updatedAt.toISOString(),
      },
    });
  } catch (err: any) {
    console.error("POST Debt API error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create debt record" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, personName, type, amount, dueDate, note, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Debt ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    const updateFields: any = {};
    if (personName !== undefined) updateFields.personName = personName.trim();
    if (type !== undefined) updateFields.type = type;
    if (amount !== undefined) updateFields.amount = Number(amount);
    if (dueDate !== undefined) updateFields.dueDate = dueDate;
    if (note !== undefined) updateFields.note = note;
    if (status !== undefined) {
      updateFields.status = status;
      if (status === "settled") {
        updateFields.settledAt = new Date().toISOString();
      } else {
        updateFields.settledAt = "";
      }
    }

    const updated = await DebtModel.findByIdAndUpdate(id, updateFields, { new: true });
    if (!updated) {
      return NextResponse.json({ error: "Debt record not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      debt: {
        id: updated._id.toString(),
        userId: updated.userId,
        personName: updated.personName,
        type: updated.type,
        amount: updated.amount,
        dueDate: updated.dueDate || "",
        note: updated.note || "",
        status: updated.status,
        settledAt: updated.settledAt || "",
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (err: any) {
    console.error("PUT Debt API error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update debt record" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Debt ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    await DebtModel.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE Debt API error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete debt record" },
      { status: 500 }
    );
  }
}
