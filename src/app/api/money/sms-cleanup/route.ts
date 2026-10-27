import { NextResponse } from "next/server";
import { connectToDatabase, resolveDatabaseForRequest, assertDatabaseSafety } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { Category } from "@/models/Category";

export const dynamic = "force-dynamic";

const DEFAULT_CORE_CATEGORY_IDS = [
  "cat-food",
  "cat-groceries",
  "cat-transport",
  "cat-health",
  "cat-shopping",
  "cat-education",
  "cat-bills",
  "cat-leisure",
  "cat-rent",
  "cat-salary",
  "cat-allowance",
  "cat-freelance",
  "cat-general",
  "cat-transfers",
];

// POST /api/money/sms-cleanup
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "UserId is required" }, { status: 400 });
    }

    // AIR-GAP: Guest or demo accounts
    if (userId === "guest-user" || (typeof userId === "string" && userId.startsWith("demo_"))) {
      return NextResponse.json({
        success: true,
        deletedTransactionsCount: 0,
        deletedCategoriesCount: 0,
      });
    }

    const dbContext = resolveDatabaseForRequest(req, userId);
    assertDatabaseSafety(dbContext.targetDb, userId);
    await connectToDatabase({ dbName: dbContext.targetDb });

    const targetUserIds =
      userId === "user-admin-default" || userId === "user_1kapw9sad_1784744868999"
        ? ["user-admin-default", "user_1kapw9sad_1784744868999"]
        : [userId];

    // 1. Purge all bank_sms transactions for this user
    const txDeleteResult = await Transaction.deleteMany({
      userId: { $in: targetUserIds },
      source: "bank_sms",
    });

    // 2. Purge auto-provisioned merchant categories, preserving default core categories
    const catDeleteResult = await Category.deleteMany({
      userId: { $in: targetUserIds },
      id: { $nin: DEFAULT_CORE_CATEGORY_IDS },
    });

    return NextResponse.json({
      success: true,
      deletedTransactionsCount: txDeleteResult.deletedCount || 0,
      deletedCategoriesCount: catDeleteResult.deletedCount || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to purge SMS data" }, { status: 500 });
  }
}
