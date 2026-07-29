import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { PushSubscriptionModel } from "@/lib/models/push-subscription";

export async function POST(req: NextRequest) {
  try {
    const { userId, subscription } = await req.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
    }

    await connectToDatabase();

    await PushSubscriptionModel.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        userId: userId || "guest",
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, message: "Push subscription saved to MongoDB" });
  } catch (err: any) {
    console.error("Push subscription error:", err);
    return NextResponse.json({ error: err?.message || "Failed to subscribe" }, { status: 500 });
  }
}
