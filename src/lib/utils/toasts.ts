"use client";

import { toast, type ExternalToast } from "sonner";
import { useUIStore } from "@/store/ui-store";
import { soundFX } from "@/components/shared/SoundFX";

export { toast };

export type StrobiPageContext = "today" | "habits" | "tasks" | "money" | "general";

export interface ToastOptions extends ExternalToast {
  description?: string;
  duration?: number;
  playfulMsg?: string;
  dedupeKey?: string;
  skipDedupe?: boolean;
}

export interface StrobiToastOptions extends ToastOptions {
  quip?: string;
  gear?: "gladiator" | "fitness" | "tasks" | "study" | "money" | "none";
  expression?: "happy" | "fire" | "focus" | "celebrate" | "wink";
}

// In-memory cache for rapid toast deduplication (solves edgecase where double clicks / rapid triggers flood screen)
const recentToasts = new Map<string, number>();
const DEDUPE_COOLDOWN_MS = 1200;

export function isDuplicateToast(key: string, cooldown = DEDUPE_COOLDOWN_MS): boolean {
  const now = Date.now();
  const lastTime = recentToasts.get(key);
  if (lastTime && now - lastTime < cooldown) {
    return true;
  }
  recentToasts.set(key, now);

  // Evict old entries to prevent memory leak
  if (recentToasts.size > 60) {
    for (const [k, t] of recentToasts.entries()) {
      if (now - t > 10000) recentToasts.delete(k);
    }
  }
  return false;
}

export const STROBI_PAGE_QUIPS: Record<StrobiPageContext, string[]> = {
  today: [
    "One day at a time. Conquering the day!",
    "All objectives logged! Momentum is unstoppable.",
    "Gladiator mindset active! Strobi is proud 🌟",
  ],
  habits: [
    "Habit locked in! Streak blazing 🔥",
    "Consistency beats intensity every single time.",
    "Identity shift in progress! Keep stacking wins 💪",
  ],
  tasks: [
    "Task conquered! Flow state unlocked ⚡",
    "High priority down. The queue yields to you!",
    "One win closer to the bigger vision 🎯",
  ],
  money: [
    "Expense tracked! Financial clarity is freedom 💰",
    "Disciplined spend! Budget buffer is intact.",
    "Every tracked rupee compounds into peace of mind 💸",
  ],
  general: [
    "Action captured! Invictus has your back ✨",
    "Locked and loaded! Steady execution 🚀",
  ],
};

/**
 * Dynamically classifies action context using NLP heuristics and on-device Transformers
 * to synthesize a companion quip tailored to the specific user accomplishment.
 */
export async function getDynamicStrobiQuip(
  actionText: string,
  pageContext: StrobiPageContext = "general"
): Promise<{ quip: string; expression: "happy" | "fire" | "focus" | "celebrate" | "wink"; gear: "gladiator" | "fitness" | "tasks" | "study" | "money" | "none" }> {
  const lower = (actionText || "").toLowerCase();

  // Tier 1: Fast deterministic keyword patterns (0ms response)
  if (
    lower.includes("gym") ||
    lower.includes("workout") ||
    lower.includes("run") ||
    lower.includes("bench") ||
    lower.includes("squat") ||
    lower.includes("exercise") ||
    lower.includes("pushup") ||
    lower.includes("cardio")
  ) {
    return {
      quip: "Iron sharpens iron! Hypertrophy locked in 💪",
      expression: "fire",
      gear: "fitness",
    };
  }

  if (
    lower.includes("study") ||
    lower.includes("read") ||
    lower.includes("exam") ||
    lower.includes("chapter") ||
    lower.includes("code") ||
    lower.includes("dev") ||
    lower.includes("deploy") ||
    lower.includes("auth") ||
    lower.includes("algorithm")
  ) {
    return {
      quip: "Deep work focus locked! Knowledge compounds ⚡",
      expression: "focus",
      gear: "study",
    };
  }

  if (
    lower.includes("save") ||
    lower.includes("invest") ||
    lower.includes("budget") ||
    lower.includes("salary") ||
    lower.includes("income") ||
    lower.includes("dividend") ||
    lower.includes("frugal")
  ) {
    return {
      quip: "Wealth discipline! Strobi salutes your financial buffer 💰",
      expression: "celebrate",
      gear: "money",
    };
  }

  if (
    lower.includes("water") ||
    lower.includes("hydrate") ||
    lower.includes("sleep") ||
    lower.includes("meditat") ||
    lower.includes("walk")
  ) {
    return {
      quip: "Vitality recharged! Steady pacing builds endurance 🌱",
      expression: "happy",
      gear: "gladiator",
    };
  }

  // Tier 2: On-device Semantic Transformer fallback
  try {
    const { classifyMerchantSemantically } = await import("@/lib/ai/semantic-classifier");
    const categories = [
      { id: "fitness", name: "Gym Workout Fitness Running Exercise Sports", description: "physical training hypertrophy" },
      { id: "study", name: "Study Coding Programming Reading Deep Work", description: "cognitive intellect learning" },
      { id: "money", name: "Money Budget Savings Income Frugal Investment", description: "wealth finances accounts" },
      { id: "vitality", name: "Water Hydration Sleep Meditation Recovery", description: "health well-being habits" },
    ];
    const match = await classifyMerchantSemantically(actionText, categories);
    if (match) {
      if (match.categoryId === "fitness") {
        return { quip: "Peak physical drive! Streak is burning 🔥", expression: "fire", gear: "fitness" };
      }
      if (match.categoryId === "study") {
        return { quip: "Cognitive victory! Deep flow state achieved ⚡", expression: "focus", gear: "tasks" };
      }
      if (match.categoryId === "money") {
        return { quip: "Disciplined capital allocation! Buffer secured 📈", expression: "celebrate", gear: "money" };
      }
      if (match.categoryId === "vitality") {
        return { quip: "Recovery protocol active! Ready to conquer tomorrow 🌟", expression: "happy", gear: "gladiator" };
      }
    }
  } catch {
    // Fall back silently to page context
  }

  // Tier 3: Contextual page quips
  const pool = STROBI_PAGE_QUIPS[pageContext] || STROBI_PAGE_QUIPS.general;
  const quip = pool[Math.floor(Math.random() * pool.length)];
  return {
    quip,
    expression: "happy",
    gear: pageContext === "money" ? "money" : pageContext === "habits" ? "fitness" : pageContext === "tasks" ? "tasks" : "gladiator",
  };
}

