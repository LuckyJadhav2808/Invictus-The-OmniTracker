import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseBankSms } from "./sms-local-parser";
import { MerchantCategoryCache } from "./merchant-cache";
import { categorizeMerchants } from "./constrained-categorizer";
import { ensureCategoryExists, findSynonymCategory } from "./category-provisioner";
import { type Category } from "@/types";

describe("Learned Merchant Dictionary & Dynamic Provisioning Workflow", () => {
  beforeEach(() => {
    MerchantCategoryCache.reset();
  });

  const minimalUserCategories: Category[] = [
    {
      id: "cat-rent",
      name: "Rent & Housing",
      type: "expense",
      icon: "🏠",
      color: "lavender",
      archived: false,
    },
    {
      id: "cat-general",
      name: "General",
      type: "expense",
      icon: "💳",
      color: "slate",
      archived: false,
    },
  ];

  it("handles incoming PNB Ambika Chemist SMS when user lacks Healthcare category", async () => {
    const rawSms =
      "A/c X3866 debited INR 60.00 Dt 01-10-26 12:03:31 to Ambika Chemist thru UPI:693771418779.Bal INR 157737.60 Not u?Fwd this SMS to 9264092640 to block UPI.-PNB";

    // 1. Zero-knowledge local parsing
    const parsed = parseBankSms(rawSms, "-PNB");
    expect(parsed).not.toBeNull();
    expect(parsed?.merchant).toBe("Ambika Chemist");
    expect(parsed?.amount).toBe(60);

    // 2. Mock addCategory callback
    const addedCategories: Category[] = [];
    const mockAddCategory = vi.fn().mockImplementation(async (catPayload) => {
      const created: Category = {
        ...catPayload,
        archived: false,
        createdAt: new Date().toISOString(),
      };
      addedCategories.push(created);
      return created;
    });

    // 3. Categorize with auto-provisioning
    const categorized = await categorizeMerchants([parsed!.merchant], minimalUserCategories, {
      provider: "none",
      addCategoryFn: mockAddCategory,
    });

    const result = categorized[parsed!.merchant];
    expect(result).toBeDefined();
    expect(result.source).toBe("cache");
    expect(result.categoryName).toBe("Healthcare & Gym");
    expect(result.wasCategoryCreated).toBe(true);
    expect(mockAddCategory).toHaveBeenCalledOnce();
    expect(addedCategories[0].icon).toBe("💊");
    expect(addedCategories[0].color).toBe("rose");
  });

  it("reuses existing synonym category (e.g. Kirana) for D-Mart without creating duplicates", async () => {
    const userWithKirana: Category[] = [
      {
        id: "cat-my-kirana",
        name: "My Local Kirana Store",
        type: "expense",
        icon: "🛒",
        color: "mint",
        archived: false,
      },
    ];

    const mockAddCategory = vi.fn();

    const categorized = await categorizeMerchants(["DMART KANDIVALI"], userWithKirana, {
      provider: "none",
      addCategoryFn: mockAddCategory,
    });

    const result = categorized["DMART KANDIVALI"];
    expect(result).toBeDefined();
    expect(result.categoryId).toBe("cat-my-kirana");
    expect(result.categoryName).toBe("My Local Kirana Store");
    expect(result.wasCategoryCreated).toBe(false);
    expect(mockAddCategory).not.toHaveBeenCalled();
  });

  it("learns new merchant association and categorizes next time in 0ms", async () => {
    // User teaches the system: "Ramesh Canteen" is "Food & Dining"
    MerchantCategoryCache.set("Ramesh Canteen", "cat-food", "Food & Dining", true);

    const match = MerchantCategoryCache.get("Ramesh Canteen");
    expect(match).toBeDefined();
    expect(match?.categoryId).toBe("cat-food");
    expect(match?.isUserDefined).toBe(true);

    // Subsequent search for compound merchant string "UPI/98124/RAMESH CANTEEN"
    const compoundHit = MerchantCategoryCache.get("RAMESH CANTEEN");
    expect(compoundHit?.categoryId).toBe("cat-food");
  });
});
