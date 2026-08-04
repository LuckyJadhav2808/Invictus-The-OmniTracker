"use client";

import { useState, useEffect } from "react";
import { useUIStore } from "@/store/ui-store";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sparkles, ArrowRight, Megaphone, X, Home, BookOpen, Wallet, CheckSquare, Dumbbell, Utensils, Moon, Trophy, ChevronDown, Bell, Eye, EyeOff } from "lucide-react";
import { InvictusLogo } from "@/components/shared/InvictusLogo";
import { getGlobalAnnouncement, type GlobalAnnouncement } from "@/lib/custom-auth";
import { requestNotificationPermission, sendNativeNotification } from "@/lib/utils/notifications";
import { toast } from "sonner";

export function SpaceHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeTracker, setActiveTracker } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<GlobalAnnouncement | null>(null);
  const [dismissedAnn, setDismissedAnn] = useState(false);
  
  // Toggle sub-nav visibility state with localStorage persistence
  const [isSubNavVisible, setIsSubNavVisible] = useState<boolean>(true);

  useEffect(() => {
    const ann = getGlobalAnnouncement();
    setAnnouncement(ann);

    try {
      const savedSubNav = localStorage.getItem("invictus_show_subnav");
      if (savedSubNav !== null) {
        setIsSubNavVisible(savedSubNav === "true");
      }
    } catch {}
  }, []);

  const toggleSubNav = () => {
    const next = !isSubNavVisible;
    setIsSubNavVisible(next);
    try {
      localStorage.setItem("invictus_show_subnav", String(next));
    } catch {}
    toast.info(next ? "Sub-navigation bar visible 📍" : "Sub-navigation bar hidden 🙈");
  };

  const spaces = [
    {
      value: "today" as const,
      label: "🔥 Today Overview",
      shortLabel: "🔥 Today Space",
      mobileLabel: "🔥 Today",
      desc: "Daily flow, habits summary & liquid chart",
      activeBg: "bg-[#CEF431] text-[#161514]",
      accentBg: "bg-[#CEF431]/30 text-[#161514]",
      href: "/today",
    },
    {
      value: "life" as const,
      label: "🌱 Goals & Life",
      shortLabel: "🌱 Goals Space",
      mobileLabel: "🌱 Goals",
      desc: "Habits, gym splits, nutrition & sleep",
      activeBg: "bg-[#03D26F] text-[#161514]",
      accentBg: "bg-[#03D26F]/30 text-[#161514]",
      href: "/goals",
    },
    {
      value: "study" as const,
      label: "📚 Study & Exams",
      shortLabel: "📚 Study Space",
      mobileLabel: "📚 Study",
      desc: "GATE syllabus, revision & mock tests",
      activeBg: "bg-[#C084FC] text-[#161514]",
      accentBg: "bg-[#C084FC]/30 text-[#161514]",
      href: "/study",
    },
    {
      value: "tasks" as const,
      label: "📋 Tasks & Projects",
      shortLabel: "📋 Tasks Space",
      mobileLabel: "📋 Tasks",
      desc: "Kanban board, P1-P4 matrix & subtasks",
      activeBg: "bg-[#F59E0B] text-white",
      accentBg: "bg-[#F59E0B]/30 text-[#161514]",
      href: "/tasks",
    },
    {
      value: "money" as const,
      label: "💰 Money & Ledger",
      shortLabel: "💰 Money Space",
      mobileLabel: "💰 Money",
      desc: "Category wallets, budgets & savings",
      activeBg: "bg-[#FBCFE8] text-[#161514]",
      accentBg: "bg-[#FBCFE8]/30 text-[#161514]",
      href: "/money",
    },
  ];

  const currentSpace =
    spaces.find(
      (s) =>
        s.href === "/today"
          ? pathname === "/today"
          : pathname.startsWith(s.href)
    ) || spaces[0];

  const handleSpaceChange = (spaceValue: string, href: string) => {
    if (spaceValue !== "today") {
      setActiveTracker(spaceValue as any);
    }
    setIsOpen(false);
    router.push(href);
  };

  const enableOSNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      sendNativeNotification("Invictus Status Bar Notifications Active 🚀", "You will receive background alerts on your laptop and mobile status bar!");
      toast.success("Laptop & Mobile Status Bar Notifications Active! 🔔");
    } else {
      toast.error("Notification permission denied in browser settings.");
    }
  };

  const getSubFeatures = () => {
    if (pathname.startsWith("/tasks")) {
      return [
        { label: "Kanban Board", icon: CheckSquare, targetId: "kanban-board", spaceHref: "/tasks", tab: "kanban" },
        { label: "Task List", icon: Sparkles, targetId: "task-list", spaceHref: "/tasks", tab: "list" },
        { label: "Eisenhower Matrix", icon: Trophy, targetId: "matrix-view", spaceHref: "/tasks", tab: "matrix" },
      ];
    }
    if (pathname.startsWith("/study")) {
      return [
        { label: "Syllabus Tracker", icon: BookOpen, targetId: "syllabus-tracker", spaceHref: "/study", tab: "subjects" },
        { label: "Study Logger", icon: Sparkles, targetId: "session-logger", spaceHref: "/study", tab: "subjects" },
        { label: "Mock Tests", icon: Trophy, targetId: "mock-tests", spaceHref: "/study", tab: "tests" },
      ];
    }
    if (pathname.startsWith("/money")) {
      return [
        { label: "Category Wallets", icon: Wallet, targetId: "category-wallets", spaceHref: "/money", tab: "ledger" },
        { label: "Savings Goals", icon: Sparkles, targetId: "savings-goals", spaceHref: "/money", tab: "ledger" },
        { label: "Subscriptions", icon: Sparkles, targetId: "subscriptions", spaceHref: "/money", tab: "ledger" },
      ];
    }
    if (pathname.startsWith("/goals")) {
      return [
        { label: "Habits List", icon: CheckSquare, targetId: "habits-section", spaceHref: "/goals", tab: "list" },
        { label: "Gym Splits", icon: Dumbbell, targetId: "gym-section", spaceHref: "/goals", tab: "gym" },
        { label: "Nutrition & Meals", icon: Utensils, targetId: "nutrition-section", spaceHref: "/goals", tab: "gym" },
        { label: "Sleep & Mood", icon: Moon, targetId: "mood-section", spaceHref: "/goals", tab: "list" },
      ];
    }
    return [
      { label: "Daily Overview", icon: Home, targetId: "overview", spaceHref: "/today", tab: "overview" },
      { label: "Liquid Bar Chart", icon: Sparkles, targetId: "pillbar-chart", spaceHref: "/today", tab: "overview" },
    ];
  };

  const subFeatures = getSubFeatures();

  const scrollToTargetWithRetry = (targetId: string, attempts = 0) => {
    const el = document.getElementById(targetId);
    if (el) {
      const headerOffset = 120;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: "smooth",
      });

      el.classList.add("ring-4", "ring-[#CEF431]", "scale-[1.01]", "transition-all", "duration-300");
      setTimeout(() => {
        el.classList.remove("ring-4", "ring-[#CEF431]", "scale-[1.01]");
      }, 2000);
    } else if (attempts < 15) {
      setTimeout(() => scrollToTargetWithRetry(targetId, attempts + 1), 150);
    }
  };

  useEffect(() => {
    const jumpId = searchParams.get("jump") || (typeof window !== "undefined" ? window.location.hash.replace("#", "") : "");
    if (jumpId) {
      scrollToTargetWithRetry(jumpId);
    }
  }, [pathname, searchParams]);

  const handleSubFeatureClick = (targetId: string, spaceHref?: string, tab?: string) => {
    const currentTab = searchParams.get("tab");
    const targetSpace = spaceHref || "/today";
    const needsTabSwitch = tab && currentTab !== tab;
    const needsPageNavigation = !pathname.startsWith(targetSpace);

    if (needsPageNavigation || needsTabSwitch) {
      const queryTab = tab ? `&tab=${tab}` : "";
      router.push(`${targetSpace}?jump=${targetId}${queryTab}`);
      return;
    }

    scrollToTargetWithRetry(targetId);
  };

  return (
    <>
      {announcement && !dismissedAnn && (
        <div className="bg-[#CEF431] text-[#161514] px-4 py-1.5 text-xs font-black flex items-center justify-between border-b-2 border-[#161514]">
          <div className="flex items-center gap-2 max-w-6xl mx-auto flex-1">
            <Megaphone className="h-4 w-4 shrink-0 animate-bounce" />
            <span className="truncate">{announcement.message}</span>
          </div>
          <button
            onClick={() => setDismissedAnn(true)}
            className="text-[#161514]/80 hover:text-[#161514] p-0.5 cursor-pointer ml-2"
          >
            <X className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-[100] w-full bg-white/95 backdrop-blur-md border-b-2 border-[#161514] transition-all">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          
          {/* Left side: Brand Logo & Desktop Active Space Badge */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <InvictusLogo size="sm" variant="horizontal" href="/today" />
            
            {/* Desktop Only Active Space Badge */}
            <div
              className={cn(
                "hidden sm:flex px-3 py-1 rounded-xl text-xs font-black border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_rgba(22,21,20,1)] items-center gap-1.5 shrink-0 whitespace-nowrap",
                currentSpace.accentBg
              )}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#161514] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#161514]" />
              </span>
              <span className="font-black">{currentSpace.shortLabel}</span>
            </div>
          </div>

          {/* Right side: Actions & Switch Space Dropdown Popover Button */}
          <div className="relative flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Sub-Nav Show / Hide Toggle Button */}
            {subFeatures.length > 0 && (
              <button
                type="button"
                onClick={toggleSubNav}
                className={cn(
                  "p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border-1.5 sm:border-2 border-[#161514] text-xs font-black shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] transition-all cursor-pointer flex items-center gap-1 shrink-0",
                  isSubNavVisible
                    ? "bg-[#CEF431] text-[#161514]"
                    : "bg-white text-[#161514]/70 hover:text-[#161514]"
                )}
                title={isSubNavVisible ? "Hide sub-navigation bar" : "Show sub-navigation bar"}
              >
                {isSubNavVisible ? <Eye className="h-4 w-4 stroke-[2.5]" /> : <EyeOff className="h-4 w-4 stroke-[2.5]" />}
                <span className="hidden md:inline">Sub-Nav</span>
              </button>
            )}

            {/* Notification Bell */}
            <button
              type="button"
              onClick={enableOSNotifications}
              className="p-1.5 sm:p-2 bg-amber-100 hover:bg-amber-200 text-[#161514] rounded-xl sm:rounded-2xl border-1.5 sm:border-2 border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] sm:shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] transition-all cursor-pointer shrink-0"
              title="Enable Laptop & Mobile Status Bar Notifications"
            >
              <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2.5]" />
            </button>

            {/* Switch Space Popover Button (Displays Active Space Indicator on Mobile) */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "flex items-center gap-1 sm:gap-2 rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-black shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] sm:shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] border-1.5 sm:border-2 border-[#161514] transition-all duration-200 cursor-pointer uppercase tracking-wider select-none hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 whitespace-nowrap shrink-0",
                currentSpace.activeBg
              )}
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2.5] shrink-0" />
              <span className="hidden sm:inline">Switch Space</span>
              <span className="sm:hidden font-black">{currentSpace.mobileLabel}</span>
              <ChevronDown
                className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-200 stroke-[2.5] shrink-0", isOpen && "rotate-180")}
              />
            </button>

            {/* Backdrop for click outside */}
            {isOpen && (
              <div
                className="fixed inset-0 z-[110] bg-[#161514]/25 backdrop-blur-2xs"
                onClick={() => setIsOpen(false)}
              />
            )}

            {/* Space Switcher Popover Menu */}
            {isOpen && (
              <div className="absolute right-0 top-full mt-2.5 w-72 sm:w-80 bg-white border-2.5 border-[#161514] rounded-3xl shadow-[6px_6px_0px_0px_rgba(22,21,20,1)] p-3 z-[120] animate-in fade-in slide-in-from-top-3 duration-200 origin-top-right space-y-2">
                
                {/* Popover Header with Explicit Close X Button */}
                <div className="px-3 py-1.5 flex items-center justify-between border-b-2 border-[#161514]/15">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#161514]">
                    Select Workspace
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black bg-[#CEF431] text-[#161514] px-2 py-0.5 rounded-lg border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)]">
                      4 Active
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="p-1 rounded-xl bg-rose-100 hover:bg-rose-300 text-[#161514] border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                      title="Close workspace switcher"
                    >
                      <X className="h-3.5 w-3.5 stroke-[3]" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  {spaces.map((sp) => {
                    const isActive = currentSpace.value === sp.value;
                    return (
                      <button
                        key={sp.value}
                        type="button"
                        onClick={() => handleSpaceChange(sp.value, sp.href)}
                        className={cn(
                          "w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center justify-between group cursor-pointer border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] hover:-translate-x-0.5 hover:-translate-y-0.5",
                          isActive
                            ? `${sp.activeBg} font-black shadow-[4px_4px_0px_0px_rgba(22,21,20,1)]`
                            : "bg-white hover:bg-[#EAF4F4] text-[#161514]"
                        )}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-black tracking-wide flex items-center gap-1.5">
                            <span>{sp.label}</span>
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-bold opacity-80",
                              isActive ? "text-[#161514]" : "text-[#161514]/70"
                            )}
                          >
                            {sp.desc}
                          </span>
                        </div>

                        <ArrowRight
                          className={cn(
                            "h-4 w-4 transition-transform group-hover:translate-x-1 stroke-[2.5]",
                            isActive ? "opacity-100 text-[#161514]" : "opacity-0 group-hover:opacity-100 text-[#161514]"
                          )}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-[#161514]/15">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      enableOSNotifications();
                    }}
                    className="w-full p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-[#161514] text-xs font-black border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    <span>Enable Status Bar OS Alerts 🔔</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Sub-Feature Navigation Quick-Jump Pill Bar (Toggleable via isSubNavVisible) */}
        {subFeatures.length > 0 && isSubNavVisible && (
          <div className="bg-[#EAF4F4]/70 border-t border-[#161514]/15 px-3 sm:px-6 py-1.5 overflow-x-auto no-scrollbar animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="max-w-6xl mx-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[#161514]/80">
              <span className="shrink-0 text-[9px] bg-white px-2 py-0.5 rounded-md border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] font-black">
                📍 SECTIONS
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {subFeatures.map((sf, idx) => {
                  const Icon = sf.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSubFeatureClick(sf.targetId, sf.spaceHref, sf.tab)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white hover:bg-[#CEF431] text-[#161514] border border-[#161514] shadow-[1px_1px_0px_0px_rgba(22,21,20,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <Icon className="h-3 w-3 stroke-[2.5]" />
                      <span>{sf.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
