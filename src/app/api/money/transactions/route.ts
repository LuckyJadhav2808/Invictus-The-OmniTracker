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

    const targetUserIds = (userId === "user-admin-default" || userId === "user_1kapw9sad_1784744868999")
      ? ["user-admin-default", "user_1kapw9sad_1784744868999"]
      : [userId];

    const txs = await Transaction.find({ userId: { $in: targetUserIds } }).sort({ date: -1 });
    return NextResponse.json(txs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/money/transactions (Supports single or bulk transactions)
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // 1. Bulk Transactions Insertion
    if (body.transactions && Array.isArray(body.transactions)) {
      const { userId, transactions } = body;
      if (!userId) {
        return NextResponse.json({ error: "UserId is required for bulk transactions" }, { status: 400 });
      }

      if (transactions.length === 0) {
        return NextResponse.json({ success: true, count: 0, transactions: [] }, { status: 200 });
      }

      const today = new Date().toISOString().split("T")[0];
      const docs = transactions.map((t: any, idx: number) => ({
        id: t.id || `tx_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        userId,
        amount: Number(t.amount),
        type: t.type || "expense",
        categoryId: t.categoryId,
        date: t.date || today,
        note: t.note || "",
        paymentMethod: t.paymentMethod || "UPI",
      }));

      const created = await Transaction.insertMany(docs, { ordered: false });
      return NextResponse.json({ success: true, count: created.length, transactions: created }, { status: 201 });
    }

    // 2. Single Transaction Insertion (Backwards Compatible)
    if (!body.userId || body.amount === undefined || !body.categoryId) {
      return NextResponse.json({ error: "UserId, categoryId, and amount are required" }, { status: 400 });
    }

    const newTx = await Transaction.create({
      ...body,
      id: body.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      amount: Number(body.amount),
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