/**
 * 🌟 Strobi Toast: Intelligent Neobrutalist companion toasts with audio & haptics
 */
export const strobiToast = {
  today: (title: string, opts?: StrobiToastOptions) => {
    const key = `today:${opts?.dedupeKey || title}`;
    if (!opts?.skipDedupe && isDuplicateToast(key)) return;

    soundFX.playPop();
    soundFX.vibrate(15);
    const quip = opts?.quip || "Gladiator mindset! Day conquered 🌟";
    toast.success(title, {
      description: opts?.description ? `${opts.description} • ✨ ${quip}` : `✨ Strobi: ${quip}`,
      duration: opts?.duration || 2000,
      ...opts,
    });
  },

  habits: (title: string, opts?: StrobiToastOptions) => {
    const key = `habits:${opts?.dedupeKey || title}`;
    if (!opts?.skipDedupe && isDuplicateToast(key)) return;

    soundFX.playPop();
    soundFX.vibrate([15, 25]);
    const quip = opts?.quip || "Habit locked in! Streak blazing 🔥";
    toast.success(title, {
      description: opts?.description ? `${opts.description} • ✨ ${quip}` : `✨ Strobi: ${quip}`,
      duration: opts?.duration || 2000,
      ...opts,
    });
  },

  tasks: (title: string, opts?: StrobiToastOptions) => {
    const key = `tasks:${opts?.dedupeKey || title}`;
    if (!opts?.skipDedupe && isDuplicateToast(key)) return;

    soundFX.playPop();
    soundFX.vibrate(20);
    const quip = opts?.quip || "Task conquered! Flow state unlocked ⚡";
    toast.success(title, {
      description: opts?.description ? `${opts.description} • ✨ ${quip}` : `✨ Strobi: ${quip}`,
      duration: opts?.duration || 2000,
      ...opts,
    });
  },

  money: (title: string, opts?: StrobiToastOptions) => {
    const key = `money:${opts?.dedupeKey || title}`;
    if (!opts?.skipDedupe && isDuplicateToast(key)) return;

    soundFX.playPop();
    soundFX.vibrate([20, 40]);
    const quip = opts?.quip || "Expense tracked! Wallet in check 💰";
    toast.success(title, {
      description: opts?.description ? `${opts.description} • ✨ ${quip}` : `✨ Strobi: ${quip}`,
      duration: opts?.duration || 2000,
      ...opts,
    });
  },

  success: (title: string, opts?: StrobiToastOptions) => {
    const key = `success:${opts?.dedupeKey || title}`;
    if (!opts?.skipDedupe && isDuplicateToast(key)) return;

    soundFX.playPop();
    soundFX.vibrate(15);
    toast.success(title, {
      description: opts?.description,
      duration: opts?.duration || 1800,
      ...opts,
    });
  },

  error: (title: string, opts?: StrobiToastOptions) => {
    const key = `error:${opts?.dedupeKey || title}`;
    if (!opts?.skipDedupe && isDuplicateToast(key)) return;

    soundFX.play("error");
    soundFX.vibrate([40, 60, 40]);
    toast.error(title, {
      description: opts?.description || "Strobi is checking the logs. Try again in a moment.",
      duration: opts?.duration || 2600,
      ...opts,
    });
  },

  /**
   * Transformer-driven dynamic toast:
   * Instantly surfaces the user action, then analyzes the text via on-device AI
   * to append an intelligent companion message.
   */
  dynamic: (
    title: string,
    actionText: string,
    pageContext: StrobiPageContext = "general",
    opts?: StrobiToastOptions
  ) => {
    const key = `dyn:${opts?.dedupeKey || title}`;
    if (!opts?.skipDedupe && isDuplicateToast(key)) return;

    soundFX.playPop();
    soundFX.vibrate(15);

    // Instant toast render to eliminate latency
    const toastId = toast.success(title, {
      description: opts?.description || "Processing…",
      duration: opts?.duration || 2000,
      ...opts,
    });

    // Async on-device transformer analysis for contextual companion response
    getDynamicStrobiQuip(actionText, pageContext).then(({ quip }) => {
      toast.success(title, {
        id: toastId,
        description: opts?.description ? `${opts.description} • ✨ ${quip}` : `✨ Strobi: ${quip}`,
        duration: opts?.duration || 2000,
      });
    }).catch(() => {});

    return toastId;
  },

  promise: toast.promise,
  dismiss: toast.dismiss,
};

