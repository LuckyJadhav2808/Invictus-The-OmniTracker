import {
  Dumbbell,
  Utensils,
  Droplet,
  Receipt,
  ReceiptText,
  FileDown,
  Users,
  CheckCircle2,
  CheckSquare,
  FolderKanban,
  type LucideIcon,
} from "lucide-react";

export interface ContextQuickAction {
  id: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  bgClass: string;
  textClass: string;
  borderClass: string;
  shortcut?: string;
  onClick: () => void;
}

/**
 * Single source of truth for context-aware quick actions per route.
 * Consumed by both Mobile HalfFlowerMenu and DesktopQuickActionsBar.
 */
export function getContextQuickActions(pathname: string): ContextQuickAction[] {
  const dispatch = (eventName: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(eventName));
    }
  };

  if (pathname.startsWith("/goals")) {
    return [
      {
        id: "log-water",
        label: "Log Water",
        shortLabel: "+Water",
        icon: Droplet,
        bgClass: "bg-[#38BDF8]",
        textClass: "text-[#161514]",
        borderClass: "border-[#161514]",
        onClick: () => dispatch("invictus:open-water-modal"),
      },
      {
        id: "log-meal",
        label: "Log Meal",
        shortLabel: "Meal",
        icon: Utensils,
        bgClass: "bg-[#03D26F]",
        textClass: "text-[#161514]",
        borderClass: "border-[#161514]",
        onClick: () => dispatch("invictus:open-quick-meal"),
      },
      {
        id: "new-habit",
        label: "New Habit",
        shortLabel: "Habit",
        icon: CheckSquare,
        bgClass: "bg-[#CEF431]",
        textClass: "text-[#161514]",
        borderClass: "border-[#161514]",
        onClick: () => dispatch("invictus:open-new-habit"),
      },
      {
        id: "log-workout",
        label: "Log Workout",
        shortLabel: "Workout",
        icon: Dumbbell,
        bgClass: "bg-[#F59E0B]",
        textClass: "text-[#161514]",
        borderClass: "border-[#161514]",
        onClick: () => dispatch("invictus:open-quick-workout"),
      },
    ];
  }

  if (pathname.startsWith("/money")) {
    return [
      {
        id: "new-expense",
        label: "Log Expense",
        shortLabel: "Expense",
        icon: Receipt,
        bgClass: "bg-[#CEF431]",
        textClass: "text-[#161514]",
        borderClass: "border-[#161514]",
        shortcut: "⌘E",
        onClick: () => dispatch("invictus:money-new-expense"),
      },
      {
        id: "export-ledger",
        label: "Export",
        shortLabel: "Export",
        icon: FileDown,
        bgClass: "bg-[#03D26F]",
        textClass: "text-[#161514]",
        borderClass: "border-[#161514]",
        onClick: () => dispatch("invictus:money-export"),
      },
      {
        id: "split-bill",
        label: "Who Owes Who",
        shortLabel: "Split/IOU",
        icon: Users,
        bgClass: "bg-[#38BDF8]",
        textClass: "text-[#161514]",
        borderClass: "border-[#161514]",
        onClick: () => dispatch("invictus:money-split"),
      },
      {
        id: "open-ledger",
        label: "Open Ledger",
        shortLabel: "Ledger",
        icon: ReceiptText,
        bgClass: "bg-[#C084FC]",
        textClass: "text-[#161514]",
        borderClass: "border-[#161514]",
        onClick: () => dispatch("invictus:money-open-ledger"),
      },
    ];
  }

  if (pathname.startsWith("/tasks")) {
    return [
      {
        id: "new-task",
        label: "New Task",
        shortLabel: "Task",
        icon: CheckCircle2,
        bgClass: "bg-[#CEF431]",
        textClass: "text-[#161514]",
        borderClass: "border-[#161514]",
        onClick: () => dispatch("invictus:tasks-new-task"),
      },
      {
        id: "new-project",
        label: "New Project",
        shortLabel: "Project",
        icon: FolderKanban,
        bgClass: "bg-[#03D26F]",
        textClass: "text-[#161514]",
        borderClass: "border-[#161514]",
        onClick: () => dispatch("invictus:tasks-new-project"),
      },
      {
        id: "tasks-water",
        label: "Quick Water",
        shortLabel: "+Water",
        icon: Droplet,
        bgClass: "bg-[#38BDF8]",
        textClass: "text-[#161514]",
        borderClass: "border-[#161514]",
        onClick: () => dispatch("invictus:open-water-modal"),
      },
      {
        id: "tasks-expense",
        label: "Log Expense",
        shortLabel: "Expense",
        icon: Receipt,
        bgClass: "bg-[#C084FC]",
        textClass: "text-[#161514]",
        borderClass: "border-[#161514]",
        onClick: () => dispatch("invictus:money-new-expense"),
      },
    ];
  }

  // Default: Today & general routes
  return [
    {
      id: "today-task",
      label: "New Task",
      shortLabel: "Task",
      icon: CheckCircle2,
      bgClass: "bg-[#CEF431]",
      textClass: "text-[#161514]",
      borderClass: "border-[#161514]",
      onClick: () => dispatch("invictus:tasks-new-task"),
    },
    {
      id: "today-expense",
      label: "Log Expense",
      shortLabel: "Expense",
      icon: Receipt,
      bgClass: "bg-[#03D26F]",
      textClass: "text-[#161514]",
      borderClass: "border-[#161514]",
      shortcut: "⌘E",
      onClick: () => dispatch("invictus:money-new-expense"),
    },
    {
      id: "today-water",
      label: "Quick Water",
      shortLabel: "+Water",
      icon: Droplet,
      bgClass: "bg-[#38BDF8]",
      textClass: "text-[#161514]",
      borderClass: "border-[#161514]",
      onClick: () => dispatch("invictus:open-water-modal"),
    },
    {
      id: "today-habit",
      label: "New Habit",
      shortLabel: "Habit",
      icon: CheckSquare,
      bgClass: "bg-[#C084FC]",
      textClass: "text-[#161514]",
      borderClass: "border-[#161514]",
      onClick: () => dispatch("invictus:open-new-habit"),
    },
  ];
}
