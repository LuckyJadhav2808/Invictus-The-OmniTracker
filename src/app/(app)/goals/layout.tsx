"use client";

import React from "react";

export default function GoalsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto space-y-0 sm:space-y-5 px-0 sm:px-6 py-0 sm:py-4 pb-4 lg:pb-12">
      {/* Route Content Canvas */}
      {children}
    </div>
  );
}
