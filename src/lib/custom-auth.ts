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
    // Initialize default seed admin account if DB is empty
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

// Register user
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

  const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    throw new Error("An account with this email already exists. Please sign in.");
  }

  const passwordHash = await hashPassword(payload.password);
  const isAdmin = normalizedEmail === ADMIN_EMAIL.toLowerCase();
  const uid = `user_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;

  const newUser: User = {
    uid,
    email: payload.email.trim(),
    displayName: payload.displayName.trim(),
    role: isAdmin ? "admin" : "user",
    passwordHash,
    timezone: "Asia/Kolkata",
    weekStartsOn: 1,
    currency: "INR",
    onboarded: false,
    modulesEnabled: { goals: true, study: true, money: true },
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  // Sync with MongoDB Atlas User database
  try {
    await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid,
        email: newUser.email,
        displayName: newUser.displayName,
        passwordHash,
      }),
    });
  } catch (err) {
    console.warn("MongoDB User register sync warning:", err);
  }

  users.push(newUser);
  saveRegisteredUsers(users);

  // Set active session
  setCustomSession(newUser);
  return newUser;
}

// Login user
export async function customLoginUser(payload: {
  email: string;
  password: string;
}): Promise<User> {
  const users = getRegisteredUsers();
  const normalizedEmail = payload.email.trim().toLowerCase();

  const userIndex = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);
  if (userIndex === -1) {
    throw new Error("No account found with this email. Please check or sign up.");
  }

  const user = users[userIndex];
  const passwordHash = await hashPassword(payload.password);

  // Verify password hash (allow seed admin bypass if matching default)
  if (user.passwordHash && user.passwordHash !== passwordHash && user.passwordHash !== "hash_default_admin") {
    throw new Error("Incorrect password. Please try again.");
  }

  // Update passwordHash if it was default seed
  if (user.passwordHash === "hash_default_admin") {
    user.passwordHash = passwordHash;
  }

  // Ensure role is admin for admin email
  if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    user.role = "admin";
  }

  // Update last login
  user.lastLogin = new Date().toISOString();
  users[userIndex] = user;
  saveRegisteredUsers(users);

  // Set active session
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

// Get active session
export function getCustomSession(): User | null {
  if (typeof window === "undefined") return null;
  const isGuestMode = localStorage.getItem("invictus_guest_mode") === "true";
  if (isGuestMode) {
    const guestName = localStorage.getItem("invictus_guest_name") || "Guest Explorer";
    return {
      uid: "guest-user",
      email: "guest@invictus.local",
      displayName: guestName,
      role: "user",
      timezone: "Asia/Kolkata",
      weekStartsOn: 1,
      currency: "INR",
      onboarded: true,
      modulesEnabled: { goals: true, study: true, money: true },
    };
  }

  const token = localStorage.getItem(SESSION_TOKEN_KEY);
  const userJson = localStorage.getItem(ACTIVE_USER_KEY);
  if (!token || !userJson) return null;

  try {
    const user: User = JSON.parse(userJson);
    if (user.email.toLowerCase().includes("luckymanojjadhav") || user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      user.role = "admin";
    }
    return user;
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
}

// Update user details in DB & active session
export function customUpdateUser(uid: string, updates: Partial<User>): User | null {
  const users = getRegisteredUsers();
  const idx = users.findIndex((u) => u.uid === uid);
  if (idx === -1) return null;

  const updatedUser: User = {
    ...users[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  users[idx] = updatedUser;
  saveRegisteredUsers(users);

  const currentUser = getCustomSession();
  if (currentUser && currentUser.uid === uid) {
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(updatedUser));
  }

  return updatedUser;
}

// Delete user by UID or Email permanently
export function customDeleteUser(uidOrEmail: string): boolean {
  if (typeof window === "undefined") return false;
  let users = getRegisteredUsers();
  const initialCount = users.length;
  const target = uidOrEmail.trim().toLowerCase();
  users = users.filter((u) => u.uid !== uidOrEmail && u.email.toLowerCase() !== target);
  
  // Persist updated list (even if empty array []) so seedAdmin is NOT re-seeded!
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

export function createReportedIssue(issue: Omit<IssueReport, "id" | "reportedAt">): IssueReport {
  const issues = getReportedIssues();
  const newIssue: IssueReport = {
    ...issue,
    id: `issue_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
    reportedAt: new Date().toISOString(),
  };
  issues.unshift(newIssue);
  if (typeof window !== "undefined") {
    localStorage.setItem(ISSUES_DB_KEY, JSON.stringify(issues));
  }
  return newIssue;
}

export function updateIssueStatus(id: string, status: "open" | "in_progress" | "resolved"): boolean {
  const issues = getReportedIssues();
  const idx = issues.findIndex((i) => i.id === id);
  if (idx !== -1) {
    issues[idx].status = status;
    if (typeof window !== "undefined") {
      localStorage.setItem(ISSUES_DB_KEY, JSON.stringify(issues));
    }
    return true;
  }
  return false;
}

export function deleteReportedIssue(id: string): boolean {
  let issues = getReportedIssues();
  const initial = issues.length;
  issues = issues.filter((i) => i.id !== id);
  if (issues.length !== initial) {
    if (typeof window !== "undefined") {
      localStorage.setItem(ISSUES_DB_KEY, JSON.stringify(issues));
    }
    return true;
  }
  return false;
}

// Password update helper for custom auth
export async function customUpdatePassword(uid: string, newPassword: string): Promise<boolean> {
  if (!newPassword || newPassword.length < 4) {
    throw new Error("Password must be at least 4 characters.");
  }
  const passwordHash = await hashPassword(newPassword);
  const updated = customUpdateUser(uid, { passwordHash });
  return updated !== null;
}

// Global Announcement Banner System
export interface GlobalAnnouncement {
  id: string;
  message: string;
  type: "info" | "warning" | "success" | "alert";
  active: boolean;
  createdAt: string;
  createdBy: string;
}

const ANNOUNCEMENT_KEY = "invictus_global_announcement";

export function getGlobalAnnouncement(): GlobalAnnouncement | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(ANNOUNCEMENT_KEY);
  if (!data) return null;
  try {
    const parsed = JSON.parse(data);
    return parsed.active ? parsed : null;
  } catch {
    return null;
  }
}

export function setGlobalAnnouncement(announcement: GlobalAnnouncement | null) {
  if (typeof window === "undefined") return;
  if (!announcement) {
    localStorage.removeItem(ANNOUNCEMENT_KEY);
  } else {
    localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(announcement));
  }
}

// Audit Trail Logging System
export interface AuditLogItem {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details: string;
}

const AUDIT_LOGS_KEY = "invictus_system_audit_logs";

export function getAuditLogs(): AuditLogItem[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(AUDIT_LOGS_KEY);
  if (!data) {
    const defaultLogs: AuditLogItem[] = [
      {
        id: "audit_1",
        action: "SYSTEM_INITIALIZATION",
        performedBy: ADMIN_EMAIL,
        timestamp: new Date().toISOString(),
        details: "Invictus Governance Engine & Custom Auth SHA-256 System Initialized.",
      },
    ];
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(defaultLogs));
    return defaultLogs;
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function addAuditLog(action: string, performedBy: string, details: string) {
  const logs = getAuditLogs();
  const newLog: AuditLogItem = {
    id: `audit_${Date.now()}`,
    action,
    performedBy,
    timestamp: new Date().toISOString(),
    details,
  };
  logs.unshift(newLog);
  if (typeof window !== "undefined") {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 50))); // Keep last 50
  }
}

