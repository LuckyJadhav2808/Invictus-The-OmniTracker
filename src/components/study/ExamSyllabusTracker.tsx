"use client";

import { useState } from "react";
import { BookOpen, Sparkles, CheckCircle2, Circle, RotateCcw, Star, Plus, ShieldCheck, Flame, Edit3, Trash2 } from "lucide-react";
import { useExamSyllabusPresets, useGenerateExamSyllabus } from "@/lib/queries/syllabus";
import { useAuth } from "@/components/shared/AuthProvider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";

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

  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-5 my-4">
      {/* Header & 1-Click Exam Syllabus Generator */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-3 border-b-2 border-[#161514]/10">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-[#C084FC] border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514] shrink-0">
            <BookOpen className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h3
              className="text-base sm:text-lg font-black text-[#161514] tracking-wider uppercase flex items-center gap-2"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Syllabus Progress
            </h3>
            <p className="text-[11px] text-[#161514]/70 font-bold mt-0.5">
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
            className="bg-[#CEF431] hover:bg-[#bce023] text-[#161514] font-black text-xs uppercase px-3.5 py-2 rounded-xl border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer shrink-0 transition-all flex items-center justify-center gap-1.5"
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
                onClick={() => setActiveSubjectId(sub.id)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
                  isSelected
                    ? "bg-[#CEF431] text-[#161514] shadow-[3px_3px_0px_0px_#161514]"
                    : "bg-white text-[#161514] hover:bg-[#FAF8F5]"
                )}
              >
                <span>{sub.icon || "📚"}</span>
                <span>{sub.name}</span>
                <span className="text-[10px] font-black bg-[#161514] text-white px-2 py-0.5 rounded-md">
                  {doneCount}/{subTopics.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Chapter Topics Checklist & Multi-Revision Tracker */}
      {currentSubject ? (
        <div className="bg-[#FAF8F5] rounded-2xl p-4 border-2 border-[#161514] shadow-[2.5px_2.5px_0px_0px_#161514] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <h4 className="text-xs font-black uppercase text-[#161514] flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
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
                className="bg-white rounded-xl border-2 border-[#161514] px-3 py-1.5 text-xs font-bold text-[#161514] outline-none w-48 sm:w-64 focus:bg-[#FFF9EA] shadow-[1.5px_1.5px_0px_0px_#161514]"
              />
              <button
                type="submit"
                className="bg-[#03D26F] hover:bg-[#02b861] text-[#161514] font-black text-xs px-3 py-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer transition-all"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
              </button>
            </form>
          </div>

          {/* Topic Items List */}
          {currentTopics.length === 0 ? (
            <p className="text-xs text-[#161514]/60 font-bold italic py-4 text-center">
              No topics in this subject yet. Click &apos;✨ Auto-Generate&apos; above or add custom topics!
            </p>
          ) : (
            <div className="space-y-2 pt-1">
              {currentTopics.map((top) => {
                const isCompleted = top.status === "completed" || top.status === "revised";
                const revs = top.revisionsCount || 0;

                return (
                  <div
                    key={top.id}
                    className="bg-white rounded-xl p-3 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const nextStatus = isCompleted ? "notStarted" : "completed";
                          if (onUpdateTopicStatus) onUpdateTopicStatus(top.id, nextStatus, revs);
                        }}
                        className="cursor-pointer text-[#161514] transition-all hover:scale-110 active:scale-95"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-[#03D26F] fill-[#03D26F]/20 stroke-[2.5]" />
                        ) : (
                          <Circle className="h-5 w-5 text-[#161514]/40 stroke-[2.5]" />
                        )}
                      </button>

                      <div>
                        <h5 className={cn("text-xs font-black text-[#161514]", isCompleted && "line-through text-[#161514]/40")}>
                          {top.title}
                        </h5>
                        <span className="text-[9px] font-bold text-[#161514]/60 block">
                          Estimated: {top.estimatedHours || 2} hours study
                        </span>
                      </div>
                    </div>

                    {/* 3-Stage Revision Checkmarks, Edit & Delete Controls */}
                    <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                      <span className="text-[9px] font-black uppercase text-[#161514]/70">Revisions:</span>
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
                              "px-2 py-0.5 rounded-lg text-[9px] font-black border-2 border-[#161514] cursor-pointer transition-all flex items-center gap-0.5 shadow-[1.5px_1.5px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
                              hasDoneRev
                                ? "bg-[#CEF431] text-[#161514]"
                                : "bg-[#FAF8F5] text-[#161514]/60 hover:bg-white"
                            )}
                          >
                            <RotateCcw className="h-2.5 w-2.5 stroke-[2.5]" /> Rev {rNum} {hasDoneRev ? "✓" : ""}
                          </button>
                        );
                      })}

                      {onEditTopic && (
                        <button
                          type="button"
                          onClick={() => {
                            const newTitle = prompt("Edit Topic Title:", top.title);
                            if (newTitle && newTitle.trim()) {
                              onEditTopic(top.id, newTitle.trim());
                            }
                          }}
                          className="p-1 text-[#161514]/70 hover:text-[#161514] cursor-pointer"
                          title="Edit Topic Title"
                        >
                          <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" />
                        </button>
                      )}

                      {onDeleteTopic && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete topic "${top.title}"?`)) {
                              onDeleteTopic(top.id);
                            }
                          }}
                          className="p-1 text-[#161514]/70 hover:text-rose-600 cursor-pointer"
                          title="Delete Topic"
                        >
                          <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-amber-50/60 rounded-2xl p-6 border-2 border-dashed border-[#161514]/40 text-center space-y-2">
          <p className="text-xs font-black text-[#161514]">No subjects loaded for study tracking!</p>
          <p className="text-[10px] text-[#161514]/70 font-bold">
            Select your exam above and click <span className="font-black text-[#161514]">&apos;✨ Auto-Generate&apos;</span> to load your exam syllabus.
          </p>
        </div>
      )}
    </div>
  );
}
