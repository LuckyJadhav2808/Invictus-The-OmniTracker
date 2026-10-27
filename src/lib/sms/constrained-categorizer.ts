/**
 * Invictus Constrained Merchant Categorizer
 *
 * Guarantees:
 * 1. O(1) Cache-First lookup via MerchantCategoryCache.
 * 2. Dynamic Category Auto-Provisioning: if a merchant maps to a category that the user
 *    hasn't created (e.g. Groceries for D-Mart), it resolves synonyms or auto-provisions it.
 * 3. Only unclassified, deduplicated merchant names cross the network.
 * 4. Steady-state network calls: 0.
 */

import { MerchantCategoryCache } from "./merchant-cache";
import { detectCategoryFromNote } from "@/lib/utils/merchant-categorizer";
import { ensureCategoryExists } from "./category-provisioner";
import { type Category } from "@/types";

export interface CategorizedMerchantResult {
  merchant: string;
  categoryId: string;
  categoryName: string;
  source: "cache" | "keyword" | "ai" | "fallback";
  wasCategoryCreated?: boolean;
}

export async function categorizeMerchants(
  merchants: string[],
  availableCategories: Category[],
  options?: {
    provider?: "gemini" | "openai" | "none";
    addCategoryFn?: (
      cat: Omit<Category, "id" | "archived" | "createdAt"> & { id?: string }
    ) => Promise<Category>;
  }
): Promise<Record<string, CategorizedMerchantResult>> {
  const provider = options?.provider || "none";
  const results: Record<string, CategorizedMerchantResult> = {};
  const currentCategories = [...availableCategories];

  // Helper to ensure category existence
  const resolveOrProvisionCategory = async (desiredIdOrName: string) => {
    const res = await ensureCategoryExists(
      desiredIdOrName,
      currentCategories,
      options?.addCategoryFn
    );
    if (res.wasCreated && !currentCategories.some((c) => c.id === res.category.id)) {
      currentCategories.push(res.category);
    }
    return res;
  };

  // Step 1: Check Categorize-Once Local Cache
  const { cached, uncached } = MerchantCategoryCache.partition(merchants);

  for (const [merchant, hit] of Object.entries(cached)) {
    // Verify that target category actually exists in user's category list
    const resolved = await resolveOrProvisionCategory(hit.categoryId || hit.categoryName);
    MerchantCategoryCache.incrementMatch(merchant);

    results[merchant] = {
      merchant,
      categoryId: resolved.category.id,
      categoryName: resolved.category.name,
      source: "cache",
      wasCategoryCreated: resolved.wasCreated,
    };
  }

  // If everything was in cache, return immediately with 0 network calls!
  if (uncached.length === 0) {
    return results;
  }

  // Step 2: For Uncached Merchants, try local keyword dictionary first
  const remainingForAi: string[] = [];

  for (const merchant of uncached) {
    const match = detectCategoryFromNote(merchant, currentCategories);
    if (match) {
      results[merchant] = {
        merchant,
        categoryId: match.categoryId,
        categoryName: match.categoryName,
        source: "keyword",
      };
      MerchantCategoryCache.set(merchant, match.categoryId, match.categoryName, false);
    } else {
      // Check if any category blueprint matches the merchant token directly
      const resolved = await resolveOrProvisionCategory(merchant);
      if (resolved.category && resolved.category.id !== "cat-general") {
        results[merchant] = {
          merchant,
          categoryId: resolved.category.id,
          categoryName: resolved.category.name,
          source: "keyword",
          wasCategoryCreated: resolved.wasCreated,
        };
        MerchantCategoryCache.set(
          merchant,
          resolved.category.id,
          resolved.category.name,
          false
        );
      } else {
        remainingForAi.push(merchant);
      }
    }
  }

  // If no AI provider requested or no merchants left for AI, assign fallback category
  if (remainingForAi.length === 0 || provider === "none") {
    for (const merchant of remainingForAi) {
      const defaultCat = currentCategories.find((c) => c.type === "expense") || currentCategories[0] || {
        id: "cat-general",
        name: "General",
        type: "expense" as const,
        icon: "💳",
        color: "slate",
        archived: false,
      };
      results[merchant] = {
        merchant,
        categoryId: defaultCat.id,
        categoryName: defaultCat.name,
        source: "fallback",
      };
      MerchantCategoryCache.set(merchant, defaultCat.id, defaultCat.name, false);
    }
    return results;
  }

  // Step 3: Single Constrained Network Call for remaining unique merchant names
  try {
    const res = await fetch("/api/money/categorize-merchants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchants: remainingForAi,
        categories: currentCategories.map((c) => ({ id: c.id, name: c.name })),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.classifications && typeof data.classifications === "object") {
        for (const merchant of remainingForAi) {
          const classified = data.classifications[merchant];
          if (classified && classified.categoryId) {
            const resolved = await resolveOrProvisionCategory(
              classified.categoryId || classified.categoryName
            );
            results[merchant] = {
              merchant,
              categoryId: resolved.category.id,
              categoryName: resolved.category.name,
              source: "ai",
              wasCategoryCreated: resolved.wasCreated,
            };
            MerchantCategoryCache.set(
              merchant,
              resolved.category.id,
              resolved.category.name,
              false
            );
            continue;
          }

          // Fallback if AI missed this merchant
          const defaultCat = currentCategories.find((c) => c.type === "expense") || currentCategories[0];
          results[merchant] = {
            merchant,
            categoryId: defaultCat.id,
            categoryName: defaultCat.name,
            source: "fallback",
          };
          MerchantCategoryCache.set(merchant, defaultCat.id, defaultCat.name, false);
        }
        return results;
      }
    }
  } catch {
    // Network or API failure: graceful fallback to local default
  }

  // Fallback for remaining merchants
  for (const merchant of remainingForAi) {
    if (!results[merchant]) {
      const defaultCat = currentCategories.find((c) => c.type === "expense") || currentCategories[0] || {
        id: "cat-general",
        name: "General",
        type: "expense" as const,
        icon: "💳",
        color: "slate",
        archived: false,
      };
      results[merchant] = {
        merchant,
        categoryId: defaultCat.id,
        categoryName: defaultCat.name,
        source: "fallback",
      };
      MerchantCategoryCache.set(merchant, defaultCat.id, defaultCat.name, false);
    }
  }

  return results;
}
