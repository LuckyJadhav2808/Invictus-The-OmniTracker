"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="neo-card p-8 max-w-md w-full bg-white flex flex-col items-center text-center space-y-4">
        <div className="size-14 rounded-2xl bg-amber-400 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center text-[#161514]">
          <AlertTriangle className="size-7 stroke-[2.5]" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-heading font-black text-[#161514] tracking-tight">
            Something went off course
          </h2>
          <p className="text-xs text-[#161514]/70 leading-relaxed font-medium">
            We ran into an unexpected glitch loading this view. Your saved data in
            Invictus is completely safe.
          </p>
        </div>

        {error.message && (
          <div className="w-full p-2.5 bg-[#F1EFEA] border-2 border-[#161514] rounded-lg text-left overflow-x-auto">
            <p className="text-[11px] font-mono text-[#161514]/80 break-words line-clamp-3">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 w-full pt-2">
          <Button
            variant="default"
            onClick={() => reset()}
            className="flex-1"
          >
            <RefreshCw className="size-4" />
            <span>Try Again</span>
          </Button>

          <Button
            variant="outline"
            asChild
            className="flex-1"
          >
            <Link href="/today">
              <Home className="size-4" />
              <span>Back to Today</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
