"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/shared/AuthProvider";
import { InvictusLoadingScreen } from "@/components/shared/InvictusLoadingScreen";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    let target = "/login";
    if (user) {
      target = "/today";
    } else {
      const isOnboarded =
        typeof window !== "undefined" &&
        localStorage.getItem("invictus_onboarded") === "true";
      target = isOnboarded ? "/login" : "/onboarding";
    }

    const timer = setTimeout(() => {
      router.replace(target);
    }, 0);
    return () => clearTimeout(timer);
  }, [user, loading, router]);

  return <InvictusLoadingScreen />;
}
