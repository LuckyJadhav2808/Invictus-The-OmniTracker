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
    <div className="min-h-screen flex items-center justify-center bg-cream-bg">
      <div className="text-center space-y-3">
        <div className="h-10 w-10 mx-auto rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
        <p
          className="text-navy-600 font-semibold text-sm"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Loading Invictus…
        </p>
      </div>
    </div>
  );
}
