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
    const target = user ? "/today" : "/login";
    router.replace(target);
  }, [user, loading, router]);

  return <InvictusLoadingScreen />;
}
