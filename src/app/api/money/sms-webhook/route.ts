import { NextResponse } from "next/server";
import { connectToDatabase, resolveDatabaseForRequest, assertDatabaseSafety } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { Category } from "@/models/Category";
import { parseBankSms } from "@/lib/sms/sms-local-parser";
import { detectCategoryFromNote } from "@/lib/utils/merchant-categorizer";

export const dynamic = "force-dynamic";

const ADMIN_UID = "user_1kapw9sad_1784744868999";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { text, sender, timestamp, userId = ADMIN_UID } = body;

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

    // 5. Intelligent Category Assignment
    const userCategories = await Category.find({ userId, archived: { $ne: true } });
    let categoryId = "cat-food";

    if (userCategories.length > 0) {
      const match = detectCategoryFromNote(parsed.merchant, userCategories);
      if (match) {
        categoryId = match.categoryId;
      } else {
        const defaultCat = userCategories.find((c) => c.type === "expense") || userCategories[0];
        if (defaultCat) categoryId = defaultCat.id;
      }
    }

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
