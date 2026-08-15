"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/shared/AuthProvider";
import { useRouter } from "next/navigation";
import {
  getRegisteredUsers,
  customDeleteUser,
  customUpdateUser,
  customRegisterUser,
  getReportedIssues,
  createReportedIssue,
  updateIssueStatus,
  deleteReportedIssue,
  getGlobalAnnouncement,
  setGlobalAnnouncement,
  clearGlobalAnnouncement,
  getAuditLogs,
  addAuditLog,
  type IssueReport,
  type GlobalAnnouncement,
  type AuditLogItem,
} from "@/lib/custom-auth";
import { type User } from "@/types";
import { toast } from "sonner";
import {
  ShieldAlert,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Trash2,
  ShieldCheck,
  UserCheck,
  Activity,
  Sparkles,
  Lock,
  Megaphone,
  History,
  HardDrive,
  UserPlus,
  Shield,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { format } from "date-fns";

const ADMIN_EMAIL = "luckymanojjadhav@gmail.com";

export default function AdminDashboardPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  const [usersList, setUsersList] = useState<User[]>([]);
  const [issuesList, setIssuesList] = useState<IssueReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [announcement, setAnnouncement] = useState<GlobalAnnouncement | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "issues" | "audit_announcements">("users");

  // Announcement Form State
  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [announcementType, setAnnouncementType] = useState<GlobalAnnouncement["type"]>("info");

  // New User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // New Issue Modal State
  const [isAddIssueOpen, setIsAddIssueOpen] = useState(false);
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDesc, setIssueDesc] = useState("");
  const [issueCategory, setIssueCategory] = useState<IssueReport["category"]>("bug");
  const [issueSeverity, setIssueSeverity] = useState<IssueReport["severity"]>("medium");

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");

  // Delete User Modal & Storage States
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [storageKB, setStorageKB] = useState(0);

  // Load Data from MongoDB & Local Stores
  const refreshData = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const mongoUsers = await res.json();
        setUsersList(mongoUsers);
      } else {
        setUsersList(getRegisteredUsers());
      }
    } catch {
      setUsersList(getRegisteredUsers());
    }

    try {
      const res = await fetch("/api/admin/issues");
      if (res.ok) {
        const mongoIssues = await res.json();
        setIssuesList(mongoIssues);
      } else {
        setIssuesList(getReportedIssues());
      }
    } catch {
      setIssuesList(getReportedIssues());
    }

    setAuditLogs(getAuditLogs());
    try {
      const res = await fetch("/api/admin/announcement");
      if (res.ok) {
        const mongoAnn = await res.json();
        setAnnouncement(mongoAnn);
        if (mongoAnn && mongoAnn.message) {
          setAnnouncementMsg(mongoAnn.message);
          setAnnouncementType(mongoAnn.type || "info");
        }
      } else {
        const activeAnn = getGlobalAnnouncement();
        setAnnouncement(activeAnn);
        if (activeAnn) {
          setAnnouncementMsg(activeAnn.message);
          setAnnouncementType(activeAnn.type);
        }
      }
    } catch {
      const activeAnn = getGlobalAnnouncement();
      setAnnouncement(activeAnn);
      if (activeAnn) {
        setAnnouncementMsg(activeAnn.message);
        setAnnouncementType(activeAnn.type);
      }
    }

    // Calculate localStorage KB
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        totalBytes += (key.length + (localStorage.getItem(key)?.length || 0)) * 2;
      }
    }
    setStorageKB(Math.round(totalBytes / 1024));
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Access Guard
  const isAuthorized =
    isAdmin || (user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-bg flex items-center justify-center p-6">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-md border border-amber-200">
          <Sparkles className="h-5 w-5 text-amber-500 animate-spin" />
          <span className="text-sm font-bold text-navy-900">Verifying Admin Access...</span>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-cream-bg p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-xl border-2 border-red-200 text-center space-y-4">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black text-navy-900" style={{ fontFamily: "var(--font-heading)" }}>
            Access Restricted
          </h2>
          <p className="text-xs text-navy-600 leading-relaxed font-medium">
            This Admin Control Panel is strictly reserved for{" "}
            <strong className="text-navy-900">{ADMIN_EMAIL}</strong>. You do not have authorization to view this area.
          </p>
          <Button
            onClick={() => router.push("/today")}
            className="bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-full py-2.5 px-6 shadow-md w-full cursor-pointer border-none"
          >
            Back to Safety
          </Button>
        </div>
      </div>
    );
  }

  // Handle Add User in MongoDB
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName || !newPassword) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, displayName: newName, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");

      // Also sync to legacy local auth for fallback
      await customRegisterUser({ email: newEmail, displayName: newName, password: newPassword }).catch(() => {});

      addAuditLog("CREATE_USER", user?.email || ADMIN_EMAIL, `Created new account for ${newName} (${newEmail}).`);
      toast.success(`User ${newName} created successfully in MongoDB! 🎉`);
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      setIsAddUserOpen(false);
      refreshData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create user");
    }
  };

  // Toggle User Role in MongoDB
  const handleToggleUserRole = async (u: User) => {
    if (u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      toast.error("Primary SuperAdmin role cannot be changed.");
      return;
    }
    const newRole = u.role === "admin" ? "user" : "admin";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: u.uid, role: newRole }),
      });
      if (!res.ok) throw new Error("Failed to update role in MongoDB");

      customUpdateUser(u.uid, { role: newRole });
      addAuditLog("UPDATE_ROLE", user?.email || ADMIN_EMAIL, `Updated role for ${u.displayName} to ${newRole}.`);
      toast.success(`Role for ${u.displayName} changed to ${newRole.toUpperCase()}`);
      refreshData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update role");
    }
  };

  // Toggle User Status (Active <-> Suspended) in MongoDB
  const handleToggleUserStatus = async (u: User) => {
    if (u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      toast.error("Primary SuperAdmin account cannot be suspended.");
      return;
    }
    const newStatus = (u as any).status === "suspended" ? "active" : "suspended";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: u.uid, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status in MongoDB");

      addAuditLog("UPDATE_STATUS", user?.email || ADMIN_EMAIL, `Updated account status for ${u.displayName} to ${newStatus}.`);
      toast.success(`Account status for ${u.displayName} set to ${newStatus.toUpperCase()}`);
      refreshData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  // Save User Edits (Name, Email, New Password) in MongoDB
  const handleSaveUserEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: editingUser.uid,
          displayName: editName,
          email: editEmail,
          newPassword: editPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");

      addAuditLog("EDIT_USER", user?.email || ADMIN_EMAIL, `Updated user details for ${editName} (${editEmail}).`);
      toast.success(`User details for ${editName} updated! ✨`);
      setEditingUser(null);
      setEditName("");
      setEditEmail("");
      setEditPassword("");
      refreshData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update user");
    }
  };

  // Handle Add Issue in MongoDB
  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle) return;
    try {
      const res = await fetch("/api/admin/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: issueTitle,
          description: issueDesc,
          category: issueCategory,
          severity: issueSeverity,
          reportedBy: user?.email || ADMIN_EMAIL,
        }),
      });
      if (!res.ok) throw new Error("Failed to create issue");

      createReportedIssue({
        title: issueTitle,
        description: issueDesc,
        category: issueCategory,
        severity: issueSeverity,
        status: "open",
        reportedBy: user?.email || ADMIN_EMAIL,
      });

      addAuditLog("REPORT_ISSUE", user?.email || ADMIN_EMAIL, `Logged issue: ${issueTitle}`);
      toast.success("Issue reported to tracking board! 🛠️");
      setIssueTitle("");
      setIssueDesc("");
      setIsAddIssueOpen(false);
      refreshData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create issue");
    }
  };

  // Handle Delete User in MongoDB
  const confirmDeleteUser = async () => {
    if (!deletingUserId) return;
    try {
      const res = await fetch(`/api/admin/users?uid=${deletingUserId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete user from MongoDB");

      customDeleteUser(deletingUserId);
      addAuditLog("DELETE_USER", user?.email || ADMIN_EMAIL, `Deleted user account ID ${deletingUserId}.`);
      toast.success("User account deleted from MongoDB");
      refreshData();
    } catch (err: any) {
      toast.error(err?.message || "Could not delete user");
    } finally {
      setDeletingUserId(null);
    }
  };

  // Handle Broadcast Announcement in MongoDB
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!announcementMsg.trim()) {
        await fetch("/api/admin/announcement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clear: true }),
        });
        clearGlobalAnnouncement();
        addAuditLog("CLEAR_ANNOUNCEMENT", user?.email || ADMIN_EMAIL, "Cleared global announcement banner.");
        toast.success("Announcement banner cleared in MongoDB!");
      } else {
        await fetch("/api/admin/announcement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: announcementMsg.trim(),
            type: announcementType,
            createdBy: user?.email || ADMIN_EMAIL,
          }),
        });
        setGlobalAnnouncement(announcementMsg.trim(), true, announcementType, user?.email || ADMIN_EMAIL);
        addAuditLog("BROADCAST_ANNOUNCEMENT", user?.email || ADMIN_EMAIL, `Broadcasted banner: "${announcementMsg.trim()}"`);
        toast.success("Global announcement published to MongoDB! 📢");
      }
      refreshData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to broadcast announcement");
    }
  };

  // Filtered Users
  const filteredUsers = usersList.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openIssuesCount = issuesList.filter((i) => i.status === "open").length;

  return (
    <div className="min-h-screen bg-cream-bg p-3 sm:p-8 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Admin Header Banner */}
        <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-amber-900 rounded-[32px] p-6 sm:p-8 text-white shadow-xl border-2 border-amber-400/30 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 h-44 w-44 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />
          <div className="relative z-10 space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-black">
              <ShieldCheck className="h-4 w-4" />
              <span>SUPER ADMIN GOVERNANCE SUITE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              Invictus System & Telemetry Center
            </h1>
            <p className="text-xs sm:text-sm font-semibold opacity-90">
              Authorized session: <strong className="text-amber-300">{user?.email}</strong>. Manage account roles, global announcements, system audit trails, and issue reports.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-400 text-[#161514] hover:bg-amber-300 font-black text-xs border-2 border-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <UserCheck className="h-4 w-4 stroke-[2.5]" />
                <span>My Profile 👤</span>
              </button>
            </div>
          </div>
        </div>

        {/* System Telemetry Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-border/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-navy-600">Total Registered</span>
              <Users className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-navy-900">{usersList.length}</p>
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
              Custom SHA-256 Auth
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-xs border border-border/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-navy-600">Open Issues</span>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-2xl font-black text-navy-900">{openIssuesCount}</p>
            <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full inline-block">
              {issuesList.length} Total Reports
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-xs border border-border/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-navy-600">Local Storage</span>
              <HardDrive className="h-4 w-4 text-sky-500" />
            </div>
            <p className="text-2xl font-black text-navy-900">{storageKB} KB</p>
            <span className="text-[9px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full inline-block">
              Client DB Healthy
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-xs border border-border/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-navy-600">Security State</span>
              <Lock className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-sm font-black text-emerald-600">100% Operational</p>
            <span className="text-[9px] font-bold text-navy-600 bg-navy-50 px-2 py-0.5 rounded-full inline-block">
              Audit Trail Active
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                activeTab === "users"
                  ? "bg-navy-900 text-white shadow-sm"
                  : "bg-white text-navy-900 hover:bg-cream-bg border border-border/60"
              }`}
            >
              👥 Users ({usersList.length})
            </button>
            <button
              onClick={() => setActiveTab("issues")}
              className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                activeTab === "issues"
                  ? "bg-navy-900 text-white shadow-sm"
                  : "bg-white text-navy-900 hover:bg-cream-bg border border-border/60"
              }`}
            >
              🛠️ Issue Board ({issuesList.length})
            </button>
            <button
              onClick={() => setActiveTab("audit_announcements")}
              className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                activeTab === "audit_announcements"
                  ? "bg-navy-900 text-white shadow-sm"
                  : "bg-white text-navy-900 hover:bg-cream-bg border border-border/60"
              }`}
            >
              📢 Announcements & Audit Logs
            </button>
          </div>

          {activeTab === "users" && (
            <Button
              onClick={() => setIsAddUserOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-navy-900 font-bold rounded-full text-xs py-2 px-4 shadow-xs flex items-center gap-1.5 cursor-pointer border-none"
            >
              <Plus className="h-4 w-4 stroke-[3]" /> Add User
            </Button>
          )}

          {activeTab === "issues" && (
            <Button
              onClick={() => setIsAddIssueOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-navy-900 font-bold rounded-full text-xs py-2 px-4 shadow-xs flex items-center gap-1.5 cursor-pointer border-none"
            >
              <Plus className="h-4 w-4 stroke-[3]" /> Report Issue
            </Button>
          )}
        </div>

        {/* Tab 1: Users Table & Role Switcher */}
        {activeTab === "users" && (
          <div className="bg-white rounded-3xl p-6 shadow-md border border-border/60 space-y-4">
            
            {/* Search Bar */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-navy-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full bg-cream-bg/60 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-navy-900 border border-border/80 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/60 text-[10px] font-black text-navy-600 uppercase tracking-widest bg-cream-bg/40">
                    <th className="p-3 rounded-l-xl">User Profile</th>
                    <th className="p-3">Role Governance</th>
                    <th className="p-3">Account Status</th>
                    <th className="p-3">Joined Date</th>
                    <th className="p-3 text-right rounded-r-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-xs">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-navy-600 font-medium">
                        No user accounts match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSeedAdmin = u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                      const statusVal = (u as any).status || "active";
                      return (
                        <tr key={u.uid} className="hover:bg-cream-bg/30 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-amber-400/20 text-amber-900 font-extrabold flex items-center justify-center text-xs">
                                {u.displayName ? u.displayName.charAt(0).toUpperCase() : "U"}
                              </div>
                              <div>
                                <p className="font-bold text-navy-900 leading-tight">{u.displayName}</p>
                                <p className="text-[11px] text-navy-600">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleToggleUserRole(u)}
                              disabled={isSeedAdmin}
                              title={isSeedAdmin ? "Primary SuperAdmin" : "Click to toggle role"}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1 cursor-pointer transition-all ${
                                u.role === "admin"
                                  ? "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                                  : "bg-navy-50 text-navy-800 hover:bg-navy-100"
                              } ${isSeedAdmin ? "cursor-not-allowed opacity-90" : ""}`}
                            >
                              <Shield className="h-3 w-3" />
                              {u.role || "user"}
                            </button>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              disabled={isSeedAdmin}
                              title={isSeedAdmin ? "Primary SuperAdmin" : "Click to toggle active/suspended status"}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1 cursor-pointer transition-all ${
                                statusVal === "suspended"
                                  ? "bg-red-100 text-red-800 border border-red-300 hover:bg-red-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                              } ${isSeedAdmin ? "cursor-not-allowed opacity-90" : ""}`}
                            >
                              <span>{statusVal === "suspended" ? "🔴 Suspended" : "🟢 Active"}</span>
                            </button>
                          </td>
                          <td className="p-3 text-navy-600 text-[11px]">
                            {u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "Initial Seed"}
                          </td>
                          <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setEditName(u.displayName);
                                setEditEmail(u.email);
                                setEditPassword("");
                              }}
                              className="text-navy-700 hover:text-navy-900 bg-cream-bg hover:bg-amber-100 p-1.5 rounded-lg border border-border/60 transition-colors cursor-pointer"
                              title="Edit user & password reset"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>

                            {!isSeedAdmin && (
                              <button
                                onClick={() => setDeletingUserId(u.uid)}
                                className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg border border-red-200 transition-colors cursor-pointer"
                                title="Delete user"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Issue Board */}
        {activeTab === "issues" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {issuesList.map((issue) => (
                <div
                  key={issue.id}
                  className="bg-white rounded-3xl p-5 shadow-sm border border-border/60 space-y-3 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                            issue.severity === "high"
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : issue.severity === "medium"
                              ? "bg-amber-100 text-amber-900 border border-amber-200"
                              : "bg-sky-100 text-sky-800 border border-sky-200"
                          }`}
                        >
                          {issue.severity} priority
                        </span>
                        <span className="text-[9px] font-bold text-navy-600 uppercase tracking-wider bg-cream-bg px-2 py-0.5 rounded-md">
                          {issue.category}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-navy-900 leading-snug">{issue.title}</h4>
                    </div>

                    <button
                      onClick={async () => {
                        try {
                          await fetch(`/api/admin/issues?id=${issue.id}`, { method: "DELETE" });
                          deleteReportedIssue(issue.id);
                          addAuditLog("DELETE_ISSUE", user?.email || ADMIN_EMAIL, `Deleted issue ID ${issue.id}`);
                          toast.success("Issue removed from MongoDB");
                          refreshData();
                        } catch {
                          toast.error("Failed to delete issue");
                        }
                      }}
                      className="text-navy-600 hover:text-red-500 p-1 cursor-pointer outline-none border-none bg-transparent"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {issue.description && (
                    <p className="text-xs text-navy-600 leading-relaxed font-medium bg-cream-bg/40 p-3 rounded-xl">
                      {issue.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px]">
                    <span className="text-navy-600 font-semibold">
                      By: {issue.reportedBy}
                    </span>
                    
                    <select
                      value={issue.status}
                      onChange={async (e) => {
                        const newSt = e.target.value;
                        try {
                          await fetch("/api/admin/issues", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: issue.id, status: newSt }),
                          });
                          updateIssueStatus(issue.id, newSt as any);
                          addAuditLog("UPDATE_ISSUE_STATUS", user?.email || ADMIN_EMAIL, `Changed status of issue ${issue.id} to ${newSt}`);
                          toast.success("Issue status updated in MongoDB");
                          refreshData();
                        } catch {
                          toast.error("Failed to update status");
                        }
                      }}
                      className={`font-black uppercase px-2.5 py-1 rounded-full border cursor-pointer outline-none ${
                        issue.status === "resolved"
                          ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                          : issue.status === "in_progress"
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : "bg-red-50 text-red-800 border-red-200"
                      }`}
                    >
                      <option value="open">🔴 Open</option>
                      <option value="in_progress">🟡 In Progress</option>
                      <option value="resolved">🟢 Resolved</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Announcements & Audit Logs */}
        {activeTab === "audit_announcements" && (
          <div className="space-y-6">
            
            {/* Global Announcement Broadcaster */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-border/60 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-amber-500" />
                  <h3 className="font-extrabold text-sm text-navy-900 uppercase tracking-wider">
                    Site-Wide Global Announcement Banner
                  </h3>
                </div>
                {announcement && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    🟢 Active Banner
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveAnnouncement} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Announcement Text</label>
                  <input
                    type="text"
                    value={announcementMsg}
                    onChange={(e) => setAnnouncementMsg(e.target.value)}
                    placeholder="e.g. 🚀 Scheduled maintenance tonight at 11:00 PM IST."
                    className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600 w-full sm:w-auto">Banner Style:</span>
                    {(["info", "warning", "success", "alert"] as const).map((st) => (
                      <button
                        type="button"
                        key={st}
                        onClick={() => setAnnouncementType(st)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black capitalize cursor-pointer transition-all ${
                          announcementType === st
                            ? "bg-navy-900 text-white"
                            : "bg-cream-bg text-navy-700 border border-border/60"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {announcement && (
                      <Button
                        type="button"
                        onClick={async () => {
                          await fetch("/api/admin/announcement", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ clear: true }),
                          });
                          clearGlobalAnnouncement();
                          setAnnouncementMsg("");
                          toast.success("Banner cleared");
                          refreshData();
                        }}
                        variant="outline"
                        className="rounded-full text-xs font-bold py-2 border-red-200 text-red-600 hover:bg-red-50 cursor-pointer w-full sm:w-auto"
                      >
                        Clear Banner
                      </Button>
                    )}
                    <Button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-600 text-navy-900 font-bold rounded-full text-xs py-2.5 px-5 cursor-pointer border-none w-full sm:w-auto"
                    >
                      Publish Announcement
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            {/* System Audit Logs */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-border/60 space-y-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-amber-500" />
                <h3 className="font-extrabold text-sm text-navy-900 uppercase tracking-wider">
                  Governance Audit Trail ({auditLogs.length})
                </h3>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-cream-bg/40 rounded-xl p-3 border border-border/50 text-xs flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[10px] text-navy-900 bg-amber-400/30 px-2 py-0.5 rounded-md uppercase">
                          {log.action}
                        </span>
                        <span className="text-[10px] font-bold text-navy-600">By: {log.performedBy}</span>
                      </div>
                      <p className="text-navy-900 font-medium text-xs">{log.details}</p>
                    </div>
                    <span className="text-[10px] font-bold text-navy-600 whitespace-nowrap">
                      {format(new Date(log.timestamp), "MMM d, h:mm a")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <ResponsiveFormContainer
        open={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
        title="Add New Account"
        description="Register a new user directly into custom auth database"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Full Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
              placeholder="e.g. Manoj Jadhav"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Email Address</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
              placeholder="e.g. user@example.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
              placeholder="Min 4 characters"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-navy-900 font-bold rounded-full py-2.5 mt-2 border-none cursor-pointer"
          >
            Create User Account
          </Button>
        </form>
      </ResponsiveFormContainer>

      {/* Edit User & Reset Password Modal */}
      <ResponsiveFormContainer
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        title="Edit User Profile & Reset Password"
        description="Update display name, email, or reset user password directly in MongoDB"
      >
        <form onSubmit={handleSaveUserEdits} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Full Display Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Email Address</label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">
              Reset Password (leave blank to keep unchanged)
            </label>
            <input
              type="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
              placeholder="Enter new password"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-navy-900 font-bold rounded-full py-2.5 mt-2 border-none cursor-pointer"
          >
            Save User Changes
          </Button>
        </form>
      </ResponsiveFormContainer>

      {/* Add Issue Modal */}
      <ResponsiveFormContainer
        open={isAddIssueOpen}
        onOpenChange={setIsAddIssueOpen}
        title="Report New Issue"
        description="Add a system bug or feature request to the admin issue board"
      >
        <form onSubmit={handleCreateIssue} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Issue Title</label>
            <input
              type="text"
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
              placeholder="Summary of issue..."
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Description</label>
            <textarea
              value={issueDesc}
              onChange={(e) => setIssueDesc(e.target.value)}
              rows={3}
              className="w-full bg-cream-bg rounded-xl border border-border/85 px-4 py-2.5 text-xs text-navy-900 focus:outline-none focus:border-amber-500 font-medium"
              placeholder="Detailed steps or feedback..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Category</label>
              <NeobrutalistSelect
                value={issueCategory}
                onChange={(val) => setIssueCategory(val as any)}
                options={[
                  { value: "bug", label: "Bug", icon: "🐛" },
                  { value: "feature", label: "Feature Request", icon: "🚀" },
                  { value: "ui", label: "UI / Aesthetics", icon: "🎨" },
                  { value: "other", label: "Other", icon: "📌" },
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-navy-600">Severity</label>
              <NeobrutalistSelect
                value={issueSeverity}
                onChange={(val) => setIssueSeverity(val as any)}
                options={[
                  { value: "low", label: "Low", icon: "🟢" },
                  { value: "medium", label: "Medium", icon: "🟡" },
                  { value: "high", label: "High", icon: "🔴" },
                ]}
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-navy-900 font-bold rounded-full py-2.5 mt-2 border-none cursor-pointer"
          >
            Submit Issue Report
          </Button>
        </form>
      </ResponsiveFormContainer>

      {/* Delete User Confirmation Modal */}
      <DeleteConfirmationModal
        open={deletingUserId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingUserId(null);
        }}
        onConfirm={confirmDeleteUser}
        title="Delete User Account"
        description="Are you sure you want to delete this user? All their session keys and local profiles will be removed."
      />
    </div>
  );
}
