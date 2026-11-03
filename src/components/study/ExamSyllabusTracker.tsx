"use client";

import { useState } from "react";
import { BookOpen, Sparkles, CheckCircle2, Circle, RotateCcw, Plus, Edit3, Trash2, Check, X } from "lucide-react";
import { useExamSyllabusPresets, useGenerateExamSyllabus } from "@/lib/queries/syllabus";
import { useAuth } from "@/components/shared/AuthProvider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { isTopicDueForRevision } from "@/lib/utils/spaced-repetition";

interface ExamSyllabusTrackerProps {
  subjects: any[];
  allTopics: any[];
  onAddTopic?: (subjectId: string, title: string) => void;
  onUpdateTopicStatus?: (topicId: string, status: string, revisionsCount?: number) => void;
  onEditTopic?: (topicId: string, title: string, estimatedHours?: number) => void;
  onDeleteTopic?: (topicId: string) => void;
}

export function ExamSyllabusTracker({
  subjects = [],
  allTopics = [],
  onAddTopic,
  onUpdateTopicStatus,
  onEditTopic,
  onDeleteTopic,
}: ExamSyllabusTrackerProps) {
  const { user } = useAuth();
  const { data: presetsData } = useExamSyllabusPresets();
  const generateSyllabusMutation = useGenerateExamSyllabus();

  const [selectedExamId, setSelectedExamId] = useState("gate_cs");
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  
  // Accessible inline editing state (replacing window.prompt)
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // Accessible delete modal state (replacing window.confirm)
  const [deletingTopic, setDeletingTopic] = useState<{ id: string; title: string } | null>(null);

  const presets = presetsData?.presets || [];

  const handleGenerateSyllabus = async () => {
    try {
      await generateSyllabusMutation.mutateAsync({
        userId: user?.uid || "guest",
        examId: selectedExamId,
      });
      toast.success("Exam Syllabus Auto-Generated! 🎓✨");
    } catch {
      toast.error("Failed to generate syllabus");
    }
  };

  const currentSubject = subjects.find((s) => s.id === activeSubjectId) || subjects[0];
  const currentTopics = allTopics.filter((t) => t.subjectId === currentSubject?.id);

  const completedTopicsCount = allTopics.filter((t) => t.status === "completed" || t.status === "revised").length;
  const totalTopicsCount = allTopics.length;
  const completionPercentage = totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0;

  const handleStartEdit = (topicId: string, currentTitle: string) => {
    setEditingTopicId(topicId);
    setEditingTitle(currentTitle);
  };

  const handleSaveEdit = (topicId: string) => {
    if (editingTitle.trim() && onEditTopic) {
      onEditTopic(topicId, editingTitle.trim());
      toast.success("Topic title updated ✏️");
    }
    setEditingTopicId(null);
    setEditingTitle("");
  };

  const handleCancelEdit = () => {
    setEditingTopicId(null);
    setEditingTitle("");
  };

  return (
    <div className="bg-white dark:bg-[#1C1A18] rounded-2xl p-5 md:p-6 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-5 my-4 transition-colors">
      {/* Header & 1-Click Exam Syllabus Generator */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-3 border-b border-[#E8E5DF] dark:border-[#2A2724]">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-[#C084FC] border border-[#C084FC] flex items-center justify-center text-[#161514] shadow-xs shrink-0">
            <BookOpen className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h3
              className="text-base sm:text-lg font-black text-[#161514] dark:text-[#FAF8F5] tracking-wider uppercase flex items-center gap-2 font-heading"
            >
              Syllabus Progress
            </h3>
            <p className="text-[11px] text-[#161514]/70 dark:text-[#FAF8F5]/70 font-bold mt-0.5">
              Overall progress: <strong className="text-[#03D26F] font-black">{completionPercentage}%</strong> ({completedTopicsCount}/{totalTopicsCount} topics completed)
            </p>
          </div>
        </div>

        {/* Exam Preset Selector Dropdown & Generator */}
        <div className="flex flex-wrap items-center gap-2 max-w-full">
          <div className="min-w-[200px] flex-1 sm:flex-none">
            <NeobrutalistSelect
              value={selectedExamId}
              onChange={setSelectedExamId}
              options={presets.map((p) => ({
                value: p.id,
                label: p.name,
                icon: "🎓",
              }))}
              placeholder="Select Exam Preset"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerateSyllabus}
            disabled={generateSyllabusMutation.isPending}
            className="bg-[#CEF431] hover:bg-[#bce023] text-[#161514] font-black text-xs uppercase px-3.5 py-2 rounded-xl border border-[#CEF431] shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shrink-0 transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 stroke-[2.5]" />
            {generateSyllabusMutation.isPending ? "Generating..." : "Auto-Generate"}
          </button>
        </div>
      </div>

      {/* Subject Filter Tabs */}
      {subjects.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {subjects.map((sub) => {
            const isSelected = (currentSubject?.id || subjects[0]?.id) === sub.id;
            const subTopics = allTopics.filter((t) => t.subjectId === sub.id);
            const doneCount = subTopics.filter((t) => t.status === "completed").length;

            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setActiveSubjectId(sub.id)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border shadow-xs hover:-translate-y-0.5 active:translate-y-0",
                  isSelected
                    ? "bg-[#CEF431] text-[#161514] border-[#CEF431]"
                    : "bg-white dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] border-[#E8E5DF] dark:border-[#2A2724] hover:bg-[#FFF9EA] dark:hover:bg-[#1C1A18]"
                )}
              >
                <span>{sub.icon || "📚"}</span>
                <span>{sub.name}</span>
                <span className="text-[10px] font-black bg-[#161514] dark:bg-[#FAF8F5] text-white dark:text-[#161514] px-2 py-0.5 rounded-md">
                  {doneCount}/{subTopics.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Chapter Topics Checklist & Multi-Revision Tracker */}
      {currentSubject ? (
        <div className="bg-[#FAF8F5] dark:bg-[#252321] rounded-2xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-3 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <h4 className="text-xs font-black uppercase text-[#161514] dark:text-[#FAF8F5] flex items-center gap-2 font-heading">
              <span>{currentSubject.icon || "📚"}</span> {currentSubject.name} — Syllabus Topics
            </h4>

            {/* Quick Add Custom Topic */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newTopicTitle.trim() && onAddTopic) {
                  onAddTopic(currentSubject.id, newTopicTitle.trim());
                  setNewTopicTitle("");
                }
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                placeholder="+ Add Custom Topic / Chapter..."
                className="bg-white dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] px-3 py-1.5 text-base sm:text-xs font-bold text-[#161514] dark:text-[#FAF8F5] outline-none w-48 sm:w-64 focus:border-[#161514] dark:focus:border-[#FAF8F5] shadow-xs transition-all"
              />
              <button
                type="submit"
                className="bg-[#03D26F] hover:bg-[#02b861] text-[#161514] font-black text-xs px-3 py-1.5 rounded-xl border border-[#03D26F] shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all"
                title="Add Topic"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
              </button>
            </form>
          </div>

          {/* Topic Items List */}
          {currentTopics.length === 0 ? (
            <p className="text-xs text-[#161514]/60 dark:text-[#FAF8F5]/60 font-bold italic py-4 text-center">
              No topics in this subject yet. Click &apos;✨ Auto-Generate&apos; above or add custom topics!
            </p>
          ) : (
            <div className="space-y-2 pt-1">
              {currentTopics.map((top) => {
                const isCompleted = top.status === "completed" || top.status === "revised";
                const revs = top.revisionsCount || 0;
                const isEditingThisTopic = editingTopicId === top.id;

                return (
                  <div
                    key={top.id}
                    className="bg-white dark:bg-[#1C1A18] rounded-xl p-3 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          const nextStatus = isCompleted ? "notStarted" : "completed";
                          if (onUpdateTopicStatus) onUpdateTopicStatus(top.id, nextStatus, revs);
                        }}
                        className="cursor-pointer text-[#161514] dark:text-[#FAF8F5] transition-all hover:scale-110 active:scale-95 shrink-0"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-[#03D26F] fill-[#03D26F]/20 stroke-[2.5]" />
                        ) : (
                          <Circle className="h-5 w-5 text-[#161514]/40 dark:text-[#FAF8F5]/40 stroke-[2.5]" />
                        )}
                      </button>

                      {isEditingThisTopic ? (
                        <div className="flex items-center gap-1.5 flex-1 max-w-sm">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit(top.id);
                              if (e.key === "Escape") handleCancelEdit();
                            }}
                            autoFocus
                            className="bg-[#FFFDF8] dark:bg-[#252321] rounded-lg border border-[#161514] dark:border-[#FAF8F5] px-2.5 py-1 text-base sm:text-xs font-black text-[#161514] dark:text-[#FAF8F5] outline-none flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(top.id)}
                            className="p-1 rounded-md bg-[#03D26F] text-[#161514] hover:bg-[#02B75F] cursor-pointer"
                            title="Save"
                          >
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="p-1 rounded-md bg-[#FAF8F5] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] hover:bg-[#E8E5DF] cursor-pointer"
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5 stroke-[3]" />
                          </button>
                        </div>
                      ) : (
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className={cn("text-xs font-black text-[#161514] dark:text-[#FAF8F5] truncate", isCompleted && "line-through text-[#161514]/40 dark:text-[#FAF8F5]/40")}>
                              {top.title}
                            </h5>
                            {isTopicDueForRevision(top).isDue && (
                              <span className="bg-[#CEF431] text-[#161514] text-[8px] font-black uppercase px-2 py-0.5 rounded-md border border-[#CEF431] shadow-xs shrink-0">
                                🧠 Due for Review
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] font-bold text-[#161514]/60 dark:text-[#FAF8F5]/60 block mt-0.5">
                            Estimated: {top.estimatedHours || 2} hours study
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 3-Stage Revision Checkmarks, Edit & Delete Controls */}
                    {!isEditingThisTopic && (
                      <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                        <span className="text-[9px] font-black uppercase text-[#161514]/70 dark:text-[#FAF8F5]/70">Revisions:</span>
                        {[1, 2, 3].map((rNum) => {
                          const hasDoneRev = revs >= rNum;
                          return (
                            <button
                              key={rNum}
                              type="button"
                              onClick={() => {
                                const newRev = hasDoneRev ? rNum - 1 : rNum;
                                if (onUpdateTopicStatus) onUpdateTopicStatus(top.id, top.status, newRev);
                              }}
                              className={cn(
                                "px-2 py-0.5 rounded-lg text-[9px] font-black border transition-all flex items-center gap-0.5 shadow-xs cursor-pointer hover:-translate-y-0.5 active:translate-y-0",
                                hasDoneRev
                                  ? "bg-[#CEF431] text-[#161514] border-[#CEF431]"
                                  : "bg-[#FAF8F5] dark:bg-[#252321] text-[#161514]/60 dark:text-[#FAF8F5]/60 border-[#E8E5DF] dark:border-[#2A2724] hover:bg-white dark:hover:bg-[#1C1A18]"
                              )}
                            >
                              <RotateCcw className="h-2.5 w-2.5 stroke-[2.5]" /> Rev {rNum} {hasDoneRev ? "✓" : ""}
                            </button>
                          );
                        })}

                        {onEditTopic && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(top.id, top.title)}
                            className="p-1 text-[#161514]/70 dark:text-[#FAF8F5]/70 hover:text-[#161514] dark:hover:text-[#FAF8F5] cursor-pointer transition-colors"
                            title="Edit Topic Title"
                          >
                            <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" />
                          </button>
                        )}

                        {onDeleteTopic && (
                          <button
                            type="button"
                            onClick={() => setDeletingTopic({ id: top.id, title: top.title })}
                            className="p-1 text-[#161514]/70 dark:text-[#FAF8F5]/70 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
                            title="Delete Topic"
                          >
                            <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl p-6 border border-dashed border-[#161514]/30 dark:border-[#FAF8F5]/30 text-center space-y-2">
          <p className="text-xs font-black text-[#161514] dark:text-[#FAF8F5]">No subjects loaded for study tracking!</p>
          <p className="text-[10px] text-[#161514]/70 dark:text-[#FAF8F5]/70 font-bold">
            Select your exam above and click <span className="font-black text-[#161514] dark:text-[#FAF8F5]">&apos;✨ Auto-Generate&apos;</span> to load your exam syllabus.
          </p>
        </div>
      )}

      {/* Accessible Delete Topic Confirmation Modal */}
      <DeleteConfirmationModal
        open={deletingTopic !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingTopic(null);
        }}
        onConfirm={() => {
          if (deletingTopic && onDeleteTopic) {
            onDeleteTopic(deletingTopic.id);
            toast.success(`Deleted "${deletingTopic.title}" 🗑️`);
            setDeletingTopic(null);
          }
        }}
        title="Delete Syllabus Topic"
        description={`Are you sure you want to delete "${deletingTopic?.title}" from the syllabus?`}
      />
    </div>
  );
}
