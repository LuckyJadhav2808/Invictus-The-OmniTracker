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
          <Link
            href={`/study/${subjectId}`}
            className="bg-white px-3.5 py-1.5 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] text-[#161514] hover:bg-[#FFF9EA] flex items-center gap-1.5 text-xs font-black uppercase tracking-wider transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 stroke-[3]" /> Syllabus
          </Link>
          <button
            onClick={() => setIsLogOpen(true)}
            className="bg-[#CEF431] hover:bg-[#b8dd24] text-[#161514] font-black text-xs uppercase py-2 px-4 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
          >
            Log Session 📝
          </button>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-5">
          <div>
            <h1 className="text-xl font-black text-[#161514] font-heading">
              {topic.title}
            </h1>
            <span className="text-[10px] font-black text-[#161514] uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#161514] inline-block mt-2">
              Subject: {subject.name}
            </span>
          </div>

          <hr className="border-[#161514]/20 border-t-2" />

          {/* Status selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">Mastery Status</label>
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
                    "py-2 px-2 rounded-xl text-xs font-black border-2 border-[#161514] transition-all cursor-pointer tracking-wider uppercase",
                    topic.status === opt.key
                      ? "bg-[#C084FC] text-[#161514] shadow-[2px_2px_0px_0px_#161514] -translate-x-0.5 -translate-y-0.5"
                      : "bg-[#FFFDF8] text-[#161514] hover:bg-[#FFF9EA]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Confidence scale pills */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black text-[#161514] uppercase tracking-wider">
              <span>Confidence Rating</span>
              <span className="text-[#EA580C] font-black px-2 py-0.5 rounded-md bg-[#FED7AA] border border-[#161514]">
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
                    "py-2 rounded-xl text-xs font-black border-2 border-[#161514] transition-all cursor-pointer",
                    (topic.confidence || 1) === level
                      ? "bg-[#03D26F] text-[#161514] shadow-[2px_2px_0px_0px_#161514] scale-105"
                      : "bg-[#FFFDF8] text-[#161514] hover:bg-[#FFF9EA]"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-[#161514]/70 font-black px-0.5 pt-0.5 uppercase tracking-wider">
              <span>1 - Needs Work</span>
              <span>5 - Mastered</span>
            </div>
          </div>
        </div>

        {/* Stopwatch Active Session Card */}
        <div className="bg-white rounded-3xl p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-4 text-center">
          <h3 className="font-black text-xs uppercase tracking-wider text-[#161514] font-heading flex items-center justify-center gap-1.5">
            <Clock className="h-4 w-4 stroke-[2.5]" /> Study Session Stopwatch
          </h3>
          <div className="text-5xl font-black text-[#161514] font-mono tracking-wider tabular-nums py-2 drop-shadow-sm">
            {formatTime(elapsedSeconds)}
          </div>

          <div className="flex justify-center gap-3">
            {!isTimerRunning ? (
              <button
                type="button"
                onClick={handleStartTimer}
                className="bg-[#03D26F] hover:bg-[#02B75F] text-[#161514] font-black text-xs uppercase py-3 px-6 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all flex items-center gap-2 tracking-wider"
              >
                <Play className="h-4 w-4 fill-[#161514]" /> Start Timer
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopTimer}
                className="bg-[#FB923C] hover:bg-[#F97316] text-[#161514] font-black text-xs uppercase py-3 px-6 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all flex items-center gap-2 tracking-wider"
              >
                <Square className="h-4 w-4 fill-[#161514]" /> Log Session
              </button>
            )}

            {elapsedSeconds > 0 && (
              <button
                type="button"
                onClick={handleResetTimer}
                className="bg-white hover:bg-[#FFF9EA] text-[#161514] font-black text-xs uppercase py-3 px-4 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all tracking-wider"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Logged study sessions history list */}
        <div className="bg-white rounded-3xl p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-4">
          <h3 className="font-black text-xs uppercase tracking-wider text-[#161514] font-heading flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 stroke-[2.5]" /> Study Log History
          </h3>

          {(() => {
            const topicSessions = sessions.filter((s) => s.topicId === topicId);

            if (sessionsLoading) {
              return <div className="h-14 animate-pulse bg-[#FAF8F5] rounded-2xl border-2 border-[#161514]" />;
            }
            if (topicSessions.length === 0) {
              return (
                <p className="text-center text-xs font-semibold text-[#161514]/70 py-4 leading-relaxed">
                  No sessions logged for this topic yet. Start the stopwatch or tap Log Session above!
                </p>
              );
            }
            return (
              <div className="space-y-3">
                {topicSessions.map((sess) => (
                  <div key={sess.id} className="bg-[#FFFDF8] rounded-2xl p-4 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-[#161514] flex items-center gap-1.5 capitalize font-heading">
                        {sess.type === "practice" ? (
                          <PenTool className="h-4 w-4 text-[#EA580C] stroke-[2.5]" />
                        ) : (
                          <BookOpen className="h-4 w-4 text-[#EA580C] stroke-[2.5]" />
                        )}
                        {sess.type || "reading"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-[#161514] px-2 py-0.5 rounded-lg bg-[#FAF8F5] border border-[#161514] flex items-center gap-1">
                          <Clock className="h-3 w-3 stroke-[2.5]" /> {sess.durationMinutes}m
                        </span>
                        <button
                          onClick={() => setDeleteSessionId(sess.id)}
                          className="bg-[#FEE2E2] hover:bg-[#FCA5A5] text-[#991B1B] p-1 rounded-xl border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                          title="Delete session log"
                        >
                          <Trash2 className="h-3 w-3 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                    {sess.notes && (
                      <p className="text-xs font-medium text-[#161514] leading-normal pl-3 border-l-2 border-[#EA580C]">
                        {sess.notes}
                      </p>
                    )}
                    <div className="text-[9px] text-[#161514]/70 font-black pl-3 flex items-center gap-1 uppercase tracking-wider">
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
            <label htmlFor="sess-duration" className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">
              Duration (minutes)
            </label>
            <input
              id="sess-duration"
              type="number"
              value={sessionDuration}
              onChange={(e) => setSessionDuration(Number(e.target.value))}
              min={1}
              required
              className="w-full rounded-xl border-2 border-[#161514] bg-[#FFFDF8] py-2.5 px-3.5 text-xs font-black text-[#161514] outline-none focus:bg-[#FFF9EA] shadow-[2px_2px_0px_0px_#161514] transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">
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
                    "py-2 px-2 rounded-xl text-xs font-black border-2 border-[#161514] transition-all cursor-pointer uppercase tracking-wider",
                    sessionType === opt.key
                      ? "bg-[#C084FC] text-[#161514] shadow-[2px_2px_0px_0px_#161514] -translate-x-0.5 -translate-y-0.5"
                      : "bg-[#FFFDF8] text-[#161514] hover:bg-[#FFF9EA]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="sess-notes" className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">
              Notes
            </label>
            <textarea
              id="sess-notes"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="What did you focus on? E.g., solved 10 integration questions..."
              rows={3}
              className="w-full rounded-xl border-2 border-[#161514] bg-[#FFFDF8] py-2.5 px-3.5 text-xs font-black text-[#161514] outline-none focus:bg-[#FFF9EA] shadow-[2px_2px_0px_0px_#161514] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={logSessionMutation.isPending}
            className="w-full bg-[#03D26F] hover:bg-[#02B75F] text-[#161514] font-black text-xs uppercase py-3 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer tracking-wider"
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

