"use client";

import { useState, useEffect } from "react";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { ChevronDown, Sparkles, ArrowRight, Megaphone, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/shared/AuthProvider";
import { getGlobalAnnouncement, type GlobalAnnouncement } from "@/lib/custom-auth";

export function SpaceHeader() {
  const { activeTracker, setActiveTracker } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<GlobalAnnouncement | null>(null);
  const [dismissedAnn, setDismissedAnn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const ann = getGlobalAnnouncement();
    setAnnouncement(ann);
  }, []);

  const spaces = [
    {
      value: "life" as const,
      label: "🌱 Life & Habits",
      shortLabel: "🌱 Life Space",
      desc: "Habits, streaks, macros & weight",
      color: "from-[#DBE64C] to-[#74C365]",
      accentBg: "bg-[#DBE64C]/25 border-[#001F3F] text-[#001F3F]",
      activeBg: "bg-[#DBE64C] text-[#001F3F]",
      href: "/goals",
    },
    {
      value: "study" as const,
      label: "📚 Study & Exams",
      shortLabel: "📚 Study Space",
      desc: "Syllabus, topics, timers & tests",
      color: "from-[#1E488F] to-[#001F3F]",
      accentBg: "bg-[#1E488F]/15 border-[#001F3F] text-[#1E488F]",
      activeBg: "bg-[#1E488F] text-white",
      href: "/study",
    },
    {
      value: "money" as const,
      label: "💰 Money & Ledger",
      shortLabel: "💰 Money Space",
      desc: "Budgets, categories & savings",
      color: "from-[#00804C] to-[#74C365]",
      accentBg: "bg-[#00804C]/15 border-[#001F3F] text-[#00804C]",
      activeBg: "bg-[#00804C] text-white",
      href: "/money",
    },
  ];

  const currentSpace = spaces.find((s) => s.value === activeTracker) || spaces[0];

  const handleSpaceChange = (spaceValue: "life" | "study" | "money", href: string) => {
    setActiveTracker(spaceValue);
    setIsOpen(false);
    router.push(href);
  };

  return (
    <>
      {announcement && !dismissedAnn && (
        <div className="bg-amber-500 text-navy-900 px-4 py-2 text-xs font-black flex items-center justify-between shadow-xs border-b border-amber-600/40">
          <div className="flex items-center gap-2 max-w-5xl mx-auto flex-1">
            <Megaphone className="h-4 w-4 shrink-0 animate-bounce" />
            <span className="truncate">{announcement.message}</span>
          </div>
          <button
            onClick={() => setDismissedAnn(true)}
            className="text-navy-900/70 hover:text-navy-900 p-0.5 cursor-pointer ml-2"
            title="Dismiss announcement"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b-2 border-navy-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left side: Space Badge indicator & Live Sync Badge */}
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] flex items-center gap-2 transition-all duration-300",
              currentSpace.accentBg
            )}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
            </span>
            <span>{currentSpace.shortLabel}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-200 border-2 border-navy-950 text-[10px] font-black text-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]">
            <span className="h-2 w-2 rounded-full bg-emerald-500 border border-black animate-pulse" />
            <span>Live Sync</span>
          </div>
        </div>

        {/* Right side: Space Switcher Button */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "flex items-center gap-2.5 rounded-2xl px-4 py-2 text-xs font-black shadow-[3px_3px_0px_0px_rgba(31,36,48,1)] border-2 border-navy-950 transition-all duration-200 cursor-pointer uppercase tracking-wider select-none outline-none hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]",
              activeTracker === "life" && "bg-amber-400 hover:bg-amber-500 text-navy-950",
              activeTracker === "study" && "bg-indigo-600 hover:bg-indigo-700 text-white",
              activeTracker === "money" && "bg-amber-300 hover:bg-amber-400 text-navy-950"
            )}
          >
            <Sparkles className="h-3.5 w-3.5 animate-spin duration-3000 stroke-[2.5]" />
            <span>Switch Space</span>
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform duration-200 stroke-[2.5]", isOpen && "rotate-180")}
            />
          </button>

          {/* Backdrop for click outside */}
          {isOpen && (
            <div
              className="fixed inset-0 z-40 bg-navy-900/10 backdrop-blur-2xs"
              onClick={() => setIsOpen(false)}
            />
          )}

          {/* Space Switcher Popover Menu */}
          {isOpen && (
            <div className="absolute right-0 mt-2.5 w-72 sm:w-80 bg-white border-2 border-navy-950 rounded-3xl shadow-[6px_6px_0px_0px_rgba(31,36,48,1)] p-3 z-50 animate-in fade-in slide-in-from-top-3 duration-200 origin-top-right space-y-2">
              <div className="px-3 py-1.5 flex items-center justify-between border-b-2 border-navy-950/20">
                <span className="text-[10px] font-black uppercase tracking-wider text-navy-950">
                  Select Workspace
                </span>
                <span className="text-[10px] font-black bg-amber-300 text-navy-950 px-2.5 py-0.5 rounded-xl border border-navy-950 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]">
                  3 Spaces Active
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                {spaces.map((space) => {
                  const isActive = activeTracker === space.value;
                  return (
                    <button
                      key={space.value}
                      onClick={() => handleSpaceChange(space.value, space.href)}
                      className={cn(
                        "w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center justify-between group cursor-pointer border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5",
                        isActive
                          ? "bg-amber-400 text-navy-950 font-black shadow-[4px_4px_0px_0px_rgba(31,36,48,1)]"
                          : "bg-white hover:bg-amber-100 text-navy-950"
                      )}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-black tracking-wide flex items-center gap-1.5">
                          <span>{space.label}</span>
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold",
                            isActive ? "opacity-90 text-navy-950" : "text-navy-700"
                          )}
                        >
                          {space.desc}
                        </span>
                      </div>

                      <ArrowRight
                        className={cn(
                          "h-4 w-4 transition-transform group-hover:translate-x-1 stroke-[2.5]",
                          isActive ? "opacity-100 text-navy-950" : "opacity-0 group-hover:opacity-100 text-navy-950"
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  </>
  );
}
