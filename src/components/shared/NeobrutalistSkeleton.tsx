"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Neobrutalist Skeleton Primitives
 * Designed for zero Cumulative Layout Shift (CLS = 0) with crisp
 * dual-theme tokens and subtle stepped hardware-accelerated wireframe pulses.
 */

export function SkeletonBox({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-[#161514]/8 dark:bg-[#FAF8F5]/8 rounded-lg animate-pulse",
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
        "bg-white dark:bg-[#1C1A18] rounded-2xl border-2 border-[#161514]/15 dark:border-[#383531] shadow-[2px_2px_0px_0px_rgba(22,21,20,0.06)] dark:shadow-[2px_2px_0px_0px_#000000] p-4 sm:p-5 transition-colors",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Space Hero Banner Wireframe Skeleton
 */
export function SpaceHeroSkeleton() {
  return (
    <div className="w-full rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1C1A18] border-2.5 border-[#161514]/20 dark:border-[#383531] shadow-[3px_3px_0px_0px_rgba(22,21,20,0.08)] dark:shadow-[3px_3px_0px_0px_#000000] p-5 sm:p-7 space-y-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-5 w-24 rounded-full bg-[#CEF431]/25 dark:bg-[#CEF431]/15" />
            <SkeletonBox className="h-4 w-32" />
          </div>
          <SkeletonBox className="h-8 w-64 sm:w-80 rounded-xl" />
          <SkeletonBox className="h-4 w-48 sm:w-72" />
        </div>

        <div className="flex items-center gap-2 pt-2 sm:pt-0">
          <SkeletonBox className="h-10 w-28 rounded-xl bg-[#CEF431]/30 dark:bg-[#CEF431]/20 border border-[#161514]/15 dark:border-[#383531]" />
          <SkeletonBox className="h-10 w-24 rounded-xl border border-[#161514]/15 dark:border-[#383531]" />
        </div>
      </div>
    </div>
  );
}

/**
 * 3-Card Metric Telemetry Grid Wireframe Skeleton
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
 * Universal Space Cockpit Skeleton (Used as fallback for layout.tsx and loading.tsx)
 */
export function SpaceCockpitSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 animate-in fade-in duration-150 select-none">
      <SpaceHeroSkeleton />
      <TelemetryGridSkeleton count={3} />

      {/* Main Dual-Column Content Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        <div className="lg:col-span-8 space-y-4">
          <SkeletonCard className="h-64 sm:h-80 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[#161514]/10 dark:border-[#383531]">
              <SkeletonBox className="h-5 w-36" />
              <SkeletonBox className="h-8 w-24 rounded-xl" />
            </div>
            <div className="space-y-3 py-4">
              <SkeletonBox className="h-12 w-full rounded-xl" />
              <SkeletonBox className="h-12 w-full rounded-xl" />
              <SkeletonBox className="h-12 w-full rounded-xl" />
            </div>
            <div className="flex justify-between items-center pt-2">
              <SkeletonBox className="h-4 w-32" />
              <SkeletonBox className="h-4 w-20" />
            </div>
          </SkeletonCard>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <SkeletonCard className="h-64 sm:h-80 flex flex-col justify-between">
            <div className="space-y-2 pb-3 border-b border-[#161514]/10 dark:border-[#383531]">
              <SkeletonBox className="h-5 w-28" />
              <SkeletonBox className="h-3.5 w-40" />
            </div>
            <div className="flex-1 flex items-center justify-center py-6">
              <SkeletonBox className="size-32 rounded-full border-4 border-dashed border-[#161514]/15 dark:border-[#383531]" />
            </div>
            <SkeletonBox className="h-9 w-full rounded-xl bg-[#03D26F]/20 dark:bg-[#03D26F]/10" />
          </SkeletonCard>
        </div>
      </div>
    </div>
  );
}

/**
 * Money Cockpit Skeleton (Summary Cockpit + 4-Tab Bar + Wallet / Ledger Deck)
 */
export function MoneyCockpitSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 animate-in fade-in duration-150 select-none">
      {/* Financial Summary Cockpit Skeleton */}
      <SkeletonCard className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <SkeletonBox className="h-4 w-28 rounded-full bg-[#CEF431]/30 dark:bg-[#CEF431]/15" />
              <SkeletonBox className="h-4 w-36" />
            </div>
            <SkeletonBox className="h-9 w-48 sm:w-60 rounded-xl" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <SkeletonBox className="h-10 flex-1 sm:flex-none sm:w-32 rounded-xl bg-[#03D26F]/30 dark:bg-[#03D26F]/15" />
            <SkeletonBox className="h-10 flex-1 sm:flex-none sm:w-28 rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#252321] space-y-1.5 border border-[#161514]/10 dark:border-[#383531]">
              <SkeletonBox className="h-3 w-16" />
              <SkeletonBox className="h-6 w-24" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      {/* 4-Tab Segmented Control Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {["Budget Wallets", "Live Ledger", "Analytics", "Vault"].map((tab, i) => (
          <SkeletonBox
            key={i}
            className={cn(
              "h-10 px-4 rounded-xl shrink-0",
              i === 0 ? "w-36 bg-[#CEF431]/30 dark:bg-[#CEF431]/20" : "w-28"
            )}
          />
        ))}
      </div>

      {/* Category Wallets Deck Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} className="h-40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <SkeletonBox className="size-10 rounded-xl" />
                <div className="space-y-1">
                  <SkeletonBox className="h-4 w-28" />
                  <SkeletonBox className="h-3 w-16" />
                </div>
              </div>
              <SkeletonBox className="h-6 w-16 rounded-md" />
            </div>
            <div className="space-y-2">
              <SkeletonBox className="h-2 w-full rounded-full" />
              <div className="flex justify-between items-center">
                <SkeletonBox className="h-3 w-20" />
                <SkeletonBox className="h-4 w-24" />
              </div>
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}

/**
 * Habits & Life Cockpit Skeleton
 */
export function HabitsCockpitSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 animate-in fade-in duration-150 select-none">
      <SpaceHeroSkeleton />
      <TelemetryGridSkeleton count={3} />
      <HabitsListSkeleton />
    </div>
  );
}

export function HabitsListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} className="flex items-center justify-between p-4 h-20">
          <div className="flex items-center gap-3">
            <SkeletonBox className="size-10 rounded-xl" />
            <div className="space-y-1.5">
              <SkeletonBox className="h-4.5 w-40 sm:w-56" />
              <div className="flex items-center gap-2">
                <SkeletonBox className="h-3 w-20" />
                <SkeletonBox className="h-3 w-16 rounded bg-[#03D26F]/20 dark:bg-[#03D26F]/10" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SkeletonBox className="size-10 rounded-xl border border-[#161514]/15 dark:border-[#383531]" />
            <SkeletonBox className="size-10 rounded-xl bg-[#03D26F]/30 dark:bg-[#03D26F]/20 border border-[#161514]/15 dark:border-[#383531]" />
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

/**
 * Study Cockpit Skeleton
 */
export function StudyCockpitSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 animate-in fade-in duration-150 select-none">
      <SpaceHeroSkeleton />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <SkeletonBox className="h-6 w-36" />
            <SkeletonBox className="h-9 w-28 rounded-xl bg-[#CEF431]/30 dark:bg-[#CEF431]/20" />
          </div>
          <SubjectsGridSkeleton count={4} />
        </div>

        <div className="lg:col-span-4 space-y-4">
          <SkeletonCard className="h-72 flex flex-col justify-between">
            <div className="space-y-1">
              <SkeletonBox className="h-5 w-32" />
              <SkeletonBox className="h-3 w-44" />
            </div>
            <div className="flex justify-center my-4">
              <SkeletonBox className="size-36 rounded-full border-4 border-dashed border-[#161514]/15 dark:border-[#383531]" />
            </div>
            <SkeletonBox className="h-10 w-full rounded-xl bg-rose-200 dark:bg-rose-950/40" />
          </SkeletonCard>
        </div>
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

/**
 * Tasks Kanban Cockpit Skeleton
 */
export function TasksCockpitSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 animate-in fade-in duration-150 select-none">
      <SpaceHeroSkeleton />

      {/* Kanban 3-Column Wireframe */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["To Do", "In Progress", "Completed"].map((col, i) => (
          <div
            key={i}
            className="rounded-2xl bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514]/15 dark:border-[#383531] p-4 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#161514]/10 dark:border-[#383531]">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#161514]/40 dark:bg-[#FAF8F5]/40" />
                <SkeletonBox className="h-4 w-20" />
              </div>
              <SkeletonBox className="h-5 w-8 rounded-full" />
            </div>

            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, cardIdx) => (
                <SkeletonCard key={cardIdx} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <SkeletonBox className="h-3 w-14 rounded bg-[#CEF431]/20 dark:bg-[#CEF431]/10" />
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
 * Settings Screen Wireframe Skeleton
 */
export function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0D0C0B] text-[#161514] dark:text-[#FAF8F5] pb-24 p-3 sm:p-6 md:p-8 space-y-6 animate-in fade-in duration-150 select-none">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Harmonized Header Skeleton */}
        <div className="flex items-center justify-between pt-2">
          <SkeletonBox className="size-11 rounded-xl" />
          <div className="text-center space-y-1">
            <SkeletonBox className="h-6 w-32 mx-auto" />
            <SkeletonBox className="h-3.5 w-48 mx-auto" />
          </div>
          <SkeletonBox className="size-11 rounded-xl" />
        </div>

        {/* Tab Controls Skeleton */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBox key={i} className="h-10 w-28 rounded-xl shrink-0" />
          ))}
        </div>

        {/* Profile Card Skeleton */}
        <SkeletonCard className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <SkeletonBox className="size-16 rounded-2xl" />
            <div className="space-y-2">
              <SkeletonBox className="h-5 w-40" />
              <SkeletonBox className="h-3.5 w-56" />
              <SkeletonBox className="h-4 w-24 rounded-full bg-[#03D26F]/20 dark:bg-[#03D26F]/10" />
            </div>
          </div>
        </SkeletonCard>

        {/* Form Settings Rows Skeleton */}
        <SkeletonCard className="p-6 space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[#161514]/10 dark:border-[#383531] last:border-b-0">
              <div className="space-y-1">
                <SkeletonBox className="h-4 w-36" />
                <SkeletonBox className="h-3 w-52" />
              </div>
              <SkeletonBox className="h-8 w-24 rounded-lg" />
            </div>
          ))}
        </SkeletonCard>
      </div>
    </div>
  );
}
