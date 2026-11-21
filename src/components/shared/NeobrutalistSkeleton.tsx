"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Neobrutalist Skeleton Primitives
 * Designed for zero Cumulative Layout Shift (CLS = 0) with crisp
 * dual-theme Neobrutalist tokens (#FAF8F5 cream, #161514 obsidian borders,
 * hard drop shadows) and subtle hardware-accelerated wireframe pulses.
 */

export function SkeletonBox({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn(
        "bg-[#161514]/10 dark:bg-white/10 rounded-lg animate-pulse will-change-[opacity]",
        className
      )}
    />
  );
}

export function SkeletonCard({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-[#1C1A18] rounded-2xl border-2 border-[#161514] dark:border-[#383531] shadow-[2.5px_2.5px_0px_0px_#161514] dark:shadow-[2.5px_2.5px_0px_0px_#000000] p-3.5 sm:p-5 transition-colors",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Universal 52px Slim Top App Bar Wireframe Skeleton
 * Renders identical pixel-perfect geometry to MobileAppBar:
 * Strobi squircle on left, Dynamic Island pill in center, 3-dots on right.
 */
export function TopAppBarSkeleton({ title }: { title?: string }) {
  return (
    <div className="sticky top-0 z-30 w-full safe-top-pad bg-[#FAF8F5]/90 dark:bg-[#161514]/90 backdrop-blur-md border-b border-[#161514]/10 dark:border-white/10 select-none -mx-2 -mt-2 sm:-mx-4 sm:-mt-4 mb-3 sm:mb-4">
      <div className="w-full h-[52px] px-3.5 relative flex items-center justify-between">
        {/* Left: Strobi Mascot Squircle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="size-9 rounded-2xl bg-amber-400/40 dark:bg-amber-400/20 border-2 border-[#161514] dark:border-[#383531] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-none flex items-center justify-center animate-pulse">
            <span className="text-xs">⚡</span>
          </div>
          {title && (
            <SkeletonBox className="h-4 w-16 sm:w-20 rounded" />
          )}
        </div>

        {/* Center: Dynamic Island Live Activity Pill */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="h-7 w-28 sm:w-36 rounded-full bg-[#161514] dark:bg-black border border-white/20 shadow-sm flex items-center justify-between px-3 animate-pulse">
            <span className="size-2 rounded-full bg-[#03D26F]" />
            <SkeletonBox className="h-2 w-14 sm:w-18 bg-white/25 rounded-full" />
            <span className="size-2 rounded-full bg-[#CEF431]" />
          </div>
        </div>

        {/* Right: 3-Dots Menu Trigger */}
        <div className="flex items-center shrink-0">
          <div className="size-9 rounded-xl border-2 border-[#161514] dark:border-[#383531] bg-white dark:bg-[#252220] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-none flex items-center justify-center animate-pulse">
            <SkeletonBox className="size-4 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Universal 4-Door Tile Row Wireframe Skeleton (Slot 4)
 * Renders the 4 doorway cards across mobile and desktop.
 */
export function DoorTileRowSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 py-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="p-3 sm:p-3.5 rounded-2xl border-2 border-[#161514] dark:border-[#383531] bg-white dark:bg-[#1C1A18] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] flex flex-col justify-between h-24 sm:h-26"
        >
          <div className="flex items-center justify-between">
            <SkeletonBox className="size-8 sm:size-9 rounded-xl bg-[#161514]/15 dark:bg-white/15" />
            <SkeletonBox className="h-4 w-10 rounded-full" />
          </div>
          <div className="space-y-1 pt-1">
            <SkeletonBox className="h-3.5 w-20 sm:w-24 rounded" />
            <SkeletonBox className="h-2.5 w-14 sm:w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 7-Day Horizon Week Strip Wireframe Skeleton
 */
export function HorizonWeekStripSkeleton() {
  return (
    <div className="py-0.5">
      <div className="flex items-center justify-between gap-1 sm:gap-2 px-1 py-2 bg-white dark:bg-[#1C1A18] rounded-2xl border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000]">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 flex flex-col items-center py-1.5 px-1 rounded-xl transition-all",
              i === 3
                ? "bg-[#161514] dark:bg-white border border-[#161514] dark:border-white"
                : "bg-transparent"
            )}
          >
            <SkeletonBox
              className={cn(
                "h-2.5 w-6 rounded mb-1",
                i === 3 ? "bg-white/40 dark:bg-[#161514]/40" : ""
              )}
            />
            <SkeletonBox
              className={cn(
                "size-5 sm:size-6 rounded-full",
                i === 3 ? "bg-[#CEF431] dark:bg-[#03D26F]" : ""
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Metric Telemetry Grid Wireframe Skeleton
 */
export function TelemetryGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} className="flex flex-col justify-between h-28 space-y-3">
          <div className="flex items-center justify-between">
            <SkeletonBox className="h-3.5 w-24" />
            <SkeletonBox className="size-6 rounded-lg bg-[#CEF431]/20 dark:bg-[#CEF431]/10" />
          </div>
          <div className="space-y-1.5">
            <SkeletonBox className="h-7 w-32 rounded-lg" />
            <SkeletonBox className="h-3 w-40" />
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

/**
 * Space Hero Banner Wireframe Skeleton
 */
export function SpaceHeroSkeleton() {
  return (
    <div className="w-full rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#383531] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] p-4 sm:p-6 space-y-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-5 w-24 rounded-full bg-[#CEF431]/30 dark:bg-[#CEF431]/20" />
            <SkeletonBox className="h-4 w-32" />
          </div>
          <SkeletonBox className="h-8 w-64 sm:w-80 rounded-xl" />
          <SkeletonBox className="h-4 w-48 sm:w-72" />
        </div>

        <div className="flex items-center gap-2 pt-2 sm:pt-0">
          <SkeletonBox className="h-10 w-28 rounded-xl bg-[#CEF431]/40 dark:bg-[#CEF431]/20 border-2 border-[#161514] dark:border-[#383531]" />
          <SkeletonBox className="h-10 w-24 rounded-xl border-2 border-[#161514] dark:border-[#383531]" />
        </div>
      </div>
    </div>
  );
}

/**
 * Universal Space Cockpit Skeleton (Used as root fallback for layout.tsx and loading.tsx)
 */
export function SpaceCockpitSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4 max-w-xl lg:max-w-4xl xl:max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 animate-in fade-in duration-150 select-none">
      <TopAppBarSkeleton />
      <SpaceHeroSkeleton />
      <DoorTileRowSkeleton />

      {/* Main Studio Content Deck */}
      <div className="space-y-3 pt-1">
        <SkeletonCard className="h-56 sm:h-64 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#161514]/10 dark:border-[#383531]">
            <SkeletonBox className="h-5 w-36" />
            <SkeletonBox className="h-8 w-24 rounded-xl" />
          </div>
          <div className="space-y-2.5 py-3">
            <SkeletonBox className="h-11 w-full rounded-xl" />
            <SkeletonBox className="h-11 w-full rounded-xl" />
          </div>
          <div className="flex justify-between items-center pt-2">
            <SkeletonBox className="h-4 w-32" />
            <SkeletonBox className="h-4 w-20" />
          </div>
        </SkeletonCard>
      </div>
    </div>
  );
}

/**
 * 🌟 TODAY COCKPIT SKELETON
 * 1-to-1 match with src/app/(app)/today/page.tsx:
 * 1. TopAppBarSkeleton
 * 2. TodayHeroPager (Conquest Ring + Daily Safe to Spend + Strobi Companion)
 * 3. 7-Day Horizon Strip
 * 4. 4 Door Tile Row
 * 5. Telemetry Marquee Tape
 * 6. Today's Combined Task & Habit Checklist
 */
export function TodayCockpitSkeleton() {
  return (
    <div className="w-full max-w-xl lg:max-w-4xl xl:max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-3 sm:space-y-4 pb-20 select-none animate-in fade-in duration-150">
      <TopAppBarSkeleton title="Today" />

      {/* Hero Pager Skeleton */}
      <div className="bg-white dark:bg-[#1C1A18] rounded-3xl p-4 sm:p-6 border-2 border-[#161514] dark:border-[#383531] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <SkeletonBox className="h-3.5 w-28 rounded" />
            <SkeletonBox className="h-6 sm:h-7 w-48 sm:w-60 rounded-xl" />
          </div>
          <div className="size-12 sm:size-14 rounded-2xl bg-[#CEF431]/30 dark:bg-[#CEF431]/20 border-2 border-[#161514] dark:border-[#383531] flex items-center justify-center animate-pulse">
            <SkeletonBox className="size-7 rounded-full" />
          </div>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-[#161514]/15 dark:border-[#383531] space-y-1 text-center">
            <SkeletonBox className="h-2.5 w-12 mx-auto" />
            <SkeletonBox className="h-5 w-16 mx-auto rounded" />
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-[#161514]/15 dark:border-[#383531] space-y-1 text-center">
            <SkeletonBox className="h-2.5 w-12 mx-auto" />
            <SkeletonBox className="h-5 w-16 mx-auto rounded bg-[#03D26F]/20 dark:bg-[#03D26F]/10" />
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-[#161514]/15 dark:border-[#383531] space-y-1 text-center">
            <SkeletonBox className="h-2.5 w-12 mx-auto" />
            <SkeletonBox className="h-5 w-16 mx-auto rounded bg-amber-400/20 dark:bg-amber-400/10" />
          </div>
        </div>
      </div>

      {/* 7-Day Horizon Scrubber */}
      <HorizonWeekStripSkeleton />

      {/* 4 Door Tiles Row */}
      <DoorTileRowSkeleton />

      {/* Telemetry Marquee Tape */}
      <div className="h-8 rounded-xl bg-[#161514] dark:bg-black border-2 border-[#161514] flex items-center justify-between px-3 text-white text-[10px] font-mono animate-pulse">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#CEF431]" />
          <SkeletonBox className="h-3 w-48 bg-white/20 rounded" />
        </div>
        <SkeletonBox className="h-3 w-20 bg-white/20 rounded" />
      </div>

      {/* Primary Checklist Feed */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <SkeletonBox className="h-4 w-32 rounded" />
          <SkeletonBox className="h-3.5 w-16 rounded" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-3.5 rounded-2xl border-2 border-[#161514] dark:border-[#383531] bg-white dark:bg-[#1C1A18] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <SkeletonBox className="size-6 rounded-lg border-2 border-[#161514]/20 shrink-0" />
              <div className="space-y-1">
                <SkeletonBox className="h-3.5 w-36 sm:w-52 rounded" />
                <SkeletonBox className="h-2.5 w-24 rounded" />
              </div>
            </div>
            <SkeletonBox className="h-5 w-14 rounded-full bg-amber-400/20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ⚡ TASKS COCKPIT SKELETON
 * 1-to-1 match with the single-column studio layout of src/app/(app)/tasks/page.tsx:
 * 1. TopAppBarSkeleton
 * 2. TasksHeroPager
 * 3. 4 Door Tile Row
 * 4. Rapid Inline Task Dock
 * 5. TasksPrimaryList
 */
export function TasksCockpitSkeleton() {
  return (
    <div className="w-full max-w-xl lg:max-w-4xl xl:max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-3 sm:space-y-4 pb-20 select-none animate-in fade-in duration-150">
      <TopAppBarSkeleton title="Tasks" />

      {/* Tasks Hero Pager Skeleton */}
      <div className="bg-white dark:bg-[#1C1A18] rounded-3xl p-4 sm:p-6 border-2 border-[#161514] dark:border-[#383531] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <SkeletonBox className="h-4 w-20 rounded bg-rose-500/20" />
              <SkeletonBox className="h-3.5 w-24 rounded" />
            </div>
            <SkeletonBox className="h-7 w-48 sm:w-64 rounded-xl" />
          </div>
          <div className="size-12 sm:size-14 rounded-2xl bg-[#CEF431]/30 dark:bg-[#CEF431]/20 border-2 border-[#161514] dark:border-[#383531] flex items-center justify-center animate-pulse">
            <SkeletonBox className="size-7 rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-[#161514]/15 dark:border-[#383531] space-y-1 text-center">
            <SkeletonBox className="h-2.5 w-14 mx-auto" />
            <SkeletonBox className="h-5 w-12 mx-auto rounded" />
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-[#161514]/15 dark:border-[#383531] space-y-1 text-center">
            <SkeletonBox className="h-2.5 w-14 mx-auto" />
            <SkeletonBox className="h-5 w-12 mx-auto rounded bg-rose-500/20" />
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-[#161514]/15 dark:border-[#383531] space-y-1 text-center">
            <SkeletonBox className="h-2.5 w-14 mx-auto" />
            <SkeletonBox className="h-5 w-12 mx-auto rounded bg-[#03D26F]/20" />
          </div>
        </div>
      </div>

      {/* 4 Door Tiles Row */}
      <DoorTileRowSkeleton />

      {/* Rapid Inline Task Dock Skeleton */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#383531] shadow-[2.5px_2.5px_0px_0px_#161514] dark:shadow-[2.5px_2.5px_0px_0px_#000000] space-y-2.5">
        <div className="flex items-center justify-between">
          <SkeletonBox className="h-3 w-28 rounded" />
          <SkeletonBox className="h-2.5 w-20 rounded" />
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <SkeletonBox className="h-9 flex-1 rounded-xl" />
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex gap-1">
              <SkeletonBox className="h-8 w-8 rounded-lg" />
              <SkeletonBox className="h-8 w-8 rounded-lg" />
              <SkeletonBox className="h-8 w-8 rounded-lg" />
            </div>
            <SkeletonBox className="h-8 w-18 rounded-lg" />
            <SkeletonBox className="h-8 w-16 rounded-lg bg-[#CEF431]/40 border-2 border-[#161514]" />
          </div>
        </div>
      </div>

      {/* Primary Tasks Checklist Skeleton */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-9 flex-1 rounded-xl" />
          <SkeletonBox className="h-9 w-28 rounded-xl" />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <SkeletonBox className="h-7 w-20 rounded-lg bg-[#161514]/20 dark:bg-white/20" />
          <SkeletonBox className="h-7 w-20 rounded-lg" />
          <SkeletonBox className="h-7 w-20 rounded-lg" />
          <SkeletonBox className="h-7 w-20 rounded-lg" />
        </div>

        <div className="space-y-2 pt-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl border-2 border-[#161514] dark:border-[#383531] bg-white dark:bg-[#1C1A18] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <SkeletonBox className="size-6 rounded-lg border-2 border-[#161514]/20 shrink-0" />
                <div className="space-y-1">
                  <SkeletonBox className="h-4 w-40 sm:w-64 rounded" />
                  <SkeletonBox className="h-2.5 w-24 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <SkeletonBox className="h-5 w-12 rounded bg-rose-500/20" />
                <SkeletonBox className="size-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Tasks Kanban Board Wireframe Skeleton (For /tasks/kanban)
 */
export function TasksKanbanSkeleton() {
  return (
    <div className="space-y-4 max-w-xl lg:max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-4 animate-in fade-in duration-150 select-none">
      <TopAppBarSkeleton title="Kanban" />

      {/* Column WIP Telemetry Pill Rail */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <SkeletonBox className="h-14 rounded-xl" />
        <SkeletonBox className="h-14 rounded-xl" />
        <SkeletonBox className="h-14 rounded-xl" />
      </div>

      {/* Kanban 3-Column Wireframe */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {["To Do", "In Progress", "Completed"].map((col, i) => (
          <div
            key={i}
            className="rounded-2xl bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#383531] shadow-[2.5px_2.5px_0px_0px_#161514] dark:shadow-[2.5px_2.5px_0px_0px_#000000] p-4 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#161514]/15 dark:border-[#383531]">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#161514] dark:bg-white" />
                <SkeletonBox className="h-4 w-20" />
              </div>
              <SkeletonBox className="h-5 w-12 rounded-full" />
            </div>

            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, cardIdx) => (
                <SkeletonCard key={cardIdx} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <SkeletonBox className="h-3 w-14 rounded bg-[#CEF431]/30 dark:bg-[#CEF431]/20" />
                    <SkeletonBox className="size-3.5 rounded" />
                  </div>
                  <SkeletonBox className="h-4 w-4/5" />
                  <div className="flex items-center justify-between pt-1">
                    <SkeletonBox className="h-3 w-16" />
                    <SkeletonBox className="size-5 rounded-full" />
                  </div>
                </SkeletonCard>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 💰 MONEY COCKPIT SKELETON
 * 1-to-1 match with src/app/(app)/money/page.tsx:
 * 1. TopAppBarSkeleton
 * 2. Financial Summary Cockpit (Available funds, luxury card deck, income/expense)
 * 3. 4 Door Tile Row
 * 4. Recent Transactions Glance
 */
export function MoneyCockpitSkeleton() {
  return (
    <div className="w-full max-w-xl lg:max-w-4xl xl:max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-3 sm:space-y-4 pb-20 select-none animate-in fade-in duration-150">
      <TopAppBarSkeleton title="Money" />

      {/* Financial Summary Cockpit Skeleton */}
      <div className="bg-white dark:bg-[#1C1A18] rounded-3xl border-2 border-[#161514] dark:border-[#383531] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] p-4 sm:p-5 space-y-4">
        {/* Available Funds Header Strip */}
        <div className="flex items-center justify-between pb-1">
          <div className="space-y-1">
            <SkeletonBox className="h-3 w-24" />
            <SkeletonBox className="h-6 sm:h-7 w-36 sm:w-44 rounded-xl" />
          </div>
          <SkeletonBox className="h-8 w-32 rounded-xl" />
        </div>

        {/* Stacked Luxury Card Deck Skeleton */}
        <div className="relative w-full rounded-2xl sm:rounded-3xl bg-[#161514] dark:bg-[#0D0C0B] border-2 border-[#161514] dark:border-[#2A2724] p-5 sm:p-6 text-white overflow-hidden min-h-[200px] sm:min-h-[220px] flex flex-col justify-between shadow-[3px_3px_0px_0px_#CEF431] dark:shadow-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-white/10 border border-white/10 animate-pulse" />
              <div className="space-y-1">
                <div className="h-3.5 w-24 bg-white/20 rounded animate-pulse" />
                <div className="h-2.5 w-32 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-5 w-16 rounded-full bg-[#03D26F]/20 border border-[#03D26F]/30 animate-pulse" />
          </div>

          <div className="space-y-1 my-2">
            <div className="h-8 sm:h-9 w-44 sm:w-52 bg-white/25 rounded-xl animate-pulse" />
            <div className="h-2.5 w-36 bg-white/10 rounded animate-pulse" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2.5 border-t border-white/10">
            <div className="space-y-1">
              <div className="h-2 w-20 bg-white/10 rounded animate-pulse" />
              <div className="h-3.5 w-16 bg-[#03D26F]/25 rounded animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="h-2 w-20 bg-white/10 rounded animate-pulse" />
              <div className="h-3.5 w-16 bg-rose-500/25 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* 4 Squircle Quick Action Launchers Grid */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {[
            { color: "bg-[#CEF431]/30 dark:bg-[#CEF431]/20" },
            { color: "bg-purple-500/20 dark:bg-purple-500/15" },
            { color: "bg-amber-500/20 dark:bg-amber-500/15" },
            { color: "bg-sky-500/20 dark:bg-sky-500/15" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-2 sm:p-2.5 rounded-2xl border-2 border-[#161514] dark:border-[#383531] bg-white dark:bg-[#1C1A18] flex flex-col items-center justify-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-none"
            >
              <div className={cn("size-9 sm:size-11 rounded-2xl animate-pulse", item.color)} />
              <SkeletonBox className="h-2.5 w-10 sm:w-12 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* 4 Door Tiles Row */}
      <DoorTileRowSkeleton />

      {/* Recent Activity Glance Skeleton */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <SkeletonBox className="h-4 w-32 rounded" />
          <SkeletonBox className="h-3.5 w-16 rounded" />
        </div>

        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl border-2 border-[#161514] dark:border-[#383531] bg-white dark:bg-[#1C1A18] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <SkeletonBox className="size-10 rounded-xl bg-[#161514]/10 dark:bg-white/10 shrink-0" />
                <div className="space-y-1">
                  <SkeletonBox className="h-3.5 w-32 sm:w-44 rounded" />
                  <SkeletonBox className="h-2.5 w-20 rounded" />
                </div>
              </div>
              <div className="text-right space-y-1 shrink-0">
                <SkeletonBox className="h-4 w-16 sm:w-20 rounded ml-auto" />
                <SkeletonBox className="h-2.5 w-10 rounded ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 🏃 HABITS & LIFE COCKPIT SKELETON
 * 1-to-1 match with src/app/(app)/goals/page.tsx:
 * 1. TopAppBarSkeleton
 * 2. HabitsCockpitDeck (Progress ring, streak, conquer ratio)
 * 3. 7-Day Horizon Strip
 * 4. 4 Door Tile Row (Gym, Nutrition, Vault, Recovery)
 * 5. Habit Rows
 */
export function HabitsCockpitSkeleton() {
  return (
    <div className="w-full max-w-xl lg:max-w-4xl xl:max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-3 sm:space-y-4 pb-20 select-none animate-in fade-in duration-150">
      <TopAppBarSkeleton title="Habits" />

      {/* Habits Hero Cockpit Deck Skeleton */}
      <div className="bg-white dark:bg-[#1C1A18] rounded-3xl p-4 sm:p-6 border-2 border-[#161514] dark:border-[#383531] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <SkeletonBox className="h-4 w-20 rounded bg-[#CEF431]/30" />
              <SkeletonBox className="h-3.5 w-24 rounded" />
            </div>
            <SkeletonBox className="h-7 w-48 sm:w-64 rounded-xl" />
          </div>
          <div className="size-12 sm:size-14 rounded-2xl bg-[#03D26F]/30 dark:bg-[#03D26F]/20 border-2 border-[#161514] dark:border-[#383531] flex items-center justify-center animate-pulse">
            <SkeletonBox className="size-7 rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-[#161514]/15 dark:border-[#383531] space-y-1 text-center">
            <SkeletonBox className="h-2.5 w-14 mx-auto" />
            <SkeletonBox className="h-5 w-12 mx-auto rounded" />
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-[#161514]/15 dark:border-[#383531] space-y-1 text-center">
            <SkeletonBox className="h-2.5 w-14 mx-auto" />
            <SkeletonBox className="h-5 w-12 mx-auto rounded bg-amber-400/20" />
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-[#161514]/15 dark:border-[#383531] space-y-1 text-center">
            <SkeletonBox className="h-2.5 w-14 mx-auto" />
            <SkeletonBox className="h-5 w-12 mx-auto rounded bg-[#03D26F]/20" />
          </div>
        </div>
      </div>

      {/* 7-Day Horizon Strip */}
      <HorizonWeekStripSkeleton />

      {/* 4 Door Tiles Row (Gym, Nutrition, Vault, Recovery) */}
      <DoorTileRowSkeleton />

      {/* Habit List Rows */}
      <HabitsListSkeleton count={4} />
    </div>
  );
}

export function HabitsListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2.5 pt-1">
      <div className="flex items-center justify-between px-1">
        <SkeletonBox className="h-4 w-32 rounded" />
        <SkeletonBox className="h-3.5 w-20 rounded" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="p-3.5 rounded-2xl border-2 border-[#161514] dark:border-[#383531] bg-white dark:bg-[#1C1A18] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <SkeletonBox className="size-8 rounded-xl bg-[#161514]/10 dark:bg-white/10 shrink-0" />
              <div className="space-y-1">
                <SkeletonBox className="h-4 w-36 sm:w-56 rounded" />
                <div className="flex items-center gap-2">
                  <SkeletonBox className="h-2.5 w-16 rounded" />
                  <SkeletonBox className="h-2.5 w-12 rounded bg-[#03D26F]/20" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: 7 }).map((_, dayIdx) => (
                  <SkeletonBox key={dayIdx} className="size-4 rounded-full" />
                ))}
              </div>
              <SkeletonBox className="size-8 rounded-xl bg-[#03D26F]/30 dark:bg-[#03D26F]/20 border border-[#161514]/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ⚙️ SETTINGS SCREEN WIREFRAME SKELETON
 * 1-to-1 match with the unified studio canvas of src/app/(app)/settings/page.tsx:
 * 1. TopAppBarSkeleton
 * 2. SettingsHeroSummary (Avatar, Name, Email, Action buttons)
 * 3. SubNav segmented tabs (General, Spaces, Alerts, Security, Vault)
 * 4. General Preferences Card (Name input, Timezone, Currency, Theme chips, Audio feedback)
 */
export function SettingsSkeleton() {
  return (
    <div className="w-full max-w-xl lg:max-w-4xl max-w-3xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-3 sm:space-y-4 pb-24 select-none animate-in fade-in duration-150">
      <TopAppBarSkeleton title="Settings" />

      {/* Hero Summary Card Skeleton */}
      <div className="bg-white dark:bg-[#1C1A18] rounded-3xl p-4 sm:p-6 border-2 border-[#161514] dark:border-[#383531] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="size-13 sm:size-14 rounded-2xl bg-amber-400/40 border-2 border-[#161514] dark:border-[#383531] flex items-center justify-center animate-pulse shrink-0">
              <SkeletonBox className="size-7 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <SkeletonBox className="h-5 w-36 sm:w-48 rounded" />
              <SkeletonBox className="h-3 w-48 sm:w-56 rounded" />
              <SkeletonBox className="h-4 w-24 rounded-full bg-emerald-500/20" />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <SkeletonBox className="h-9 w-20 rounded-xl" />
            <SkeletonBox className="h-9 w-24 rounded-xl" />
          </div>
        </div>
      </div>

      {/* SubNav Tabs Rail Skeleton (General, Spaces, Alerts, Security, Vault) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {["General", "Spaces", "Alerts", "Security", "Vault"].map((tab, i) => (
          <SkeletonBox
            key={i}
            className={cn(
              "h-8 sm:h-9 px-3 rounded-xl shrink-0",
              i === 0 ? "w-24 bg-[#161514]/25 dark:bg-white/25" : "w-20"
            )}
          />
        ))}
      </div>

      {/* Active Tab Preferences Card Skeleton */}
      <div className="bg-white dark:bg-[#1C1A18] rounded-3xl p-4 sm:p-6 border-2 border-[#161514] dark:border-[#383531] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] space-y-5">
        <div className="flex items-center justify-between border-b border-[#161514]/15 dark:border-[#383531] pb-3">
          <SkeletonBox className="h-4 w-44 rounded" />
          <SkeletonBox className="h-3 w-16 rounded" />
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <SkeletonBox className="h-3 w-28 rounded" />
            <SkeletonBox className="h-9 w-full rounded-xl" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <SkeletonBox className="h-3 w-20 rounded" />
              <SkeletonBox className="h-9 w-full rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <SkeletonBox className="h-3 w-24 rounded" />
              <SkeletonBox className="h-9 w-full rounded-xl" />
            </div>
          </div>

          {/* Theme Selector Strip */}
          <div className="pt-2 border-t border-[#161514]/10 dark:border-[#383531] space-y-2">
            <SkeletonBox className="h-3 w-40 rounded" />
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <SkeletonBox key={i} className="size-8 rounded-full" />
              ))}
            </div>
          </div>

          {/* Audio Feedback 4 Buttons */}
          <div className="pt-2 border-t border-[#161514]/10 dark:border-[#383531] space-y-2">
            <SkeletonBox className="h-3 w-36 rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonBox key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          </div>

          <SkeletonBox className="h-11 w-full rounded-2xl bg-[#CEF431]/40 border-2 border-[#161514]" />
        </div>
      </div>
    </div>
  );
}

/**
 * 📊 ANALYTICS HUB SKELETON
 */
export function AnalyticsSkeleton() {
  return (
    <div className="w-full max-w-xl lg:max-w-4xl xl:max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-3 sm:space-y-4 pb-20 select-none animate-in fade-in duration-150">
      <TopAppBarSkeleton title="Analytics" />

      {/* Header Card */}
      <div className="bg-white dark:bg-[#1C1A18] rounded-3xl p-4 sm:p-6 border-2 border-[#161514] dark:border-[#383531] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <SkeletonBox className="h-4 w-28 rounded bg-[#7DD3FC]/30" />
          <SkeletonBox className="h-6 sm:h-7 w-48 sm:w-64 rounded-xl" />
        </div>
        <div className="flex gap-2">
          <SkeletonBox className="h-9 w-24 rounded-xl" />
          <SkeletonBox className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SkeletonCard className="h-24 flex flex-col justify-between">
          <SkeletonBox className="h-3 w-20 rounded" />
          <SkeletonBox className="h-6 w-28 rounded-lg" />
        </SkeletonCard>
        <SkeletonCard className="h-24 flex flex-col justify-between">
          <SkeletonBox className="h-3 w-20 rounded" />
          <SkeletonBox className="h-6 w-28 rounded-lg bg-[#03D26F]/20" />
        </SkeletonCard>
        <SkeletonCard className="h-24 flex flex-col justify-between">
          <SkeletonBox className="h-3 w-20 rounded" />
          <SkeletonBox className="h-6 w-28 rounded-lg bg-amber-400/20" />
        </SkeletonCard>
      </div>

      {/* Big Chart Card */}
      <div className="bg-white dark:bg-[#1C1A18] rounded-3xl p-4 sm:p-6 border-2 border-[#161514] dark:border-[#383531] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] space-y-4">
        <div className="flex items-center justify-between border-b border-[#161514]/10 dark:border-[#383531] pb-3">
          <SkeletonBox className="h-4 w-36 rounded" />
          <SkeletonBox className="h-3 w-20 rounded" />
        </div>
        <div className="h-64 sm:h-72 w-full flex items-end justify-between gap-2 sm:gap-4 pt-4 px-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <SkeletonBox
                className="w-full rounded-t-lg bg-[#CEF431]/40 dark:bg-[#CEF431]/20"
                style={{ height: `${30 + ((i * 17) % 65)}%` }}
              />
              <SkeletonBox className="h-3 w-8 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 👤 PROFILE SCREEN SKELETON
 */
export function ProfileSkeleton() {
  return (
    <div className="w-full max-w-xl lg:max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-4 pb-20 select-none animate-in fade-in duration-150">
      <TopAppBarSkeleton title="Profile" />

      {/* User Info Card Skeleton */}
      <div className="bg-white dark:bg-[#1C1A18] rounded-3xl p-4 sm:p-6 border-2 border-[#161514] dark:border-[#383531] shadow-[4px_4px_0px_0px_#161514] dark:shadow-[4px_4px_0px_0px_#000000] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="size-13 sm:size-16 rounded-2xl bg-amber-400/40 border-2 border-[#161514] dark:border-[#383531] flex items-center justify-center animate-pulse shrink-0">
              <SkeletonBox className="size-8 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <SkeletonBox className="h-5 sm:h-6 w-36 sm:w-52 rounded" />
              <SkeletonBox className="h-3 w-48 sm:w-60 rounded" />
              <SkeletonBox className="h-4 w-24 rounded-lg bg-emerald-500/20" />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <SkeletonBox className="h-9 w-24 rounded-xl" />
            <SkeletonBox className="h-9 w-28 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Yearly Activity Matrix Card Skeleton */}
      <div className="bg-white dark:bg-[#1C1A18] rounded-3xl p-4 sm:p-6 border-2 border-[#161514] dark:border-[#383531] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#161514]/10 dark:border-[#383531]">
          <SkeletonBox className="h-4 w-44 rounded" />
          <SkeletonBox className="h-3 w-24 rounded" />
        </div>
        <div className="h-32 w-full rounded-xl bg-[#161514]/5 dark:bg-white/5 flex items-center justify-center animate-pulse">
          <SkeletonBox className="h-6 w-48 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * 📚 STUDY COCKPIT SKELETON
 */
export function StudyCockpitSkeleton() {
  return (
    <div className="space-y-4 max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-4 animate-in fade-in duration-150 select-none">
      <SpaceHeroSkeleton />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SkeletonBox className="h-6 w-36" />
          <SkeletonBox className="h-9 w-28 rounded-xl bg-[#CEF431]/30 dark:bg-[#CEF431]/20" />
        </div>
        <SubjectsGridSkeleton count={4} />
      </div>
    </div>
  );
}

export function SubjectsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} className="h-32 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SkeletonBox className="size-8 rounded-lg" />
              <SkeletonBox className="h-5 w-32" />
            </div>
            <SkeletonBox className="h-5 w-12 rounded-full" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <SkeletonBox className="h-3 w-16" />
              <SkeletonBox className="h-3 w-12" />
            </div>
            <SkeletonBox className="h-2 w-full rounded-full" />
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}
