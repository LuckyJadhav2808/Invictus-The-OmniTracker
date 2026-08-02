"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type User } from "@/types";
import {
  getCustomSession,
  customLoginUser,
  customRegisterUser,
  customLogout,
  setCustomSession,
} from "@/lib/custom-auth";
import { registerServiceWorker } from "@/lib/utils/notifications";

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = () => {
    const session = getCustomSession();
    setUser(session);
    setLoading(false);
  };

  useEffect(() => {
    refreshUser();
    registerServiceWorker();
  }, []);

  const isGuest = user?.uid === "guest-user";
  const isAdmin = user?.email?.toLowerCase() === "luckymanojjadhav@gmail.com" || user?.role === "admin";

  const login = async (email: string, password: string) => {
    const loggedUser = await customLoginUser({ email, password });
    setUser(loggedUser);
    return loggedUser;
  };

  const signup = async (email: string, password: string, displayName: string) => {
    const newUser = await customRegisterUser({ email, password, displayName });
    setUser(newUser);
    return newUser;
  };

  const enterGuestMode = (name = "Guest Explorer") => {
    localStorage.setItem("invictus_guest_mode", "true");
    localStorage.setItem("invictus_guest_name", name);
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

