"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";
import { getContextQuickActions } from "@/lib/navigation/quick-actions";

/**
 * Desktop-only Diagonal Quarter-Flower Quick Action Menu (hidden on mobile < lg).
 * Anchored in the bottom-right corner and fans context-aware petals diagonally
 * up-and-left across a 90° arc (0° to 90°), mirroring Mobile's HalfFlowerMenu.
 */
export function DesktopDiagonalFlowerMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const petalRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const petals = getContextQuickActions(pathname);
  const petalCount = petals.length;

  // Quarter-circle diagonal arc fanning UP and LEFT from bottom-right corner
  const orbitRadius = 124;
  const startAngleDeg = 0; // straight left
  const endAngleDeg = 90; // straight up
  const stepDeg = petalCount > 1 ? (endAngleDeg - startAngleDeg) / (petalCount - 1) : 0;

  const toggleMenu = useCallback(() => {
    soundFX.playPop();
    setIsOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    toggleBtnRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
    } else if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault();
      const currentIdx = petalRefs.current.findIndex((el) => el === document.activeElement);
      const nextIdx = (currentIdx + 1) % petalCount;
      petalRefs.current[nextIdx]?.focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault();
      const currentIdx = petalRefs.current.findIndex((el) => el === document.activeElement);
      const prevIdx = (currentIdx - 1 + petalCount) % petalCount;
      petalRefs.current[prevIdx]?.focus();
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on route navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Focus first petal on open
  useEffect(() => {
    if (isOpen) {
      petalRefs.current[0]?.focus();
    }
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className="hidden lg:block fixed bottom-6 right-6 z-40 select-none"
    >
      {/* Subtle Atmospheric Dim Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/25 dark:bg-black/45 backdrop-blur-[1px] z-40 animate-in fade-in-0 duration-150"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Quarter-Flower Diagonal Arc */}
      <ul
        id={menuId}
        role="menu"
        aria-label="Desktop Quick Action Flower Menu"
        inert={!isOpen ? true : undefined}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 m-0 p-0 list-none"
      >
        {petals.map((petal, index) => {
          const Icon = petal.icon;
          const angleDeg = startAngleDeg + index * stepDeg;
          const rad = (angleDeg * Math.PI) / 180;
          const deltaX = Math.round(-orbitRadius * Math.cos(rad));
          const deltaY = Math.round(-orbitRadius * Math.sin(rad));

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
                  setIsOpen(false);
                  petal.onClick();
                }}
                className={cn(
                  "size-11 rounded-2xl flex items-center justify-center border-2 shadow-[2.5px_2.5px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-transform hover:scale-110",
                  petal.bgClass,
                  petal.textClass,
                  petal.borderClass || "border-[#161514]"
                )}
                title={petal.label}
              >
                <Icon className="size-5 stroke-[2.5]" />
              </button>

              <span className="mt-1 px-1.5 py-0.5 bg-[#161514] text-white dark:bg-[#FAF8F5] dark:text-[#161514] font-heading font-black text-[9px] uppercase tracking-wider rounded-md border border-white/20 dark:border-black/20 shadow-xs pointer-events-none whitespace-nowrap">
                {petal.shortLabel || petal.label}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Corner FAB Toggle Button */}
      <button
        ref={toggleBtnRef}
        type="button"
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={isOpen ? "Close Quick Actions Flower Menu" : "Open Quick Actions Flower Menu"}
        title="Quick Actions"
        className={cn(
          "relative z-50 size-12 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center cursor-pointer transition-all duration-200",
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
