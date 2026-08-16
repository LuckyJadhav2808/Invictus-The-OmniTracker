import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { PushSubscriptionModel } from "@/lib/models/push-subscription";

export async function POST(req: NextRequest) {
  try {
    const { userId, subscription, timezone, config } = await req.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
    }

    await connectToDatabase();

    const updateDoc: any = {
      userId: userId || "guest",
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    };

    if (timezone) updateDoc.timezone = timezone;
    if (config) {
      if (config.moneyEnabled !== undefined) updateDoc.moneyEnabled = config.moneyEnabled;
      if (config.moneyTime !== undefined) updateDoc.moneyTime = config.moneyTime;
      if (config.habitsEnabled !== undefined) updateDoc.habitsEnabled = config.habitsEnabled;
      if (config.habitsTime !== undefined) updateDoc.habitsTime = config.habitsTime;
      if (config.studyEnabled !== undefined) updateDoc.studyEnabled = config.studyEnabled;
      if (config.studyTime !== undefined) updateDoc.studyTime = config.studyTime;
      if (config.examEnabled !== undefined) updateDoc.examEnabled = config.examEnabled;
      if (config.examTime !== undefined) updateDoc.examTime = config.examTime;
      if (config.soundEnabled !== undefined) updateDoc.soundEnabled = config.soundEnabled;
    }

    await PushSubscriptionModel.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      updateDoc,
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, message: "Push subscription and reminder schedule saved to MongoDB" });
  } catch (err: any) {
    console.error("Push subscription error:", err);
    return NextResponse.json({ error: err?.message || "Failed to subscribe" }, { status: 500 });
  }
}
