"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, RotateCcw, Home, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MoneyErrorBoundary({ error, reset }: ErrorProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Log the error to client diagnostic reporting
    console.error("[Money Engine Boundary Caught Error]:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#FFFCF8] dark:bg-[#1E1D1B] border-2 border-[#161514] dark:border-[#3D3A37] rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_#161514] dark:shadow-[6px_6px_0px_0px_#000]">
        {/* Header Icon & Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] dark:bg-rose-950/40 border-2 border-[#161514] dark:border-[#3D3A37] flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-[2px_2px_0px_0px_#161514]">
            <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">
              System Safeguard
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#161514] dark:text-[#F5F2EB] tracking-tight">
              Vault Interrupted
            </h2>
          </div>
        </div>

        {/* Reassurance Message */}
        <p className="text-sm font-semibold text-[#5A5550] dark:text-[#A8A29E] leading-relaxed mb-6">
          Your transactions, category envelopes, and balances remain completely safe in the database.
          A client-side render hiccup occurred while calculating ledger views.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#FF4F17] hover:bg-[#E04310] text-white font-black text-sm uppercase tracking-wide border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#161514] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            Retry Cockpit
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#F5F2EB] dark:bg-[#2A2725] hover:bg-[#EAE5DC] dark:hover:bg-[#34302D] text-[#161514] dark:text-[#F5F2EB] font-black text-sm uppercase tracking-wide border-2 border-[#161514] dark:border-[#3D3A37] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] transition-all"
          >
            <Home className="w-4 h-4 stroke-[2.5]" />
            Return Home
          </Link>
        </div>

        {/* Diagnostics Accordion */}
        <div className="border-t-2 border-[#161514]/10 dark:border-white/10 pt-4">
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="flex items-center justify-between w-full text-xs font-bold text-[#8C8479] hover:text-[#161514] dark:hover:text-white transition-colors"
          >
            <span>Diagnostic Details</span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDetails && (
            <div className="mt-3 p-3 rounded-lg bg-[#161514] text-[#F5F2EB] text-[11px] font-mono overflow-x-auto leading-snug max-h-40 border border-[#3D3A37]">
              <div className="text-rose-400 font-bold mb-1">
                {error.name}: {error.message}
              </div>
              {error.digest && (
                <div className="text-[#8C8479] text-[10px] mb-2">Digest: {error.digest}</div>
              )}
              {error.stack && (
                <pre className="text-[10px] text-[#A8A29E] whitespace-pre-wrap">{error.stack}</pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
