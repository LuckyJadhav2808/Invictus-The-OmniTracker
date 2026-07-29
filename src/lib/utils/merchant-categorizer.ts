// 100+ Merchant & Keyword Categorization Dataset Engine
export interface MerchantRule {
  keywords: string[];
  categoryName: string;
  suggestedIcon: string;
}

export const MERCHANT_RULES: MerchantRule[] = [
  {
    keywords: ["swiggy", "zomato", "dominos", "pizza", "mcdonalds", "burger", "starbucks", "subway", "kfc", "restaurant", "cafe", "dinner", "lunch", "coffee", "tea", "chai", "food", "dining", "bar", "pub", "baking", "bakery"],
    categoryName: "Dining & Outings",
    suggestedIcon: "🍕",
  },
  {
    keywords: ["uber", "ola", "rapido", "cab", "taxi", "petrol", "diesel", "fuel", "shell", "hp", "bpcl", "metro", "bus", "train", "flight", "airindia", "indigo", "toll", "parking", "auto", "transport", "travel"],
    categoryName: "Transportation & Fuel",
    suggestedIcon: "🚗",
  },
  {
    keywords: ["dmart", "d-mart", "blinkit", "zepto", "instamart", "bigbasket", "grofers", "supermarket", "grocery", "groceries", "milk", "vegetables", "fruits", "provisions", "bazaar", "reliance fresh"],
    categoryName: "Groceries & Provisions",
    suggestedIcon: "🛒",
  },
  {
    keywords: ["electricity", "power", "bescom", "tata power", "water", "wifi", "broadband", "jio", "airtel", "vi", "recharge", "gas", "cylinder", "indane", "hp gas", "utilities", "maintenance"],
    categoryName: "Utilities & Wifi",
    suggestedIcon: "⚡",
  },
  {
    keywords: ["cult.fit", "cultfit", "gym", "fitness", "protein", "whey", "creatine", "gold gym", "anytime fitness", "decathlon", "yoga", "trainer"],
    categoryName: "Gym & Health",
    suggestedIcon: "🏋️",
  },
  {
    keywords: ["amazon", "flipkart", "myntra", "ajio", "nykaa", "zara", "h&m", "uniqlo", "clothes", "shoes", "nike", "adidas", "puma", "electronics", "croma", "reliance digital", "apple", "shopping", "gadgets"],
    categoryName: "Shopping & Wants",
    suggestedIcon: "🛍️",
  },
  {
    keywords: ["apollo", "pharmacy", "1mg", "pharmeasy", "doctor", "hospital", "clinic", "medicine", "meds", "dental", "blood test", "health insurance", "medplus"],
    categoryName: "Healthcare & Meds",
    suggestedIcon: "🩺",
  },
  {
    keywords: ["zerodha", "groww", "indmoney", "upstox", "sip", "mutual fund", "stocks", "share", "crypto", "binance", "coinswitch", "ppf", "nps", "fd", "investment", "investments"],
    categoryName: "SIP Investments",
    suggestedIcon: "📈",
  },
  {
    keywords: ["savings", "emergency", "deposit", "vault", "reserve"],
    categoryName: "Emergency Savings",
    suggestedIcon: "💰",
  },
];

export function detectCategoryFromNote(noteText: string, categories: any[]): { categoryId?: string; categoryName?: string; icon?: string } | null {
  if (!noteText || !noteText.trim()) return null;
  const lowerNote = noteText.toLowerCase().trim();

  for (const rule of MERCHANT_RULES) {
    for (const keyword of rule.keywords) {
      if (lowerNote.includes(keyword)) {
        // Find matching category in user categories list
        const match = categories.find((c) =>
          c.name.toLowerCase().includes(rule.categoryName.toLowerCase()) ||
          rule.categoryName.toLowerCase().includes(c.name.toLowerCase())
        );

        return {
          categoryId: match?.id,
          categoryName: match?.name || rule.categoryName,
          icon: rule.suggestedIcon,
        };
      }
    }
  }

  return null;
}
