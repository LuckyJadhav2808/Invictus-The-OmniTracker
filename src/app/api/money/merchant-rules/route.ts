import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { MerchantRule } from "@/models/MerchantRule";
import { normalizeMerchantKey } from "@/lib/sms/merchant-cache";

export const dynamic = "force-dynamic";

// GET /api/money/merchant-rules?userId=xxx
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "UserId required for data isolation" }, { status: 400 });
    }

    const rules = await MerchantRule.find({ userId }).sort({ matchCount: -1, createdAt: -1 });
    return NextResponse.json(rules);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/money/merchant-rules
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const userId = body.userId;
    const rawPattern = typeof body.merchantPattern === "string" ? body.merchantPattern : "";
    const pattern = normalizeMerchantKey(rawPattern);
    const categoryId = body.categoryId;
    const categoryName = body.categoryName || "General";

    if (!userId || !pattern || !categoryId) {
      return NextResponse.json(
        { error: "userId, valid merchantPattern, and categoryId are required" },
        { status: 400 }
      );
    }

    const ruleId = body.id || `mrule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const displayName = typeof body.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim().slice(0, 80)
      : rawPattern.trim() || pattern;

    const updatedRule = await MerchantRule.findOneAndUpdate(
      { userId, merchantPattern: pattern },
      {
        $set: {
          id: ruleId,
          userId,
          merchantPattern: pattern,
          displayName,
          categoryId,
          categoryName,
          isUserDefined: true,
          lastMatchedAt: new Date(),
        },
        $inc: {
          matchCount: 1,
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    return NextResponse.json(updatedRule);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/money/merchant-rules?userId=xxx&pattern=yyy
export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const pattern = searchParams.get("pattern");

    if (!userId || !pattern) {
      return NextResponse.json({ error: "userId and pattern required" }, { status: 400 });
    }

    const normalized = normalizeMerchantKey(pattern);
    await MerchantRule.deleteOne({ userId, merchantPattern: normalized });

    return NextResponse.json({ success: true, deletedPattern: normalized });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
