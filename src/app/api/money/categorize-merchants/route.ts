import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  merchants: z.array(z.string().min(1).max(100)).max(50),
  categories: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ).min(1),
});

// Heuristic keyword classifier mapping common merchant words to category tokens
const HEURISTIC_KEYWORDS: Record<string, string[]> = {
  food: ["restaurant", "cafe", "dhaba", "bhojanalaya", "bakery", "sweets", "kitchen", "canteen", "chai", "coffee", "tea", "burger", "pizza", "biryani", "food", "dining", "snack", "tiffin"],
  groceries: ["supermarket", "mart", "store", "kirana", "provision", "vegetable", "fruits", "dairy", "milk", "ration", "bazaar", "dry fruits"],
  transport: ["petrol", "fuel", "diesel", "cabs", "taxi", "travels", "auto", "rides", "parking", "toll", "fastag", "puncture", "service station"],
  health: ["chemist", "pharmacy", "medical", "hospital", "clinic", "pathology", "diagnostics", "dental", "gym", "fitness", "wellness"],
  shopping: ["clothing", "apparel", "textiles", "fashion", "garments", "footwear", "shoes", "jewellers", "electronics", "retail"],
  bills: ["recharge", "broadband", "telecom", "electricity", "power", "gas", "utility"],
  education: ["book", "stationery", "xerox", "print", "academy", "classes", "coaching", "school", "college", "tuition"],
  leisure: ["cinema", "theatre", "multiplex", "club", "resort", "amusement"],
};

export async function POST(req: Request) {
  try {
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = RequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid request payload", details: parseResult.error.flatten() }, { status: 400 });
    }

    const { merchants, categories } = parseResult.data;
    const classifications: Record<string, { categoryId: string; categoryName: string }> = {};

    // 1. Sanitize untrusted input strings
    const sanitizedMerchants = merchants.map((m) =>
      m.replace(/[^\w\s\-.*]/gi, "").trim().slice(0, 50)
    );

    // 2. Classify each merchant against available categories
    for (const merchant of sanitizedMerchants) {
      const lower = merchant.toLowerCase();
      let matchedCategory = null;

      // Check against category names directly
      for (const cat of categories) {
        if (lower.includes(cat.name.toLowerCase())) {
          matchedCategory = cat;
          break;
        }
      }

      // Check against keyword semantics
      if (!matchedCategory) {
        for (const [semanticKey, kws] of Object.entries(HEURISTIC_KEYWORDS)) {
          const hasKeyword = kws.some((kw) => lower.includes(kw));
          if (hasKeyword) {
            matchedCategory = categories.find((c) =>
              c.name.toLowerCase().includes(semanticKey) ||
              c.id.toLowerCase().includes(semanticKey)
            );
            if (matchedCategory) break;
          }
        }
      }

      // Fallback to first available expense category
      if (!matchedCategory) {
        matchedCategory = categories.find((c) => c.id === "cat-food") || categories[0];
      }

      classifications[merchant] = {
        categoryId: matchedCategory.id,
        categoryName: matchedCategory.name,
      };
    }

    return NextResponse.json({
      success: true,
      count: Object.keys(classifications).length,
      classifications,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Categorization failed" }, { status: 500 });
  }
}
