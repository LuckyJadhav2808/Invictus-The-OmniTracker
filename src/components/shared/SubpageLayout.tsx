"use client";

import React from "react";
import { MobileAppBar } from "@/components/mobile/MobileAppBar";
import { SubpageHeader } from "@/components/shared/SubpageHeader";
import { cn } from "@/lib/utils";

export interface SubpageLayoutProps {
  appBarTitle: string;
  backHref: string;
  backLabel: string;
  title: string;
  badge?: string;
  badgeColorClass?: string;
  subtitle?: string;
  icon?: React.ElementType;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
  maxWidthClass?: string;
  className?: string;
}

export function SubpageLayout({
  appBarTitle,
  backHref,
  backLabel,
  title,
  badge,
  badgeColorClass,
  subtitle,
  icon,
  rightAction,
  children,
  maxWidthClass = "max-w-xl lg:max-w-5xl xl:max-w-6xl",
  className,
}: SubpageLayoutProps) {
  return (
    <div
      className={cn(
        "w-full mx-auto space-y-3.5 select-none animate-in fade-in duration-200 pb-[calc(5.5rem+env(safe-area-inset-bottom))]",
        maxWidthClass,
        className
      )}
    >
      {/* 1. Dynamic Strobi Top App Bar */}
      <div className="-mx-2 -mt-2 sm:-mx-4 sm:-mt-4">
        <MobileAppBar title={appBarTitle} showDynamicIsland={true} />
      </div>

      {/* 2. Title Bar with Inline Back Button */}
      <SubpageHeader
        backHref={backHref}
        backLabel={backLabel}
        title={title}
        badge={badge}
        badgeColorClass={badgeColorClass}
        subtitle={subtitle}
        icon={icon}
        rightAction={rightAction}
      />

      {/* 3. Subpage Body Content */}
      {children}
    </div>
  );
}
