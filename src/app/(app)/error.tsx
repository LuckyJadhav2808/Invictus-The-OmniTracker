"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function AppRouteErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App route error captured:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 sm:p-6 text-center">
      <div className="bg-[#FAF8F5] dark:bg-[#1E1C1A] border-2 border-[#161514] dark:border-[#38332E] shadow-[4px_4px_0px_0px_#161514] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.6)] rounded-2xl p-6 sm:p-8 max-w-md w-full flex flex-col items-center text-center space-y-5">
        <div className="size-14 rounded-2xl bg-[#FFE600] border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514] flex items-center justify-center text-[#161514]">
          <AlertTriangle className="size-7 stroke-[2.5]" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-heading font-black text-[#161514] dark:text-[#FAF8F5] tracking-tight">
            Something Went Off Course
          </h2>
          <p className="text-xs sm:text-sm text-[#161514]/70 dark:text-[#FAF8F5]/70 leading-relaxed font-medium">
            We ran into an unexpected glitch loading this view. Your saved data in
            Invictus is completely safe.
          </p>
        </div>

        {error.message && (
          <div className="w-full p-3 bg-[#F1EFEA] dark:bg-[#141312] border-2 border-[#161514] dark:border-[#38332E] rounded-xl text-left overflow-x-auto shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-none">
            <p className="text-[11px] font-mono text-[#161514]/80 dark:text-[#FAF8F5]/80 break-words line-clamp-3">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-1">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:flex-1 h-11 px-4 rounded-xl bg-[#CEF431] hover:bg-[#b8dd22] text-[#161514] border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RefreshCw className="size-4 stroke-[2.5]" />
            <span>Try Again</span>
          </button>

          <Link
            href="/today"
            className="w-full sm:flex-1 h-11 px-4 rounded-xl bg-white dark:bg-[#252220] hover:bg-[#F1EFEA] dark:hover:bg-[#2D2A27] text-[#161514] dark:text-[#FAF8F5] border-2 border-[#161514] dark:border-[#38332E] shadow-[2.5px_2.5px_0px_0px_#161514] dark:shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,0.6)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <Home className="size-4 stroke-[2.5]" />
            <span>Back to Today</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
