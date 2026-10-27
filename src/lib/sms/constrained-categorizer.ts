/**
 * Invictus Constrained Merchant Categorizer
 *
 * Guarantees:
 * 1. O(1) Cache-First lookup via MerchantCategoryCache.
 * 2. Only unclassified, deduplicated merchant names cross the network.
 * 3. Fallback to rich local keyword dictionary if offline or provider === "none".
 * 4. Steady-state network calls: 0.
 */

import { MerchantCategoryCache } from "./merchant-cache";
import { detectCategoryFromNote } from "@/lib/utils/merchant-categorizer";
import { type Category } from "@/types";

export interface CategorizedMerchantResult {
  merchant: string;
  categoryId: string;
  categoryName: string;
  source: "cache" | "keyword" | "ai" | "fallback";
}

export async function categorizeMerchants(
  merchants: string[],
  availableCategories: Category[],
  options?: {
    provider?: "gemini" | "openai" | "none";
  }
): Promise<Record<string, CategorizedMerchantResult>> {
  const provider = options?.provider || "none";
  const results: Record<string, CategorizedMerchantResult> = {};

  // Step 1: Check Categorize-Once Local Cache
  const { cached, uncached } = MerchantCategoryCache.partition(merchants);

  for (const [merchant, hit] of Object.entries(cached)) {
    results[merchant] = {
      merchant,
      categoryId: hit.categoryId,
      categoryName: hit.categoryName,
      source: "cache",
    };
  }

  // If everything was in cache, return immediately with 0 network calls!
  if (uncached.length === 0) {
    return results;
  }

  // Step 2: For Uncached Merchants, try local keyword dictionary first
  const remainingForAi: string[] = [];

  for (const merchant of uncached) {
    const match = detectCategoryFromNote(merchant, availableCategories);
    if (match) {
      results[merchant] = {
        merchant,
        categoryId: match.categoryId,
        categoryName: match.categoryName,
        source: "keyword",
      };
      MerchantCategoryCache.set(merchant, match.categoryId, match.categoryName);
    } else {
      remainingForAi.push(merchant);
    }
  }

  // If no AI provider requested or no merchants left for AI, assign fallback category
  if (remainingForAi.length === 0 || provider === "none") {
    for (const merchant of remainingForAi) {
      const defaultCat = availableCategories.find((c) => c.id === "cat-food") || availableCategories[0] || {
        id: "cat-general",
        name: "General",
      };
      results[merchant] = {
        merchant,
        categoryId: defaultCat.id,
        categoryName: defaultCat.name,
        source: "fallback",
      };
      MerchantCategoryCache.set(merchant, defaultCat.id, defaultCat.name);
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
        categories: availableCategories.map((c) => ({ id: c.id, name: c.name })),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.classifications && typeof data.classifications === "object") {
        for (const merchant of remainingForAi) {
          const classified = data.classifications[merchant];
          if (classified && classified.categoryId) {
            results[merchant] = {
              merchant,
              categoryId: classified.categoryId,
              categoryName: classified.categoryName || "Expense",
              source: "ai",
            };
            MerchantCategoryCache.set(merchant, classified.categoryId, classified.categoryName);
            continue;
          }

          // Fallback if AI missed this merchant
          const defaultCat = availableCategories[0] || { id: "cat-food", name: "Food & Dining" };
          results[merchant] = {
            merchant,
            categoryId: defaultCat.id,
            categoryName: defaultCat.name,
            source: "fallback",
          };
          MerchantCategoryCache.set(merchant, defaultCat.id, defaultCat.name);
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
      const defaultCat = availableCategories[0] || { id: "cat-food", name: "Food & Dining" };
      results[merchant] = {
        merchant,
        categoryId: defaultCat.id,
        categoryName: defaultCat.name,
        source: "fallback",
      };
      MerchantCategoryCache.set(merchant, defaultCat.id, defaultCat.name);
    }
  }

  return results;
}
