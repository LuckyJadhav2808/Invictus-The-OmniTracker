"use client";

import { useState } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { useAuth } from "@/components/shared/AuthProvider";
import { toast } from "sonner";
import { Bug, Send, AlertTriangle } from "lucide-react";

interface ReportIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportIssueModal({ open, onOpenChange }: ReportIssueModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"bug" | "feature" | "ui" | "other">("bug");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter an issue title.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          severity,
          reportedBy: user?.displayName || user?.email || "Invictus User",
          userId: user?.uid || "user-default",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit issue report");

      toast.success("Issue report submitted to Admin! 🛠️✨");
      setTitle("");
      setDescription("");
      setCategory("bug");
      setSeverity("medium");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit issue report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveFormContainer
      open={open}
      onOpenChange={onOpenChange}
      title="REPORT AN ISSUE OR FEEDBACK"
      description="Report a bug, request a feature, or submit UI feedback directly to the Invictus Admin Board"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <div className="space-y-1">
          <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
            Issue Title / Summary *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. PDF statement formatting on mobile..."
            className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
              Category
            </label>
            <NeobrutalistSelect
              value={category}
              onChange={(val) => setCategory(val as any)}
              options={[
                { value: "bug", label: "System Bug", icon: "🐛" },
                { value: "feature", label: "Feature Request", icon: "🚀" },
                { value: "ui", label: "UI / Aesthetics", icon: "🎨" },
                { value: "other", label: "General Feedback", icon: "📌" },
              ]}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
              Priority / Severity
            </label>
            <NeobrutalistSelect
              value={severity}
              onChange={(val) => setSeverity(val as any)}
              options={[
                { value: "low", label: "Low Priority", icon: "🟢" },
                { value: "medium", label: "Medium Priority", icon: "🟡" },
                { value: "high", label: "High / Urgent", icon: "🔴" },
              ]}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514]">
            Description / Reproduction Steps
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain what happened or what you'd like to see improved..."
            className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-[#161514] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_rgba(22,21,20,1)] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#CEF431] hover:bg-[#bce028] text-[#161514] font-black text-xs uppercase tracking-wider rounded-2xl py-3 mt-2 border-2 border-[#161514] shadow-[3px_3px_0px_0px_rgba(22,21,20,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Send className="h-4 w-4 stroke-[2.5]" />
          <span>{isSubmitting ? "Submitting Report..." : "Submit Issue Report"}</span>
        </button>
      </form>
    </ResponsiveFormContainer>
  );
}
