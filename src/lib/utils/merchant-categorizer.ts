// 100+ Merchant & Keyword Categorization Dataset Engine
// Comprehensive keyword & semantic dictionary with Indian everyday terms
import { type Category } from "@/types";

export interface KeywordMapping {
  keywords: string[];
  categoryTerms: string[];
  suggestedIcon?: string;
}

export const KEYWORD_MAPPINGS: KeywordMapping[] = [
  // 1. Food & Dining / Snacks / Canteen / Indian Delicacies
  {
    keywords: [
      "khana", "momos", "momo", "pizza", "paratha", "chai", "tea", "vadapav", "vada pav",
      "dosa", "idli", "samosa", "biryani", "maggi", "canteen", "mess", "snack",
      "snacks", "swiggy", "zomato", "mcdonalds", "mcd", "burger", "starbucks", "coffee",
      "dominos", "kfc", "subway", "haldiram", "bikanervala", "shawarma", "roll",
      "ice cream", "pastry", "bakery", "juice", "shakes", "lunch", "dinner", "breakfast",
      "cafe", "restaurant", "food", "dining", "thali", "kachori", "sweets"
    ],
    categoryTerms: ["food", "dining", "canteen", "snacks", "meal"],
    suggestedIcon: "🍔",
  },
  // 2. Education / Books / Stationery / Tuition
  {
    keywords: [
      "stationary", "stationery", "pen", "pencil", "notebook", "register", "photocopy",
      "xerox", "printout", "print", "books", "book", "tuition", "coaching", "college",
      "school", "exam", "test", "course", "udemy", "coursera", "fee", "fees",
      "syllabus", "admission", "study", "education", "stationery & books"
    ],
    categoryTerms: ["education", "books", "tuition", "study", "stationery"],
    suggestedIcon: "📚",
  },
  // 3. Transport / Commute / Travel / Rides
  {
    keywords: [
      "uber", "ola", "rapido", "metro", "bus", "train", "irctc", "flight", "auto",
      "cab", "taxi", "petrol", "diesel", "fuel", "gas", "toll", "fastag", "parking",
      "puncture", "service", "scooty", "bike", "commute", "transport", "travel", "rickshaw"
    ],
    categoryTerms: ["transport", "commute", "travel", "pass", "transit"],
    suggestedIcon: "🚕",
  },
  // 4. Groceries / Quick Commerce / Supermarket
  {
    keywords: [
      "blinkit", "zepto", "instamart", "dmart", "bigbasket", "ration", "sabji",
      "vegetables", "fruits", "milk", "doodh", "curd", "paneer", "atta", "rice",
      "dal", "oil", "grocery", "groceries", "supermarket", "mart"
    ],
    categoryTerms: ["groceries", "grocery", "food"],
    suggestedIcon: "🛒",
  },
  // 5. Shopping / Clothes / E-Commerce
  {
    keywords: [
      "amazon", "flipkart", "myntra", "meesho", "ajio", "zara", "h&m", "uniqlo",
      "clothes", "tshirt", "jeans", "shoes", "sneakers", "electronics", "gadgets",
      "shopping", "apparel"
    ],
    categoryTerms: ["shopping", "leisure", "personal"],
    suggestedIcon: "🛍️",
  },
  // 6. Healthcare / Pharmacy / Gym / Fitness
  {
    keywords: [
      "hospital", "doctor", "clinic", "pharmacy", "apollo", "1mg", "netmeds",
      "pharmeasy", "medicine", "medicines", "tablet", "syrup", "test", "blood test",
      "health", "dentist", "medical", "gym", "cult", "fitness", "protein", "creatine"
    ],
    categoryTerms: ["health", "medical", "hospital", "gym", "fitness", "healthcare"],
    suggestedIcon: "💊",
  },
  // 7. Housing / Rent / Utilities / Bills
  {
    keywords: [
      "rent", "flat", "room", "pg", "hostel", "deposit", "electricity", "bijli",
      "water", "wifi", "broadband", "jio", "airtel", "maintenance", "cylinder", "bills"
    ],
    categoryTerms: ["rent", "housing", "bills", "utilities"],
    suggestedIcon: "🏠",
  },
  // 8. Entertainment / Leisure / Fun / Subscriptions
  {
    keywords: [
      "enjoy", "leisure", "party", "club", "movie", "cinema", "pvr", "inox",
      "netflix", "spotify", "prime", "hotstar", "youtube", "game", "steam", "concert"
    ],
    categoryTerms: ["leisure", "enjoy", "entertainment", "subscription"],
    suggestedIcon: "🍿",
  },
  // 9. Income / Salary / Freelance / Allowance
  {
    keywords: [
      "salary", "stipend", "paycheck", "freelance", "client", "upwork", "fiverr",
      "pocket money", "allowance", "cashback", "refund", "dividend", "interest", "bonus"
    ],
    categoryTerms: ["salary", "freelance", "allowance", "income"],
    suggestedIcon: "💰",
  },
];

export interface AutoMatchResult<T = any> {
  categoryId: string;
  categoryName: string;
  category: T;
  matchType: "direct" | "keyword";
}

/**
 * Multi-tier intelligent category matcher from note text
 * Tier 1: Direct match against user's custom category names
 * Tier 2: Comprehensive keyword & semantic dictionary mapping
 */
export function detectCategoryFromNote<T extends { id: string; name: string }>(
  noteText: string,
  categories: T[]
): AutoMatchResult<T> | null {
  if (!noteText || !noteText.trim() || !categories || categories.length === 0) {
    return null;
  }

  const lower = noteText.toLowerCase().trim();

  // Tier 1: Direct substring or token match against user's categories
  for (const cat of categories) {
    if (!cat.name) continue;
    const cName = cat.name.toLowerCase().trim();
    // Direct whole match of category name
    const exactRegex = new RegExp(`\\b${cName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "i");
    if (exactRegex.test(lower)) {
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        category: cat,
        matchType: "direct",
      };
    }
    // Check word-level tokens if multi-word (e.g. "Tuition" in "Books & Tuition")
    const tokens = cName.split(/[\s&,-]+/).filter((w) => w.length > 2);
    for (const token of tokens) {
      const regex = new RegExp(`\\b${token}\\b`, "i");
      if (regex.test(lower)) {
        return {
          categoryId: cat.id,
          categoryName: cat.name,
          category: cat,
          matchType: "direct",
        };
      }
    }
  }

  // Tier 2: Keyword & semantic dictionary mapping
  for (const group of KEYWORD_MAPPINGS) {
    const hasKeyword = group.keywords.some((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      return regex.test(lower) || lower.includes(kw);
    });

    if (hasKeyword) {
      // Find a matching category in user's category list prioritizing earlier categoryTerms
      let matched: T | undefined;
      for (const term of group.categoryTerms) {
        matched = categories.find((c) => {
          const cName = c.name.toLowerCase();
          return cName.includes(term);
        });
        if (matched) break;
      }

      if (matched) {
        return {
          categoryId: matched.id,
          categoryName: matched.name,
          category: matched,
          matchType: "keyword",
        };
      }
    }
  }

  return null;
}
