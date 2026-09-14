"use client";

import React from "react";

interface InvictusLoadingScreenProps {
  message?: string;
  submessage?: string;
  fullscreen?: boolean;
}

export function InvictusLoadingScreen({
  message = "Loading Invictus…",
  submessage,
  fullscreen = true,
}: InvictusLoadingScreenProps) {
  return (
    <div
      className={`flex items-center justify-center bg-[#FAF8F5] bg-graph-grid ${
        fullscreen ? "min-h-screen w-full" : "h-full w-full py-12"
      }`}
    >
      <div className="bg-white rounded-3xl p-8 border-[2.5px] border-[#161514] shadow-[6px_6px_0px_0px_#161514] text-center space-y-4 max-w-xs mx-auto animate-in fade-in duration-300">
        <div className="h-12 w-12 mx-auto rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] bg-[#CEF431] flex items-center justify-center">
          <div className="h-5 w-5 rounded-full border-2 border-[#161514] border-t-transparent animate-spin" />
        </div>
        <div className="space-y-1">
          <p
            className="text-[#161514] font-black text-sm uppercase tracking-wider"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {message}
          </p>
          {submessage && (
            <p className="text-xs text-navy-600/70 font-medium">
              {submessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function InvictusInlineLoader({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-8 rounded-lg",
    md: "h-10 w-10 rounded-xl",
    lg: "h-12 w-12 rounded-xl",
  };
  const spinnerClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div className={`mx-auto ${sizeClasses[size]} border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] bg-[#CEF431] flex items-center justify-center`}>
      <div className={`${spinnerClasses[size]} rounded-full border-2 border-[#161514] border-t-transparent animate-spin`} />
    </div>
  );
}
