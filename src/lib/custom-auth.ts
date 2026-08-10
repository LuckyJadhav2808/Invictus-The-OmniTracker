import { type User } from "@/types";

const ADMIN_EMAIL = "luckymanojjadhav@gmail.com";
const USERS_DB_KEY = "invictus_custom_users_db";
const SESSION_TOKEN_KEY = "invictus_custom_session_token";
const ACTIVE_USER_KEY = "invictus_custom_active_user";

// Simple password hash for local security
async function hashPassword(password: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `hash_${Math.abs(hash)}`;
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "_invictus_salt_2026");
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Get all registered users from database
export function getRegisteredUsers(): User[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(USERS_DB_KEY);
  if (!data) {
    // Initialize default seed accounts if DB is empty
    const seedAdmin: User = {
      uid: "user-admin-default",
      email: ADMIN_EMAIL,
      displayName: "Lucky Manoj Jadhav",
      role: "admin",
      passwordHash: "hash_default_admin",
      timezone: "Asia/Kolkata",
      weekStartsOn: 1,
      currency: "INR",
      onboarded: true,
      modulesEnabled: { goals: true, study: true, money: true },
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    localStorage.setItem(USERS_DB_KEY, JSON.stringify([seedAdmin]));
    return [seedAdmin];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save users list to database
function saveRegisteredUsers(users: User[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
}

// Register user with automatic Cloud MongoDB check & Login conversion
export async function customRegisterUser(payload: {
  email: string;
  password: string;
  displayName: string;
}): Promise<User> {
  const users = getRegisteredUsers();
  const normalizedEmail = payload.email.trim().toLowerCase();

  if (!payload.password || payload.password.length < 4) {
    throw new Error("Password must be at least 4 characters long.");
  }

  // Check local DB
  const existingLocal = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existingLocal) {
    return customLoginUser({ email: payload.email, password: payload.password });
  }

  // Check MongoDB Cloud DB for existing account
  try {
    const cloudRes = await fetch(`/api/auth/user?email=${encodeURIComponent(normalizedEmail)}`);
    if (cloudRes.ok) {
      const data = await cloudRes.json();
      if (data.user) {
        return customLoginUser({ email: payload.email, password: payload.password });
      }
    }
  } catch (err) {
    console.warn("Cloud user check warning:", err);
  }

  const passwordHash = await hashPassword(payload.password);
  const isAdmin = normalizedEmail === ADMIN_EMAIL.toLowerCase();
  const uid = `user_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;

  const newUser: User = {
    uid,
    email: payload.email.trim(),
    displayName: payload.displayName.trim() || "Invictus Explorer",
    role: isAdmin ? "admin" : "user",
    passwordHash,
    timezone: "Asia/Kolkata",
    weekStartsOn: 1,
    currency: "INR",
    onboarded: true,
    modulesEnabled: { goals: true, study: true, money: true },
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  try {
    const regRes = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid,
        email: newUser.email,
        displayName: newUser.displayName,
        passwordHash,
      }),
    });
    if (regRes.ok) {
      const regData = await regRes.json();
      if (regData.user?.uid) {
        newUser.uid = regData.user.uid;
      }
    }
  } catch (err) {
    console.warn("MongoDB User register sync warning:", err);
  }

  users.push(newUser);
  saveRegisteredUsers(users);

  setCustomSession(newUser);
  return newUser;
}

// Login user with Cloud MongoDB sync fallback (solves multi-device login & prevents "No account found")
export async function customLoginUser(payload: {
  email: string;
  password: string;
}): Promise<User> {
  const users = getRegisteredUsers();
  const normalizedEmail = payload.email.trim().toLowerCase();
  const passwordHash = await hashPassword(payload.password);

  let userIndex = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);

  // If not found in current browser's local DB, query MongoDB Atlas Cloud DB!
  if (userIndex === -1) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, passwordHash }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const cloudUser: User = {
            uid: data.user.uid || `user_${Date.now()}`,
            email: data.user.email,
            displayName: data.user.displayName || "Invictus Explorer",
            role: data.user.role || (normalizedEmail === ADMIN_EMAIL.toLowerCase() ? "admin" : "user"),
            passwordHash: passwordHash,
            timezone: data.user.timezone || "Asia/Kolkata",
            weekStartsOn: data.user.weekStartsOn || 1,
            currency: data.user.currency || "INR",
            onboarded: true,
            modulesEnabled: data.user.modulesEnabled || { goals: true, study: true, money: true },
            createdAt: data.user.createdAt || new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          };

          // Save cloud user to local database on this device
          users.push(cloudUser);
          saveRegisteredUsers(users);
          setCustomSession(cloudUser);
          return cloudUser;
        }
      }
    } catch (err) {
      console.warn("Cloud login fetch error:", err);
    }

    throw new Error("No account found with this email. Please check your email or sign up.");
  }

  const user = users[userIndex];

  // Verify password hash
  if (
    user.passwordHash &&
    user.passwordHash !== passwordHash &&
    user.passwordHash !== "hash_default_admin" &&
    user.passwordHash !== "hash_default"
  ) {
    throw new Error("Incorrect password. Please try again.");
  }

  if (user.passwordHash === "hash_default_admin" || user.passwordHash === "hash_default") {
    user.passwordHash = passwordHash;
  }

  if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    user.role = "admin";
  }

  user.lastLogin = new Date().toISOString();
  users[userIndex] = user;
  saveRegisteredUsers(users);

  setCustomSession(user);
  return user;
}

// Set active user session
export function setCustomSession(user: User) {
  if (typeof window === "undefined") return;
  const token = `invictus_token_${user.uid}_${Date.now()}`;
  localStorage.setItem(SESSION_TOKEN_KEY, token);
  localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
  localStorage.removeItem("invictus_guest_mode");
  localStorage.removeItem("invictus_guest_name");
}

// Get active session with guaranteed profile persistence
export function getCustomSession(): User | null {
  if (typeof window === "undefined") return null;
  const isGuestMode = localStorage.getItem("invictus_guest_mode") === "true";
  if (isGuestMode) {
    const guestName = localStorage.getItem("invictus_guest_name") || "Guest Explorer";
    const profileStr = localStorage.getItem("invictus_user_profile");
    let guestProfile: Partial<User> = {};
    if (profileStr) {
      try {
        guestProfile = JSON.parse(profileStr);
      } catch {}
    }

    return {
      uid: "guest-user",
      email: "guest@invictus.local",
      displayName: guestProfile.displayName || guestName,
      role: "user",
      timezone: "Asia/Kolkata",
      weekStartsOn: 1,
      currency: "INR",
      onboarded: true,
      modulesEnabled: { goals: true, study: true, money: true },
      ...guestProfile,
    };
  }

  const token = localStorage.getItem(SESSION_TOKEN_KEY);
  const userJson = localStorage.getItem(ACTIVE_USER_KEY);
  if (!token || !userJson) return null;

  try {
    const user: User = JSON.parse(userJson);
    const users = getRegisteredUsers();
    const dbUser = users.find((u) => u.uid === user.uid || u.email.toLowerCase() === user.email.toLowerCase());
    
    // Merge dbUser updates into active user session so user updates are never lost!
    const finalUser: User = dbUser ? { ...user, ...dbUser } : user;

    if (finalUser.email.toLowerCase().includes("luckymanojjadhav") || finalUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      finalUser.role = "admin";
    }
    return finalUser;
  } catch {
    return null;
  }
}

// Logout
export function customLogout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(ACTIVE_USER_KEY);
  localStorage.removeItem("invictus_guest_mode");
  localStorage.removeItem("invictus_guest_name");
  localStorage.removeItem("invictus_user_profile");
}

// Update user details in DB & active session atomically
export function customUpdateUser(uid: string, updates: Partial<User>): User | null {
  if (typeof window === "undefined") return null;

  const isGuestMode = localStorage.getItem("invictus_guest_mode") === "true";
  if (isGuestMode || uid === "guest-user") {
    const profileStr = localStorage.getItem("invictus_user_profile");
    const existing = profileStr ? JSON.parse(profileStr) : {};
    const updated = { ...existing, ...updates };
    if (updates.displayName) {
      localStorage.setItem("invictus_guest_name", updates.displayName);
    }
    localStorage.setItem("invictus_user_profile", JSON.stringify(updated));
    return getCustomSession();
  }

  const users = getRegisteredUsers();
  const idx = users.findIndex((u) => u.uid === uid);
  
  let updatedUser: User;
  if (idx !== -1) {
    updatedUser = {
      ...users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    users[idx] = updatedUser;
    saveRegisteredUsers(users);
  } else {
    const currentSession = getCustomSession();
    updatedUser = {
      ...(currentSession || ({} as User)),
      uid,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  }

  localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(updatedUser));
  return updatedUser;
}

// Update user password
export async function customUpdatePassword(uid: string, newPassword: string): Promise<boolean> {
  const users = getRegisteredUsers();
  const idx = users.findIndex((u) => u.uid === uid);
  if (idx === -1) return false;

  const passwordHash = await hashPassword(newPassword);
  users[idx].passwordHash = passwordHash;
  saveRegisteredUsers(users);

  const session = getCustomSession();
  if (session && session.uid === uid) {
    session.passwordHash = passwordHash;
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(session));
  }
  return true;
}

// Delete user by UID or Email permanently
export function customDeleteUser(uidOrEmail: string): boolean {
  if (typeof window === "undefined") return false;
  let users = getRegisteredUsers();
  const initialCount = users.length;
  const target = uidOrEmail.trim().toLowerCase();
  users = users.filter((u) => u.uid !== uidOrEmail && u.email.toLowerCase() !== target);
  
  saveRegisteredUsers(users);
  return users.length !== initialCount;
}

// Issue reporting system persistence
export interface IssueReport {
  id: string;
  title: string;
  category: "bug" | "feature" | "ui" | "other";
  severity: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved";
  reportedBy: string;
  reportedAt: string;
  description: string;
}

const ISSUES_DB_KEY = "invictus_reported_issues_db";

export function getReportedIssues(): IssueReport[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(ISSUES_DB_KEY);
  if (!data) {
    const seedIssues: IssueReport[] = [
      {
        id: "issue_seed_1",
        title: "Mobile login background image scaling on smaller phones",
        category: "ui",
        severity: "medium",
        status: "in_progress",
        reportedBy: "luckymanojjadhav@gmail.com",
        reportedAt: new Date().toISOString(),
        description: "Optimized mobile background scaling for ultra-warm aesthetic.",
      },
      {
        id: "issue_seed_2",
        title: "Custom Auth migration completion notice",
        category: "feature",
        severity: "low",
        status: "resolved",
        reportedBy: "luckymanojjadhav@gmail.com",
        reportedAt: new Date(Date.now() - 86400000).toISOString(),
        description: "Firebase auth replaced with custom SHA-256 local auth engine.",
      },
    ];
    localStorage.setItem(ISSUES_DB_KEY, JSON.stringify(seedIssues));
    return seedIssues;
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveReportedIssue(issue: Omit<IssueReport, "id" | "reportedAt">): IssueReport {
  const issues = getReportedIssues();
  const newIssue: IssueReport = {
    ...issue,
    id: `issue_${Date.now()}`,
    reportedAt: new Date().toISOString(),
  };
  issues.unshift(newIssue);
  localStorage.setItem(ISSUES_DB_KEY, JSON.stringify(issues));
  return newIssue;
}

export const createReportedIssue = saveReportedIssue;

export function updateReportedIssueStatus(id: string, status: "open" | "in_progress" | "resolved"): boolean {
  const issues = getReportedIssues();
  const idx = issues.findIndex((i) => i.id === id);
  if (idx === -1) return false;
  issues[idx].status = status;
  localStorage.setItem(ISSUES_DB_KEY, JSON.stringify(issues));
  return true;
}

export const updateIssueStatus = updateReportedIssueStatus;

export function deleteReportedIssue(id: string): boolean {
  let issues = getReportedIssues();
  const initial = issues.length;
  issues = issues.filter((i) => i.id !== id);
  localStorage.setItem(ISSUES_DB_KEY, JSON.stringify(issues));
  return issues.length !== initial;
}

// Audit Logs for Admin Panel
export interface AuditLogItem {
  id: string;
  action: string;
  userEmail: string;
  performedBy?: string;
  timestamp: string;
  details?: string;
}

const AUDIT_LOGS_KEY = "invictus_audit_logs_db";

export function getAuditLogs(): AuditLogItem[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(AUDIT_LOGS_KEY);
  if (!data) return [];
  try { return JSON.parse(data); } catch { return []; }
}

export function addAuditLog(action: string, userEmail: string, details?: string, performedBy?: string) {
  if (typeof window === "undefined") return;
  const logs = getAuditLogs();
  const newLog: AuditLogItem = {
    id: `log_${Date.now()}`,
    action,
    userEmail,
    performedBy: performedBy || userEmail,
    timestamp: new Date().toISOString(),
    details,
  };
  logs.unshift(newLog);
  localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
}

// Global Announcement Banner Persistence
export interface GlobalAnnouncement {
  id: string;
  message: string;
  active: boolean;
  type?: "info" | "warning" | "success" | "alert";
  createdBy?: string;
  createdAt: string;
}

const ANNOUNCEMENT_KEY = "invictus_global_announcement";

export function getGlobalAnnouncement(): GlobalAnnouncement | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(ANNOUNCEMENT_KEY);
  if (!data) return null;
  try {
    const ann: GlobalAnnouncement = JSON.parse(data);
    return ann.active ? ann : null;
  } catch {
    return null;
  }
}

export function setGlobalAnnouncement(
  message: string,
  active: boolean = true,
  type: "info" | "warning" | "success" | "alert" = "info",
  createdBy?: string
) {
  if (typeof window === "undefined") return;
  const ann: GlobalAnnouncement = {
    id: `ann_${Date.now()}`,
    message,
    active,
    type,
    createdBy,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(ann));
}

export function clearGlobalAnnouncement() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ANNOUNCEMENT_KEY);
}
