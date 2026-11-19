import { NextResponse } from "next/server";
import { connectToDatabase, resolveDatabaseForRequest, assertDatabaseSafety } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { Category } from "@/models/Category";
import { parseBankSms } from "@/lib/sms/sms-local-parser";
import { detectCategoryFromNote } from "@/lib/utils/merchant-categorizer";
import { resolveExpenseCategoryId } from "@/lib/utils/resolve-category";

export const dynamic = "force-dynamic";

const ADMIN_UID = "user_1kapw9sad_1784744868999";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { text, sender, timestamp, userId = ADMIN_UID } = body;

    // ─── AMBIENT MICRO-DIALOG / DIRECT QUICK-LOG BYPASS ───
    if (
      body.amount !== undefined &&
      (body.rawSender === "AmbientMicroDialog" || body.merchant || body.category)
    ) {
      const numAmount = Number(body.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return NextResponse.json({ error: "Invalid quick-log amount" }, { status: 400 });
      }

      const targetUserId = userId || ADMIN_UID;
      const today = new Date().toISOString().split("T")[0];
      const note = (typeof body.merchant === "string" && body.merchant.trim().length > 0)
        ? body.merchant.trim()
        : (typeof body.category === "string" ? body.category : "Quick Expense");
      const dedupSignature = body.dedupSignature || `ambient_${targetUserId}_${body.date || today}_${numAmount}_${note}`;

      // Air-gap guest accounts from modifying production DB
      if (targetUserId === "guest-user" || (typeof targetUserId === "string" && targetUserId.startsWith("demo_"))) {
        return NextResponse.json({
          success: true,
          isGuest: true,
          transaction: {
            id: `tx_${Date.now()}_guest`,
            userId: targetUserId,
            amount: Math.round(numAmount * 100) / 100,
            type: "expense",
            merchant: note,
            paymentMethod: body.paymentMethod || "UPI",
            date: body.date || today,
            dedupSignature,
          },
        });
      }

      const dbContext = resolveDatabaseForRequest(req, targetUserId);
      assertDatabaseSafety(dbContext.targetDb, targetUserId);
      await connectToDatabase({ dbName: dbContext.targetDb });

      // Deduplication check
      const existing = await Transaction.findOne({
        userId: targetUserId,
        dedupSignature,
      });

      if (existing) {
        return NextResponse.json({
          success: true,
          isDuplicate: true,
          message: "Transaction already recorded in ledger.",
          transaction: existing,
        });
      }

      // Category matching: strictly resolve to expense category (never income like Salary)
      const userCategories = await Category.find({ userId: targetUserId, archived: { $ne: true } });
      const categoryId = resolveExpenseCategoryId(body.category, note, userCategories);

      const txId = `tx_quick_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newTx = await Transaction.create({
        id: txId,
        userId: targetUserId,
        amount: Math.round(numAmount * 100) / 100,
        type: "expense",
        categoryId,
        date: body.date || today,
        note,
        paymentMethod: body.paymentMethod || "UPI",
        source: "ambient_quick_log",
        dedupSignature,
        sourceMetadata: {
          bankName: body.bankName || "Cash/QuickLog",
          accountMasked: body.accountLast4 || "MANUAL",
          rawSender: body.rawSender || "AmbientMicroDialog",
        },
      });

      return NextResponse.json({
        success: true,
        transaction: newTx,
      }, { status: 201 });
    }

    // ─── BANK SMS PAYLOAD PROCESSING ───
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "SMS text payload is required" }, { status: 400 });
    }

    // 1. Zero-Knowledge Local Parsing
    const parsed = parseBankSms(text, sender, timestamp);
    if (!parsed) {
      return NextResponse.json({
        dropped: true,
        message: "Message dropped by security air-gap (OTP, credit inflow, failed transaction, or non-bank SMS).",
      });
    }

    // 2. Air-gap guest accounts from modifying production DB
    if (userId === "guest-user" || (typeof userId === "string" && userId.startsWith("demo_"))) {
      return NextResponse.json({
        success: true,
        isGuest: true,
        transaction: {
          id: `tx_${Date.now()}_guest`,
          userId,
          amount: parsed.amount,
          type: "expense",
          merchant: parsed.merchant,
          paymentMethod: parsed.paymentMethod,
          date: parsed.date,
          dedupSignature: parsed.dedupSignature,
        },
      });
    }

    // 3. Database Connection & Safety Guard
    const dbContext = resolveDatabaseForRequest(req, userId);
    assertDatabaseSafety(dbContext.targetDb, userId);
    await connectToDatabase({ dbName: dbContext.targetDb });

    // 4. Idempotency Check: Avoid Duplicate Insertions
    const existing = await Transaction.findOne({
      userId,
      dedupSignature: parsed.dedupSignature,
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        isDuplicate: true,
        message: "Transaction already recorded in ledger.",
        transaction: existing,
      });
    }

    // 5. Intelligent Category Assignment (strictly expense category)
    const userCategories = await Category.find({ userId, archived: { $ne: true } });
    const categoryId = resolveExpenseCategoryId(undefined, parsed.merchant, userCategories);

    // 6. Create Transaction
    const txId = `tx_sms_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTx = await Transaction.create({
      id: txId,
      userId,
      amount: parsed.amount,
      type: "expense",
      categoryId,
      date: parsed.date,
      note: parsed.merchant,
      paymentMethod: parsed.paymentMethod,
      source: "bank_sms",
      dedupSignature: parsed.dedupSignature,
      sourceMetadata: {
        bankName: parsed.bankName,
        accountMasked: parsed.accountMasked,
        rawSender: sender || parsed.bankName,
      },
    });

    return NextResponse.json({
      success: true,
      transaction: newTx,
      parsed: {
        amount: parsed.amount,
        merchant: parsed.merchant,
        paymentMethod: parsed.paymentMethod,
        bank: parsed.bankName,
        referenceId: parsed.referenceId,
      },
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process SMS webhook" }, { status: 500 });
  }
}
