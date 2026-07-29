import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";

// GET /api/money/transactions?userId=xxx
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "UserId is required" }, { status: 400 });
    }

    const txs = await Transaction.find({ userId }).sort({ date: -1 });
    return NextResponse.json(txs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/money/transactions
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.userId || !body.amount || !body.categoryId) {
      return NextResponse.json({ error: "UserId, categoryId, and amount are required" }, { status: 400 });
    }

    const newTx = await Transaction.create({
      id: body.id || `tx_${Date.now()}`,
      ...body,
    });

    return NextResponse.json(newTx, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/money/transactions - update transaction
export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, userId, amount, type, categoryId, date, note, paymentMethod } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: "Id and userId required" }, { status: 400 });
    }

    const updateFields: any = {};
    if (amount !== undefined) updateFields.amount = Number(amount);
    if (type !== undefined) updateFields.type = type;
    if (categoryId !== undefined) updateFields.categoryId = categoryId;
    if (date !== undefined) updateFields.date = date;
    if (note !== undefined) updateFields.note = note;
    if (paymentMethod !== undefined) updateFields.paymentMethod = paymentMethod;

    const updated = await Transaction.findOneAndUpdate(
      { id, userId },
      { $set: updateFields },
      { new: true }
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/money/transactions?id=xxx&userId=yyy
export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json({ error: "Id and userId required" }, { status: 400 });
    }

    await Transaction.deleteOne({ id, userId });
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
