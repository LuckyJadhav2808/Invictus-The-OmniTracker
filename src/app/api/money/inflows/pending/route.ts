import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { PendingInflow } from "@/models/PendingInflow";
import { Transaction } from "@/models/Transaction";
import { Category } from "@/models/Category";

const ADMIN_UID = "user_1kapw9sad_1784744868999";
const LEGACY_ADMIN_UID = "user-admin-default";

function getTargetUserIds(userId: string) {
  if (userId === ADMIN_UID || userId === LEGACY_ADMIN_UID) {
    return [ADMIN_UID, LEGACY_ADMIN_UID];
  }
  return [userId];
}

// GET /api/money/inflows/pending?userId=xxx
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "UserId is required" }, { status: 400 });
    }

    const targetUserIds = getTargetUserIds(userId);
    const pendingInflows = await PendingInflow.find({
      userId: { $in: targetUserIds },
      status: "pending",
    }).sort({ createdAt: -1 });

    return NextResponse.json(pendingInflows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/money/inflows/pending (Approve / Confirm or Dismiss)
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, userId, action, categoryId, note } = body;

    if (!id || !userId || !action) {
      return NextResponse.json(
        { error: "id, userId, and action are required." },
        { status: 400 }
      );
    }

    const targetUserIds = getTargetUserIds(userId);
    const inflow = await PendingInflow.findOne({
      id,
      userId: { $in: targetUserIds },
    });

    if (!inflow) {
      return NextResponse.json({ error: "Pending inflow not found" }, { status: 404 });
    }

    if (action === "dismiss") {
      inflow.status = "dismissed";
      await inflow.save();
      return NextResponse.json({
        success: true,
        message: "Inflow dismissed without logging to ledger.",
        inflowId: id,
      });
    }

    if (action === "approve") {
      // Find category or fallback to salary/income
      let resolvedCatId = categoryId;
      if (!resolvedCatId) {
        const userCat = await Category.findOne({
          userId: { $in: targetUserIds },
          type: "income",
          archived: { $ne: true },
        });
        resolvedCatId = userCat ? userCat.id : "cat-salary";
      }

      const txId = `tx_inflow_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const noteText = note || `${inflow.merchant}${inflow.bankName ? ` (${inflow.bankName})` : ""}`;

      const newTx = await Transaction.create({
        id: txId,
        userId,
        categoryId: resolvedCatId,
        amount: inflow.amount,
        type: "income",
        date: inflow.date,
        note: noteText,
        paymentMethod: "UPI",
        source: "bank_sms",
        dedupSignature: inflow.dedupSignature,
        sourceMetadata: {
          bankName: inflow.bankName,
          accountMasked: inflow.accountLast4 ? `XX${inflow.accountLast4}` : undefined,
          rawSender: inflow.rawSender,
        },
      });

      inflow.status = "approved";
      await inflow.save();

      return NextResponse.json(
        {
          success: true,
          message: `Logged ₹${inflow.amount.toLocaleString()} income to your ledger! 🎉`,
          transaction: newTx,
          inflowId: id,
        },
        { status: 201 }
      );
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/money/inflows/pending?id=xxx&userId=yyy
export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json({ error: "id and userId required" }, { status: 400 });
    }

    const targetUserIds = getTargetUserIds(userId);
    await PendingInflow.findOneAndDelete({ id, userId: { $in: targetUserIds } });

    return NextResponse.json({ success: true, message: "Inflow deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
