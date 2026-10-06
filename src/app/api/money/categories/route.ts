import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Category } from "@/models/Category";

export const dynamic = "force-dynamic";

// GET /api/money/categories?userId=xxx
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "UserId required for data isolation" }, { status: 400 });
    }

    const categories = await Category.find({ userId }).sort({ createdAt: 1 });
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/money/categories
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim().slice(0, 60) : "";
    const type = body.type === "income" ? "income" : body.type === "expense" ? "expense" : null;

    if (!body.userId || !name || !type) {
      return NextResponse.json({ error: "UserId, valid name (1-60 chars), and type (income|expense) required" }, { status: 400 });
    }

    const catId = body.id || `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const monthlyBudget = Math.max(0, Math.round(Number(body.monthlyBudget) || 0));

    const newCategory = await Category.findOneAndUpdate(
      { id: catId, userId: body.userId },
      {
        $set: {
          id: catId,
          userId: body.userId,
          name,
          type,
          color: typeof body.color === "string" ? body.color.slice(0, 30) : "amber",
          icon: typeof body.icon === "string" ? body.icon.slice(0, 50) : "💳",
          monthlyBudget,
          archived: Boolean(body.archived),
          isTemplate: Boolean(body.isTemplate),
          templatePackId: body.templatePackId ? String(body.templatePackId) : null,
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/money/categories - update category / monthly budget
export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, userId, name, color, icon, type, monthlyBudget, archived, isTemplate, templatePackId } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: "Id and userId required" }, { status: 400 });
    }

    const updateFields: any = {};
    if (name !== undefined) {
      const trimmed = typeof name === "string" ? name.trim().slice(0, 60) : "";
      if (!trimmed) return NextResponse.json({ error: "Category name cannot be empty" }, { status: 400 });
      updateFields.name = trimmed;
    }
    if (color !== undefined) updateFields.color = typeof color === "string" ? color.slice(0, 30) : "amber";
    if (icon !== undefined) updateFields.icon = typeof icon === "string" ? icon.slice(0, 50) : "💳";
    if (type !== undefined) {
      if (type !== "income" && type !== "expense") {
        return NextResponse.json({ error: "Type must be income or expense" }, { status: 400 });
      }
      updateFields.type = type;
    }
    if (monthlyBudget !== undefined) {
      updateFields.monthlyBudget = Math.max(0, Math.round(Number(monthlyBudget) || 0));
    }
    if (archived !== undefined) updateFields.archived = Boolean(archived);
    if (isTemplate !== undefined) updateFields.isTemplate = Boolean(isTemplate);
    if (templatePackId !== undefined) updateFields.templatePackId = templatePackId ? String(templatePackId) : null;

    const queryFilter: any = { userId };
    if (mongoose.Types.ObjectId.isValid(id)) {
      queryFilter.$or = [{ id }, { _id: id }];
    } else {
      queryFilter.id = id;
    }

    const updated = await Category.findOneAndUpdate(
      queryFilter,
      { $set: { id, userId, ...updateFields } },
      { upsert: true, returnDocument: "after" }
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/money/categories?id=xxx&userId=yyy
export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json({ error: "Id and userId required" }, { status: 400 });
    }

    await Category.deleteOne({ id, userId });
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
