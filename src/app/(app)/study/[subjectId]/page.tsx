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

  const { data: subjects = [] } = useSubjects();
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

  if (!subject) {
    return (
      <div className="min-h-screen bg-cream-bg flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-navy-600 font-bold">Subject not found</p>
          <Link href="/study">
            <Button className="rounded-full bg-navy-900 text-white">Back to Study</Button>
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
        status: "not_started",
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
  // Status mapping
  const statusLabels: Record<string, { label: string; bg: string; text: string }> = {
    notStarted: { label: "Not Started", bg: "bg-navy-900/5", text: "text-navy-600" },
    inProgress: { label: "In Progress", bg: "bg-amber-500/10", text: "text-amber-600" },
    completed: { label: "Completed", bg: "bg-mint-600/10", text: "text-mint-600" },
    needsRevision: { label: "Needs Revision", bg: "bg-coral-400/20", text: "text-coral-500" },
  };

  return (
    <div className="min-h-screen bg-cream-bg p-4 md:p-8 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/study" className="text-navy-600 hover:text-navy-900 flex items-center gap-1.5 text-sm font-bold">
            <ArrowLeft className="h-4 w-4" /> Subjects
          </Link>
          <Button
            onClick={() => setIsAddTopicOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full py-2 px-4 shadow-sm flex items-center gap-1.5 cursor-pointer border-none"
          >
            <Plus className="h-4 w-4 stroke-[3]" /> Add Topic
          </Button>
        </div>

        {/* Title details */}
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-navy-900" style={{ fontFamily: "var(--font-heading)" }}>
            {subject.name}
          </h1>
          <p className="text-navy-600 text-sm">
            Manage your topics and check progress
          </p>
        </div>

        {/* Topics syllabus */}
        {topicsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-[var(--radius-lg)] p-4 h-16 animate-pulse" />
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
                  className="break-inside-avoid block w-full bg-white border border-border rounded-[var(--radius-lg)] p-4 flex items-center justify-between shadow-[0_8px_24px_rgba(31,36,48,0.02)] hover:shadow-[0_8px_24px_rgba(31,36,48,0.06)] hover:scale-[1.002] active:scale-[0.998] transition-all cursor-pointer select-none"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-bold text-sm text-navy-900 truncate leading-snug">
                      {topic.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider", status.bg, status.text)}>
                        {status.label}
                      </span>
                      <span className="text-[10px] font-semibold text-navy-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {topicLoggedHours} / {topic.estimatedHours}h
                      </span>
                      {topic.confidence > 1 && (
                        <span className="text-[9px] font-bold text-amber-600 flex items-center gap-0.5">
                          <Sparkles className="h-3 w-3" /> Confidence: {topic.confidence}/5
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
                        className="text-navy-600 hover:text-navy-900 p-1 cursor-pointer transition-colors outline-none border-none bg-transparent"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTopicId(topic.id)}
                        className="text-red-500 hover:text-red-600 p-1 cursor-pointer transition-colors outline-none border-none bg-transparent"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <ChevronRight className="h-4 w-4 text-navy-600" />
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
          <div className="space-y-1">
            <label htmlFor="topic-title" className="text-xs font-bold uppercase tracking-wider text-navy-600">
              Topic Title
            </label>
            <input
              id="topic-title"
              type="text"
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              placeholder="e.g. Chapter 1: Thermodynamics..."
              required
              className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none text-navy-900"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="est-hours" className="text-xs font-bold uppercase tracking-wider text-navy-600">
              Estimated Hours
            </label>
            <input
              id="est-hours"
              type="number"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(Number(e.target.value))}
              min={1}
              required
              className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none text-navy-900"
            />
          </div>

          <Button
            type="submit"
            disabled={addTopicMutation.isPending}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full py-2.5 shadow-sm border-none cursor-pointer"
          >
            {addTopicMutation.isPending ? "Adding…" : "Add Topic"}
          </Button>
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
            <label htmlFor="edit-topic-title" className="text-xs font-bold uppercase tracking-wider text-navy-600">
              Topic Title
            </label>
            <input
              id="edit-topic-title"
              type="text"
              value={editTopicTitle}
              onChange={(e) => setEditTopicTitle(e.target.value)}
              placeholder="e.g. Chapter 1: Thermodynamics..."
              required
              className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none text-navy-900"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-est-hours" className="text-xs font-bold uppercase tracking-wider text-navy-600">
              Estimated Hours
            </label>
            <input
              id="edit-est-hours"
              type="number"
              value={editEstimatedHours}
              onChange={(e) => setEditEstimatedHours(Number(e.target.value))}
              min={1}
              required
              className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none text-navy-900"
            />
          </div>

          <Button
            type="submit"
            disabled={updateTopicMutation.isPending}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full py-2.5 shadow-sm border-none cursor-pointer"
          >
            {updateTopicMutation.isPending ? "Updating…" : "Save Changes"}
          </Button>
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
            try {
              await deleteTopicMutation.mutateAsync({ topicId: deleteTopicId, subjectId });
              toast.success("Topic deleted");
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
