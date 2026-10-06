"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { InvictusLoadingScreen } from "@/components/shared/InvictusLoadingScreen";

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login?tab=signup");
  }, [router]);

  return <InvictusLoadingScreen />;
}
