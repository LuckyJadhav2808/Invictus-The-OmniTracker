"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy Onboarding Route Redirect
 * The old multi-step wizard has been decommissioned in favor of the
 * in-context Quick Start HUD directly inside the Today Cockpit (/today).
 */
export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("invictus_onboarded", "true");
    }
    router.replace("/today");
  }, [router]);

  return null;
}
