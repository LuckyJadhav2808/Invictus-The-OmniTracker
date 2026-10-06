import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";

export const dynamic = "force-dynamic";

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
      const validDocs = [];

      for (let idx = 0; idx < transactions.length; idx++) {
        const t = transactions[idx];
        const numAmount = Number(t.amount);
        if (isNaN(numAmount) || numAmount <= 0) continue;

        validDocs.push({
          id: t.id || `tx_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          userId,
          amount: Math.round(numAmount * 100) / 100,
          type: t.type === "income" ? "income" : "expense",
          categoryId: t.categoryId || "cat-food",
          date: t.date || today,
          note: typeof t.note === "string" ? t.note.slice(0, 500) : "",
          paymentMethod: typeof t.paymentMethod === "string" ? t.paymentMethod.slice(0, 50) : "UPI",
        });
      }

      if (validDocs.length === 0) {
        return NextResponse.json({ error: "No valid transactions with positive amounts provided" }, { status: 400 });
      }

      const created = await Transaction.insertMany(validDocs, { ordered: false });
      return NextResponse.json({ success: true, count: created.length, transactions: created }, { status: 201 });
    }

    // 2. Single Transaction Insertion (Backwards Compatible)
    if (!body.userId || body.amount === undefined || !body.categoryId) {
      return NextResponse.json({ error: "UserId, categoryId, and amount are required" }, { status: 400 });
    }

    const numAmount = Number(body.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];
    const newTx = await Transaction.create({
      id: body.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: body.userId,
      amount: Math.round(numAmount * 100) / 100,
      type: body.type === "income" ? "income" : "expense",
      categoryId: body.categoryId,
      date: body.date || today,
      note: typeof body.note === "string" ? body.note.slice(0, 500) : "",
      paymentMethod: typeof body.paymentMethod === "string" ? body.paymentMethod.slice(0, 50) : "UPI",
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
    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
      }
      updateFields.amount = Math.round(numAmount * 100) / 100;
    }
    if (type !== undefined) {
      if (type !== "income" && type !== "expense") {
        return NextResponse.json({ error: "Type must be income or expense" }, { status: 400 });
      }
      updateFields.type = type;
    }
    if (categoryId !== undefined) updateFields.categoryId = String(categoryId);
    if (date !== undefined) updateFields.date = String(date);
    if (note !== undefined) updateFields.note = typeof note === "string" ? note.slice(0, 500) : "";
    if (paymentMethod !== undefined) updateFields.paymentMethod = typeof paymentMethod === "string" ? paymentMethod.slice(0, 50) : "UPI";

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
