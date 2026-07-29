import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { PushSubscriptionModel } from "@/lib/models/push-subscription";
import { webpush } from "@/lib/web-push-service";

export async function POST(req: NextRequest) {
  try {
    const { userId, title, body, url } = await req.json();

    await connectToDatabase();

    // 1. Try finding subscription for specific user
    let subscriptions = [];
    if (userId && userId !== "guest") {
      subscriptions = await PushSubscriptionModel.find({ userId });
    }

    // 2. Fallback: If no match or guest user, find any active subscriptions
    if (subscriptions.length === 0) {
      subscriptions = await PushSubscriptionModel.find({}).sort({ updatedAt: -1 }).limit(10);
    }

    if (subscriptions.length === 0) {
      return NextResponse.json({ error: "No active push subscriptions found on server" }, { status: 404 });
    }

    const payload = JSON.stringify({
      title: title || "🌱 Invictus Life Engine",
      body: body || "Time for your daily routine check-in!",
      url: url || "/goals",
    });

    let sentCount = 0;
    const errors: any[] = [];

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            payload
          );
          sentCount++;
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await PushSubscriptionModel.deleteOne({ _id: sub._id });
          } else {
            errors.push(err?.message);
          }
        }
      })
    );

    return NextResponse.json({
      success: true,
      sentCount,
      total: subscriptions.length,
      message: `Pushed ${sentCount} notifications successfully`,
    });
  } catch (err: any) {
    console.error("Send push error:", err);
    return NextResponse.json({ error: err?.message || "Failed to send push" }, { status: 500 });
  }
}
