"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useId,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Plus,
  Dumbbell,
  Utensils,
  Droplet,
  Receipt,
  Users,
  CheckCircle2,
  Kanban,
  Moon,
  Wallet,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

export interface FlowerPetalItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  bgClass: string;
  textClass: string;
  borderClass?: string;
  onClick: () => void;
}

export interface HalfFlowerMenuProps {
  className?: string;
  onOpenActionSheet?: () => void;
}

export function HalfFlowerMenu({
  className,
  onOpenActionSheet,
}: HalfFlowerMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const petalRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Context-aware petals based on active space (High-Frequency Micro-Actions)
  const getPetals = useCallback((): FlowerPetalItem[] => {
    // 1. Habits Space
    if (pathname.startsWith("/goals")) {
      return [
        {
          id: "log-water",
          label: "Quick Water",
          shortLabel: "+250ml",
          icon: Droplet,
          bgClass: "bg-[#38BDF8]",
          textClass: "text-[#161514]",
          borderClass: "border-[#161514]",
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent("invictus:quick-log-water", { detail: { amount: 250 } })
            );
          },
        },
        {
          id: "log-meal",
          label: "Log Meal",
          shortLabel: "Meal",
          icon: Utensils,
          bgClass: "bg-[#03D26F]",
          textClass: "text-[#161514]",
          borderClass: "border-[#161514]",
          onClick: () => {
            window.dispatchEvent(new CustomEvent("invictus:goals-open-portal", { detail: { portal: "nutrition" } }));
          },
        },
        {
          id: "log-workout",
          label: "Log Workout",
          shortLabel: "Workout",
          icon: Dumbbell,
          bgClass: "bg-[#CEF431]",
          textClass: "text-[#161514]",
          borderClass: "border-[#161514]",
          onClick: () => {
            window.dispatchEvent(new CustomEvent("invictus:goals-open-portal", { detail: { portal: "gym" } }));
          },
        },
        {
          id: "stoic-reflection",
          label: "Stoic Mood",
          shortLabel: "Mood",
          icon: Moon,
          bgClass: "bg-[#C084FC]",
          textClass: "text-[#161514]",
          borderClass: "border-[#161514]",
          onClick: () => {
            window.dispatchEvent(new CustomEvent("invictus:goals-open-reflection"));
          },
        },
      ];
    }

    // 2. Money Space
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
          onClick: () => {
            window.dispatchEvent(new CustomEvent("invictus:money-new-expense"));
          },
        },
        {
          id: "split-bill",
          label: "Split / IOU",
          shortLabel: "Split",
          icon: Users,
          bgClass: "bg-[#03D26F]",
          textClass: "text-[#161514]",
          borderClass: "border-[#161514]",
          onClick: () => {
            window.dispatchEvent(new CustomEvent("invictus:money-split"));
          },
        },
        {
          id: "cash-till",
          label: "Cash Refill",
          shortLabel: "Cash",
          icon: Wallet,
          bgClass: "bg-[#38BDF8]",
          textClass: "text-[#161514]",
          borderClass: "border-[#161514]",
          onClick: () => {
            window.dispatchEvent(new CustomEvent("invictus:money-cash-till"));
          },
        },
        {
          id: "quick-entry",
          label: "Quick Entry",
          shortLabel: "Quick",
          icon: Sparkles,
          bgClass: "bg-[#F59E0B]",
          textClass: "text-[#161514]",
          borderClass: "border-[#161514]",
          onClick: () => {
            window.dispatchEvent(new CustomEvent("invictus:money-quick-cash"));
          },
        },
      ];
    }

    // 3. Tasks Space
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
          onClick: () => {
            window.dispatchEvent(new CustomEvent("invictus:tasks-new-task"));
          },
        },
        {
          id: "new-project",
          label: "New Project",
          shortLabel: "Project",
          icon: Kanban,
          bgClass: "bg-[#03D26F]",
          textClass: "text-[#161514]",
          borderClass: "border-[#161514]",
          onClick: () => {
            window.dispatchEvent(new CustomEvent("invictus:tasks-new-project"));
          },
        },
        {
          id: "quick-water",
          label: "Quick Water",
          shortLabel: "+250ml",
          icon: Droplet,
          bgClass: "bg-[#38BDF8]",
          textClass: "text-[#161514]",
          borderClass: "border-[#161514]",
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent("invictus:quick-log-water", { detail: { amount: 250 } })
            );
          },
        },
        {
          id: "quick-expense",
          label: "Quick Expense",
          shortLabel: "Expense",
          icon: Receipt,
          bgClass: "bg-[#F59E0B]",
          textClass: "text-[#161514]",
          borderClass: "border-[#161514]",
          onClick: () => {
            router.push("/money?action=new-expense");
          },
        },
      ];
    }

    // 4. Today Overview (Default)
    return [
      {
        id: "today-task",
        label: "Quick Task",
        shortLabel: "Task",
        icon: CheckCircle2,
        bgClass: "bg-[#CEF431]",
        textClass: "text-[#161514]",
        borderClass: "border-[#161514]",
        onClick: () => {
          window.dispatchEvent(new CustomEvent("invictus:tasks-new-task"));
        },
      },
      {
        id: "today-expense",
        label: "Log Expense",
        shortLabel: "Expense",
        icon: Receipt,
        bgClass: "bg-[#03D26F]",
        textClass: "text-[#161514]",
        borderClass: "border-[#161514]",
        onClick: () => {
          window.dispatchEvent(new CustomEvent("invictus:money-new-expense"));
        },
      },
      {
        id: "today-water",
        label: "Quick Water",
        shortLabel: "+250ml",
        icon: Droplet,
        bgClass: "bg-[#38BDF8]",
        textClass: "text-[#161514]",
        borderClass: "border-[#161514]",
        onClick: () => {
          window.dispatchEvent(
            new CustomEvent("invictus:quick-log-water", { detail: { amount: 250 } })
          );
        },
      },
      {
        id: "today-reflection",
        label: "Reflection",
        shortLabel: "Review",
        icon: Moon,
        bgClass: "bg-[#C084FC]",
        textClass: "text-[#161514]",
        borderClass: "border-[#161514]",
        onClick: () => {
          window.dispatchEvent(new CustomEvent("invictus:today-open-reflection"));
        },
      },
    ];
  }, [pathname]);

  const petals = getPetals();
  const petalCount = petals.length;

  // Orbit geometry: 180° upward semi-circular arc
  // Theta angles: 0° is straight UP.
  // We distribute symmetrically from -67.5° to +67.5°
  // Radius R = 86px
  const orbitRadius = 88;
  const angleSpread = 135; // degrees total spread
  const step = petalCount > 1 ? angleSpread / (petalCount - 1) : 0;
  const startAngle = -angleSpread / 2; // -67.5°

  const toggleMenu = useCallback(() => {
    soundFX.playPop();
    soundFX.vibrate(20);
    setIsOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    toggleBtnRef.current?.focus();
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
    }
  };

  // Close on outside pointer down
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, [isOpen]);

  // Focus first petal on open
  useEffect(() => {
    if (isOpen) {
      petalRefs.current[0]?.focus();
    }
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={cn("relative flex items-center justify-center select-none", className)}
      onKeyDown={handleKeyDown}
    >
      {/* 1. Atmospheric Dim Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/45 dark:bg-black/65 backdrop-blur-xs z-40 animate-in fade-in-0 duration-150"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* 2. Half-Flower Petals Arc */}
      <ul
        id={menuId}
        role="menu"
        aria-label="Quick Action Flower Menu"
        aria-orientation="horizontal"
        inert={!isOpen ? true : undefined}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 m-0 p-0 list-none"
      >
        {petals.map((petal, index) => {
          const Icon = petal.icon;
          const thetaDeg = startAngle + index * step; // angle from straight UP
          const thetaRad = (thetaDeg * Math.PI) / 180;
          const deltaX = Math.round(orbitRadius * Math.sin(thetaRad));
          const deltaY = Math.round(-orbitRadius * Math.cos(thetaRad));

          const openDelay = index * 20;
          const closeDelay = (petalCount - 1 - index) * 12;

          return (
            <li
              key={petal.id}
              role="none"
              className={cn(
                "absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center transition-all duration-200 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] motion-reduce:transition-none",
                isOpen
                  ? "pointer-events-auto opacity-100 scale-100"
                  : "pointer-events-none opacity-0 scale-50"
              )}
              style={{
                transform: isOpen
                  ? `translate(${deltaX}px, ${deltaY}px) scale(1)`
                  : "translate(0px, 0px) scale(0.4)",
                transitionDelay: isOpen ? `${openDelay}ms` : `${closeDelay}ms`,
              }}
            >
              {/* Petal Circular Action Button */}
              <button
                ref={(el) => {
                  petalRefs.current[index] = el;
                }}
                type="button"
                role="menuitem"
                aria-label={petal.label}
                tabIndex={isOpen ? 0 : -1}
                onClick={() => {
                  soundFX.playPop();
                  soundFX.vibrate(25);
                  closeMenu();
                  petal.onClick();
                }}
                className={cn(
                  "size-12 rounded-2xl flex items-center justify-center border-2 shadow-[2.5px_2.5px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-transform hover:scale-110",
                  petal.bgClass,
                  petal.textClass,
                  petal.borderClass || "border-[#161514]"
                )}
              >
                <Icon className="size-5 stroke-[2.5]" />
              </button>

              {/* Neobrutalist Micro Tooltip Badge */}
              <span className="mt-1 px-1.5 py-0.5 bg-[#161514] text-white dark:bg-[#FAF8F5] dark:text-[#161514] font-heading font-black text-[9px] uppercase tracking-wider rounded-md border border-white/20 dark:border-black/20 shadow-xs pointer-events-none whitespace-nowrap">
                {petal.shortLabel || petal.label}
              </span>
            </li>
          );
        })}
      </ul>

      {/* 3. Center FAB Toggle Button (Notched) */}
      <button
        ref={toggleBtnRef}
        type="button"
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={isOpen ? "Close Quick Actions Flower Menu" : "Open Quick Actions Flower Menu"}
        className={cn(
          "relative z-50 size-12 rounded-2xl border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center cursor-pointer transition-all duration-200",
          isOpen
            ? "bg-[#161514] text-white rotate-45 scale-105"
            : "bg-[#CEF431] text-[#161514] rotate-0 hover:scale-105"
        )}
      >
        <Plus className="size-6 stroke-[3] transition-transform duration-200" />
      </button>
    </div>
  );
}
