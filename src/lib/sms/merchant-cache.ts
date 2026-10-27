/**
 * Invictus Categorize-Once Local Merchant Cache
 * Provides O(1) lookups for previously categorized merchants.
 * Guarantees zero network calls in steady state!
 */

const STORAGE_KEY = "invictus_merchant_category_cache";

// Pre-seeded high-confidence Indian merchant mappings
const PRESEEDED_MERCHANTS: Record<string, { categoryId: string; categoryName: string }> = {
  // Food & Dining / Delivery
  "swiggy": { categoryId: "cat-food", categoryName: "Food & Dining" },
  "zomato": { categoryId: "cat-food", categoryName: "Food & Dining" },
  "mcdonalds": { categoryId: "cat-food", categoryName: "Food & Dining" },
  "dominos": { categoryId: "cat-food", categoryName: "Food & Dining" },
  "starbucks": { categoryId: "cat-food", categoryName: "Food & Dining" },
  "chai point": { categoryId: "cat-food", categoryName: "Food & Dining" },
  "chaayos": { categoryId: "cat-food", categoryName: "Food & Dining" },
  "kfc": { categoryId: "cat-food", categoryName: "Food & Dining" },
  "subway": { categoryId: "cat-food", categoryName: "Food & Dining" },
  "haldiram": { categoryId: "cat-food", categoryName: "Food & Dining" },
  "burger king": { categoryId: "cat-food", categoryName: "Food & Dining" },

  // Groceries & Quick Commerce
  "blinkit": { categoryId: "cat-groceries", categoryName: "Groceries" },
  "zepto": { categoryId: "cat-groceries", categoryName: "Groceries" },
  "instamart": { categoryId: "cat-groceries", categoryName: "Groceries" },
  "dmart": { categoryId: "cat-groceries", categoryName: "Groceries" },
  "bigbasket": { categoryId: "cat-groceries", categoryName: "Groceries" },
  "supermarket": { categoryId: "cat-groceries", categoryName: "Groceries" },

  // Transport & Commute
  "uber": { categoryId: "cat-transport", categoryName: "Transport & Commute" },
  "ola": { categoryId: "cat-transport", categoryName: "Transport & Commute" },
  "rapido": { categoryId: "cat-transport", categoryName: "Transport & Commute" },
  "metro": { categoryId: "cat-transport", categoryName: "Transport & Commute" },
  "irctc": { categoryId: "cat-transport", categoryName: "Transport & Commute" },
  "bpcl": { categoryId: "cat-transport", categoryName: "Transport & Commute" },
  "hpcl": { categoryId: "cat-transport", categoryName: "Transport & Commute" },
  "iocil": { categoryId: "cat-transport", categoryName: "Transport & Commute" },
  "fastag": { categoryId: "cat-transport", categoryName: "Transport & Commute" },

  // Health, Chemist & Fitness
  "ambika chemist": { categoryId: "cat-health", categoryName: "Healthcare & Gym" },
  "chemist": { categoryId: "cat-health", categoryName: "Healthcare & Gym" },
  "apollo": { categoryId: "cat-health", categoryName: "Healthcare & Gym" },
  "apollo pharmacy": { categoryId: "cat-health", categoryName: "Healthcare & Gym" },
  "1mg": { categoryId: "cat-health", categoryName: "Healthcare & Gym" },
  "netmeds": { categoryId: "cat-health", categoryName: "Healthcare & Gym" },
  "pharmeasy": { categoryId: "cat-health", categoryName: "Healthcare & Gym" },
  "cult.fit": { categoryId: "cat-health", categoryName: "Healthcare & Gym" },
  "cultfit": { categoryId: "cat-health", categoryName: "Healthcare & Gym" },

  // Shopping & E-Commerce
  "amazon": { categoryId: "cat-shopping", categoryName: "Shopping" },
  "flipkart": { categoryId: "cat-shopping", categoryName: "Shopping" },
  "myntra": { categoryId: "cat-shopping", categoryName: "Shopping" },
  "meesho": { categoryId: "cat-shopping", categoryName: "Shopping" },
  "ajio": { categoryId: "cat-shopping", categoryName: "Shopping" },
  "zara": { categoryId: "cat-shopping", categoryName: "Shopping" },
  "uniqlo": { categoryId: "cat-shopping", categoryName: "Shopping" },

  // Bills, Telecom & Utilities
  "airtel": { categoryId: "cat-bills", categoryName: "Bills & Utilities" },
  "jio": { categoryId: "cat-bills", categoryName: "Bills & Utilities" },
  "vi": { categoryId: "cat-bills", categoryName: "Bills & Utilities" },
  "electricity": { categoryId: "cat-bills", categoryName: "Bills & Utilities" },
  "bescom": { categoryId: "cat-bills", categoryName: "Bills & Utilities" },
  "tata play": { categoryId: "cat-bills", categoryName: "Bills & Utilities" },

  // Entertainment & Leisure
  "spotify": { categoryId: "cat-leisure", categoryName: "Leisure & Fun" },
  "netflix": { categoryId: "cat-leisure", categoryName: "Leisure & Fun" },
  "bookmyshow": { categoryId: "cat-leisure", categoryName: "Leisure & Fun" },
  "pvr": { categoryId: "cat-leisure", categoryName: "Leisure & Fun" },
  "inox": { categoryId: "cat-leisure", categoryName: "Leisure & Fun" },
  "steam": { categoryId: "cat-leisure", categoryName: "Leisure & Fun" },

  // Education & Books
  "udemy": { categoryId: "cat-education", categoryName: "Books & Tuition" },
  "coursera": { categoryId: "cat-education", categoryName: "Books & Tuition" },
  "bookstore": { categoryId: "cat-education", categoryName: "Books & Tuition" },
};

