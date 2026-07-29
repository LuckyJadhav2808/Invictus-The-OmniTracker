"use client";

import { useAuth } from "@/components/shared/AuthProvider";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-cream-bg p-4 md:p-8">
      <div className="max-w-md mx-auto space-y-6">
        <h1
          className="text-2xl font-extrabold tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          PROFILE
        </h1>

        <div className="bg-white rounded-[var(--radius-lg)] p-6 shadow-[0_8px_24px_rgba(31,36,48,0.08)] space-y-5">
          {/* Avatar placeholder */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-amber-500/20 flex items-center justify-center">
              <User className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-lg">
                {user?.displayName || "User"}
              </p>
              <p className="text-navy-600 text-sm">{user?.email}</p>
            </div>
          </div>

          <hr className="border-input" />

          <Link
            href="/settings"
            className="flex items-center gap-3 py-2 text-sm font-semibold text-navy-900 hover:text-amber-600 transition-colors"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>

          <Button
            variant="outline"
            onClick={signOut}
            className="w-full rounded-full border-input"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
