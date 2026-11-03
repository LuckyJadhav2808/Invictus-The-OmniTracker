"use client";

import { use, useState } from "react";
import { useSubjects, useTopics, useAddTopic, useUpdateTopic, useDeleteTopic, useStudySessions } from "@/lib/queries/study";
import { Button } from "@/components/ui/button";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { ArrowLeft, Plus, Clock, ChevronRight, CheckSquare, Sparkles, Edit3, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

const TOPIC_STARTER_PRESETS = [
  { title: "Core Theory & Concepts", hours: 2, badge: "Theory" },
  { title: "Practice Problem Set & PYQs", hours: 3, badge: "Practice" },
  { title: "Formula Sheet & Summary", hours: 1, badge: "Summary" },
  { title: "Mock Exam & Speed Drill", hours: 2, badge: "Drill" },
];

export default function SubjectDetailPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = use(params);
  const router = useRouter();
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);

  // Topic Form States
  const [topicTitle, setTopicTitle] = useState("");
  const [estimatedHours, setEstimatedHours] = useState(1);

  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { data: topics = [], isLoading: topicsLoading } = useTopics(subjectId);
  const { data: sessions = [] } = useStudySessions(subjectId);

  const addTopicMutation = useAddTopic();
  const updateTopicMutation = useUpdateTopic();
  const deleteTopicMutation = useDeleteTopic();

  // Topic Edit & Delete states
  const [editingTopic, setEditingTopic] = useState<any | null>(null);
  const [editTopicTitle, setEditTopicTitle] = useState("");
  const [editEstimatedHours, setEditEstimatedHours] = useState(1);
  const [deleteTopicId, setDeleteTopicId] = useState<string | null>(null);

  const subject = subjects.find((s) => s.id === subjectId);

  if (subjectsLoading) {
    return (
      <div className="min-h-screen bg-cream-bg dark:bg-[#161514] flex items-center justify-center p-4 transition-colors">
        <div className="text-center space-y-3 animate-pulse">
          <div className="w-12 h-12 bg-amber-400 rounded-2xl mx-auto border border-[#161514]/20" />
          <p className="text-xs font-black text-[#161514] dark:text-[#FAF8F5] uppercase tracking-wider">Loading Subject...</p>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-cream-bg dark:bg-[#161514] flex items-center justify-center p-4 transition-colors">
        <div className="text-center space-y-4">
          <p className="text-[#161514] dark:text-[#FAF8F5] font-black text-sm">Subject not found</p>
          <Link href="/study">
            <Button className="rounded-xl border border-[#161514]/20 bg-[#CEF431] text-[#161514] font-black shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer">
              Back to Study
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle.trim()) return;
    try {
      await addTopicMutation.mutateAsync({
        subjectId,
        title: topicTitle,
        estimatedHours: Number(estimatedHours),
        status: "notStarted",
        difficulty: "medium",
        notes: "",
      } as any);
      toast.success("Topic added! Let's conquer it 🚀");
      setTopicTitle("");
      setEstimatedHours(1);
      setIsAddTopicOpen(false);
    } catch {
      toast.error("Failed to add topic");
    }
  };

  const handleUpdateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic || !editTopicTitle.trim()) return;
    try {
      await updateTopicMutation.mutateAsync({
        id: editingTopic.id,
        subjectId,
        title: editTopicTitle,
        estimatedHours: Number(editEstimatedHours),
      });
      toast.success("Topic updated successfully! 📝");
      setEditingTopic(null);
    } catch {
      toast.error("Failed to update topic");
    }
  };

  // Status mapping with theme-calibrated tokens
  const statusLabels: Record<string, { label: string; bg: string; text: string }> = {
    notStarted: { label: "Not Started", bg: "bg-stone-100 dark:bg-stone-800 border border-[#E8E5DF] dark:border-[#2A2724]", text: "text-stone-700 dark:text-stone-300" },
    inProgress: { label: "In Progress", bg: "bg-amber-100 dark:bg-amber-950/40 border border-amber-300/40 dark:border-amber-900/40", text: "text-amber-900 dark:text-amber-200" },
    completed: { label: "Completed", bg: "bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300/40 dark:border-emerald-900/40", text: "text-emerald-900 dark:text-emerald-200" },
    needsRevision: { label: "Needs Rev.", bg: "bg-orange-100 dark:bg-orange-950/40 border border-orange-300/40 dark:border-orange-900/40", text: "text-orange-900 dark:text-orange-200" },
  };

  return (
    <div className="min-h-screen bg-cream-bg dark:bg-[#161514] p-4 md:p-8 space-y-6 transition-colors">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/study"
            className="bg-white dark:bg-[#1C1A18] px-3.5 py-1.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs text-[#161514] dark:text-[#FAF8F5] hover:bg-[#FFF9EA] dark:hover:bg-[#252321] flex items-center gap-1.5 text-xs font-black uppercase tracking-wider transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 stroke-[3]" /> Subjects
          </Link>
          <button
            onClick={() => setIsAddTopicOpen(true)}
            className="bg-[#CEF431] hover:bg-[#b8dd24] text-[#161514] font-black text-xs uppercase py-2 px-4 rounded-xl border border-[#161514]/20 shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" /> Add Topic
          </button>
        </div>

        {/* Title details */}
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-[#161514] dark:text-[#FAF8F5] font-heading tracking-tight">
            {subject.name}
          </h1>
          <p className="text-xs font-bold text-[#161514]/70 dark:text-[#FAF8F5]/70 uppercase tracking-wider">
            Manage your topics, track mastery, and log revisions
          </p>
        </div>

        {/* Topics syllabus */}
        {topicsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-[#1C1A18] rounded-2xl p-5 h-20 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs animate-pulse" />
            ))}
          </div>
        ) : topics.length === 0 ? (
          <EmptyState
            title="Break down your syllabus! 🎯"
            description="Break down this subject into clear study topics (e.g. Chapter 1, Algebra Basics) to log sessions and master the material."
            Icon={CheckSquare}
            ctaText="Add Study Topic"
            onCtaClick={() => setIsAddTopicOpen(true)}
            iconBgClass="bg-orange-500/15"
            iconColorClass="text-orange-500"
          />
        ) : (
          <div className="columns-1 md:columns-2 gap-4 space-y-4 [column-fill:_balance]">
            {topics.map((topic) => {
              const status = statusLabels[topic.status] || statusLabels.notStarted;
              const topicLoggedMins = sessions
                .filter((s) => s.topicId === topic.id)
                .reduce((sum, s) => sum + s.durationMinutes, 0);
              const topicLoggedHours = (topicLoggedMins / 60).toFixed(1);

              return (
                <div
                  key={topic.id}
                  onClick={() => router.push(`/study/${subjectId}/${topic.id}`)}
                  className="break-inside-avoid block w-full bg-white dark:bg-[#1C1A18] rounded-2xl p-4 sm:p-5 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs hover:border-[#161514]/30 dark:hover:border-white/30 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer select-none flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-black text-sm md:text-base text-[#161514] dark:text-[#FAF8F5] truncate font-heading leading-snug">
                      {topic.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider shadow-xs", status.bg, status.text)}>
                        {status.label}
                      </span>
                      <span className="text-[10px] font-black text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FAF8F5] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#2A2724]">
                        <Clock className="h-3 w-3 stroke-[2.5]" /> {topicLoggedHours} / {topic.estimatedHours}h
                      </span>
                      {topic.confidence > 1 && (
                        <span className="text-[9px] font-black text-amber-950 dark:text-amber-200 flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-[#FEF08A] dark:bg-amber-950/40 border border-amber-300/40 dark:border-amber-900/40">
                          <Sparkles className="h-3 w-3 stroke-[2.5]" /> {topic.confidence}/5
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 mr-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setEditingTopic(topic);
                          setEditTopicTitle(topic.title);
                          setEditEstimatedHours(topic.estimatedHours);
                        }}
                        className="bg-amber-400/20 dark:bg-amber-400/10 hover:bg-amber-400/30 text-amber-900 dark:text-amber-200 border border-amber-400/30 p-1.5 rounded-xl shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                        title="Edit topic"
                      >
                        <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" />
                      </button>
                      <button
                        onClick={() => setDeleteTopicId(topic.id)}
                        className="bg-rose-500/15 dark:bg-rose-950/30 hover:bg-rose-500/25 text-rose-700 dark:text-rose-400 border border-rose-500/30 p-1.5 rounded-xl shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                        title="Delete topic"
                      >
                        <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                    <div className="bg-[#FAF8F5] dark:bg-[#252321] p-1.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs text-[#161514] dark:text-[#FAF8F5]">
                      <ChevronRight className="h-4 w-4 stroke-[3]" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Topic Dialog Form */}
      <ResponsiveFormContainer
        open={isAddTopicOpen}
        onOpenChange={setIsAddTopicOpen}
        title="Add Study Topic"
        description="Enter the details of the chapter or study unit"
      >
        <form onSubmit={handleAddTopic} className="space-y-4">
          {/* Quick Starters (1-Tap Fill) */}
          <div className="space-y-1.5 pb-1">
            <span className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514]/60 dark:text-[#FAF8F5]/60 block">
              Quick Starters (1-Tap Fill)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {TOPIC_STARTER_PRESETS.map((p) => (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => {
                    setTopicTitle(p.title);
                    setEstimatedHours(p.hours);
                  }}
                  className="p-2.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#252321] hover:bg-white dark:hover:bg-[#1C1A18] text-left transition-all shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <span className="text-xs font-bold text-[#161514] dark:text-[#FAF8F5] block truncate">
                    {p.title}
                  </span>
                  <span className="text-[10px] text-[#161514]/60 dark:text-[#FAF8F5]/60 block mt-0.5">
                    Est. {p.hours}h ({p.badge})
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="topic-title" className="text-[10px] font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
              Topic Title *
            </label>
            <input
              id="topic-title"
              type="text"
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              placeholder="e.g. Chapter 1: Thermodynamics..."
              required
              className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FFFDF8] dark:bg-[#252321] py-2.5 px-3.5 text-base sm:text-xs font-bold text-[#161514] dark:text-[#FAF8F5] outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5] shadow-xs transition-all"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="est-hours" className="text-[10px] font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
              Estimated Hours
            </label>
            <input
              id="est-hours"
              type="number"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(Number(e.target.value))}
              min={1}
              required
              className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FFFDF8] dark:bg-[#252321] py-2.5 px-3.5 text-base sm:text-xs font-bold text-[#161514] dark:text-[#FAF8F5] outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5] shadow-xs transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={addTopicMutation.isPending}
            className="w-full bg-[#03D26F] hover:bg-[#02B75F] text-[#161514] font-black text-xs uppercase py-3 rounded-xl border border-[#03D26F] shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer tracking-wider"
          >
            {addTopicMutation.isPending ? "Adding…" : "Add Topic 🎯"}
          </button>
        </form>
      </ResponsiveFormContainer>

      {/* Edit Topic Dialog Form */}
      <ResponsiveFormContainer
        open={editingTopic !== null}
        onOpenChange={(open) => {
          if (!open) setEditingTopic(null);
        }}
        title="Edit Study Topic"
        description="Update your chapter title or estimated workload"
      >
        <form onSubmit={handleUpdateTopic} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="edit-topic-title" className="text-[10px] font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
              Topic Title
            </label>
            <input
              id="edit-topic-title"
              type="text"
              value={editTopicTitle}
              onChange={(e) => setEditTopicTitle(e.target.value)}
              placeholder="e.g. Chapter 1: Thermodynamics..."
              required
              className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FFFDF8] dark:bg-[#252321] py-2.5 px-3.5 text-base sm:text-xs font-bold text-[#161514] dark:text-[#FAF8F5] outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5] shadow-xs transition-all"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-est-hours" className="text-[10px] font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
              Estimated Hours
            </label>
            <input
              id="edit-est-hours"
              type="number"
              value={editEstimatedHours}
              onChange={(e) => setEditEstimatedHours(Number(e.target.value))}
              min={1}
              required
              className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FFFDF8] dark:bg-[#252321] py-2.5 px-3.5 text-base sm:text-xs font-bold text-[#161514] dark:text-[#FAF8F5] outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5] shadow-xs transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={updateTopicMutation.isPending}
            className="w-full bg-[#03D26F] hover:bg-[#02B75F] text-[#161514] font-black text-xs uppercase py-3 rounded-xl border border-[#03D26F] shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer tracking-wider"
          >
            {updateTopicMutation.isPending ? "Updating…" : "Save Changes 📝"}
          </button>
        </form>
      </ResponsiveFormContainer>

      {/* Delete Topic Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteTopicId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTopicId(null);
        }}
        onConfirm={async () => {
          if (deleteTopicId) {
            const topicToDelete = topics.find((t) => t.id === deleteTopicId);
            try {
              await deleteTopicMutation.mutateAsync({ topicId: deleteTopicId, subjectId });
              toast.success("Topic deleted", {
                description: topicToDelete ? `"${topicToDelete.title}" removed` : undefined,
                action: topicToDelete
                  ? {
                      label: "Undo",
                      onClick: () => {
                        addTopicMutation.mutate({
                          subjectId,
                          title: topicToDelete.title,
                          estimatedHours: topicToDelete.estimatedHours,
                          status: topicToDelete.status,
                          confidence: topicToDelete.confidence,
                          difficulty: (topicToDelete as any).difficulty,
                          notes: topicToDelete.notes,
                        } as any);
                        toast.info("Topic restored", {
                          description: `"${topicToDelete.title}" has been reinstated`,
                        });
                      },
                    }
                  : undefined,
              });
            } catch {
              toast.error("Failed to delete topic");
            }
            setDeleteTopicId(null);
          }
        }}
        title="Delete Topic"
        description="Are you sure you want to delete this topic? All topic-specific study hours logged will be lost."
      />
    </div>
  );
}

