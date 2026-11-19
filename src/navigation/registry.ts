/**
 * Invictus OS Universal Navigation & Domain Registry
 * Strictly enforces Container Types (TAB | SCREEN | SHEET | INLINE)
 * and Domain Clusters (HABITS CORE | BODY & GYM | NUTRITION | RECOVERY | MONEY | SYSTEM).
 */

export type NavigationContainerType = "TAB" | "SCREEN" | "SHEET" | "INLINE";

export type NavigationDomain =
  | "HABITS CORE"
  | "BODY & GYM"
  | "NUTRITION"
  | "RECOVERY"
  | "MONEY"
  | "SYSTEM";

export interface NavigationItem {
  id: string;
  domain: NavigationDomain;
  container: NavigationContainerType;
  title: string;
  routeKey: string;
  parentPage: string;
  icon?: string;
  description?: string;
}

export const NAVIGATION_REGISTRY: Record<string, NavigationItem> = {
  // ================= HABITS DOMAIN =================
  "habits.main": {
    id: "habits.main",
    domain: "HABITS CORE",
    container: "TAB",
    title: "Habits",
    routeKey: "/goals",
    parentPage: "/goals",
    icon: "CheckSquare",
    description: "Daily atomic routines & momentum cockpit",
  },
  "habits.new": {
    id: "habits.new",
    domain: "HABITS CORE",
    container: "SHEET",
    title: "New Habit",
    routeKey: "?sheet=new-habit",
    parentPage: "/goals",
    icon: "Plus",
    description: "Create or import habit routines",
  },
  "habits.edit": {
    id: "habits.edit",
    domain: "HABITS CORE",
    container: "SHEET",
    title: "Edit Habit",
    routeKey: "?sheet=edit-habit",
    parentPage: "/goals",
    icon: "Edit3",
    description: "Edit habit title, reminder, or streak rules",
  },
  "habits.shields": {
    id: "habits.shields",
    domain: "HABITS CORE",
    container: "SHEET",
    title: "Cryo-Shield Vault",
    routeKey: "?sheet=shields",
    parentPage: "/goals",
    icon: "ShieldCheck",
    description: "Streak freeze inventory & replenishment history",
  },
  "habits.reminders": {
    id: "habits.reminders",
    domain: "HABITS CORE",
    container: "SHEET",
    title: "Reminders & Notifications",
    routeKey: "?sheet=reminders",
    parentPage: "/goals",
    icon: "Bell",
    description: "Proactive audio and alert schedule",
  },
  "habits.all": {
    id: "habits.all",
    domain: "HABITS CORE",
    container: "SCREEN",
    title: "All Habits Vault",
    routeKey: "/goals/all",
    parentPage: "/goals",
    icon: "List",
    description: "Full uncapped list of active and archived habits",
  },
  "habits.detail": {
    id: "habits.detail",
    domain: "HABITS CORE",
    container: "SCREEN",
    title: "Habit Analytics",
    routeKey: "/goals/[id]",
    parentPage: "/goals",
    icon: "TrendingUp",
    description: "Per-habit completion logs & streaks",
  },

  // ================= BODY & GYM DOMAIN =================
  "gym.main": {
    id: "gym.main",
    domain: "BODY & GYM",
    container: "TAB",
    title: "Gym & Routines",
    routeKey: "/goals/gym",
    parentPage: "/goals",
    icon: "Dumbbell",
    description: "Progressive overload routine tracker & active rest timer",
  },
  "gym.log-workout": {
    id: "gym.log-workout",
    domain: "BODY & GYM",
    container: "SHEET",
    title: "Log Workout",
    routeKey: "?sheet=log-workout",
    parentPage: "/goals/gym",
    icon: "PlusCircle",
    description: "Quick log workout session or add exercises",
  },
  "gym.body-profile": {
    id: "gym.body-profile",
    domain: "BODY & GYM",
    container: "SHEET",
    title: "Body Profile",
    routeKey: "?sheet=body-profile",
    parentPage: "/goals/gym",
    icon: "Activity",
    description: "Body weight, measurements, gender and age",
  },
  "gym.anatomy": {
    id: "gym.anatomy",
    domain: "BODY & GYM",
    container: "SCREEN",
    title: "Muscle Activation Anatomy",
    routeKey: "/goals/gym/anatomy",
    parentPage: "/goals/gym",
    icon: "Eye",
    description: "Interactive visual muscular load anatomy",
  },

  // ================= NUTRITION DOMAIN =================
  "diet.main": {
    id: "diet.main",
    domain: "NUTRITION",
    container: "TAB",
    title: "Diet & Fuel",
    routeKey: "/goals/nutrition",
    parentPage: "/goals",
    icon: "Utensils",
    description: "Macro targets, meal slots, and food library",
  },
  "diet.log-meal": {
    id: "diet.log-meal",
    domain: "NUTRITION",
    container: "SHEET",
    title: "Log Meal",
    routeKey: "?sheet=log-meal",
    parentPage: "/goals/nutrition",
    icon: "Plus",
    description: "Log food item and calculate macros",
  },
  "diet.water": {
    id: "diet.water",
    domain: "NUTRITION",
    container: "SHEET",
    title: "Hydration Chamber",
    routeKey: "?sheet=water",
    parentPage: "/goals/nutrition",
    icon: "Droplet",
    description: "Water logging, fast add (+250/+500), and target settings",
  },

  // ================= RECOVERY DOMAIN =================
  "recovery.main": {
    id: "recovery.main",
    domain: "RECOVERY",
    container: "SHEET",
    title: "Evening Recovery & Journal",
    routeKey: "?sheet=recovery",
    parentPage: "/goals",
    icon: "Moon",
    description: "Sleep duration, mood journal, and daily reflections",
  },

  // ================= STATS DOMAIN =================
  "stats.main": {
    id: "stats.main",
    domain: "HABITS CORE",
    container: "TAB",
    title: "Analytics & Streaks",
    routeKey: "/goals/analytics",
    parentPage: "/goals",
    icon: "BarChart3",
    description: "30-day heatmap matrix, completion velocity, and trophies",
  },

  // ================= MONEY DOMAIN =================
  "money.main": {
    id: "money.main",
    domain: "MONEY",
    container: "TAB",
    title: "Overview",
    routeKey: "/money",
    parentPage: "/money",
    icon: "Wallet",
    description: "Belanje financial overview, physical card deck, and ambient daily pace",
  },
  "money.ledger-sheet": {
    id: "money.ledger-sheet",
    domain: "MONEY",
    container: "SHEET",
    title: "Transaction Ledger & Envelopes",
    routeKey: "?sheet=ledger",
    parentPage: "/money",
    icon: "Receipt",
    description: "Complete searchable transaction history, category rail, and payment filters",
  },
  "money.budgets": {
    id: "money.budgets",
    domain: "MONEY",
    container: "TAB",
    title: "Budgets",
    routeKey: "/money?tab=budgets",
    parentPage: "/money",
    icon: "Target",
    description: "Budget envelopes, rollover telemetry, and category caps",
  },
  "money.debts": {
    id: "money.debts",
    domain: "MONEY",
    container: "TAB",
    title: "IOUs 🤝",
    routeKey: "/money?tab=debts",
    parentPage: "/money",
    icon: "Users",
    description: "Who owes who, split bills, and pending repayments",
  },
  "money.vault": {
    id: "money.vault",
    domain: "MONEY",
    container: "TAB",
    title: "Vault",
    routeKey: "/money?tab=vault",
    parentPage: "/money",
    icon: "PiggyBank",
    description: "Savings goals, emergency fund lockups, and milestone projections",
  },
  "money.analytics": {
    id: "money.analytics",
    domain: "MONEY",
    container: "SCREEN",
    title: "Financial Analytics",
    routeKey: "/money?tab=analytics",
    parentPage: "/money",
    icon: "BarChart2",
    description: "Cash flow velocity, spend breakdown, and category trends",
  },
  "money.allowances": {
    id: "money.allowances",
    domain: "MONEY",
    container: "SHEET",
    title: "Allowances & Limits",
    routeKey: "?sheet=allowances",
    parentPage: "/money",
    icon: "Sliders",
    description: "Configure UPI, Cash, and Daily Safe Pace limits",
  },
  "money.new-tx": {
    id: "money.new-tx",
    domain: "MONEY",
    container: "SHEET",
    title: "Log Expense",
    routeKey: "?sheet=new-tx",
    parentPage: "/money",
    icon: "Plus",
    description: "Record expense transaction with category and payment method",
  },
  "money.new-income": {
    id: "money.new-income",
    domain: "MONEY",
    container: "SHEET",
    title: "Log Income",
    routeKey: "?sheet=new-income",
    parentPage: "/money",
    icon: "TrendingUp",
    description: "Record income, allowance, salary, or freelancing earnings",
  },
  "money.transfer": {
    id: "money.transfer",
    domain: "MONEY",
    container: "SHEET",
    title: "Transfer Funds",
    routeKey: "?sheet=transfer",
    parentPage: "/money",
    icon: "ArrowRightLeft",
    description: "Move money between digital accounts and cash till",
  },
  "money.split-bill": {
    id: "money.split-bill",
    domain: "MONEY",
    container: "SHEET",
    title: "Split Bill / IOU",
    routeKey: "?sheet=split",
    parentPage: "/money",
    icon: "Users",
    description: "Split group check or track personal debt with friends",
  },
  "money.export-pdf": {
    id: "money.export-pdf",
    domain: "MONEY",
    container: "SHEET",
    title: "Export Ledger Report",
    routeKey: "?sheet=export",
    parentPage: "/money",
    icon: "FileDown",
    description: "Generate clean PDF or CSV bank statement export",
  },
  "money.bulk-scan": {
    id: "money.bulk-scan",
    domain: "MONEY",
    container: "SHEET",
    title: "Bulk Expense Entry",
    routeKey: "?sheet=bulk",
    parentPage: "/money",
    icon: "FileSpreadsheet",
    description: "Quick-paste multiple items or rapid sequential logging",
  },
  "money.calculator": {
    id: "money.calculator",
    domain: "MONEY",
    container: "SHEET",
    title: "Neobrutalist Calculator",
    routeKey: "?sheet=calculator",
    parentPage: "/money",
    icon: "Calculator",
    description: "Tactile scratchpad and tip/split math calculator",
  },
};

/**
 * Helper to retrieve domain home route
 */
export function getDomainHome(domain: NavigationDomain): string {
  switch (domain) {
    case "HABITS CORE":
      return "/goals";
    case "BODY & GYM":
      return "/goals/gym";
    case "NUTRITION":
      return "/goals/nutrition";
    case "RECOVERY":
      return "/goals?sheet=recovery";
    case "MONEY":
      return "/money";
    case "SYSTEM":
      return "/settings";
    default:
      return "/goals";
  }
}
