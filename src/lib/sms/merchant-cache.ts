/**
 * Invictus Categorize-Once Local Merchant Cache & Learned Rules Engine
 * Powered by Fuse.js for typo-tolerant fuzzy merchant normalization.
 * Guarantees zero network calls in steady state!
 */

import Fuse, { type IFuseOptions } from "fuse.js";

export interface MerchantRuleItem {
  merchantPattern: string;
  displayName: string;
  categoryId: string;
  categoryName: string;
  matchCount: number;
  isUserDefined: boolean;
  updatedAt?: string;
}

const STORAGE_KEY = "invictus_merchant_category_cache";

// Strict financial-grade Fuse.js configuration for merchant matching
const FUSE_OPTIONS: IFuseOptions<MerchantRuleItem> = {
  keys: [
    { name: "merchantPattern", weight: 0.7 },
    { name: "displayName", weight: 0.3 },
  ],
  threshold: 0.32, // 0.0 = perfect match, 0.32 = strict financial fuzzy match
  distance: 100,
  minMatchCharLength: 3,
  ignoreLocation: true,
  includeScore: true,
  shouldSort: true,
};

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

export function normalizeMerchantKey(merchant: string): string {
  return merchant.toLowerCase().trim().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

export class MerchantCategoryCache {
  private static memoryCache: Record<string, MerchantRuleItem> = {};
  private static isHydrated = false;
  private static fuseInstance: Fuse<MerchantRuleItem> | null = null;

  private static getFuseInstance(): Fuse<MerchantRuleItem> {
    if (!this.fuseInstance) {
      const items = Object.values(this.memoryCache);
      this.fuseInstance = new Fuse(items, FUSE_OPTIONS);
    }
    return this.fuseInstance;
  }

  private static invalidateFuseIndex(): void {
    this.fuseInstance = null;
  }

  private static initDefaults(): void {
    const map: Record<string, MerchantRuleItem> = {};
    for (const [key, val] of Object.entries(PRESEEDED_MERCHANTS)) {
      map[key] = {
        merchantPattern: key,
        displayName: key.charAt(0).toUpperCase() + key.slice(1),
        categoryId: val.categoryId,
        categoryName: val.categoryName,
        matchCount: 0,
        isUserDefined: false,
      };
    }
    this.memoryCache = map;
    this.invalidateFuseIndex();
  }

  private static hydrate(): void {
    if (this.isHydrated) return;
    this.initDefaults();

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          for (const [k, v] of Object.entries(parsed)) {
            const raw = v as any;
            this.memoryCache[k] = {
              merchantPattern: k,
              displayName: raw.displayName || (k.charAt(0).toUpperCase() + k.slice(1)),
              categoryId: raw.categoryId,
              categoryName: raw.categoryName,
              matchCount: typeof raw.matchCount === "number" ? raw.matchCount : 0,
              isUserDefined: Boolean(raw.isUserDefined),
              updatedAt: raw.updatedAt,
            };
          }
        }
      } catch {}
    }

    this.isHydrated = true;
    this.invalidateFuseIndex();
  }

  private static persist(): void {
    this.invalidateFuseIndex();
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memoryCache));
    } catch {}
  }

  /**
   * 4-Tier Fuzzy Lookup for a merchant name in O(1) / O(k) / Bitap.
   * Tier 1: Exact normalized key match (O(1)).
   * Tier 2: Token / Word boundary match.
   * Tier 3: Fuse.js Bitap Fuzzy Search (typos, e.g. "Swigy", "Blink it", "Apollo Pharmcy").
   * Tier 4: Substring match for tokens >= 4 characters.
   */
  static get(merchant: string): MerchantRuleItem | null {
    this.hydrate();
    const key = normalizeMerchantKey(merchant);
    if (!key) return null;

    // Tier 1: Exact normalized key match
    if (this.memoryCache[key]) {
      return this.memoryCache[key];
    }

    // Tier 2: Token-level match (e.g. "dmart kandivali" against "dmart")
    const words = key.split(/\s+/).filter((w) => w.length >= 3);
    for (const word of words) {
      if (this.memoryCache[word]) {
        return this.memoryCache[word];
      }
    }

    // Tier 3: Fuse.js Bitap Fuzzy Search (strict financial-grade threshold <= 0.32)
    const fuse = this.getFuseInstance();
    const searchResults = fuse.search(key);
    if (searchResults.length > 0) {
      const best = searchResults[0];
      if (best.score !== undefined && best.score <= 0.32) {
        return best.item;
      }
    }

    // Also fuzzy search significant words from compound string (e.g. "UPI/98124/SWIGY-BLR")
    for (const word of words) {
      if (word.length >= 4) {
        const wordResults = fuse.search(word);
        if (wordResults.length > 0) {
          const bestWord = wordResults[0];
          const patternLen = bestWord.item.merchantPattern.length;
          // Require strict score (<= 0.22) and close length proximity (within 2 chars)
          // to prevent generic words like "shop" from falsely matching specific brands like "meesho"
          if (
            bestWord.score !== undefined &&
            bestWord.score <= 0.22 &&
            Math.abs(patternLen - word.length) <= 2
          ) {
            return bestWord.item;
          }
        }
      }
    }

    // Tier 4: Substring test across existing rules as legacy fallback
    for (const rule of Object.values(this.memoryCache)) {
      const pattern = rule.merchantPattern;
      if (pattern.length >= 4 && (key.includes(pattern) || pattern.includes(key))) {
        return rule;
      }
    }

    return null;
  }

  /**
   * Sets or updates a merchant rule in the cache and persists to localStorage.
   */
  static set(
    merchant: string,
    categoryId: string,
    categoryName: string,
    isUserDefined = true,
    displayName?: string
  ): MerchantRuleItem {
    this.hydrate();
    const key = normalizeMerchantKey(merchant);
    if (!key) {
      throw new Error("Invalid merchant string");
    }

    const existing = this.memoryCache[key];
    const item: MerchantRuleItem = {
      merchantPattern: key,
      displayName: displayName || (merchant.trim().length > 0 ? merchant.trim() : key),
      categoryId,
      categoryName,
      matchCount: existing ? existing.matchCount + 1 : 1,
      isUserDefined: existing ? (existing.isUserDefined || isUserDefined) : isUserDefined,
      updatedAt: new Date().toISOString(),
    };

    this.memoryCache[key] = item;
    this.persist();
    return item;
  }

  /**
   * Increments the match counter for analytics and sorting.
   */
  static incrementMatch(merchant: string): void {
    this.hydrate();
    const match = this.get(merchant);
    if (match && this.memoryCache[match.merchantPattern]) {
      this.memoryCache[match.merchantPattern].matchCount += 1;
      this.persist();
    }
  }

  /**
   * Removes a rule (or resets to default if it was preseeded).
   */
  static deleteRule(merchantPattern: string): void {
    this.hydrate();
    const key = normalizeMerchantKey(merchantPattern);
    if (PRESEEDED_MERCHANTS[key]) {
      // Reset back to non-user preseeded
      const def = PRESEEDED_MERCHANTS[key];
      this.memoryCache[key] = {
        merchantPattern: key,
        displayName: key.charAt(0).toUpperCase() + key.slice(1),
        categoryId: def.categoryId,
        categoryName: def.categoryName,
        matchCount: 0,
        isUserDefined: false,
      };
    } else {
      delete this.memoryCache[key];
    }
    this.persist();
  }

  /**
   * Returns all active rules sorted with user-defined rules and highest match count first.
   */
  static getAllRules(): MerchantRuleItem[] {
    this.hydrate();
    return Object.values(this.memoryCache).sort((a, b) => {
      if (a.isUserDefined && !b.isUserDefined) return -1;
      if (!a.isUserDefined && b.isUserDefined) return 1;
      if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
      return a.displayName.localeCompare(b.displayName);
    });
  }

  /**
   * Bulk checks a list of merchant strings and separates into cached vs uncached.
   */
  static partition(merchants: string[]): {
    cached: Record<string, MerchantRuleItem>;
    uncached: string[];
  } {
    this.hydrate();
    const cached: Record<string, MerchantRuleItem> = {};
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
   * Merges server-synced rules from MongoDB into the local memory cache.
   */
  static syncWithServer(rules: MerchantRuleItem[]): void {
    this.hydrate();
    for (const r of rules) {
      const key = normalizeMerchantKey(r.merchantPattern);
      if (!key) continue;
      this.memoryCache[key] = {
        ...r,
        merchantPattern: key,
        isUserDefined: true,
      };
    }
    this.persist();
  }

  /**
   * Clears user added mappings and resets to pre-seeded defaults.
   */
  static reset(): void {
    this.initDefaults();
    this.persist();
  }
}
