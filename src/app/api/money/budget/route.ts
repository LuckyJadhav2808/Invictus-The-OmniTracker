import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getCustomSession } from "@/lib/custom-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const session = await getCustomSession();
    const userId = searchParams.get("userId") || session?.uid;

    if (!userId) {
      return NextResponse.json({ error: "UserId required" }, { status: 400 });
    }

    const user = await User.findOne({
      $or: [{ uid: userId }, { email: "luckymanojjadhav@gmail.com" }],
    });

    if (!user) {
      return NextResponse.json({
        budgetPreferences: {
          upiBudget: 0,
          cashBudget: 0,
          monthlyBudget: 0,
          customDailyBudget: null,
          enableRollover: true,
          budgetViewMode: "monthly",
          smsReaderEnabled: false,
        },
      });
    }

    return NextResponse.json({
      budgetPreferences: user.budgetPreferences || {
        upiBudget: 0,
        cashBudget: 0,
        monthlyBudget: 0,
        customDailyBudget: null,
        enableRollover: true,
        budgetViewMode: "monthly",
        smsReaderEnabled: false,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const session = await getCustomSession();
    const body = await req.json();
    const userId = body.userId || session?.uid;

    if (!userId) {
      return NextResponse.json({ error: "UserId required" }, { status: 400 });
    }

    const {
      upiBudget = 0,
      cashBudget = 0,
      monthlyBudget = 0,
      customDailyBudget = null,
      enableRollover = true,
      budgetViewMode = "monthly",
      smsReaderEnabled = false,
    } = body;

    const updatedUser = await User.findOneAndUpdate(
      { $or: [{ uid: userId }, { email: "luckymanojjadhav@gmail.com" }] },
      {
        $set: {
          budgetPreferences: {
            upiBudget: Number(upiBudget) || 0,
            cashBudget: Number(cashBudget) || 0,
            monthlyBudget: Number(monthlyBudget) || Number(upiBudget) + Number(cashBudget),
            customDailyBudget: customDailyBudget !== null ? Number(customDailyBudget) : null,
            enableRollover: Boolean(enableRollover),
            budgetViewMode: budgetViewMode === "daily" ? "daily" : "monthly",
            smsReaderEnabled: Boolean(smsReaderEnabled),
          },
        },
      },
      { new: true, upsert: false }
    );

    return NextResponse.json({
      success: true,
      budgetPreferences: updatedUser?.budgetPreferences,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  return POST(req);
}
