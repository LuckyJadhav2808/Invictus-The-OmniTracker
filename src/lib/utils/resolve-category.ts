import { type Category } from "@/types";
import { detectCategoryFromNote } from "./merchant-categorizer";

/**
 * Resolves an expense transaction strictly to a valid expense category.
 * Prevents any expense from ever mapping to an income category (e.g. Salary, Freelance).
 * Fully compatible with both frontend Category objects and MongoDB Mongoose documents.
 */
export function resolveExpenseCategoryId(
  targetCategoryHint: string | undefined,
  noteText: string | undefined,
  categories: Array<Category | any>
): string {
  // 1. Isolate expense categories strictly (never allow income categories like Salary)
  const expenseCategories = (categories || []).filter(
    (c) => (c.type ? c.type === "expense" : true) && !c.archived
  );

  if (expenseCategories.length === 0) {
    return "cat-food";
  }

  const cleanHint = (targetCategoryHint || "").toLowerCase().trim();
  const cleanNote = (noteText || "").toLowerCase().trim();

  // Helper to extract id from both React types (c.id) and Mongoose documents (c._id or c.id)
  const getCatId = (c: any): string => (c.id || c._id?.toString() || "");

  // 2. Exact or semantic match on manual/preset category hint (e.g. "Food", "Travel", "Grocery", "Bills")
  if (cleanHint) {
    // 2a. Match ID directly (e.g. "cat-food" === "cat-food" or "food" === "cat-food")
    const idMatch = expenseCategories.find((c) => {
      const id = getCatId(c).toLowerCase();
      return (
        id === cleanHint ||
        id === `cat-${cleanHint}` ||
        `cat-${id}` === cleanHint
      );
    });
    if (idMatch) return getCatId(idMatch);

    // 2b. Match Name directly
    const nameMatch = expenseCategories.find((c) => {
      const name = (c.name || "").toLowerCase();
      return (
        name === cleanHint ||
        name.startsWith(cleanHint) ||
        cleanHint.startsWith(name) ||
        name.includes(cleanHint) ||
        cleanHint.includes(name)
      );
    });
    if (nameMatch) return getCatId(nameMatch);

    // 2c. Semantic Aliases for common shortcuts
    if (/food|dining|snack|canteen|meal|restaurant|chai|cafe/i.test(cleanHint)) {
      const foodCat = expenseCategories.find(
        (c) => /food|dining/i.test(c.name || "") || getCatId(c) === "cat-food"
      );
      if (foodCat) return getCatId(foodCat);
    }
    if (/travel|transport|commute|cab|taxi|metro|fuel/i.test(cleanHint)) {
      const travelCat = expenseCategories.find(
        (c) => /transport|commute|travel/i.test(c.name || "") || getCatId(c) === "cat-transport"
      );
      if (travelCat) return getCatId(travelCat);
    }
    if (/grocer|ration|market|mart|supermarket/i.test(cleanHint)) {
      const grocerCat = expenseCategories.find(
        (c) => /grocer/i.test(c.name || "") || getCatId(c) === "cat-groceries"
      );
      if (grocerCat) return getCatId(grocerCat);
    }
    if (/bill|utilit|recharge|electricity|wifi|rent/i.test(cleanHint)) {
      const billsCat = expenseCategories.find(
        (c) => /bill|utilit/i.test(c.name || "") || getCatId(c) === "cat-bills"
      );
      if (billsCat) return getCatId(billsCat);
    }
  }

  // 3. Match from Note Text using NLP dictionary
  if (cleanNote) {
    const nlpMatch = detectCategoryFromNote(cleanNote, expenseCategories);
    if (nlpMatch && nlpMatch.categoryId) {
      return nlpMatch.categoryId;
    }
  }

  // 4. Safe Fallback: Default to "cat-food" or first expense category
  const defaultFood = expenseCategories.find(
    (c) => getCatId(c) === "cat-food" || /food/i.test(c.name || "")
  );
  if (defaultFood) return getCatId(defaultFood);

  return getCatId(expenseCategories[0]) || "cat-food";
}
