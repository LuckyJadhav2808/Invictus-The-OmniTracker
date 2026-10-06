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
import { cn } from "@/lib/utils";

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

  const getAdminHeaders = () => ({
    "Content-Type": "application/json",
    "x-admin-email": user?.email || ADMIN_EMAIL,
    "x-admin-uid": user?.uid || "user-admin-default",
  });

  // Load Data from MongoDB & Local Stores
  const refreshData = async () => {
    try {
      const res = await fetch("/api/admin/users", {
        headers: getAdminHeaders(),
      });
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
        headers: getAdminHeaders(),
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
        headers: getAdminHeaders(),
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
        headers: getAdminHeaders(),
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
        headers: getAdminHeaders(),
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
        headers: getAdminHeaders(),
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
    <div className="min-h-screen bg-[#FAF8F5] pb-24 p-3 sm:p-6 md:p-8 space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Admin Header Banner */}
        <div className="bg-[#161514] text-white rounded-3xl p-6 sm:p-8 border-[2.5px] border-[#161514] shadow-[5px_5px_0px_0px_#CEF431] relative overflow-hidden">
          <div className="relative z-10 space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#CEF431] text-[#161514] border-2 border-[#161514] text-xs font-black">
              <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
              <span>SUPER ADMIN GOVERNANCE SUITE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase font-heading">
              Invictus System & Telemetry Center
            </h1>
            <p className="text-xs sm:text-sm font-bold text-white/80">
              Authorized session: <strong className="text-amber-300 font-mono">{user?.email}</strong>. Manage account roles, global announcements, system audit trails, and issue reports.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 text-[#161514] hover:bg-amber-300 font-black text-xs border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <UserCheck className="h-4 w-4 stroke-[2.5]" />
                <span>My Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* System Telemetry Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#161514]/70 font-heading">Total Registered</span>
              <Users className="h-4 w-4 text-amber-500 stroke-[2.5]" />
            </div>
            <p className="text-2xl font-black text-[#161514] font-heading">{usersList.length}</p>
            <span className="text-[9px] font-black text-emerald-950 bg-emerald-300 px-2 py-0.5 rounded-lg border border-[#161514] inline-block">
              Custom SHA-256 Auth
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#161514]/70 font-heading">Open Issues</span>
              <AlertTriangle className="h-4 w-4 text-orange-500 stroke-[2.5]" />
            </div>
            <p className="text-2xl font-black text-[#161514] font-heading">{openIssuesCount}</p>
            <span className="text-[9px] font-black text-orange-950 bg-orange-300 px-2 py-0.5 rounded-lg border border-[#161514] inline-block">
              {issuesList.length} Total Reports
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#161514]/70 font-heading">Local Storage</span>
              <HardDrive className="h-4 w-4 text-sky-500 stroke-[2.5]" />
            </div>
            <p className="text-2xl font-black text-[#161514] font-heading">{storageKB} KB</p>
            <span className="text-[9px] font-black text-sky-950 bg-sky-300 px-2 py-0.5 rounded-lg border border-[#161514] inline-block">
              Client DB Healthy
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#161514]/70 font-heading">Security State</span>
              <Lock className="h-4 w-4 text-emerald-500 stroke-[2.5]" />
            </div>
            <p className="text-sm font-black text-emerald-600 font-heading">100% Operational</p>
            <span className="text-[9px] font-black text-[#161514] bg-[#FAF8F5] px-2 py-0.5 rounded-lg border border-[#161514] inline-block">
              Audit Trail Active
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b-2 border-[#161514]/10 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("users")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border-2 font-heading",
                activeTab === "users"
                  ? "bg-[#161514] text-white border-[#161514] shadow-[2px_2px_0px_0px_#161514]"
                  : "bg-white text-[#161514] border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:bg-[#FAF8F5]"
              )}
            >
              <Users className="h-3.5 w-3.5 stroke-[2.5]" /> Users ({usersList.length})
            </button>
            <button
              onClick={() => setActiveTab("issues")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border-2 font-heading",
                activeTab === "issues"
                  ? "bg-[#161514] text-white border-[#161514] shadow-[2px_2px_0px_0px_#161514]"
                  : "bg-white text-[#161514] border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:bg-[#FAF8F5]"
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5 stroke-[2.5]" /> Issue Board ({issuesList.length})
            </button>
            <button
              onClick={() => setActiveTab("audit_announcements")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border-2 font-heading",
                activeTab === "audit_announcements"
                  ? "bg-[#161514] text-white border-[#161514] shadow-[2px_2px_0px_0px_#161514]"
                  : "bg-white text-[#161514] border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:bg-[#FAF8F5]"
              )}
            >
              <Megaphone className="h-3.5 w-3.5 stroke-[2.5]" /> Announcements & Logs
            </button>
          </div>

          {activeTab === "users" && (
            <Button
              onClick={() => setIsAddUserOpen(true)}
              className="bg-amber-400 hover:bg-amber-500 text-[#161514] font-black rounded-xl text-xs py-2 px-4 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center gap-1.5 cursor-pointer uppercase transition-all"
            >
              <Plus className="h-4 w-4 stroke-[3]" /> Add User
            </Button>
          )}

          {activeTab === "issues" && (
            <Button
              onClick={() => setIsAddIssueOpen(true)}
              className="bg-amber-400 hover:bg-amber-500 text-[#161514] font-black rounded-xl text-xs py-2 px-4 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center gap-1.5 cursor-pointer uppercase transition-all"
            >
              <Plus className="h-4 w-4 stroke-[3]" /> Report Issue
            </Button>
          )}
        </div>

        {/* Tab 1: Users Table & Role Switcher */}
        {activeTab === "users" && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-[2.5px] border-[#161514] shadow-[5px_5px_0px_0px_#161514] space-y-4">
            
            {/* Search Bar */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#161514]/60 stroke-[2.5]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full bg-[#FAF8F5] rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-[#161514] border-2 border-[#161514] focus:outline-none focus:bg-[#FFF9EA] focus:shadow-[2px_2px_0px_0px_#161514] transition-all"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#161514] text-[10px] font-black text-[#161514] uppercase tracking-widest bg-[#FAF8F5]">
                    <th className="p-3 rounded-l-xl font-heading">User Profile</th>
                    <th className="p-3 font-heading">Role Governance</th>
                    <th className="p-3 font-heading">Account Status</th>
                    <th className="p-3 font-heading">Joined Date</th>
                    <th className="p-3 text-right rounded-r-xl font-heading">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-[#161514]/10 text-xs font-bold">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#161514]/60 font-bold">
                        No user accounts match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSeedAdmin = u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                      const statusVal = (u as any).status || "active";
                      return (
                        <tr key={u.uid} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-amber-400 border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] text-[#161514] font-black flex items-center justify-center text-xs">
                                {u.displayName ? u.displayName.charAt(0).toUpperCase() : "U"}
                              </div>
                              <div>
                                <p className="font-black text-[#161514] leading-tight font-heading">{u.displayName}</p>
                                <p className="text-[11px] text-[#161514]/70 font-mono">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleToggleUserRole(u)}
                              disabled={isSeedAdmin}
                              title={isSeedAdmin ? "Primary SuperAdmin" : "Click to toggle role"}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition-all border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514] ${
                                u.role === "admin"
                                  ? "bg-amber-300 text-[#161514] hover:bg-amber-400"
                                  : "bg-[#FAF8F5] text-[#161514] hover:bg-white"
                              } ${isSeedAdmin ? "cursor-not-allowed opacity-90" : ""}`}
                            >
                              <Shield className="h-3 w-3 stroke-[2.5]" />
                              {u.role || "user"}
                            </button>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              disabled={isSeedAdmin}
                              title={isSeedAdmin ? "Primary SuperAdmin" : "Click to toggle active/suspended status"}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition-all border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514] ${
                                statusVal === "suspended"
                                  ? "bg-red-100 text-red-900 hover:bg-red-200"
                                  : "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                              } ${isSeedAdmin ? "cursor-not-allowed opacity-90" : ""}`}
                            >
                              <span>{statusVal === "suspended" ? "Suspended" : "Active"}</span>
                            </button>
                          </td>
                          <td className="p-3 text-[#161514]/70 text-[11px]">
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
                              className="text-[#161514] hover:bg-amber-100 p-1.5 rounded-lg border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514] transition-colors cursor-pointer bg-white"
                              title="Edit user & password reset"
                            >
                              <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" />
                            </button>

                            {!isSeedAdmin && (
                              <button
                                onClick={() => setDeletingUserId(u.uid)}
                                className="text-red-600 hover:bg-red-100 p-1.5 rounded-lg border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514] transition-colors cursor-pointer bg-white"
                                title="Delete user"
                              >
                                <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
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
                  className="bg-white rounded-3xl p-5 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-3 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border border-[#161514] ${
                            issue.severity === "high"
                              ? "bg-red-200 text-red-950"
                              : issue.severity === "medium"
                              ? "bg-amber-200 text-amber-950"
                              : "bg-sky-200 text-sky-950"
                          }`}
                        >
                          {issue.severity} priority
                        </span>
                        <span className="text-[9px] font-black text-[#161514] uppercase tracking-wider bg-[#FAF8F5] px-2 py-0.5 rounded-lg border border-[#161514]">
                          {issue.category}
                        </span>
                      </div>
                      <h4 className="font-black text-sm text-[#161514] leading-snug font-heading">{issue.title}</h4>
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
                      className="text-[#161514]/60 hover:text-red-600 p-1 cursor-pointer outline-none border-none bg-transparent"
                    >
                      <Trash2 className="h-4 w-4 stroke-[2.5]" />
                    </button>
                  </div>

                  {issue.description && (
                    <p className="text-xs text-[#161514] leading-relaxed font-bold bg-[#FAF8F5] p-3 rounded-xl border border-[#161514]/20">
                      {issue.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t-2 border-[#161514]/10 text-[10px]">
                    <span className="text-[#161514]/70 font-bold font-mono">
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
                      className={`font-black uppercase px-2.5 py-1 rounded-xl border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514] cursor-pointer outline-none ${
                        issue.status === "resolved"
                          ? "bg-emerald-200 text-emerald-950"
                          : issue.status === "in_progress"
                          ? "bg-amber-200 text-amber-950"
                          : "bg-red-200 text-red-950"
                      }`}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
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
            <div className="bg-white rounded-3xl p-5 sm:p-6 border-[2.5px] border-[#161514] shadow-[5px_5px_0px_0px_#161514] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-amber-500 stroke-[2.5]" />
                  <h3 className="font-black text-sm text-[#161514] uppercase tracking-wider font-heading">
                    Site-Wide Global Announcement Banner
                  </h3>
                </div>
                {announcement && (
                  <span className="text-[10px] font-black text-emerald-950 bg-emerald-300 px-2.5 py-0.5 rounded-lg border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514]">
                    Active Banner
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveAnnouncement} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#161514]/70 font-heading">Announcement Text</label>
                  <input
                    type="text"
                    value={announcementMsg}
                    onChange={(e) => setAnnouncementMsg(e.target.value)}
                    placeholder="e.g. Scheduled maintenance tonight at 11:00 PM IST."
                    className="w-full bg-[#FAF8F5] rounded-xl border-2 border-[#161514] px-4 py-2.5 text-xs text-[#161514] focus:outline-none focus:bg-[#FFF9EA] focus:shadow-[2px_2px_0px_0px_#161514] font-bold transition-all"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#161514]/70 w-full sm:w-auto font-heading">Banner Style:</span>
                    {(["info", "warning", "success", "alert"] as const).map((st) => (
                      <button
                        type="button"
                        key={st}
                        onClick={() => setAnnouncementType(st)}
                        className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase cursor-pointer border-2 border-[#161514] transition-all ${
                          announcementType === st
                            ? "bg-[#161514] text-white shadow-[1.5px_1.5px_0px_0px_#161514]"
                            : "bg-[#FAF8F5] text-[#161514] hover:bg-white"
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
                        className="rounded-xl text-xs font-black uppercase py-2 border-2 border-red-600 text-red-600 hover:bg-red-50 shadow-[2px_2px_0px_0px_#dc2626] cursor-pointer w-full sm:w-auto transition-all"
                      >
                        Clear Banner
                      </Button>
                    )}
                    <Button
                      type="submit"
                      className="bg-amber-400 hover:bg-amber-500 text-[#161514] font-black uppercase tracking-wider rounded-xl text-xs py-2.5 px-5 cursor-pointer border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] w-full sm:w-auto transition-all"
                    >
                      Publish Announcement
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            {/* System Audit Logs */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border-[2.5px] border-[#161514] shadow-[5px_5px_0px_0px_#161514] space-y-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-amber-500 stroke-[2.5]" />
                <h3 className="font-black text-sm text-[#161514] uppercase tracking-wider font-heading">
                  Governance Audit Trail ({auditLogs.length})
                </h3>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-[#FAF8F5] rounded-xl p-3 border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] text-xs flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[10px] text-[#161514] bg-amber-400 px-2 py-0.5 rounded-md border border-[#161514] uppercase">
                          {log.action}
                        </span>
                        <span className="text-[10px] font-bold text-[#161514]/70">By: {log.performedBy}</span>
                      </div>
                      <p className="text-[#161514] font-bold text-xs">{log.details}</p>
                    </div>
                    <span className="text-[10px] font-bold text-[#161514]/60 whitespace-nowrap font-mono">
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
            <label className="text-[10px] font-black uppercase tracking-widest text-[#161514]/70 font-heading">Full Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="neo-input w-full bg-[#FAF8F5] rounded-xl border-2 border-[#161514] px-4 py-2.5 text-xs text-[#161514] font-bold outline-none focus:bg-[#FFF9EA] focus:shadow-[2px_2px_0px_0px_#161514] transition-all"
              placeholder="e.g. Manoj Jadhav"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#161514]/70 font-heading">Email Address</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="neo-input w-full bg-[#FAF8F5] rounded-xl border-2 border-[#161514] px-4 py-2.5 text-xs text-[#161514] font-bold outline-none focus:bg-[#FFF9EA] focus:shadow-[2px_2px_0px_0px_#161514] transition-all"
              placeholder="e.g. user@example.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#161514]/70 font-heading">Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="neo-input w-full bg-[#FAF8F5] rounded-xl border-2 border-[#161514] px-4 py-2.5 text-xs text-[#161514] font-bold outline-none focus:bg-[#FFF9EA] focus:shadow-[2px_2px_0px_0px_#161514] transition-all"
              placeholder="Min 4 characters"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-amber-400 hover:bg-amber-500 text-[#161514] font-black uppercase tracking-wider rounded-2xl py-3 mt-2 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] cursor-pointer transition-all"
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
            <label className="text-[10px] font-black uppercase tracking-widest text-[#161514]/70 font-heading">Full Display Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="neo-input w-full bg-[#FAF8F5] rounded-xl border-2 border-[#161514] px-4 py-2.5 text-xs text-[#161514] font-bold outline-none focus:bg-[#FFF9EA] focus:shadow-[2px_2px_0px_0px_#161514] transition-all"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#161514]/70 font-heading">Email Address</label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="neo-input w-full bg-[#FAF8F5] rounded-xl border-2 border-[#161514] px-4 py-2.5 text-xs text-[#161514] font-bold outline-none focus:bg-[#FFF9EA] focus:shadow-[2px_2px_0px_0px_#161514] transition-all"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#161514]/70 font-heading">
              Reset Password (leave blank to keep unchanged)
            </label>
            <input
              type="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              className="neo-input w-full bg-[#FAF8F5] rounded-xl border-2 border-[#161514] px-4 py-2.5 text-xs text-[#161514] font-bold outline-none focus:bg-[#FFF9EA] focus:shadow-[2px_2px_0px_0px_#161514] transition-all"
              placeholder="Enter new password"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-amber-400 hover:bg-amber-500 text-[#161514] font-black uppercase tracking-wider rounded-2xl py-3 mt-2 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] cursor-pointer transition-all"
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
            <label className="text-[10px] font-black uppercase tracking-widest text-[#161514]/70 font-heading">Issue Title</label>
            <input
              type="text"
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
              className="neo-input w-full bg-[#FAF8F5] rounded-xl border-2 border-[#161514] px-4 py-2.5 text-xs text-[#161514] font-bold outline-none focus:bg-[#FFF9EA] focus:shadow-[2px_2px_0px_0px_#161514] transition-all"
              placeholder="Summary of issue..."
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#161514]/70 font-heading">Description</label>
            <textarea
              value={issueDesc}
              onChange={(e) => setIssueDesc(e.target.value)}
              rows={3}
              className="neo-input w-full bg-[#FAF8F5] rounded-xl border-2 border-[#161514] px-4 py-2.5 text-xs text-[#161514] font-bold outline-none focus:bg-[#FFF9EA] focus:shadow-[2px_2px_0px_0px_#161514] transition-all"
              placeholder="Detailed steps or feedback..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#161514]/70 font-heading">Category</label>
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
              <label className="text-[10px] font-black uppercase tracking-widest text-[#161514]/70 font-heading">Severity</label>
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
            className="w-full bg-amber-400 hover:bg-amber-500 text-[#161514] font-black uppercase tracking-wider rounded-2xl py-3 mt-2 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] cursor-pointer transition-all"
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
