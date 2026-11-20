import { create } from "zustand";
import { persist } from "zustand/middleware";

const getLocalSystemToday = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

type ActiveTab = "today" | "goals" | "money" | "tasks" | "profile";
type ActiveTracker = "life" | "money" | "tasks";
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
  widgetVariantStyle: WidgetVariantStyle;
  setWidgetVariantStyle: (style: WidgetVariantStyle) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeTab: "today",
      setActiveTab: (tab) => set({ activeTab: tab }),
      selectedDate: getLocalSystemToday(),
      setSelectedDate: (date) => set({ selectedDate: date }),
      isMobileNavOpen: false,
      setMobileNavOpen: (open) => set({ isMobileNavOpen: open }),
      activeTracker: "life",
      setActiveTracker: (tracker) => set({ activeTracker: tracker }),
      playfulToastsEnabled: true,
      setPlayfulToastsEnabled: (enabled) => set({ playfulToastsEnabled: enabled }),
      widgetVariantStyle: "classic",
      setWidgetVariantStyle: (style) => set({ widgetVariantStyle: style }),
    }),
    {
      name: "invictus-ui-store",
      partialize: (state) => {
        // Exclude selectedDate from localStorage so app always defaults to fresh TODAY on load
        const { selectedDate, ...rest } = state;
        return rest;
      },
    }
  )
);
