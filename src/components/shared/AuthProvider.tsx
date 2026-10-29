"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { type User } from "@/types";
import {
  getCustomSession,
  customLoginUser,
  customRegisterUser,
  customLogout,
  setCustomSession,
} from "@/lib/custom-auth";
import { registerServiceWorker } from "@/lib/utils/notifications";
import { loadEvaluatorDemoData, isDemoDataActive, clearEvaluatorDemoData } from "@/lib/demo/demo-data-seed";
import { hydrateDeviceFromCloud } from "@/lib/offline/device-hydration";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string, displayName: string) => Promise<User>;
  signOut: () => Promise<void>;
  enterGuestMode: (name?: string) => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isGuest: false,
  isAdmin: false,
  login: async () => ({} as User),
  signup: async () => ({} as User),
  signOut: async () => {},
  enterGuestMode: () => {},
  refreshUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    return getCustomSession();
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return false;
  });

  const refreshUser = () => {
    const session = getCustomSession();
    setUser(session);
    setLoading(false);
  };

  useEffect(() => {
    refreshUser();
    registerServiceWorker();
    const current = getCustomSession();
    if (current && current.uid !== "guest-user") {
      hydrateDeviceFromCloud(current);
    }
  }, []);

  const isGuest = user?.uid === "guest-user";
  const isAdmin = user?.email?.toLowerCase() === "luckymanojjadhav@gmail.com" || user?.role === "admin";

  const login = async (email: string, password: string) => {
    // If demo data was active from a guest evaluation session, purge it so main account starts clean
    if (typeof window !== "undefined" && isDemoDataActive()) {
      clearEvaluatorDemoData();
    }
    const loggedUser = await customLoginUser({ email, password });
    
    // Purge in-memory queries so fresh user data is fetched cleanly
    queryClient.clear();
    
    // Hydrate device localStorage from cloud document
    hydrateDeviceFromCloud(loggedUser);
    
    setUser(loggedUser);
    queryClient.invalidateQueries();
    return loggedUser;
  };

  const signup = async (email: string, password: string, displayName: string) => {
    // If demo data was active from a guest evaluation session, purge it so main account starts clean
    if (typeof window !== "undefined" && isDemoDataActive()) {
      clearEvaluatorDemoData();
    }
    const newUser = await customRegisterUser({ email, password, displayName });
    
    queryClient.clear();
    hydrateDeviceFromCloud(newUser);
    
    setUser(newUser);
    queryClient.invalidateQueries();
    return newUser;
  };

  const enterGuestMode = (name = "Guest Explorer") => {
    localStorage.setItem("invictus_guest_mode", "true");
    localStorage.setItem("invictus_guest_name", name);
    localStorage.setItem("invictus_onboarded", "true");

    // Auto-seed evaluator showcase if empty
    const hasExistingData = localStorage.getItem("invictus_tasks_db") || localStorage.getItem("invictus_habits");
    if (!hasExistingData) {
      loadEvaluatorDemoData();
    }

    const guestUser: User = {
      uid: "guest-user",
      email: "guest@invictus.local",
      displayName: name,
      role: "user",
      timezone: "Asia/Kolkata",
      weekStartsOn: 1,
      currency: "INR",
      onboarded: true,
      modulesEnabled: { goals: true, study: true, money: true },
    };
    setUser(guestUser);
  };

  const signOut = async () => {
    customLogout();
    queryClient.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest,
        isAdmin,
        login,
        signup,
        signOut,
        enterGuestMode,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

