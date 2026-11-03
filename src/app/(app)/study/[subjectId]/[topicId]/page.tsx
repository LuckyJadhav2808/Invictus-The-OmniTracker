"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSubjects, useTopics, useUpdateTopic, useAddStudySession, useStudySessions, useDeleteStudySession } from "@/lib/queries/study";
import { Button } from "@/components/ui/button";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { ArrowLeft, Play, Square, Clock, Calendar, BookOpen, PenTool, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TopicDetailPage({
  params,
}: {
  params: Promise<{ subjectId: string; topicId: string }>;
}) {
  const { subjectId, topicId } = use(params);
  const router = useRouter();

  const [isLogOpen, setIsLogOpen] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  // Timer/Stopwatch State
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Form State
  const [sessionDuration, setSessionDuration] = useState(30);
  const [sessionType, setSessionType] = useState<"reading" | "practice" | "revision" | "mockTest">("reading");
  const [sessionNotes, setSessionNotes] = useState("");

  const { data: subjects = [] } = useSubjects();
  const { data: topics = [] } = useTopics(subjectId);
  const { data: sessions = [], isLoading: sessionsLoading } = useStudySessions(subjectId);

  const updateTopicMutation = useUpdateTopic();
  const logSessionMutation = useAddStudySession();
  const deleteSessionMutation = useDeleteStudySession();

  const subject = subjects.find((s) => s.id === subjectId);
  const topic = topics.find((t) => t.id === topicId);

  // Stopwatch recovery on mount
  useEffect(() => {
    const start = localStorage.getItem("invictus_stopwatch_start");
    const tid = localStorage.getItem("invictus_stopwatch_topic_id");
    if (start && tid === topicId) {
      const elapsed = Math.floor((new Date().getTime() - new Date(start).getTime()) / 1000);
      setElapsedSeconds(elapsed);
      setIsTimerRunning(true);
    }
  }, [topicId]);

  // Stopwatch Interval Hook
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        const start = localStorage.getItem("invictus_stopwatch_start");
        if (start) {
          const elapsed = Math.floor((new Date().getTime() - new Date(start).getTime()) / 1000);
          setElapsedSeconds(elapsed);
        } else {
          setElapsedSeconds((s) => s + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  if (!subject || !topic) {
    return (
      <div className="min-h-screen bg-cream-bg dark:bg-[#161514] flex items-center justify-center p-4 transition-colors">
        <div className="text-center space-y-4">
          <p className="text-[#161514] dark:text-[#FAF8F5] font-bold text-sm">Topic not found</p>
          <Link href={`/study/${subjectId}`}>
            <Button className="rounded-xl border border-[#161514]/20 bg-[#CEF431] text-[#161514] font-black shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer">
              Back to Subject
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Format stopwatch string
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, "0") : null,
      String(mins).padStart(2, "0"),
      String(secs).padStart(2, "0"),
    ]
      .filter(Boolean)
      .join(":");
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    localStorage.setItem("invictus_stopwatch_start", new Date().toISOString());
    localStorage.setItem("invictus_stopwatch_subject_id", subjectId);
    localStorage.setItem("invictus_stopwatch_topic_id", topicId);
    localStorage.setItem("invictus_stopwatch_topic_title", topic.title);
  };

  const handleStopTimer = () => {
    setIsTimerRunning(false);
    localStorage.removeItem("invictus_stopwatch_start");
    localStorage.removeItem("invictus_stopwatch_subject_id");
    localStorage.removeItem("invictus_stopwatch_topic_id");
    localStorage.removeItem("invictus_stopwatch_topic_title");
    const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
    setSessionDuration(minutes);
    setIsLogOpen(true);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setElapsedSeconds(0);
    localStorage.removeItem("invictus_stopwatch_start");
    localStorage.removeItem("invictus_stopwatch_subject_id");
    localStorage.removeItem("invictus_stopwatch_topic_id");
    localStorage.removeItem("invictus_stopwatch_topic_title");
  };

  const handleLogSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await logSessionMutation.mutateAsync({
        subjectId,
        topicId,
        durationMinutes: Number(sessionDuration),
        type: sessionType,
        date: new Date().toISOString().split("T")[0],
        notes: sessionNotes,
      });
      toast.success("Study session logged! 📝");
      setIsLogOpen(false);
      setSessionNotes("");
      setElapsedSeconds(0);
    } catch {
      toast.error("Failed to log study session");
    }
  };

  const handleConfidenceChange = async (val: number) => {
    try {
      await updateTopicMutation.mutateAsync({
        id: topicId,
        subjectId,
        confidence: val,
      });
      toast.success(`Confidence updated to ${val}/5!`);
    } catch {
      toast.error("Failed to update confidence");
    }
  };

  const handleStatusChange = async (status: any) => {
    try {
      await updateTopicMutation.mutateAsync({
        id: topicId,
        subjectId,
        status,
      });
      toast.success(`Status updated to ${status}!`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="min-h-screen bg-cream-bg dark:bg-[#161514] p-4 md:p-8 space-y-6 transition-colors">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href={`/study/${subjectId}`}
            className="bg-white dark:bg-[#1C1A18] px-3.5 py-1.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs text-[#161514] dark:text-[#FAF8F5] hover:bg-[#FFF9EA] dark:hover:bg-[#252321] flex items-center gap-1.5 text-xs font-black uppercase tracking-wider transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 stroke-[3]" /> Syllabus
          </Link>
          <button
            onClick={() => setIsLogOpen(true)}
            className="bg-[#CEF431] hover:bg-[#b8dd24] text-[#161514] font-black text-xs uppercase py-2 px-4 rounded-xl border border-[#161514]/20 shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            Log Session 📝
          </button>
        </div>

        {/* Content Card */}
        <div className="bg-white dark:bg-[#1C1A18] rounded-2xl p-5 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-5 transition-colors">
          <div>
            <h1 className="text-xl font-black text-[#161514] dark:text-[#FAF8F5] font-heading">
              {topic.title}
            </h1>
            <span className="text-[10px] font-black text-[#161514] dark:text-[#FAF8F5] uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FAF8F5] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#2A2724] inline-block mt-2">
              Subject: {subject.name}
            </span>
          </div>

          <hr className="border-[#E8E5DF] dark:border-[#2A2724]" />

          {/* Status selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">Mastery Status</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "notStarted", label: "Not Started" },
                { key: "inProgress", label: "In Progress" },
                { key: "completed", label: "Completed" },
                { key: "needsRevision", label: "Needs Rev." },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleStatusChange(opt.key)}
                  type="button"
                  className={cn(
                    "py-2 px-2 rounded-xl text-xs font-black border transition-all cursor-pointer tracking-wider uppercase",
                    topic.status === opt.key
                      ? "bg-[#C084FC] text-[#161514] border-[#C084FC] shadow-xs"
                      : "bg-[#FFFDF8] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] border-[#E8E5DF] dark:border-[#2A2724] hover:bg-[#FFF9EA] dark:hover:bg-[#1C1A18]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Confidence scale pills */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black text-[#161514] dark:text-[#FAF8F5] uppercase tracking-wider">
              <span>Confidence Rating</span>
              <span className="text-orange-950 dark:text-orange-200 font-black px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/40 border border-orange-300/40 dark:border-orange-900/40">
                {topic.confidence || 1} / 5
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleConfidenceChange(level)}
                  className={cn(
                    "py-2 rounded-xl text-xs font-black border transition-all cursor-pointer",
                    (topic.confidence || 1) === level
                      ? "bg-[#03D26F] text-[#161514] border-[#03D26F] shadow-xs scale-105"
                      : "bg-[#FFFDF8] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] border-[#E8E5DF] dark:border-[#2A2724] hover:bg-[#FFF9EA] dark:hover:bg-[#1C1A18]"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-[#161514]/70 dark:text-[#FAF8F5]/70 font-bold px-0.5 pt-0.5 uppercase tracking-wider">
              <span>1 - Needs Work</span>
              <span>5 - Mastered</span>
            </div>
          </div>
        </div>

        {/* Stopwatch Active Session Card */}
        <div className="bg-white dark:bg-[#1C1A18] rounded-2xl p-6 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-4 text-center transition-colors">
          <h3 className="font-black text-xs uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] font-heading flex items-center justify-center gap-1.5">
            <Clock className="h-4 w-4 stroke-[2.5]" /> Study Session Stopwatch
          </h3>
          <div className="text-5xl font-black text-[#161514] dark:text-[#FAF8F5] font-mono tracking-wider tabular-nums py-2">
            {formatTime(elapsedSeconds)}
          </div>

          <div className="flex justify-center gap-3">
            {!isTimerRunning ? (
              <button
                type="button"
                onClick={handleStartTimer}
                className="bg-[#03D26F] hover:bg-[#02B75F] text-[#161514] font-black text-xs uppercase py-2.5 px-5 rounded-xl border border-[#03D26F] shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all flex items-center gap-2 tracking-wider"
              >
                <Play className="h-3.5 w-3.5 fill-[#161514]" /> Start Timer
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopTimer}
                className="bg-[#FB923C] hover:bg-[#F97316] text-[#161514] font-black text-xs uppercase py-2.5 px-5 rounded-xl border border-[#FB923C] shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all flex items-center gap-2 tracking-wider"
              >
                <Square className="h-3.5 w-3.5 fill-[#161514]" /> Log Session
              </button>
            )}

            {elapsedSeconds > 0 && (
              <button
                type="button"
                onClick={handleResetTimer}
                className="bg-white dark:bg-[#252321] hover:bg-[#FFF9EA] dark:hover:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] font-black text-xs uppercase py-2.5 px-4 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all tracking-wider"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Logged study sessions history list */}
        <div className="bg-white dark:bg-[#1C1A18] rounded-2xl p-5 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-4 transition-colors">
          <h3 className="font-black text-xs uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] font-heading flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 stroke-[2.5]" /> Study Log History
          </h3>

          {(() => {
            const topicSessions = sessions.filter((s) => s.topicId === topicId);

            if (sessionsLoading) {
              return <div className="h-14 animate-pulse bg-[#FAF8F5] dark:bg-[#252321] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724]" />;
            }
            if (topicSessions.length === 0) {
              return (
                <p className="text-center text-xs font-semibold text-[#161514]/70 dark:text-[#FAF8F5]/70 py-4 leading-relaxed">
                  No sessions logged for this topic yet. Start the stopwatch or tap Log Session above!
                </p>
              );
            }
            return (
              <div className="space-y-3">
                {topicSessions.map((sess) => (
                  <div key={sess.id} className="bg-[#FFFDF8] dark:bg-[#252321] rounded-xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-2 transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5 capitalize font-heading">
                        {sess.type === "practice" ? (
                          <PenTool className="h-4 w-4 text-[#EA580C] dark:text-[#FB923C] stroke-[2.5]" />
                        ) : (
                          <BookOpen className="h-4 w-4 text-[#EA580C] dark:text-[#FB923C] stroke-[2.5]" />
                        )}
                        {sess.type || "reading"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-[#161514] dark:text-[#FAF8F5] px-2 py-0.5 rounded-lg bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] flex items-center gap-1">
                          <Clock className="h-3 w-3 stroke-[2.5]" /> {sess.durationMinutes}m
                        </span>
                        <button
                          type="button"
                          onClick={() => setDeleteSessionId(sess.id)}
                          className="bg-[#FEE2E2]/60 dark:bg-[#7F1D1D]/30 hover:bg-[#FEE2E2] dark:hover:bg-[#7F1D1D]/50 text-[#DC2626] dark:text-[#F87171] p-1.5 rounded-lg border border-[#FCA5A5] dark:border-[#7F1D1D] shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                          title="Delete session log"
                        >
                          <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                    {sess.notes && (
                      <p className="text-xs font-medium text-[#161514] dark:text-[#FAF8F5] leading-normal pl-3 border-l-2 border-[#EA580C] dark:border-[#FB923C]">
                        {sess.notes}
                      </p>
                    )}
                    <div className="text-[9px] text-[#161514]/70 dark:text-[#FAF8F5]/70 font-black pl-3 flex items-center gap-1 uppercase tracking-wider">
                      <Calendar className="h-3 w-3 stroke-[2.5]" /> {sess.date}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Log Session Dialog Form */}
      <ResponsiveFormContainer
        open={isLogOpen}
        onOpenChange={setIsLogOpen}
        title="Log Study Session"
        description="Save your study duration and topics covered"
      >
        <form onSubmit={handleLogSessionSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="sess-duration" className="text-[10px] font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
              Duration (minutes)
            </label>
            <input
              id="sess-duration"
              type="number"
              value={sessionDuration}
              onChange={(e) => setSessionDuration(Number(e.target.value))}
              min={1}
              required
              className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FFFDF8] dark:bg-[#252321] py-2.5 px-3.5 text-base sm:text-xs font-black text-[#161514] dark:text-[#FAF8F5] outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5] shadow-xs transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
              Activity Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "reading", label: "Reading / Lecture" },
                { key: "practice", label: "Practice Problems" },
                { key: "revision", label: "Revision" },
                { key: "mockTest", label: "Mock Test" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSessionType(opt.key as any)}
                  className={cn(
                    "py-2 px-2 rounded-xl text-xs font-black border transition-all cursor-pointer uppercase tracking-wider",
                    sessionType === opt.key
                      ? "bg-[#C084FC] text-[#161514] border-[#C084FC] shadow-xs scale-[1.02]"
                      : "bg-[#FFFDF8] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] border-[#E8E5DF] dark:border-[#2A2724] hover:bg-[#FFF9EA] dark:hover:bg-[#1C1A18]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="sess-notes" className="text-[10px] font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
              Notes
            </label>
            <textarea
              id="sess-notes"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="What did you focus on? E.g., solved 10 integration questions..."
              rows={3}
              className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FFFDF8] dark:bg-[#252321] py-2.5 px-3.5 text-base sm:text-xs font-medium text-[#161514] dark:text-[#FAF8F5] outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5] shadow-xs transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={logSessionMutation.isPending}
            className="w-full bg-[#03D26F] hover:bg-[#02B75F] text-[#161514] font-black text-xs uppercase py-3 rounded-xl border border-[#03D26F] shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer tracking-wider"
          >
            {logSessionMutation.isPending ? "Logging…" : "Save Session 📚"}
          </button>
        </form>
      </ResponsiveFormContainer>

      {/* Delete Study Session Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteSessionId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteSessionId(null);
        }}
        onConfirm={async () => {
          if (deleteSessionId) {
            const sessionToDelete = sessions.find((s) => s.id === deleteSessionId);
            try {
              await deleteSessionMutation.mutateAsync({ sessionId: deleteSessionId, subjectId });
              toast.success("Study session deleted 🗑️", {
                action: sessionToDelete
                  ? {
                      label: "Undo",
                      onClick: () => {
                        logSessionMutation.mutate({
                          subjectId,
                          topicId,
                          date: sessionToDelete.date || new Date().toISOString().split("T")[0],
                          durationMinutes: sessionToDelete.durationMinutes,
                          type: sessionToDelete.type,
                          notes: sessionToDelete.notes,
                        });
                        toast.info("Study session restored ↩️");
                      },
                    }
                  : undefined,
              });
            } catch {
              toast.error("Failed to delete study session");
            }
            setDeleteSessionId(null);
          }
        }}
        title="Delete Study Session"
        description="Are you sure you want to delete this study session log? This cannot be undone."
      />
    </div>
  );
}

