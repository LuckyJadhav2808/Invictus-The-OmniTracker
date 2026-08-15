import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { StreakFreezeModel } from "@/models/StreakFreeze";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "user-admin-default";

    await connectToDatabase();

    const currentMonthStr = format(new Date(), "yyyy-MM");
    let streakFreeze = await StreakFreezeModel.findOne({ userId });

    if (!streakFreeze) {
      streakFreeze = await StreakFreezeModel.create({
        userId,
        tokensAvailable: 1,
        lastMonthlyCredit: currentMonthStr,
        frozenDates: [],
      });
    } else {
      // Monthly Token Auto-Credit Check
      if (streakFreeze.lastMonthlyCredit !== currentMonthStr) {
        streakFreeze.tokensAvailable = Math.min(2, streakFreeze.tokensAvailable + 1);
        streakFreeze.lastMonthlyCredit = currentMonthStr;
        await streakFreeze.save();
      }
    }

    return NextResponse.json({
      success: true,
      streakFreeze: {
        userId: streakFreeze.userId,
        tokensAvailable: streakFreeze.tokensAvailable,
        lastMonthlyCredit: streakFreeze.lastMonthlyCredit,
        frozenDates: streakFreeze.frozenDates || [],
      },
    });
  } catch (err: any) {
    console.error("Streak Freeze GET API Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch streak freeze status" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId = "user-admin-default", action, frozenDate } = body;

    await connectToDatabase();

    let streakFreeze = await StreakFreezeModel.findOne({ userId });

    if (!streakFreeze) {
      streakFreeze = await StreakFreezeModel.create({
        userId,
        tokensAvailable: 1,
        lastMonthlyCredit: format(new Date(), "yyyy-MM"),
        frozenDates: [],
      });
    }

    if (action === "freeze_date" && frozenDate) {
      if (streakFreeze.tokensAvailable <= 0) {
        return NextResponse.json(
          { error: "No Streak Freeze tokens available! Earn tokens via monthly login or milestone levels." },
          { status: 400 }
        );
      }

      if (!streakFreeze.frozenDates.includes(frozenDate)) {
        streakFreeze.frozenDates.push(frozenDate);
        streakFreeze.tokensAvailable = Math.max(0, streakFreeze.tokensAvailable - 1);
        await streakFreeze.save();
      }
    } else if (action === "award_bonus_token") {
      streakFreeze.tokensAvailable = Math.min(2, streakFreeze.tokensAvailable + 1);
      await streakFreeze.save();
    }

    return NextResponse.json({
      success: true,
      streakFreeze: {
        userId: streakFreeze.userId,
        tokensAvailable: streakFreeze.tokensAvailable,
        lastMonthlyCredit: streakFreeze.lastMonthlyCredit,
        frozenDates: streakFreeze.frozenDates || [],
      },
    });
  } catch (err: any) {
    console.error("Streak Freeze POST API Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update streak freeze status" },
      { status: 500 }
    );
  }
}