/**
 * Backward-compatible showToast helper
 */
export const showToast = {
  success: (msg: string, opts?: ToastOptions | string) => {
    const isPlayful = useUIStore.getState().playfulToastsEnabled;
    const description = typeof opts === "object" ? opts.description : undefined;
    const playfulMsg = typeof opts === "object" ? opts.playfulMsg : (typeof opts === "string" ? opts : undefined);
    const action = typeof opts === "object" ? opts.action : undefined;
    const duration = typeof opts === "object" ? opts.duration : 1800;

    const key = `st:success:${msg}`;
    if (isDuplicateToast(key)) return;

    const finalTitle = isPlayful && playfulMsg ? playfulMsg : msg;
    strobiToast.success(finalTitle, {
      description,
      duration,
      action,
      skipDedupe: true,
    });
  },

  error: (msg: string, opts?: ToastOptions | string) => {
    const isPlayful = useUIStore.getState().playfulToastsEnabled;
    const description = typeof opts === "object" ? opts.description : undefined;
    const playfulMsg = typeof opts === "object" ? opts.playfulMsg : (typeof opts === "string" ? opts : undefined);
    const action = typeof opts === "object" ? opts.action : undefined;
    const duration = typeof opts === "object" ? opts.duration : 2600;

    const key = `st:error:${msg}`;
    if (isDuplicateToast(key)) return;

    const finalTitle = isPlayful && playfulMsg ? playfulMsg : msg;
    strobiToast.error(finalTitle, {
      description,
      duration,
      action,
      skipDedupe: true,
    });
  },

  info: (msg: string, opts?: ToastOptions | string) => {
    const isPlayful = useUIStore.getState().playfulToastsEnabled;
    const description = typeof opts === "object" ? opts.description : undefined;
    const playfulMsg = typeof opts === "object" ? opts.playfulMsg : (typeof opts === "string" ? opts : undefined);
    const action = typeof opts === "object" ? opts.action : undefined;
    const duration = typeof opts === "object" ? opts.duration : 1800;

    const key = `st:info:${msg}`;
    if (isDuplicateToast(key)) return;

    const finalTitle = isPlayful && playfulMsg ? playfulMsg : msg;
    toast.info(finalTitle, {
      description,
      duration,
      action,
    });
  },

  warning: (msg: string, opts?: ToastOptions | string) => {
    const isPlayful = useUIStore.getState().playfulToastsEnabled;
    const description = typeof opts === "object" ? opts.description : undefined;
    const playfulMsg = typeof opts === "object" ? opts.playfulMsg : (typeof opts === "string" ? opts : undefined);
    const action = typeof opts === "object" ? opts.action : undefined;
    const duration = typeof opts === "object" ? opts.duration : 2200;

    const key = `st:warning:${msg}`;
    if (isDuplicateToast(key)) return;

    const finalTitle = isPlayful && playfulMsg ? playfulMsg : msg;
    toast.warning(finalTitle, {
      description,
      duration,
      action,
    });
  },
};
