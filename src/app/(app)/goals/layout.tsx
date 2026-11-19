"use client";

import React from "react";
import { LifeSpaceSubNav } from "@/components/goals/LifeSpaceSubNav";

export default function GoalsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto space-y-0 sm:space-y-5 px-0 sm:px-6 py-0 sm:py-4 pb-28 lg:pb-12">
      {/* Persistent Life Space Sub-Navigation Bar (Desktop only; on mobile, SegmentedSubNav handles this) */}
      <div className="hidden lg:block">
        <LifeSpaceSubNav />
      </div>

      {/* Route Content Canvas */}
      {children}
    </div>
  );
}
