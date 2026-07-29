import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { MealPlan } from "@/models/MealPlan";

// GET /api/gym/meals?userId=xxx&date=2026-07-27
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date");

    if (!userId) {
      return NextResponse.json({ error: "UserId required for data isolation" }, { status: 400 });
    }

    const query: any = { userId };
    if (date) query.date = date;

    const meals = await MealPlan.find(query).sort({ createdAt: 1 });
    return NextResponse.json(meals);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/gym/meals - Log meal entry
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { userId, date, dayOfWeek, mealType, name, calories, protein, carbs, fat, time, completed } = body;

    if (!userId || !date || !name) {
      return NextResponse.json({ error: "UserId, date, and name required" }, { status: 400 });
    }

    const id = body.id || `meal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMeal = await MealPlan.create({
      id,
      userId,
      date,
      dayOfWeek: dayOfWeek || "",
      mealType: mealType || "Lunch",
      name,
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      time: time || "",
      completed: completed !== undefined ? completed : false,
    });

    return NextResponse.json(newMeal, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/gym/meals - Update meal entry
export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, userId, name, mealType, calories, protein, carbs, fat, time, completed } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: "Id and userId required" }, { status: 400 });
    }

    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name;
    if (mealType !== undefined) updateFields.mealType = mealType;
    if (calories !== undefined) updateFields.calories = Number(calories);
    if (protein !== undefined) updateFields.protein = Number(protein);
    if (carbs !== undefined) updateFields.carbs = Number(carbs);
    if (fat !== undefined) updateFields.fat = Number(fat);
    if (time !== undefined) updateFields.time = time;
    if (completed !== undefined) updateFields.completed = completed;

    const updated = await MealPlan.findOneAndUpdate(
      { id, userId },
      { $set: updateFields },
      { new: true }
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/gym/meals?id=xxx&userId=yyy
export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json({ error: "Id and userId required" }, { status: 400 });
    }

    await MealPlan.deleteOne({ id, userId });
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
