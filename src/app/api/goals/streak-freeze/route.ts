import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { StreakFreezeModel } from "@/models/StreakFreeze";
import { Habit } from "@/models/Habit";
import { HabitLog } from "@/models/HabitLog";
import { evaluateAutonomousStreakFreeze } from "@/lib/utils/streaks";
import { format, subDays } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "user-admin-default";

    await connectToDatabase();

    const currentMonthStr = format(new Date(), "yyyy-MM");
    const targetUserIds = (userId === "user-admin-default" || userId === "user_1kapw9sad_1784744868999")
      ? ["user-admin-default", "user_1kapw9sad_1784744868999"]
      : [userId];

    let streakFreeze = await StreakFreezeModel.findOne({ userId: { $in: targetUserIds } });

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

    // 🛡️ Autonomous Streak Freeze Shield Evaluation
    // If the user missed yesterday and holds freeze tokens, automatically deploy the shield!
    let autoShieldEvent: any = null;

    if (streakFreeze.tokensAvailable > 0) {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const sevenDaysAgoStr = format(subDays(new Date(), 7), "yyyy-MM-dd");

      const habits = await Habit.find({
        userId: { $in: targetUserIds },
        archived: { $ne: true },
      }).lean();

      if (habits.length > 0) {
        const recentLogs = await HabitLog.find({
          userId: { $in: targetUserIds },
          date: { $gte: sevenDaysAgoStr, $lte: todayStr },
          completed: true,
        }).lean();

        const shieldResult = evaluateAutonomousStreakFreeze({
          habits: habits.map((h: any) => ({
            id: h.id || h._id.toString(),
            title: h.title,
            frequency: h.frequency,
            archived: h.archived,
          })),
          completedLogs: recentLogs.map((l: any) => ({
            habitId: l.habitId,
            date: l.date,
            completed: l.completed,
          })),
          streakFreeze: {
            tokensAvailable: streakFreeze.tokensAvailable,
            frozenDates: streakFreeze.frozenDates || [],
          },
          referenceDateStr: todayStr,
        });

        if (shieldResult.shielded) {
          streakFreeze.tokensAvailable = shieldResult.newTokensAvailable;
          streakFreeze.frozenDates = shieldResult.newFrozenDates;
          await streakFreeze.save();

          autoShieldEvent = {
            shielded: true,
            tokensConsumed: shieldResult.tokensConsumed,
            newlyFrozenDates: shieldResult.newlyFrozenDates,
            affectedHabitIds: shieldResult.affectedHabitIds,
            message: shieldResult.message,
          };
        }
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
      autoShieldEvent,
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

    const targetUserIds = (userId === "user-admin-default" || userId === "user_1kapw9sad_1784744868999")
      ? ["user-admin-default", "user_1kapw9sad_1784744868999"]
      : [userId];

    let streakFreeze = await StreakFreezeModel.findOne({ userId: { $in: targetUserIds } });

    if (!streakFreeze) {
      streakFreeze = await StreakFreezeModel.create({
        userId,
        tokensAvailable: 1,
        lastMonthlyCredit: format(new Date(), "yyyy-MM"),
        frozenDates: [],
      });
    }

    let autoShieldEvent: any = null;

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
    } else if (action === "evaluate_auto_shield") {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const sevenDaysAgoStr = format(subDays(new Date(), 7), "yyyy-MM-dd");

      const habits = await Habit.find({
        userId: { $in: targetUserIds },
        archived: { $ne: true },
      }).lean();

      const recentLogs = await HabitLog.find({
        userId: { $in: targetUserIds },
        date: { $gte: sevenDaysAgoStr, $lte: todayStr },
        completed: true,
      }).lean();

      const shieldResult = evaluateAutonomousStreakFreeze({
        habits: habits.map((h: any) => ({
          id: h.id || h._id.toString(),
          title: h.title,
          frequency: h.frequency,
          archived: h.archived,
        })),
        completedLogs: recentLogs.map((l: any) => ({
          habitId: l.habitId,
          date: l.date,
          completed: l.completed,
        })),
        streakFreeze: {
          tokensAvailable: streakFreeze.tokensAvailable,
          frozenDates: streakFreeze.frozenDates || [],
        },
        referenceDateStr: todayStr,
      });

      if (shieldResult.shielded) {
        streakFreeze.tokensAvailable = shieldResult.newTokensAvailable;
        streakFreeze.frozenDates = shieldResult.newFrozenDates;
        await streakFreeze.save();

        autoShieldEvent = {
          shielded: true,
          tokensConsumed: shieldResult.tokensConsumed,
          newlyFrozenDates: shieldResult.newlyFrozenDates,
          affectedHabitIds: shieldResult.affectedHabitIds,
          message: shieldResult.message,
        };
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
      autoShieldEvent,
    });
  } catch (err: any) {
    console.error("Streak Freeze POST API Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update streak freeze status" },
      { status: 500 }
    );
  }
}
