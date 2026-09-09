"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/shared/AuthProvider";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const target = user ? "/today" : "/login";
    router.replace(target);
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] bg-graph-grid">
      <div className="bg-white rounded-3xl p-8 border-[2.5px] border-[#161514] shadow-[6px_6px_0px_0px_#161514] text-center space-y-4">
        <div className="h-12 w-12 mx-auto rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] bg-[#CEF431] flex items-center justify-center">
          <div className="h-5 w-5 rounded-full border-2 border-[#161514] border-t-transparent animate-spin" />
        </div>
        <p
          className="text-[#161514] font-black text-sm uppercase tracking-wider"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Loading Invictus…
        </p>
      </div>
    </div>
  );
}
