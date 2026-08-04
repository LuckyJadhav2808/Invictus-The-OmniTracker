import { create } from "zustand";
import { persist } from "zustand/middleware";

type ActiveTab = "today" | "goals" | "study" | "money" | "tasks" | "profile";
type ActiveTracker = "life" | "study" | "money" | "tasks";
type HabitLayoutStyle = "cards" | "compact";
type WidgetVariantStyle = "classic" | "expanded" | "dark";

interface UIState {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedDate: string; // "yyyy-mm-dd"
  setSelectedDate: (date: string) => void;
  isMobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  activeTracker: ActiveTracker;
  setActiveTracker: (tracker: ActiveTracker) => void;
  playfulToastsEnabled: boolean;
  setPlayfulToastsEnabled: (enabled: boolean) => void;
  habitLayoutStyle: HabitLayoutStyle;
  setHabitLayoutStyle: (style: HabitLayoutStyle) => void;
  widgetVariantStyle: WidgetVariantStyle;
  setWidgetVariantStyle: (style: WidgetVariantStyle) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeTab: "today",
      setActiveTab: (tab) => set({ activeTab: tab }),
      selectedDate: new Date().toISOString().split("T")[0],
      setSelectedDate: (date) => set({ selectedDate: date }),
      isMobileNavOpen: false,
      setMobileNavOpen: (open) => set({ isMobileNavOpen: open }),
      activeTracker: "life",
      setActiveTracker: (tracker) => set({ activeTracker: tracker }),
      playfulToastsEnabled: true,
      setPlayfulToastsEnabled: (enabled) => set({ playfulToastsEnabled: enabled }),
      habitLayoutStyle: "cards",
      setHabitLayoutStyle: (style) => set({ habitLayoutStyle: style }),
      widgetVariantStyle: "classic",
      setWidgetVariantStyle: (style) => set({ widgetVariantStyle: style }),
    }),
    {
      name: "invictus-ui-store",
    }
  )
);
