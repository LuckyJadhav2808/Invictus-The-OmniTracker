import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Category } from "@/models/Category";

let indexesCleaned = false;
async function ensureCategoryIndexes() {
  if (indexesCleaned) return;
  try {
    await Category.collection.dropIndex("id_1").catch(() => {});
    indexesCleaned = true;
  } catch {}
}

// GET /api/money/categories?userId=xxx
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    await ensureCategoryIndexes();
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
    await ensureCategoryIndexes();
    const body = await req.json();

    if (!body.userId || !body.name || !body.type) {
      return NextResponse.json({ error: "UserId, name, and type required" }, { status: 400 });
    }

    const catId = body.id || `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newCategory = await Category.findOneAndUpdate(
      { id: catId, userId: body.userId },
      {
        $set: {
          id: catId,
          userId: body.userId,
          name: body.name,
          type: body.type,
          color: body.color || "amber",
          icon: body.icon || "💳",
          monthlyBudget: Number(body.monthlyBudget) || 0,
          archived: body.archived || false,
          isTemplate: body.isTemplate || false,
          templatePackId: body.templatePackId || null,
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
    await ensureCategoryIndexes();
    const body = await req.json();
    const { id, userId, name, color, icon, type, monthlyBudget, archived, isTemplate, templatePackId } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: "Id and userId required" }, { status: 400 });
    }

    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name;
    if (color !== undefined) updateFields.color = color;
    if (icon !== undefined) updateFields.icon = icon;
    if (type !== undefined) updateFields.type = type;
    if (monthlyBudget !== undefined) updateFields.monthlyBudget = Number(monthlyBudget);
    if (archived !== undefined) updateFields.archived = archived;
    if (isTemplate !== undefined) updateFields.isTemplate = isTemplate;
    if (templatePackId !== undefined) updateFields.templatePackId = templatePackId;

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
    await ensureCategoryIndexes();
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
