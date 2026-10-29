import { NextResponse } from "next/server";
import { connectToDatabase, resolveDatabaseForRequest, assertDatabaseSafety } from "@/lib/mongodb";
import { User } from "@/models/User";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

const ADMIN_UIDS = ["user_1kapw9sad_1784744868999", "user-admin-default"];

function buildUserQuery(userId: string) {
  if (ADMIN_UIDS.includes(userId)) {
    return {
      $or: [
        { uid: { $in: ADMIN_UIDS } },
        { email: "luckymanojjadhav@gmail.com" },
      ],
    };
  }
  if (mongoose.Types.ObjectId.isValid(userId)) {
    return {
      $or: [{ uid: userId }, { _id: new mongoose.Types.ObjectId(userId) }],
    };
  }
  return { uid: userId };
}

const DEFAULT_BUDGET_PREFERENCES = {
  upiBudget: 8000,
  cashBudget: 2000,
  monthlyBudget: 10000,
  customDailyBudget: null,
  enableRollover: true,
  budgetViewMode: "monthly",
  smsReaderEnabled: false,
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "UserId is required for budget preferences" }, { status: 400 });
    }

    // AIR-GAP: Guest or demo accounts
    if (userId === "guest-user" || (typeof userId === "string" && userId.startsWith("demo_"))) {
      return NextResponse.json({
        budgetPreferences: DEFAULT_BUDGET_PREFERENCES,
      });
    }

    const dbContext = resolveDatabaseForRequest(req, userId);
    assertDatabaseSafety(dbContext.targetDb, userId);
    await connectToDatabase({ dbName: dbContext.targetDb });

    const query = buildUserQuery(userId);
    const user = await User.findOne(query);

    if (!user) {
      return NextResponse.json({
        budgetPreferences: DEFAULT_BUDGET_PREFERENCES,
      });
    }

    // If user document exists but has zeroed-out preferences, fall back to safe defaults
    const prefs = user.budgetPreferences;
    const isZeroed = !prefs || ((prefs.upiBudget ?? 0) === 0 && (prefs.cashBudget ?? 0) === 0 && (prefs.monthlyBudget ?? 0) === 0);

    const resolvedPreferences = isZeroed
      ? DEFAULT_BUDGET_PREFERENCES
      : {
          upiBudget: prefs.upiBudget ?? DEFAULT_BUDGET_PREFERENCES.upiBudget,
          cashBudget: prefs.cashBudget ?? DEFAULT_BUDGET_PREFERENCES.cashBudget,
          monthlyBudget: (prefs.monthlyBudget && prefs.monthlyBudget > 0)
            ? prefs.monthlyBudget
            : (prefs.upiBudget ?? 0) + (prefs.cashBudget ?? 0) || DEFAULT_BUDGET_PREFERENCES.monthlyBudget,
          customDailyBudget: prefs.customDailyBudget ?? null,
          enableRollover: prefs.enableRollover ?? true,
          budgetViewMode: prefs.budgetViewMode || "monthly",
          smsReaderEnabled: Boolean(prefs.smsReaderEnabled),
        };

    return NextResponse.json({
      budgetPreferences: resolvedPreferences,
    });
  } catch (error: any) {
    console.error("[API /api/money/budget GET error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json();
    const userId = body.userId || searchParams.get("userId") || req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "UserId is required to update budget preferences" }, { status: 400 });
    }

    // AIR-GAP: Guest or demo accounts stay local
    if (userId === "guest-user" || (typeof userId === "string" && userId.startsWith("demo_"))) {
      return NextResponse.json({
        success: true,
        budgetPreferences: {
          ...DEFAULT_BUDGET_PREFERENCES,
          ...body,
        },
      });
    }

    const dbContext = resolveDatabaseForRequest(req, userId);
    assertDatabaseSafety(dbContext.targetDb, userId);
    await connectToDatabase({ dbName: dbContext.targetDb });

    const {
      upiBudget = DEFAULT_BUDGET_PREFERENCES.upiBudget,
      cashBudget = DEFAULT_BUDGET_PREFERENCES.cashBudget,
      monthlyBudget,
      customDailyBudget = null,
      enableRollover = true,
      budgetViewMode = "monthly",
      smsReaderEnabled = false,
    } = body;

    const numUpi = Number(upiBudget) || 0;
    const numCash = Number(cashBudget) || 0;
    const numMonthly = Number(monthlyBudget) || (numUpi + numCash);

    const query = buildUserQuery(userId);

    const updatedUser = await User.findOneAndUpdate(
      query,
      {
        $set: {
          budgetPreferences: {
            upiBudget: numUpi,
            cashBudget: numCash,
            monthlyBudget: numMonthly,
            customDailyBudget: customDailyBudget !== null ? Number(customDailyBudget) : null,
            enableRollover: Boolean(enableRollover),
            budgetViewMode: budgetViewMode === "daily" ? "daily" : "monthly",
            smsReaderEnabled: Boolean(smsReaderEnabled),
          },
        },
      },
      { new: true, upsert: false }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User account not found to update budget preferences" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      budgetPreferences: updatedUser.budgetPreferences,
    });
  } catch (error: any) {
    console.error("[API /api/money/budget POST error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  return POST(req);
}
