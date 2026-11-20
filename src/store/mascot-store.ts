import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type MascotColorTheme =
  | "classic-blue"
  | "electric-lime"
  | "emerald"
  | "sunset-peach"
  | "amethyst"
  | "solar-amber"
  | "hot-coral"
  | "titanium";

export type MascotExpression =
  | "joy"
  | "wink"
  | "shades"
  | "zen"
  | "fire"
  | "scholar";

export interface MascotThemeConfig {
  name: MascotColorTheme;
  label: string;
  previewColor: string;
  glowColor: string;
  stops: [string, string, string, string, string];
}

export const MASCOT_COLOR_THEMES: Record<MascotColorTheme, MascotThemeConfig> = {
  "classic-blue": {
    name: "classic-blue",
    label: "Electric Blue",
    previewColor: "#5B7FE5",
    glowColor: "rgba(91, 127, 229, 0.4)",
    stops: ["#A8C4FF", "#7E9FF8", "#5B7FE5", "#375DC7", "#1B3285"],
  },
  "electric-lime": {
    name: "electric-lime",
    label: "Electric Lime",
    previewColor: "#CEF431",
    glowColor: "rgba(206, 244, 49, 0.45)",
    stops: ["#F4FFB8", "#CEF431", "#A6D216", "#739B07", "#3F5602"],
  },
  emerald: {
    name: "emerald",
    label: "Malachite Emerald",
    previewColor: "#03D26F",
    glowColor: "rgba(3, 210, 111, 0.4)",
    stops: ["#BAF7D0", "#6EE7B7", "#10B981", "#047857", "#064E3B"],
  },
  "sunset-peach": {
    name: "sunset-peach",
    label: "Sunset Peach",
    previewColor: "#FB923C",
    glowColor: "rgba(251, 146, 60, 0.4)",
    stops: ["#FFEDD5", "#FDBA74", "#FB923C", "#EA580C", "#9A3412"],
  },
  amethyst: {
    name: "amethyst",
    label: "Amethyst Violet",
    previewColor: "#A855F7",
    glowColor: "rgba(168, 85, 247, 0.4)",
    stops: ["#F3E8FF", "#D8B4FE", "#A855F7", "#7E22CE", "#581C87"],
  },
  "solar-amber": {
    name: "solar-amber",
    label: "Solar Amber",
    previewColor: "#F59E0B",
    glowColor: "rgba(245, 158, 11, 0.4)",
    stops: ["#FEF3C7", "#FCD34D", "#F59E0B", "#D97706", "#78350F"],
  },
  "hot-coral": {
    name: "hot-coral",
    label: "Hot Coral",
    previewColor: "#F43F5E",
    glowColor: "rgba(244, 63, 94, 0.4)",
    stops: ["#FFE4E6", "#FDA4AF", "#F43F5E", "#BE123C", "#881337"],
  },
  titanium: {
    name: "titanium",
    label: "Titanium Slate",
    previewColor: "#64748B",
    glowColor: "rgba(100, 116, 139, 0.4)",
    stops: ["#F8FAFC", "#CBD5E1", "#64748B", "#334155", "#0F172A"],
  },
};

export interface MascotExpressionOption {
  id: MascotExpression;
  label: string;
  emoji: string;
  description: string;
}

export const MASCOT_EXPRESSIONS: MascotExpressionOption[] = [
  { id: "joy", label: "Joy", emoji: "😊", description: "Cheerful & energetic companion" },
  { id: "wink", label: "Wink", emoji: "😉", description: "Playful & witty co-pilot" },
  { id: "shades", label: "Shades", emoji: "😎", description: "Effortlessly cool hacker mode" },
  { id: "zen", label: "Zen", emoji: "😌", description: "Calm, grounded mindfulness" },
  { id: "fire", label: "Fire", emoji: "🔥", description: "Relentless discipline & streak power" },
  { id: "scholar", label: "Scholar", emoji: "🧐", description: "Deep work focus & sharp intellect" },
];

interface MascotState {
  colorTheme: MascotColorTheme;
  expression: MascotExpression;
  customName: string;
  setColorTheme: (colorTheme: MascotColorTheme) => void;
  setExpression: (expression: MascotExpression) => void;
  setCustomName: (customName: string) => void;
  resetMascot: () => void;
}

// One-time client-side migration ensuring existing users have classic-blue default
if (typeof window !== "undefined") {
  try {
    const migrated = localStorage.getItem("invictus_mascot_blue_v2");
    if (!migrated) {
      localStorage.setItem("invictus_mascot_blue_v2", "true");
      const raw = localStorage.getItem("invictus_mascot_config");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.state) {
          parsed.state.colorTheme = "classic-blue";
          localStorage.setItem("invictus_mascot_config", JSON.stringify(parsed));
        }
      }
    }
  } catch {}
}

export const useMascotStore = create<MascotState>()(
  persist(
    (set) => ({
      colorTheme: "classic-blue",
      expression: "joy",
      customName: "Strobi",
      setColorTheme: (colorTheme) => set({ colorTheme }),
      setExpression: (expression) => set({ expression }),
      setCustomName: (customName) => set({ customName }),
      resetMascot: () =>
        set({
          colorTheme: "classic-blue",
          expression: "joy",
          customName: "Strobi",
        }),
    }),
    {
      name: "invictus_mascot_config",
      version: 2,
      migrate: (persistedState: any, version: number) => {
        const state = (persistedState || {}) as Partial<MascotState>;
        // Migration to v2: enforce classic-blue as default for existing users
        if (!version || version < 2) {
          return {
            ...state,
            colorTheme: "classic-blue",
            expression: state.expression || "joy",
            customName: state.customName || "Strobi",
          };
        }
        return state as MascotState;
      },
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined" && window.localStorage) {
          return window.localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
    }
  )
);
