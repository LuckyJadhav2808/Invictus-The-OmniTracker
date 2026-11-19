/**
 * Invictus OS Universal Navigation & Domain Registry
 * Strictly enforces Container Types (TAB | SCREEN | SHEET | INLINE)
 * and Domain Clusters (HABITS CORE | BODY & GYM | NUTRITION | RECOVERY | MONEY | STUDY | SYSTEM).
 */

export type NavigationContainerType = "TAB" | "SCREEN" | "SHEET" | "INLINE";

export type NavigationDomain =
  | "HABITS CORE"
  | "BODY & GYM"
  | "NUTRITION"
  | "RECOVERY"
  | "MONEY"
  | "STUDY"
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
    case "STUDY":
      return "/study";
    case "SYSTEM":
      return "/settings";
    default:
      return "/goals";
  }
}