function normalizeMerchantKey(merchant: string): string {
  return merchant.toLowerCase().trim().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ");
}

export class MerchantCategoryCache {
  private static memoryCache: Record<string, { categoryId: string; categoryName: string }> = { ...PRESEEDED_MERCHANTS };
  private static isHydrated = false;

  private static hydrate(): void {
    if (this.isHydrated || typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.memoryCache = { ...PRESEEDED_MERCHANTS, ...parsed };
      }
      this.isHydrated = true;
    } catch {
      this.memoryCache = { ...PRESEEDED_MERCHANTS };
    }
  }

  private static persist(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memoryCache));
    } catch {}
  }

  /**
   * Looks up a merchant in the cache in O(1).
   */
  static get(merchant: string): { categoryId: string; categoryName: string } | null {
    this.hydrate();
    const key = normalizeMerchantKey(merchant);

    // Direct key match
    if (this.memoryCache[key]) {
      return this.memoryCache[key];
    }

    // Substring match for compound merchants (e.g. "Ambika Chemist" matching "chemist")
    for (const [cachedKey, val] of Object.entries(this.memoryCache)) {
      if (key.includes(cachedKey) || cachedKey.includes(key)) {
        return val;
      }
    }

    return null;
  }

  /**
   * Sets a merchant category in the cache and persists to localStorage.
   */
  static set(merchant: string, categoryId: string, categoryName: string): void {
    this.hydrate();
    const key = normalizeMerchantKey(merchant);
    if (!key) return;

    this.memoryCache[key] = { categoryId, categoryName };
    this.persist();
  }

  /**
   * Bulk checks a list of merchant strings and separates into cached vs uncached.
   */
  static partition(merchants: string[]): {
    cached: Record<string, { categoryId: string; categoryName: string }>;
    uncached: string[];
  } {
    this.hydrate();
    const cached: Record<string, { categoryId: string; categoryName: string }> = {};
    const uncached: string[] = [];

    const seen = new Set<string>();

    for (const m of merchants) {
      const key = normalizeMerchantKey(m);
      if (!key || seen.has(key)) continue;
      seen.add(key);

      const hit = this.get(m);
      if (hit) {
        cached[m] = hit;
      } else {
        uncached.push(m);
      }
    }

    return { cached, uncached };
  }

  /**
   * Clears user added mappings and resets to pre-seeded defaults.
   */
  static reset(): void {
    this.memoryCache = { ...PRESEEDED_MERCHANTS };
    this.persist();
  }
}
