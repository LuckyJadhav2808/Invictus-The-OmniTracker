"use client";

import { useState } from "react";
import { BookOpen, Sparkles, CheckCircle2, Circle, RotateCcw, Star, Plus, ShieldCheck, Flame, Edit3, Trash2 } from "lucide-react";
import { useExamSyllabusPresets, useGenerateExamSyllabus } from "@/lib/queries/syllabus";
import { useAuth } from "@/components/shared/AuthProvider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    <div className="bg-white rounded-3xl p-5 md:p-6 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-5 my-4">
      {/* Header & 1-Click Exam Syllabus Generator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b-2 border-navy-950/10">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-lavender-400 border-2 border-navy-950 flex items-center justify-center text-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] shrink-0">
            <BookOpen className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h3
              className="text-lg font-black text-navy-950 tracking-wider uppercase flex items-center gap-2"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              EXAM SYLLABUS & REVISION TRACKER
            </h3>
            <p className="text-[11px] text-navy-700 font-bold mt-0.5">
              Syllabus Readiness: <strong className="text-emerald-700 font-black">{completionPercentage}% Completed</strong> ({completedTopicsCount}/{totalTopicsCount} topics)
            </p>
          </div>
        </div>

        {/* Exam Preset Selector Dropdown & Generator */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="bg-cream-bg rounded-xl border-2 border-navy-950 px-3 py-1.5 text-xs font-black text-navy-950 outline-none shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]"
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleGenerateSyllabus}
            disabled={generateSyllabusMutation.isPending}
            className="bg-amber-400 hover:bg-amber-500 text-navy-950 font-black text-xs uppercase px-3.5 py-1.5 rounded-xl border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer shrink-0 transition-all flex items-center justify-center gap-1"
          >
            <Sparkles className="h-3.5 w-3.5 stroke-[2.5]" />
            {generateSyllabusMutation.isPending ? "Generating..." : "✨ Auto-Generate"}
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
                  "px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5",
                  isSelected
                    ? "bg-amber-300 text-navy-950 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)]"
                    : "bg-white text-navy-950 hover:bg-cream-bg"
                )}
              >
                <span>{sub.icon || "📚"}</span>
                <span>{sub.name}</span>
                <span className="text-[10px] font-black bg-navy-950 text-white px-2 py-0.5 rounded-md">
                  {doneCount}/{subTopics.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Chapter Topics Checklist & Multi-Revision Tracker */}
      {currentSubject ? (
        <div className="bg-cream-bg/40 rounded-2xl p-4 border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-navy-950 flex items-center gap-2">
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
                className="bg-white rounded-xl border-2 border-navy-950 px-3 py-1 text-xs font-black text-navy-950 outline-none w-48 sm:w-64"
              />
              <button
                type="submit"
                className="bg-emerald-400 hover:bg-emerald-500 text-navy-950 font-black text-xs px-3 py-1 rounded-xl border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
              </button>
            </form>
          </div>

          {/* Topic Items List */}
          {currentTopics.length === 0 ? (
            <p className="text-xs text-navy-600 font-bold italic py-4 text-center">
              No topics in this subject yet. Click '✨ Auto-Generate' above or add custom topics!
            </p>
          ) : (
            <div className="space-y-2 pt-1">
              {currentTopics.map((top) => {
                const isCompleted = top.status === "completed" || top.status === "revised";
                const revs = top.revisionsCount || 0;

                return (
                  <div
                    key={top.id}
                    className="bg-white rounded-2xl p-3 border-2 border-navy-950 shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const nextStatus = isCompleted ? "notStarted" : "completed";
                          if (onUpdateTopicStatus) onUpdateTopicStatus(top.id, nextStatus, revs);
                        }}
                        className="cursor-pointer text-navy-950 transition-all hover:scale-110"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 fill-emerald-100 stroke-[2.5]" />
                        ) : (
                          <Circle className="h-5 w-5 text-navy-400 stroke-[2.5]" />
                        )}
                      </button>

                      <div>
                        <h5 className={cn("text-xs font-black text-navy-950", isCompleted && "line-through text-navy-400")}>
                          {top.title}
                        </h5>
                        <span className="text-[9px] font-bold text-navy-600 block">
                          Estimated: {top.estimatedHours || 2} hours study
                        </span>
                      </div>
                    </div>

                    {/* 3-Stage Revision Checkmarks, Edit & Delete Controls */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="text-[9px] font-black uppercase text-navy-700">Revisions:</span>
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
                              "px-2 py-0.5 rounded-lg text-[9px] font-black border border-navy-950 cursor-pointer transition-all flex items-center gap-0.5",
                              hasDoneRev
                                ? "bg-amber-300 text-navy-950 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]"
                                : "bg-cream-bg/40 text-navy-600 hover:bg-amber-100"
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
                          className="p-1 text-navy-600 hover:text-navy-950 cursor-pointer"
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
                          className="p-1 text-navy-600 hover:text-rose-600 cursor-pointer"
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
        <div className="bg-amber-50/60 rounded-2xl p-6 border-2 border-dashed border-navy-950 text-center space-y-2">
          <p className="text-xs font-black text-navy-950">No subjects loaded for study tracking!</p>
          <p className="text-[10px] text-navy-700 font-bold">
            Select your exam above and click <span className="font-black text-amber-900">'✨ Auto-Generate'</span> to load your exam syllabus.
          </p>
        </div>
      )}
    </div>
  );
}
