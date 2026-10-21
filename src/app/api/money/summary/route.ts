import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { MonthlyFinancialRollup } from "@/models/MonthlyFinancialRollup";
import { Transaction } from "@/models/Transaction";
import { format, endOfMonth, parseISO, getDate } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const currentMonthKey = searchParams.get("month") || format(new Date(), "yyyy-MM");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Check pre-computed rollup first (0ms instantaneous lookup)
    let rollup = await MonthlyFinancialRollup.findOne({
      userId,
      monthKey: currentMonthKey,
    });

    // 2. If no rollup exists or explicitly requested fresh, compute and cache it
    if (!rollup) {
      const transactions = await Transaction.find({
        userId,
        date: { $regex: `^${currentMonthKey}` },
      });

      let totalIncome = 0;
      let totalExpense = 0;

      transactions.forEach((tx: any) => {
        const amt = Number(tx.amount) || 0;
        if (tx.type === "income") {
          totalIncome += amt;
        } else if (tx.type === "expense") {
          totalExpense += amt;
        }
      });

      const netCashflow = totalIncome - totalExpense;

      // Compute daily remaining allowance
      const now = new Date();
      let daysRemaining = 1;
      try {
        const monthDate = parseISO(`${currentMonthKey}-01`);
        const totalDaysInMonth = getDate(endOfMonth(monthDate));
        const currentDayNum = getDate(now);
        daysRemaining = Math.max(1, totalDaysInMonth - currentDayNum + 1);
      } catch {
        daysRemaining = 1;
      }

      const dailyAllowanceRemaining =
        netCashflow > 0 ? Math.round(netCashflow / daysRemaining) : 0;

      rollup = await MonthlyFinancialRollup.findOneAndUpdate(
        { userId, monthKey: currentMonthKey },
        {
          $set: {
            userId,
            monthKey: currentMonthKey,
            totalIncome,
            totalExpense,
            netCashflow,
            dailyAllowanceRemaining,
            transactionCount: transactions.length,
          },
        },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({
      success: true,
      data: rollup,
      cached: Boolean(rollup),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load financial rollup" },
      { status: 500 }
    );
  }
}
