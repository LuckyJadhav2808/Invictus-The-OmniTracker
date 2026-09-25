import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { Category } from "@/models/Category";
import { PendingInflow } from "@/models/PendingInflow";

const ADMIN_UID = "user_1kapw9sad_1784744868999";
const LEGACY_ADMIN_UID = "user-admin-default";

function getTargetUserIds(userId: string) {
  if (userId === ADMIN_UID || userId === LEGACY_ADMIN_UID) {
    return [ADMIN_UID, LEGACY_ADMIN_UID];
  }
  return [userId];
}

// POST /api/money/auto-sync
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const {
      userId,
      amount,
      type = "expense",
      merchant,
      categorySuggestion,
      date,
      accountLast4,
      bankName,
      dedupSignature,
      rawSender,
    } = body;

    if (!userId || !amount || !merchant || !date) {
      return NextResponse.json(
        { error: "Missing required fields: userId, amount, merchant, and date are required." },
        { status: 400 }
      );
    }

    const targetUserIds = getTargetUserIds(userId);

    // 1. Deduplication Check via dedupSignature (in Transactions or Pending Inflows)
    if (dedupSignature) {
      const existingTx = await Transaction.findOne({
        userId: { $in: targetUserIds },
        dedupSignature,
      });

      if (existingTx) {
        return NextResponse.json({
          success: true,
          actionTaken: "duplicate_ignored",
          message: "Transaction already recorded (idempotent skipped).",
          transaction: existingTx,
        });
      }

      const existingInflow = await PendingInflow.findOne({
        userId: { $in: targetUserIds },
        dedupSignature,
      });

      if (existingInflow) {
        return NextResponse.json({
          success: true,
          actionTaken: "duplicate_ignored",
          message: "Inflow already queued for your review.",
          pendingInflow: existingInflow,
        });
      }
    }

    // Secondary duplicate safety check (same date, same amount, similar note)
    const recentDuplicate = await Transaction.findOne({
      userId: { $in: targetUserIds },
      date,
      amount: Number(amount),
      type,
      note: { $regex: new RegExp(merchant.replace(/[^a-zA-Z0-9]/g, ".*"), "i") },
    });

    if (recentDuplicate) {
      return NextResponse.json({
        success: true,
        actionTaken: "duplicate_ignored",
        message: "Identical transaction already exists for today.",
        transaction: recentDuplicate,
      });
    }

    // 2. FOR CREDITS / INCOME: Route to Manual Review Queue (prevents fake income & self-transfer inflation)
    if (type === "income") {
      const inflowId = `inflow_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const pendingInflow = await PendingInflow.create({
        id: inflowId,
        userId,
        amount: Number(amount),
        merchant,
        date,
        bankName: bankName || "Bank",
        accountLast4,
        rawSender,
        dedupSignature: dedupSignature || `sms_${inflowId}`,
        status: "pending",
      });

      return NextResponse.json(
        {
          success: true,
          actionTaken: "queued_for_review",
          isIncomeReview: true,
          message: `Inflow of ₹${Number(amount).toLocaleString()} from ${merchant} queued for your review in Money Space! 📥`,
          pendingInflow,
        },
        { status: 201 }
      );
    }

    // 3. FOR DEBITS / EXPENSES: Auto-Log Directly with Historical Contact Memory
    let categoryId: string | undefined;
    let isHistoricalMatch = false;

    // A) Check past transactions for this user with matching merchant/person name
    const pastTx = await Transaction.findOne({
      userId: { $in: targetUserIds },
      note: { $regex: new RegExp(merchant.replace(/[^a-zA-Z0-9]/g, ".*"), "i") },
      categoryId: { $exists: true, $ne: "" },
    }).sort({ createdAt: -1 });

    if (pastTx && pastTx.categoryId) {
      categoryId = pastTx.categoryId;
      isHistoricalMatch = true;
    }

    // B) If no historical record, resolve via categorySuggestion or P2P Transfers
    const userCategories = await Category.find({
      userId: { $in: targetUserIds },
      archived: { $ne: true },
    });

    if (!categoryId) {
      let matchedCategory = userCategories.find(
        (c) =>
          categorySuggestion &&
          c.name.toLowerCase().includes(categorySuggestion.toLowerCase())
      );

      // If categorySuggestion was generic, check for dedicated P2P / Transfers category
      if (!matchedCategory || categorySuggestion === "Shopping & Wants") {
        const p2pCategory = userCategories.find(
          (c) =>
            c.name.toLowerCase().includes("p2p") ||
            c.name.toLowerCase().includes("transfer") ||
            c.name.toLowerCase().includes("personal")
        );
        if (p2pCategory) {
          matchedCategory = p2pCategory;
        }
      }

      if (!matchedCategory) {
        matchedCategory = userCategories.find((c) => c.type === type);
      }

      categoryId = matchedCategory?.id;

      // Fallback default category if user has no matching categories
      if (!categoryId) {
        const fallbackId = type === "income" ? "cat-salary" : "cat-food";
        categoryId = fallbackId;
      }
    }

    // 3. Create Transaction
    const txId = `tx_sms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const noteText = `${merchant}${bankName ? ` (${bankName})` : ""}`;

    const newTx = await Transaction.create({
      id: txId,
      userId,
      categoryId,
      amount: Number(amount),
      type,
      date,
      note: noteText,
      paymentMethod: "UPI",
      source: "bank_sms",
      dedupSignature: dedupSignature || `sms_${txId}`,
      sourceMetadata: {
        bankName: bankName || "Bank",
        accountMasked: accountLast4 ? `XX${accountLast4}` : undefined,
        rawSender: rawSender || "SMS",
      },
    });

    return NextResponse.json(
      {
        success: true,
        actionTaken: "created",
        isHistoricalMatch,
        message: isHistoricalMatch
          ? `Auto-categorized "${merchant}" based on your past preference!`
          : "Auto-logged transaction successfully from Bank SMS!",
        transaction: newTx,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Auto-sync SMS error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
