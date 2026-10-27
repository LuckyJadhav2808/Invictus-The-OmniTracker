import { describe, it, expect, vi } from "vitest";
import {
  findSynonymCategory,
  ensureCategoryExists,
  CATEGORY_BLUEPRINTS,
} from "./category-provisioner";
import { type Category } from "@/types";

describe("Dynamic Category Auto-Provisioning Engine", () => {
  const baseCategories: Category[] = [
    {
      id: "cat-food",
      name: "Food & Dining",
      type: "expense",
      icon: "🍔",
      color: "coral",
      archived: false,
    },
    {
      id: "cat-rent",
      name: "Rent & Housing",
      type: "expense",
      icon: "🏠",
      color: "lavender",
      archived: false,
    },
  ];

  it("finds existing category by exact ID or name", () => {
    const matchId = findSynonymCategory("cat-food", baseCategories);
    expect(matchId?.name).toBe("Food & Dining");

    const matchName = findSynonymCategory("Food & Dining", baseCategories);
    expect(matchName?.id).toBe("cat-food");
  });

  it("identifies semantic synonyms and avoids duplicate creation", () => {
    const customCategories: Category[] = [
      {
        id: "cat-custom-kirana",
        name: "Kirana & Supermarket",
        type: "expense",
        icon: "🛒",
        color: "mint",
        archived: false,
      },
    ];

    // D-Mart or Groceries should resolve to "Kirana & Supermarket"
    const match = findSynonymCategory("Groceries", customCategories);
    expect(match).toBeDefined();
    expect(match?.id).toBe("cat-custom-kirana");

    const dmartMatch = findSynonymCategory("dmart", customCategories);
    expect(dmartMatch?.id).toBe("cat-custom-kirana");
  });

  it("auto-provisions missing category with Neobrutalist blueprint tokens", async () => {
    const mockAddCategory = vi.fn().mockImplementation(async (payload) => ({
      ...payload,
      archived: false,
      createdAt: new Date().toISOString(),
    }));

    const result = await ensureCategoryExists("cat-groceries", baseCategories, mockAddCategory);

    expect(result.wasCreated).toBe(true);
    expect(result.category.name).toBe("Groceries");
    expect(result.category.icon).toBe("🛒");
    expect(result.category.color).toBe("mint");
    expect(mockAddCategory).toHaveBeenCalledOnce();
  });

  it("reuses existing category and does not call addCategory if already present", async () => {
    const mockAddCategory = vi.fn();

    const result = await ensureCategoryExists("Food & Dining", baseCategories, mockAddCategory);

    expect(result.wasCreated).toBe(false);
    expect(result.category.id).toBe("cat-food");
    expect(mockAddCategory).not.toHaveBeenCalled();
  });

  it("handles obscure category with graceful fallback blueprint", async () => {
    const result = await ensureCategoryExists("Crypto Arbitrage", baseCategories);

    expect(result.wasCreated).toBe(true);
    expect(result.category.name).toBe("Crypto Arbitrage");
    expect(result.category.icon).toBe("💳");
  });
});
