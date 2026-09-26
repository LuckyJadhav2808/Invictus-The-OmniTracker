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

async function processSingleItem(item: any) {
  const {
    userId,
    amount,
    type = "expense",
    merchant,
    categorySuggestion,
    categoryId: explicitCategoryId,
    date,
    accountLast4,
    bankName,
    dedupSignature,
    rawSender,
  } = item;

  if (!userId || !amount || !merchant || !date) {
    return {
      error: "Missing required fields: userId, amount, merchant, and date are required.",
      status: 400,
    };
  }

  const targetUserIds = getTargetUserIds(userId);

  // 1. Deduplication Check via dedupSignature (in Transactions or Pending Inflows)
  if (dedupSignature) {
    const existingTx = await Transaction.findOne({
      userId: { $in: targetUserIds },
      dedupSignature,
    });

    if (existingTx) {
      return {
        success: true,
        actionTaken: "duplicate_ignored",
        message: "Transaction already recorded (idempotent skipped).",
        transaction: existingTx,
        status: 200,
      };
    }

    const existingInflow = await PendingInflow.findOne({
      userId: { $in: targetUserIds },
      dedupSignature,
    });

    if (existingInflow) {
      return {
        success: true,
        actionTaken: "duplicate_ignored",
        message: "Inflow already queued for your review.",
        pendingInflow: existingInflow,
        status: 200,
      };
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
    return {
      success: true,
      actionTaken: "duplicate_ignored",
      message: "Identical transaction already exists for today.",
      transaction: recentDuplicate,
      status: 200,
    };
  }

  // 2. FOR CREDITS / INCOME: Route to Manual Review Queue
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

    return {
      success: true,
      actionTaken: "queued_for_review",
      isIncomeReview: true,
      message: `Inflow of ₹${Number(amount).toLocaleString()} from ${merchant} queued for review! 📥`,
      pendingInflow,
      status: 201,
    };
  }

  // 3. FOR DEBITS / EXPENSES: Auto-Log Directly with Historical Contact Memory
  let categoryId: string | undefined = explicitCategoryId;
  let isHistoricalMatch = false;

  if (!categoryId) {
    const pastTx = await Transaction.findOne({
      userId: { $in: targetUserIds },
      note: { $regex: new RegExp(merchant.replace(/[^a-zA-Z0-9]/g, ".*"), "i") },
      categoryId: { $exists: true, $ne: "" },
    }).sort({ createdAt: -1 });

    if (pastTx && pastTx.categoryId) {
      categoryId = pastTx.categoryId;
      isHistoricalMatch = true;
    }
  }

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

    if (!categoryId) {
      const fallbackId = type === "income" ? "cat-salary" : "cat-food";
      categoryId = fallbackId;
    }
  }

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

  return {
    success: true,
    actionTaken: "created",
    isHistoricalMatch,
    message: isHistoricalMatch
      ? `Auto-categorized "${merchant}" based on your past preference!`
      : "Auto-logged transaction successfully from Bank SMS!",
    transaction: newTx,
    status: 201,
  };
}

// POST /api/money/auto-sync
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // Check for batch mode
    if (body.items && Array.isArray(body.items)) {
      const results: any[] = [];
      let createdCount = 0;
      let reviewCount = 0;
      let duplicateCount = 0;

      for (const item of body.items) {
        const res = await processSingleItem(item);
        if (res.actionTaken === "created") createdCount++;
        else if (res.actionTaken === "queued_for_review") reviewCount++;
        else if (res.actionTaken === "duplicate_ignored") duplicateCount++;
        results.push(res);
      }

      return NextResponse.json({
        success: true,
        batch: true,
        createdCount,
        reviewCount,
        duplicateCount,
        results,
      });
    }

    // Single item mode
    const res = await processSingleItem(body);
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: res.status || 400 });
    }
    return NextResponse.json(res, { status: res.status || 200 });
  } catch (error: any) {
    console.error("Auto-sync SMS error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
