import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Subscription } from "@/models/Subscription";

// GET /api/money/subscriptions?userId=xxx
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "UserId required for data isolation" }, { status: 400 });
    }

    const subs = await Subscription.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json(subs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/money/subscriptions - Create subscription
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { userId, name, cost, amount, billingCycle, renewalDate, nextRenewalDate, category, icon } = body;

    const finalName = name;
    const finalCost = cost !== undefined ? Number(cost) : amount !== undefined ? Number(amount) : 0;
    const finalRenewal = renewalDate || nextRenewalDate || new Date().toISOString().split("T")[0];

    if (!userId || !finalName) {
      return NextResponse.json({ error: "UserId and name required" }, { status: 400 });
    }

    const id = body.id || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSub = await Subscription.create({
      id,
      userId,
      name: finalName,
      cost: finalCost,
      billingCycle: billingCycle || "monthly",
      renewalDate: finalRenewal,
      category: category || "Entertainment",
      icon: icon || "CreditCard",
    });

    return NextResponse.json(newSub, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/money/subscriptions - Update subscription
export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, userId, name, cost, amount, billingCycle, renewalDate, nextRenewalDate, category, icon } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: "Id and userId required" }, { status: 400 });
    }

    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name;
    if (cost !== undefined) updateFields.cost = Number(cost);
    if (amount !== undefined) updateFields.cost = Number(amount);
    if (billingCycle !== undefined) updateFields.billingCycle = billingCycle;
    if (renewalDate !== undefined) updateFields.renewalDate = renewalDate;
    if (nextRenewalDate !== undefined) updateFields.renewalDate = nextRenewalDate;
    if (category !== undefined) updateFields.category = category;
    if (icon !== undefined) updateFields.icon = icon;

    const updated = await Subscription.findOneAndUpdate(
      { id, userId },
      { $set: updateFields },
      { new: true }
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/money/subscriptions?id=xxx&userId=yyy
export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json({ error: "Id and userId required" }, { status: 400 });
    }

    await Subscription.deleteOne({ id, userId });
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
