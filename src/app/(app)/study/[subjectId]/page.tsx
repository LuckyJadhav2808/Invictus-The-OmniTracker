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
    notStarted: { label: "Not Started", bg: "bg-[#F3F4F6] border-2 border-[#161514]", text: "text-[#161514]" },
    inProgress: { label: "In Progress", bg: "bg-[#FEF08A] border-2 border-[#161514]", text: "text-[#161514]" },
    completed: { label: "Completed", bg: "bg-[#A7F3D0] border-2 border-[#161514]", text: "text-[#161514]" },
    needsRevision: { label: "Needs Rev.", bg: "bg-[#FED7AA] border-2 border-[#161514]", text: "text-[#161514]" },
  };

  return (
    <div className="min-h-screen bg-cream-bg p-4 md:p-8 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/study"
            className="bg-white px-3.5 py-1.5 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] text-[#161514] hover:bg-[#FFF9EA] flex items-center gap-1.5 text-xs font-black uppercase tracking-wider transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 stroke-[3]" /> Subjects
          </Link>
          <button
            onClick={() => setIsAddTopicOpen(true)}
            className="bg-[#CEF431] hover:bg-[#b8dd24] text-[#161514] font-black text-xs uppercase py-2 px-4 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" /> Add Topic
          </button>
        </div>

        {/* Title details */}
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-[#161514] font-heading tracking-tight">
            {subject.name}
          </h1>
          <p className="text-xs font-bold text-[#161514]/70 uppercase tracking-wider">
            Manage your topics, track mastery, and log revisions
          </p>
        </div>

        {/* Topics syllabus */}
        {topicsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-5 h-20 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] animate-pulse" />
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
                  className="break-inside-avoid block w-full bg-white rounded-3xl p-5 border-[2.5px] border-[#161514] shadow-[3.5px_3.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer select-none flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-black text-sm md:text-base text-[#161514] truncate font-heading leading-snug">
                      {topic.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider shadow-[1px_1px_0px_0px_#161514]", status.bg, status.text)}>
                        {status.label}
                      </span>
                      <span className="text-[10px] font-black text-[#161514] flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FAF8F5] border border-[#161514]">
                        <Clock className="h-3 w-3 stroke-[2.5]" /> {topicLoggedHours} / {topic.estimatedHours}h
                      </span>
                      {topic.confidence > 1 && (
                        <span className="text-[9px] font-black text-[#161514] flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-[#FEF08A] border border-[#161514]">
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
                        className="bg-[#FFFDF8] hover:bg-[#FFF9EA] text-[#161514] p-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                        title="Edit topic"
                      >
                        <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" />
                      </button>
                      <button
                        onClick={() => setDeleteTopicId(topic.id)}
                        className="bg-[#FEE2E2] hover:bg-[#FCA5A5] text-[#991B1B] p-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                        title="Delete topic"
                      >
                        <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                    <div className="bg-[#FAF8F5] p-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]">
                      <ChevronRight className="h-4 w-4 text-[#161514] stroke-[3]" />
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
          <div className="space-y-1">
            <label htmlFor="topic-title" className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">
              Topic Title
            </label>
            <input
              id="topic-title"
              type="text"
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              placeholder="e.g. Chapter 1: Thermodynamics..."
              required
              className="w-full rounded-xl border-2 border-[#161514] bg-[#FFFDF8] py-2.5 px-3.5 text-xs font-black text-[#161514] outline-none focus:bg-[#FFF9EA] shadow-[2px_2px_0px_0px_#161514] transition-all"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="est-hours" className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">
              Estimated Hours
            </label>
            <input
              id="est-hours"
              type="number"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(Number(e.target.value))}
              min={1}
              required
              className="w-full rounded-xl border-2 border-[#161514] bg-[#FFFDF8] py-2.5 px-3.5 text-xs font-black text-[#161514] outline-none focus:bg-[#FFF9EA] shadow-[2px_2px_0px_0px_#161514] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={addTopicMutation.isPending}
            className="w-full bg-[#03D26F] hover:bg-[#02B75F] text-[#161514] font-black text-xs uppercase py-3 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer tracking-wider"
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
            <label htmlFor="edit-topic-title" className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">
              Topic Title
            </label>
            <input
              id="edit-topic-title"
              type="text"
              value={editTopicTitle}
              onChange={(e) => setEditTopicTitle(e.target.value)}
              placeholder="e.g. Chapter 1: Thermodynamics..."
              required
              className="w-full rounded-xl border-2 border-[#161514] bg-[#FFFDF8] py-2.5 px-3.5 text-xs font-black text-[#161514] outline-none focus:bg-[#FFF9EA] shadow-[2px_2px_0px_0px_#161514] transition-all"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-est-hours" className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">
              Estimated Hours
            </label>
            <input
              id="edit-est-hours"
              type="number"
              value={editEstimatedHours}
              onChange={(e) => setEditEstimatedHours(Number(e.target.value))}
              min={1}
              required
              className="w-full rounded-xl border-2 border-[#161514] bg-[#FFFDF8] py-2.5 px-3.5 text-xs font-black text-[#161514] outline-none focus:bg-[#FFF9EA] shadow-[2px_2px_0px_0px_#161514] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={updateTopicMutation.isPending}
            className="w-full bg-[#03D26F] hover:bg-[#02B75F] text-[#161514] font-black text-xs uppercase py-3 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer tracking-wider"
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

