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
      <div className="min-h-screen bg-cream-bg flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-navy-600 font-bold">Topic not found</p>
          <Link href={`/study/${subjectId}`}>
            <Button className="rounded-full bg-navy-900 text-white">Back to Subject</Button>
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
      toast.success("Study session logged! Good job! 📝");
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
    <div className="min-h-screen bg-cream-bg p-4 md:p-8 space-y-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href={`/study/${subjectId}`} className="text-navy-600 hover:text-navy-900 flex items-center gap-1.5 text-sm font-bold">
            <ArrowLeft className="h-4 w-4" /> Syllabus
          </Link>
          <Button
            onClick={() => setIsLogOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full py-1.5 px-3.5 shadow-sm text-xs border-none cursor-pointer"
          >
            Log Session
          </Button>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-[var(--radius-lg)] p-6 shadow-[0_8px_24px_rgba(31,36,48,0.06)] space-y-6">
          <div>
            <h1 className="text-lg font-extrabold text-navy-900" style={{ fontFamily: "var(--font-heading)" }}>
              {topic.title}
            </h1>
            <p className="text-xs text-navy-600 mt-1 uppercase tracking-wider font-semibold">
              Subject: {subject.name}
            </p>
          </div>

          <hr className="border-border" />

          {/* Status selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-navy-600 uppercase tracking-wider">Status</label>
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
                    "py-2 rounded-[var(--radius-sm)] text-[11px] font-bold border transition-all cursor-pointer",
                    topic.status === opt.key
                      ? "bg-navy-900 border-navy-900 text-white"
                      : "bg-cream-bg/30 border-input text-navy-600 hover:bg-cream-bg/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Confidence scale pills */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-navy-600 uppercase tracking-wider">
              <span>Confidence Rating</span>
              <span className="text-orange-500 font-extrabold">{topic.confidence || 1} / 5</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleConfidenceChange(level)}
                  className={cn(
                    "py-2 rounded-[var(--radius-sm)] text-xs font-extrabold border transition-all cursor-pointer",
                    (topic.confidence || 1) === level
                      ? "bg-orange-500 border-orange-500 text-white shadow-sm scale-105"
                      : "bg-cream-bg/40 border-input text-navy-600 hover:bg-cream-bg/70"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-navy-600 font-semibold px-0.5 pt-0.5">
              <span>1 - Needs Work</span>
              <span>5 - Mastered</span>
            </div>
          </div>
        </div>

        {/* Stopwatch Active Session Card */}
        <div className="bg-white rounded-[var(--radius-lg)] p-6 shadow-[0_8px_24px_rgba(31,36,48,0.06)] space-y-4 text-center">
          <h3 className="font-bold text-xs uppercase tracking-wider text-navy-600" style={{ fontFamily: "var(--font-heading)" }}>
            Study Session Stopwatch
          </h3>
          <div className="text-4xl font-extrabold text-navy-900 font-mono tracking-wider tabular-nums py-2">
            {formatTime(elapsedSeconds)}
          </div>

          <div className="flex justify-center gap-3">
            {!isTimerRunning ? (
              <Button
                onClick={handleStartTimer}
                className="bg-mint-600 hover:bg-mint-700 text-white font-bold rounded-full py-2 px-5 flex items-center gap-1.5 cursor-pointer border-none shadow-sm"
              >
                <Play className="h-4 w-4 fill-white" /> Start Timer
              </Button>
            ) : (
              <Button
                onClick={handleStopTimer}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full py-2 px-5 flex items-center gap-1.5 cursor-pointer border-none shadow-sm"
              >
                <Square className="h-4 w-4 fill-white" /> Log Session
              </Button>
            )}

            {elapsedSeconds > 0 && (
              <Button
                onClick={handleResetTimer}
                className="rounded-full border border-navy-900/20 hover:bg-navy-900/5 text-navy-900 font-bold px-4 py-2 text-xs bg-white cursor-pointer"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Logged study sessions history list */}
        <div className="bg-white rounded-[var(--radius-lg)] p-6 shadow-[0_8px_24px_rgba(31,36,48,0.06)] space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-navy-600" style={{ fontFamily: "var(--font-heading)" }}>
            Study Log History
          </h3>

          {(() => {
            const topicSessions = sessions.filter((s) => s.topicId === topicId);

            if (sessionsLoading) {
              return <div className="h-12 animate-pulse bg-cream-bg/20 rounded-[var(--radius-sm)]" />;
            }
            if (topicSessions.length === 0) {
              return (
                <p className="text-center text-xs text-navy-600 py-4 leading-relaxed">
                  No sessions logged for this topic yet. Start the stopwatch or tap Log Session above!
                </p>
              );
            }
            return (
              <div className="space-y-3">
                {topicSessions.map((sess) => (
                  <div key={sess.id} className="border-b pb-3 last:border-none last:pb-0 space-y-1.5">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-navy-900 flex items-center gap-1 capitalize">
                        {sess.type === "practice" ? (
                          <PenTool className="h-3.5 w-3.5 text-orange-500" />
                        ) : (
                          <BookOpen className="h-3.5 w-3.5 text-orange-500" />
                        )}
                        {sess.type || "reading"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-navy-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {sess.durationMinutes}m
                        </span>
                        <button
                          onClick={() => setDeleteSessionId(sess.id)}
                          className="text-red-500 hover:text-red-600 p-0.5 cursor-pointer transition-colors outline-none border-none bg-transparent"
                          title="Delete session log"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    {sess.notes && (
                      <p className="text-xs text-navy-600 leading-normal pl-4.5 border-l-2 border-orange-500/30">
                        {sess.notes}
                      </p>
                    )}
                    <div className="text-[9px] text-navy-600/70 font-semibold pl-4.5 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {sess.date}
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
            <label htmlFor="sess-duration" className="text-xs font-bold uppercase tracking-wider text-navy-600">
              Duration (minutes)
            </label>
            <input
              id="sess-duration"
              type="number"
              value={sessionDuration}
              onChange={(e) => setSessionDuration(Number(e.target.value))}
              min={1}
              required
              className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none text-navy-900 focus:ring-2 focus:ring-orange-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-navy-600">
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
                    "py-2 rounded-[var(--radius-sm)] text-[10px] font-bold border transition-all cursor-pointer",
                    sessionType === opt.key
                      ? "bg-navy-900 border-navy-900 text-white"
                      : "bg-cream-bg/30 border-input text-navy-600 hover:bg-cream-bg/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="sess-notes" className="text-xs font-bold uppercase tracking-wider text-navy-600">
              Notes
            </label>
            <textarea
              id="sess-notes"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="What did you focus on? E.g., solved 10 integration questions..."
              rows={3}
              className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none text-navy-900 placeholder:text-navy-600/40 focus:ring-2 focus:ring-orange-500 transition-all"
            />
          </div>

          <Button
            type="submit"
            disabled={logSessionMutation.isPending}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full py-2.5 shadow-sm border-none cursor-pointer"
          >
            {logSessionMutation.isPending ? "Logging…" : "Save Session"}
          </Button>
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
            try {
              await deleteSessionMutation.mutateAsync({ sessionId: deleteSessionId, subjectId });
              toast.success("Study session deleted 🗑️");
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
