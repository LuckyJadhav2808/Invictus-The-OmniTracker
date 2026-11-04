"use client";

import { useState, useEffect, Suspense } from "react";
import {
  useSubjects,
  useAddSubject,
  useUpdateSubject,
  useDeleteSubject,
  useTests,
  useAddTest,
  useUpdateTest,
  useDeleteTest,
  useStudySessions,
  useAllTopics,
  useAddTopic,
  useUpdateTopic,
  useDeleteTopic,
  useAddStudySession,
} from "@/lib/queries/study";
import { ExamSyllabusTracker } from "@/components/study/ExamSyllabusTracker";
import { StudySessionLogger } from "@/components/study/StudySessionLogger";
import { PomodoroTimerWidget } from "@/components/study/PomodoroTimerWidget";
import { calculateSM2Review } from "@/lib/utils/spaced-repetition";
import { EmptyState } from "@/components/shared/EmptyState";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { StudyCockpitSkeleton, SubjectsGridSkeleton } from "@/components/shared/NeobrutalistSkeleton";
import { TemplateSelectionModal, TemplatePack } from "@/components/shared/TemplateSelectionModal";
import { SUBJECT_TEMPLATE_PACKS, MOCK_TEST_TEMPLATE_PACKS } from "@/lib/templates-data";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { VixPixelCompanion } from "@/components/mascot/VixPixelCompanion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressRing } from "@/components/shared/ProgressRing";
import {
  BookOpen,
  Plus,
  Calendar as CalendarIcon,
  Trophy,
  Award,
  BarChart2,
  AlertCircle,
  FileText,
  ChevronRight,
  Clock,
  Sparkles,
  Edit3,
  Trash2,
} from "lucide-react";
import { format, differenceInCalendarDays, parseISO, getDay, subWeeks, eachDayOfInterval } from "date-fns";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/shared/AuthProvider";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, LineChart, Line } from "recharts";
import { ProactiveReminderBanner } from "@/components/shared/ProactiveReminderBanner";

const SUBJECT_STARTER_PRESETS = [
  {
    name: "Data Structures & Algorithms",
    color: "indigo",
    badge: "CS Core",
    desc: "Trees, Graphs, DP & Sorting",
  },
  {
    name: "System Design & Networks",
    color: "orange",
    badge: "Architecture",
    desc: "TCP/IP, Caching & Scaling",
  },
  {
    name: "Engineering Mathematics",
    color: "mint",
    badge: "Calculus",
    desc: "Linear Algebra & Probability",
  },
  {
    name: "Fullstack Web Engineering",
    color: "lavender",
    badge: "Web Dev",
    desc: "Next.js, REST APIs & Databases",
  },
];

const TEST_STARTER_PRESETS = [
  {
    name: "Full Length Mock Exam (3 Hours)",
    score: 72,
    totalScore: 100,
    badge: "Full Test",
  },
  {
    name: "Midterm Review Sprint",
    score: 42,
    totalScore: 50,
    badge: "Midterm",
  },
  {
    name: "Topic Speed Quiz",
    score: 18,
    totalScore: 20,
    badge: "Quick Quiz",
  },
];

function StudyPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "subjects");
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isSubjectChoiceOpen, setIsSubjectChoiceOpen] = useState(false);
  const [isAddTestOpen, setIsAddTestOpen] = useState(false);
  const [isTestChoiceOpen, setIsTestChoiceOpen] = useState(false);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (val === "subjects") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", val);
      }
      window.history.replaceState(null, "", url.pathname + url.search);
    }
  };

  // Subject Form States
  const [subjectName, setSubjectName] = useState("");
  const [subjectColor, setSubjectColor] = useState("orange");

  // Test Form States
  const [testName, setTestName] = useState("");
  const [testDate, setTestDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [testScore, setTestScore] = useState(0);
  const [testTotalScore, setTestTotalScore] = useState(100);

  // User Target Settings for Countdown
  const [studyTarget, setStudyTarget] = useState<{ examName: string; examDate: string } | null>(null);

  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { data: tests = [] } = useTests();
  const { data: sessions = [] } = useStudySessions();
  const { data: allTopics = [] } = useAllTopics();

  const addSubjectMutation = useAddSubject();
  const updateSubjectMutation = useUpdateSubject();
  const deleteSubjectMutation = useDeleteSubject();
  const addTestMutation = useAddTest();
  const updateTestMutation = useUpdateTest();
  const deleteTestMutation = useDeleteTest();
  const addTopicMutation = useAddTopic();
  const updateTopicMutation = useUpdateTopic();
  const deleteTopicMutation = useDeleteTopic();
  const logSessionMutation = useAddStudySession();

  const handleApplySubjectPack = (pack: TemplatePack) => {
    pack.items.forEach((item) => {
      addSubjectMutation.mutate({
        name: item.title,
        color: "indigo",
        icon: "BookOpen",
      });
    });
    toast.success(`Applied ${pack.name} syllabus!`);
  };

  const handleApplyTestPack = (pack: TemplatePack) => {
    pack.items.forEach((item) => {
      addTestMutation.mutate({
        name: item.title,
        date: format(new Date(), "yyyy-MM-dd"),
        score: 0,
        totalScore: item.target || 100,
        scope: ["General"],
        weakAreas: [],
      });
    });
    toast.success(`Applied ${pack.name} mock test!`);
  };

  // Test Edit & Delete states
  const [editingTest, setEditingTest] = useState<any | null>(null);
  const [editTestName, setEditTestName] = useState("");
  const [editTestDate, setEditTestDate] = useState("");
  const [editTestScore, setEditTestScore] = useState(0);
  const [editTestTotalScore, setEditTestTotalScore] = useState(100);
  const [deleteTestId, setDeleteTestId] = useState<string | null>(null);

  // Subject Edit & Delete states
  const [editingSubject, setEditingSubject] = useState<any | null>(null);
  const [editSubjectName, setEditSubjectName] = useState("");
  const [editSubjectColor, setEditSubjectColor] = useState("orange");
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null);

  // Load local user profile target info if Guest Mode is active
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const isGuestMode = localStorage.getItem("invictus_guest_mode") === "true";
      if (isGuestMode) {
        const profileStr = localStorage.getItem("invictus_user_profile");
        if (profileStr) {
          const profile = JSON.parse(profileStr);
          if (profile.studyTarget) {
            setStudyTarget(profile.studyTarget);
          }
        }
      } else if (user.studyTarget) {
        setStudyTarget(user.studyTarget);
      }
    };
    loadProfile();
  }, [user]);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;
    try {
      await addSubjectMutation.mutateAsync({
        name: subjectName,
        color: subjectColor,
        icon: "BookOpen",
      });
      toast.success("Subject added successfully!");
      setSubjectName("");
      setIsAddSubjectOpen(false);
    } catch {
      toast.error("Failed to add subject");
    }
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !editSubjectName.trim()) return;
    try {
      await updateSubjectMutation.mutateAsync({
        id: editingSubject.id,
        name: editSubjectName,
        color: editSubjectColor,
      });
      toast.success("Subject updated successfully!");
      setEditingSubject(null);
    } catch {
      toast.error("Failed to update subject");
    }
  };

  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim() || testTotalScore <= 0) return;
    try {
      await addTestMutation.mutateAsync({
        name: testName,
        date: testDate,
        score: Number(testScore),
        totalScore: Number(testTotalScore),
        scope: [],
        weakAreas: [],
      });
      toast.success("Mock test logged!");
      setTestName("");
      setIsAddTestOpen(false);
    } catch {
      toast.error("Failed to log test");
    }
  };

  const handleUpdateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTest || !editTestName.trim() || editTestTotalScore <= 0) return;
    try {
      await updateTestMutation.mutateAsync({
        id: editingTest.id,
        name: editTestName,
        date: editTestDate,
        score: Number(editTestScore),
        totalScore: Number(editTestTotalScore),
      });
      toast.success("Mock test updated successfully!");
      setEditingTest(null);
    } catch {
      toast.error("Failed to update test");
    }
  };

  // Color mapping utility (Calibrated palettes with dark mode tokens)
  const colorMap: Record<string, { bg: string; text: string; ring: string; badge: string }> = {
    amber: { bg: "bg-[#FDE047] dark:bg-amber-500/20", text: "text-[#161514] dark:text-amber-200", ring: "stroke-[#EAB308]", badge: "bg-[#FEF08A] dark:bg-amber-950/40" },
    orange: { bg: "bg-[#FB923C] dark:bg-orange-500/20", text: "text-[#161514] dark:text-orange-200", ring: "stroke-[#F97316]", badge: "bg-[#FED7AA] dark:bg-orange-950/40" },
    mint: { bg: "bg-[#03D26F] dark:bg-emerald-500/20", text: "text-[#161514] dark:text-emerald-200", ring: "stroke-[#059669]", badge: "bg-[#A7F3D0] dark:bg-emerald-950/40" },
    lavender: { bg: "bg-[#C084FC] dark:bg-purple-500/20", text: "text-[#161514] dark:text-purple-200", ring: "stroke-[#9333EA]", badge: "bg-[#E9D5FF] dark:bg-purple-950/40" },
    coral: { bg: "bg-[#F472B6] dark:bg-rose-500/20", text: "text-[#161514] dark:text-rose-200", ring: "stroke-[#E11D48]", badge: "bg-[#FBCFE8] dark:bg-rose-950/40" },
    indigo: { bg: "bg-[#818CF8] dark:bg-indigo-500/20", text: "text-[#161514] dark:text-indigo-200", ring: "stroke-[#4F46E5]", badge: "bg-[#C7D2FE] dark:bg-indigo-950/40" },
  };

  // Compute total logged study hours (from sessions)
  const totalLoggedMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalLoggedHours = (totalLoggedMinutes / 60).toFixed(1);

  // Compute Countdown Days
  const countdownDays = () => {
    if (!studyTarget?.examDate) return null;
    const targetDate = studyTarget.examDate.includes("T")
      ? parseISO(studyTarget.examDate)
      : new Date(`${studyTarget.examDate}T00:00:00`);
    const diff = differenceInCalendarDays(targetDate, new Date());
    return diff >= 0 ? diff : 0;
  };

  const daysLeft = countdownDays();

  // Real study hours per day of week from sessions
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const barChartData = (() => {
    const dayCounts: Record<number, { totalHours: number; totalDays: number }> = {};
    for (let i = 0; i < 7; i++) dayCounts[i] = { totalHours: 0, totalDays: 0 };
    const fourWeekStart = subWeeks(new Date(), 4);
    const windowDays = eachDayOfInterval({ start: fourWeekStart, end: new Date() });
    for (const day of windowDays) {
      dayCounts[getDay(day)].totalDays++;
    }
    for (const session of sessions) {
      if (!session.date) continue;
      const dow = getDay(new Date(session.date));
      dayCounts[dow].totalHours += session.durationMinutes / 60;
    }
    return dayNames.map((name, i) => {
      const { totalHours, totalDays } = dayCounts[i];
      const hours = totalDays > 0 ? Math.round((totalHours / totalDays) * 10) / 10 : 0;
      return { name, hours };
    });
  })();

  // Real mastery rate from topics
  const masteryRate = allTopics.length > 0
    ? Math.round((allTopics.filter((t) => t.status === "completed").length / allTopics.length) * 100)
    : 0;

  // Real revision due count
  const revisionDueCount = allTopics.filter((t) => t.status === "needsRevision").length;

  // Test Trend Data
  const testTrendData = tests
    .map((t) => ({
      name: t.name,
      percentage: Math.round((t.score / t.totalScore) * 100),
    }))
    .reverse();

  // Test Telemetry
  const avgTestScore = tests.length > 0
    ? Math.round(tests.reduce((acc, t) => acc + (t.score / (t.totalScore || 100)) * 100, 0) / tests.length)
    : 0;
  const bestTestScore = tests.length > 0
    ? Math.max(...tests.map((t) => Math.round((t.score / (t.totalScore || 100)) * 100)))
    : 0;

  return (
    <div className="min-h-screen bg-cream-bg p-4 md:p-8 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Clean Modern Study Header Card */}
        <div className="bg-white dark:bg-[#1C1A18] rounded-2xl p-5 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-heading font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-[#161514]/20 bg-[#C084FC] text-[#161514] shadow-xs flex items-center gap-1">
                <BookOpen className="size-3 stroke-[2.5]" />
                <span>Study & Academics</span>
              </span>
              {studyTarget?.examName && (
                <span className="text-[10px] font-heading font-black text-[#161514]/70 dark:text-[#FAF8F5]/70">
                  Target: {studyTarget.examName} ({daysLeft !== null ? `${daysLeft}d left` : "Scheduled"})
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-heading font-black text-[#161514] dark:text-[#FAF8F5] tracking-tight">
              Study & Revision
            </h1>
            <p className="text-xs font-medium text-[#161514]/70 dark:text-[#FAF8F5]/70 max-w-lg">
              Track subjects, syllabus mastery, focus sessions, and mock test scores.
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="px-3 py-2 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#252321] shadow-xs text-center min-w-[65px] transition-colors">
              <span className="text-[9px] font-heading font-black uppercase text-[#161514]/60 dark:text-[#FAF8F5]/60 block leading-tight">Subjects</span>
              <span className="text-sm font-heading font-black text-[#161514] dark:text-[#FAF8F5]">{subjects.length}</span>
            </div>
            <div className="px-3 py-2 rounded-xl border border-purple-500/20 dark:border-purple-900/30 bg-purple-500/10 dark:bg-purple-950/20 shadow-xs text-center min-w-[65px] transition-colors">
              <span className="text-[9px] font-heading font-black uppercase text-purple-700 dark:text-purple-300 block leading-tight">Hours</span>
              <span className="text-sm font-heading font-black text-[#161514] dark:text-[#FAF8F5] flex items-center justify-center gap-1">
                <Clock className="size-3 text-purple-700 dark:text-purple-400" />
                {totalLoggedHours}h
              </span>
            </div>
            <div className="px-3 py-2 rounded-xl border border-emerald-500/20 dark:border-emerald-900/30 bg-emerald-500/10 dark:bg-emerald-950/20 shadow-xs text-center min-w-[65px] transition-colors">
              <span className="text-[9px] font-heading font-black uppercase text-emerald-800 dark:text-emerald-300 block leading-tight">Mastery</span>
              <span className="text-sm font-heading font-black text-emerald-900 dark:text-emerald-300 flex items-center justify-center gap-1">
                <Trophy className="size-3 text-emerald-700 dark:text-emerald-400" />
                {masteryRate}%
              </span>
            </div>
            <Button
              onClick={() => setIsSubjectChoiceOpen(true)}
              className="bg-[#CEF431] hover:bg-[#D8F74E] text-[#161514] font-heading font-black text-xs px-3.5 py-2.5 h-auto rounded-xl border border-[#161514]/20 shadow-xs flex items-center gap-1.5 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <Plus className="size-4 stroke-[3]" />
              <span>New Subject</span>
            </Button>

            {/* Interactive Scholar Vix Companion */}
            <VixPixelCompanion
              gear="study"
              state="focus"
              size={42}
              onClick={() => setIsSubjectChoiceOpen(true)}
              title="Vix: Scholar Companion (Click for New Subject)"
            />
          </div>
        </div>

        {/* Proactive Reminder Banner */}
        <ProactiveReminderBanner space="study" />

        {/* Tab Controls */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="w-full overflow-x-auto no-scrollbar pb-1 mb-5">
            <TabsList className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-2xl p-1.5 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center gap-1.5 w-max min-w-full sm:min-w-0 sm:w-auto transition-colors">
              <TabsTrigger
                value="subjects"
                className="rounded-xl text-xs font-heading font-extrabold py-2 px-3.5 border border-transparent data-[state=active]:border-[#161514]/20 dark:data-[state=active]:border-white/20 data-[state=active]:bg-[#C084FC] data-[state=active]:text-[#161514] data-[state=active]:shadow-xs text-[#161514]/70 dark:text-[#FAF8F5]/70 hover:text-[#161514] dark:hover:text-[#FAF8F5] hover:bg-white/50 dark:hover:bg-white/5 transition-all flex items-center gap-1.5 shrink-0"
              >
                <BookOpen className="size-3.5 stroke-[2.2]" />
                <span>Subjects & Syllabus</span>
              </TabsTrigger>
              <TabsTrigger
                value="sessions"
                className="rounded-xl text-xs font-heading font-extrabold py-2 px-3.5 border border-transparent data-[state=active]:border-[#161514]/20 dark:data-[state=active]:border-white/20 data-[state=active]:bg-[#C084FC] data-[state=active]:text-[#161514] data-[state=active]:shadow-xs text-[#161514]/70 dark:text-[#FAF8F5]/70 hover:text-[#161514] dark:hover:text-[#FAF8F5] hover:bg-white/50 dark:hover:bg-white/5 transition-all flex items-center gap-1.5 shrink-0"
              >
                <Clock className="size-3.5 stroke-[2.2]" />
                <span>Study Sessions</span>
              </TabsTrigger>
              <TabsTrigger
                value="tests"
                className="rounded-xl text-xs font-heading font-extrabold py-2 px-3.5 border border-transparent data-[state=active]:border-[#161514]/20 dark:data-[state=active]:border-white/20 data-[state=active]:bg-[#C084FC] data-[state=active]:text-[#161514] data-[state=active]:shadow-xs text-[#161514]/70 dark:text-[#FAF8F5]/70 hover:text-[#161514] dark:hover:text-[#FAF8F5] hover:bg-white/50 dark:hover:bg-white/5 transition-all flex items-center gap-1.5 shrink-0"
              >
                <BarChart2 className="size-3.5 stroke-[2.2]" />
                <span>Mock Tests & Analytics</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Subjects & Syllabus */}
          <TabsContent value="subjects" className="space-y-6 outline-none">
            {/* Exam Countdown Banner (if configured) */}
            {studyTarget && daysLeft !== null && (
              <div className="bg-white dark:bg-[#1C1A18] rounded-2xl p-4 md:p-5 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-[#FED7AA] dark:bg-amber-950/40 border border-[#161514]/20 dark:border-amber-900/40 flex items-center justify-center text-[#161514] dark:text-amber-200 shadow-xs shrink-0">
                    <Trophy className="size-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-heading font-black text-[#161514] dark:text-[#FAF8F5] uppercase tracking-wide">
                      {studyTarget.examName} Countdown
                    </h4>
                    <p className="text-xs font-medium text-[#161514]/70 dark:text-[#FAF8F5]/70">
                      Stay consistent with daily study and revision sessions.
                    </p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 shrink-0">
                  <span className="text-3xl font-heading font-black text-[#EA580C] dark:text-orange-400">{daysLeft}</span>
                  <span className="text-[10px] font-heading font-black uppercase text-[#161514] px-2 py-0.5 rounded-lg bg-[#FED7AA] dark:bg-amber-950/40 border border-[#161514]/20 dark:border-amber-900/40">
                    Days Left
                  </span>
                </div>
              </div>
            )}

            {/* Subjects List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5">
                  <BookOpen className="size-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Subjects</span>
                  <span className="bg-[#CEF431] text-[#161514] text-[10px] px-2 py-0.5 rounded-full border border-[#161514]/20 font-black shadow-xs">
                    {subjects.length}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSubjectChoiceOpen(true)}
                  className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] bg-[#CEF431] border border-[#161514]/20 px-2.5 py-1 rounded-xl shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                >
                  + Add Subject
                </button>
              </div>

              {subjectsLoading ? (
                <SubjectsGridSkeleton count={2} />
              ) : subjects.length === 0 ? (
                <EmptyState
                  title="Start your learning path"
                  description="Break down your studies into organized subjects (e.g. Mathematics, Science, Literature) to track topic mastery."
                  Icon={BookOpen}
                  ctaText="Create a Subject"
                  onCtaClick={() => setIsSubjectChoiceOpen(true)}
                  iconBgClass="bg-orange-500/15"
                  iconColorClass="text-orange-500"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {subjects.map((sub) => {
                    const colors = colorMap[sub.color] || colorMap.orange;
                    const subTopics = allTopics.filter((t) => t.subjectId === sub.id);
                    const subCompleted = subTopics.filter((t) => t.status === "completed").length;
                    const subPercentage = subTopics.length > 0 ? Math.round((subCompleted / subTopics.length) * 100) : 0;

                    return (
                      <div
                        key={sub.id}
                        onClick={() => router.push(`/study/${sub.id}`)}
                        className="w-full bg-white dark:bg-[#1C1A18] rounded-2xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs hover:border-[#161514]/30 dark:hover:border-white/30 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer select-none flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn("size-10 rounded-xl border border-black/10 dark:border-white/10 shadow-xs flex items-center justify-center shrink-0", colors.bg, colors.text)}>
                            <BookOpen className="size-5 stroke-[2.2]" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-heading font-black text-sm text-[#161514] dark:text-[#FAF8F5] truncate">{sub.name}</h4>
                            <span className="text-[10px] font-bold text-[#161514]/70 dark:text-[#FAF8F5]/70 uppercase tracking-wider block mt-0.5">
                              {subTopics.length} topic{subTopics.length !== 1 ? "s" : ""} • {subPercentage}% mastered
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setEditingSubject(sub);
                                setEditSubjectName(sub.name);
                                setEditSubjectColor(sub.color);
                              }}
                              className="bg-amber-400/20 dark:bg-amber-400/10 hover:bg-amber-400/30 text-amber-900 dark:text-amber-200 border border-amber-400/30 p-1.5 rounded-lg shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                              title="Edit Subject"
                            >
                              <Edit3 className="size-3.5 stroke-[2.2]" />
                            </button>
                            <button
                              onClick={() => setDeleteSubjectId(sub.id)}
                              className="bg-rose-500/15 dark:bg-rose-950/30 hover:bg-rose-500/25 text-rose-700 dark:text-rose-400 border border-rose-500/30 p-1.5 rounded-lg shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                              title="Archive Subject"
                            >
                              <Trash2 className="size-3.5 stroke-[2.2]" />
                            </button>
                          </div>

                          <ProgressRing
                            percentage={subPercentage}
                            size={32}
                            strokeWidth={3}
                            colorClass={colors.ring}
                          />
                          <div className="bg-[#FAF8F5] dark:bg-[#252321] p-1 rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs text-[#161514] dark:text-[#FAF8F5]">
                            <ChevronRight className="size-3.5 stroke-[3]" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Exam Syllabus Tracker */}
            <div className="pt-2">
              <ExamSyllabusTracker
                subjects={subjects}
                allTopics={allTopics}
                onAddTopic={(subjectId, title) => {
                  addTopicMutation.mutate({
                    subjectId,
                    title,
                    status: "notStarted",
                    confidence: 1,
                    estimatedHours: 2,
                  } as any);
                  toast.success("Topic added to syllabus!");
                }}
                onUpdateTopicStatus={(topicId, status, revisionsCount) => {
                  const existingTopic = (allTopics || []).find((t: any) => t.id === topicId);
                  const isAdvancing = revisionsCount !== undefined && revisionsCount > (existingTopic?.revisionsCount || 0);
                  const sm2 = calculateSM2Review(existingTopic, isAdvancing ? 5 : 3);

                  updateTopicMutation.mutate({
                    id: topicId,
                    status: status as any,
                    revisionsCount,
                    easinessFactor: sm2.easinessFactor,
                    intervalDays: sm2.intervalDays,
                    nextRevisionDate: sm2.nextRevisionDate,
                    lastRevisedAt: new Date().toISOString(),
                  } as any);
                }}
                onEditTopic={(topicId, title) => {
                  updateTopicMutation.mutate({
                    id: topicId,
                    title,
                  } as any);
                  toast.success("Topic title updated!");
                }}
                onDeleteTopic={(topicId) => {
                  deleteTopicMutation.mutate(topicId);
                  toast.success("Topic removed");
                }}
              />
            </div>
          </TabsContent>

          {/* Tab 2: Study Sessions */}
          <TabsContent value="sessions" className="space-y-6 outline-none">
            {/* Live Dynamic Island-Synced Pomodoro Focus Widget */}
            <PomodoroTimerWidget subjects={subjects} />

            <StudySessionLogger
              topics={allTopics}
              onLogSession={(data) => {
                logSessionMutation.mutate({
                  durationMinutes: data.durationMinutes,
                  topicId: data.topicId || "",
                  notes: data.notes,
                } as any);
              }}
            />
          </TabsContent>

          {/* Tab 3: Mock Tests & Analytics */}
          <TabsContent value="tests" className="space-y-6 outline-none">
            {/* Test Performance Telemetry Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="bg-white dark:bg-[#1C1A18] rounded-2xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center gap-3.5 transition-colors">
                <div className="size-11 rounded-xl bg-[#FED7AA] dark:bg-amber-950/40 border border-[#161514]/20 dark:border-amber-900/40 shadow-xs flex items-center justify-center text-[#161514] dark:text-amber-200 shrink-0">
                  <FileText className="size-5 stroke-[2.2]" />
                </div>
                <div>
                  <h5 className="text-[10px] font-heading font-black text-[#161514]/70 dark:text-[#FAF8F5]/70 uppercase tracking-wider">Mocks Taken</h5>
                  <p className="text-xl font-heading font-black text-[#161514] dark:text-[#FAF8F5] mt-0.5">{tests.length}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1C1A18] rounded-2xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center gap-3.5 transition-colors">
                <div className="size-11 rounded-xl bg-[#CEF431] dark:bg-lime-950/40 border border-[#161514]/20 dark:border-lime-900/40 shadow-xs flex items-center justify-center text-[#161514] dark:text-lime-200 shrink-0">
                  <Award className="size-5 stroke-[2.2]" />
                </div>
                <div>
                  <h5 className="text-[10px] font-heading font-black text-[#161514]/70 dark:text-[#FAF8F5]/70 uppercase tracking-wider">Average Score</h5>
                  <p className="text-xl font-heading font-black text-[#161514] dark:text-[#FAF8F5] mt-0.5">{avgTestScore}%</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1C1A18] rounded-2xl p-4 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center gap-3.5 transition-colors">
                <div className="size-11 rounded-xl bg-[#A7F3D0] dark:bg-emerald-950/40 border border-[#161514]/20 dark:border-emerald-900/40 shadow-xs flex items-center justify-center text-[#161514] dark:text-emerald-200 shrink-0">
                  <Trophy className="size-5 stroke-[2.2]" />
                </div>
                <div>
                  <h5 className="text-[10px] font-heading font-black text-[#161514]/70 dark:text-[#FAF8F5]/70 uppercase tracking-wider">Personal Best</h5>
                  <p className="text-xl font-heading font-black text-[#161514] dark:text-[#FAF8F5] mt-0.5">{bestTestScore}%</p>
                </div>
              </div>
            </div>

            {/* Daily study hours trend chart */}
            <div className="bg-white dark:bg-[#1C1A18] rounded-2xl p-5 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-3 transition-colors">
              <h3 className="font-heading font-black text-xs text-[#161514] dark:text-[#FAF8F5] uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="size-4 stroke-[2.5]" /> Daily Study Hours Trend
              </h3>
              {sessions.length === 0 ? (
                <EmptyState
                  title="No study sessions logged yet"
                  description="Start the stopwatch or log a study session in any topic to see your weekly study trend analytics."
                  Icon={Clock}
                  ctaText="Go to Subjects"
                  onCtaClick={() => setActiveTab("subjects")}
                  iconBgClass="bg-orange-500/15"
                  iconColorClass="text-orange-500"
                />
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={11} fontWeight={700} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={11} fontWeight={700} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
                      <Tooltip formatter={(v) => [`${v}h`, "Logged study hours"]} contentStyle={{ borderRadius: "12px", border: "1px solid #E8E5DF", backgroundColor: "#1C1A18", color: "#FAF8F5", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "12px" }} />
                      <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                        {barChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.hours >= 3.0 ? "#03D26F" : entry.hours >= 1.5 ? "#FACC15" : "#FB923C"} stroke="rgba(0,0,0,0.1)" strokeWidth={1} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Mock Tests Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-black text-xs uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-2">
                  <FileText className="size-4 stroke-[2.2]" /> Exam Mock Scores
                </h3>
                <button
                  type="button"
                  onClick={() => setIsTestChoiceOpen(true)}
                  className="bg-[#CEF431] hover:bg-[#b8dd24] text-[#161514] font-heading font-black text-xs uppercase py-1.5 px-3 rounded-xl border border-[#161514]/20 shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Plus className="size-3.5 stroke-[3]" /> Log Test
                </button>
              </div>

              {tests.length === 0 ? (
                <EmptyState
                  title="Track your readiness"
                  description="Keep track of mock exam sheets or test results to gauge syllabus readiness."
                  Icon={FileText}
                  ctaText="Log Mock Test"
                  onCtaClick={() => setIsTestChoiceOpen(true)}
                  iconBgClass="bg-mint-600/10"
                  iconColorClass="text-mint-600"
                />
              ) : (
                <div className="space-y-4">
                  {/* Scores line chart */}
                  <div className="bg-white dark:bg-[#1C1A18] rounded-2xl p-5 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs h-56 w-full transition-colors">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={testTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={11} fontWeight={700} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={11} fontWeight={700} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                        <Tooltip formatter={(v) => [`${v}%`, "Test score"]} contentStyle={{ borderRadius: "12px", border: "1px solid #E8E5DF", backgroundColor: "#1C1A18", color: "#FAF8F5", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "12px" }} />
                        <Line type="monotone" dataKey="percentage" stroke="#C084FC" strokeWidth={3} activeDot={{ r: 5, stroke: "#161514", strokeWidth: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* List of tests */}
                  <div className="space-y-2.5">
                    {tests.map((test) => {
                      const scorePercentage = test.totalScore > 0 ? Math.round((test.score / test.totalScore) * 100) : 0;
                      return (
                        <div
                          key={test.id}
                          className="bg-white dark:bg-[#1C1A18] rounded-xl p-3.5 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center justify-between hover:border-[#161514]/30 dark:hover:border-white/30 transition-all"
                        >
                          <div>
                            <h4 className="font-heading font-black text-xs text-[#161514] dark:text-[#FAF8F5]">{test.name}</h4>
                            <p className="text-[10px] font-bold text-[#161514]/70 dark:text-[#FAF8F5]/70 uppercase tracking-wider mt-0.5">{test.date}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <span className="text-sm font-heading font-black text-[#161514] dark:text-[#FAF8F5]">{test.score}/{test.totalScore}</span>
                              <p className="text-[9px] font-heading font-black text-emerald-950 dark:text-emerald-200 px-1.5 py-0.5 rounded-md border border-emerald-500/30 bg-emerald-500/20 uppercase tracking-wider mt-0.5">{scorePercentage}% Score</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingTest(test);
                                  setEditTestName(test.name);
                                  setEditTestDate(test.date);
                                  setEditTestScore(test.score);
                                  setEditTestTotalScore(test.totalScore);
                                }}
                                className="bg-amber-400/20 dark:bg-amber-400/10 hover:bg-amber-400/30 text-amber-900 dark:text-amber-200 border border-amber-400/30 p-1.5 rounded-lg shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                                title="Edit test score"
                              >
                                <Edit3 className="size-3.5 stroke-[2.2]" />
                              </button>
                              <button
                                onClick={() => setDeleteTestId(test.id)}
                                className="bg-rose-500/15 dark:bg-rose-950/30 hover:bg-rose-500/25 text-rose-700 dark:text-rose-400 border border-rose-500/30 p-1.5 rounded-lg shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                                title="Delete test log"
                              >
                                <Trash2 className="size-3.5 stroke-[2.2]" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Subject Choice Modal */}
      <TemplateSelectionModal
        open={isSubjectChoiceOpen}
        onOpenChange={setIsSubjectChoiceOpen}
        title="ADD SUBJECT"
        subtitle="START FROM SCRATCH OR APPLY A READY-MADE SYLLABUS."
        blankLabel="BLANK SUBJECT"
        blankDesc="CUSTOM NAME & COLOR THEME"
        templatesLabel="SYLLABUS PACKS"
        templatesDesc="COMPUTER SCIENCE, STEM & ENGINEERING, COMPETITIVE..."
        templatePacks={SUBJECT_TEMPLATE_PACKS}
        onSelectBlank={() => setIsAddSubjectOpen(true)}
        onApplyTemplatePack={handleApplySubjectPack}
      />

      {/* Add Mock Test Choice Modal */}
      <TemplateSelectionModal
        open={isTestChoiceOpen}
        onOpenChange={setIsTestChoiceOpen}
        title="ADD MOCK TEST"
        subtitle="START FROM SCRATCH OR APPLY A TEST TEMPLATE."
        blankLabel="BLANK MOCK TEST"
        blankDesc="CUSTOM TEST TITLE, DATE & TOTAL SCORE"
        templatesLabel="TEST PACKS"
        templatesDesc="FULL LENGTH EXAM (3HRS), CHAPTER SPRINT..."
        templatePacks={MOCK_TEST_TEMPLATE_PACKS}
        onSelectBlank={() => setIsAddTestOpen(true)}
        onApplyTemplatePack={handleApplyTestPack}
      />

      {/* Add Subject Dialog Form */}
      <ResponsiveFormContainer
        open={isAddSubjectOpen}
        onOpenChange={setIsAddSubjectOpen}
        title="Add Subject"
        description="Name your subject and choose a theme color"
      >
        <form onSubmit={handleAddSubject} className="space-y-4">
          {/* Quick Starters (1-Tap Fill) */}
          <div className="space-y-1.5 pb-1">
            <span className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514]/60 dark:text-[#FAF8F5]/60 block">
              Quick Starters (1-Tap Fill)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUBJECT_STARTER_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setSubjectName(p.name);
                    setSubjectColor(p.color);
                  }}
                  className="p-2.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#252321] hover:bg-white dark:hover:bg-[#1C1A18] text-left transition-all group shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-[#161514] dark:text-[#FAF8F5] truncate block">
                      {p.name}
                    </span>
                    <span className="text-[9px] font-bold text-[#161514]/60 dark:text-[#FAF8F5]/60 shrink-0">
                      {p.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#161514]/60 dark:text-[#FAF8F5]/60 truncate block mt-0.5">
                    {p.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="subj-name" className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
              Subject Name *
            </label>
            <input
              id="subj-name"
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. Physics, Chemistry, Japanese N3..."
              required
              className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FFFDF8] dark:bg-[#252321] py-2.5 px-3.5 text-base sm:text-xs font-bold text-[#161514] dark:text-[#FAF8F5] outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5] shadow-xs transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
              Theme Color
            </label>
            <div className="flex gap-2.5 flex-wrap">
              {["orange", "amber", "mint", "lavender", "coral", "indigo"].map((c) => {
                const isSelected = subjectColor === c;
                const bgClass =
                  c === "amber"
                    ? "bg-[#FDE047]"
                    : c === "orange"
                    ? "bg-[#FB923C]"
                    : c === "mint"
                    ? "bg-[#03D26F]"
                    : c === "lavender"
                    ? "bg-[#C084FC]"
                    : c === "coral"
                    ? "bg-[#F472B6]"
                    : "bg-[#818CF8]";
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSubjectColor(c)}
                    className={`h-9 w-9 rounded-xl transition-all border border-[#161514]/20 dark:border-white/20 cursor-pointer shadow-xs hover:-translate-y-0.5 active:translate-y-0 ${bgClass} ${isSelected ? "ring-2 ring-offset-2 ring-[#161514] dark:ring-white scale-110" : ""}`}
                  />
                );
              })}
            </div>
          </div>

          <Button
            type="submit"
            disabled={addSubjectMutation.isPending}
            className="w-full bg-[#03D26F] hover:bg-[#02B75F] text-[#161514] font-heading font-black text-xs uppercase py-3 rounded-xl border border-[#03D26F] shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer tracking-wider"
          >
            {addSubjectMutation.isPending ? "Adding…" : "Create Subject"}
          </Button>
        </form>
      </ResponsiveFormContainer>

      {/* Log Test Dialog Form */}
      <ResponsiveFormContainer
        open={isAddTestOpen}
        onOpenChange={setIsAddTestOpen}
        title="Log Mock Test"
        description="Enter test metadata and your scoring results"
      >
        <form onSubmit={handleAddTest} className="space-y-4">
          {/* Quick Starters (1-Tap Fill) */}
          <div className="space-y-1.5 pb-1">
            <span className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514]/60 dark:text-[#FAF8F5]/60 block">
              Quick Starters (1-Tap Fill)
            </span>
            <div className="grid grid-cols-3 gap-2">
              {TEST_STARTER_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setTestName(p.name);
                    setTestScore(p.score);
                    setTestTotalScore(p.totalScore);
                  }}
                  className="p-2 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FAF8F5] dark:bg-[#252321] hover:bg-white dark:hover:bg-[#1C1A18] text-left transition-all shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <span className="text-xs font-bold text-[#161514] dark:text-[#FAF8F5] block truncate">
                    {p.badge}
                  </span>
                  <span className="text-[10px] text-[#161514]/60 dark:text-[#FAF8F5]/60 block mt-0.5">
                    {p.score}/{p.totalScore} pts
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="test-title" className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
              Test Name / Title *
            </label>
            <input
              id="test-title"
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g. Mock Test 1, Unit Test A..."
              required
              className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FFFDF8] dark:bg-[#252321] py-2.5 px-3.5 text-base sm:text-xs font-bold text-[#161514] dark:text-[#FAF8F5] outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5] shadow-xs transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="test-score" className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
                Your Score
              </label>
              <input
                id="test-score"
                type="number"
                value={testScore}
                onChange={(e) => setTestScore(Number(e.target.value))}
                min={0}
                required
                className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FFFDF8] dark:bg-[#252321] py-2.5 px-3.5 text-base sm:text-xs font-bold text-[#161514] dark:text-[#FAF8F5] outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5] shadow-xs transition-all"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="test-total" className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
                Total Score
              </label>
              <input
                id="test-total"
                type="number"
                value={testTotalScore}
                onChange={(e) => setTestTotalScore(Number(e.target.value))}
                min={1}
                required
                className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FFFDF8] dark:bg-[#252321] py-2.5 px-3.5 text-base sm:text-xs font-bold text-[#161514] dark:text-[#FAF8F5] outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5] shadow-xs transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="test-date" className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
              Test Date
            </label>
            <input
              id="test-date"
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              required
              className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FFFDF8] dark:bg-[#252321] py-2.5 px-3.5 text-base sm:text-xs font-bold text-[#161514] dark:text-[#FAF8F5] outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5] shadow-xs transition-all"
            />
          </div>

          <Button
            type="submit"
            disabled={addTestMutation.isPending}
            className="w-full bg-[#03D26F] hover:bg-[#02B75F] text-[#161514] font-heading font-black text-xs uppercase py-3 rounded-xl border border-[#03D26F] shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer tracking-wider"
          >
            {addTestMutation.isPending ? "Logging…" : "Log Score"}
          </Button>
        </form>
      </ResponsiveFormContainer>

      {/* Edit Subject Dialog Form */}
      <ResponsiveFormContainer
        open={editingSubject !== null}
        onOpenChange={(open) => {
          if (!open) setEditingSubject(null);
        }}
        title="Edit Subject"
        description="Update your subject name or theme color"
      >
        <form onSubmit={handleUpdateSubject} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="edit-subject-name" className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
              Subject Name
            </label>
            <input
              id="edit-subject-name"
              type="text"
              value={editSubjectName}
              onChange={(e) => setEditSubjectName(e.target.value)}
              placeholder="e.g. Mathematics, Biology..."
              required
              className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FFFDF8] dark:bg-[#252321] py-2.5 px-3.5 text-base sm:text-xs font-bold text-[#161514] dark:text-[#FAF8F5] outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5] shadow-xs transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">Theme Color</label>
            <div className="flex gap-2.5 flex-wrap">
              {["orange", "amber", "mint", "lavender", "coral", "indigo"].map((c) => {
                const isSelected = editSubjectColor === c;
                const bgClass =
                  c === "amber"
                    ? "bg-[#FDE047]"
                    : c === "orange"
                    ? "bg-[#FB923C]"
                    : c === "mint"
                    ? "bg-[#03D26F]"
                    : c === "lavender"
                    ? "bg-[#C084FC]"
                    : c === "coral"
                    ? "bg-[#F472B6]"
                    : "bg-[#818CF8]";
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditSubjectColor(c)}
                    className={`h-9 w-9 rounded-xl transition-all border border-[#161514]/20 dark:border-white/20 cursor-pointer shadow-xs hover:-translate-y-0.5 active:translate-y-0 ${bgClass} ${isSelected ? "ring-2 ring-offset-2 ring-[#161514] dark:ring-white scale-110" : ""}`}
                  />
                );
              })}
            </div>
          </div>

          <Button
            type="submit"
            disabled={updateSubjectMutation.isPending}
            className="w-full bg-[#03D26F] hover:bg-[#02B75F] text-[#161514] font-heading font-black text-xs uppercase py-3 rounded-xl border border-[#03D26F] shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer tracking-wider"
          >
            {updateSubjectMutation.isPending ? "Updating…" : "Save Changes"}
          </Button>
        </form>
      </ResponsiveFormContainer>

      {/* Delete Subject Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteSubjectId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteSubjectId(null);
        }}
        onConfirm={async () => {
          if (deleteSubjectId) {
            const subToDelete = subjects.find((s) => s.id === deleteSubjectId);
            try {
              await deleteSubjectMutation.mutateAsync(deleteSubjectId);
              toast.success("Subject archived", {
                description: subToDelete ? `"${subToDelete.name}" was moved to archives` : undefined,
                action: subToDelete
                  ? {
                      label: "Undo",
                      onClick: () => {
                        addSubjectMutation.mutate({
                          name: subToDelete.name,
                          color: subToDelete.color,
                          icon: subToDelete.icon,
                        });
                        toast.info("Subject restored", {
                          description: `"${subToDelete.name}" has been reinstated`,
                        });
                      },
                    }
                  : undefined,
              });
            } catch {
              toast.error("Failed to archive subject");
            }
            setDeleteSubjectId(null);
          }
        }}
        title="Archive Subject"
        description="Are you sure you want to archive this subject? You will not lose study statistics."
      />

      {/* Edit Mock Test Dialog Form */}
      <ResponsiveFormContainer
        open={editingTest !== null}
        onOpenChange={(open) => {
          if (!open) setEditingTest(null);
        }}
        title="Edit Mock Test"
        description="Update your test details or score"
      >
        <form onSubmit={handleUpdateTest} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="edit-test-title" className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
              Test Name / Title
            </label>
            <input
              id="edit-test-title"
              type="text"
              value={editTestName}
              onChange={(e) => setEditTestName(e.target.value)}
              placeholder="e.g. Mock Test 1, Unit Test A..."
              required
              className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FFFDF8] dark:bg-[#252321] py-2.5 px-3.5 text-base sm:text-xs font-bold text-[#161514] dark:text-[#FAF8F5] outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5] shadow-xs transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="edit-test-score" className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
                Your Score
              </label>
              <input
                id="edit-test-score"
                type="number"
                value={editTestScore}
                onChange={(e) => setEditTestScore(Number(e.target.value))}
                min={0}
                required
                className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FFFDF8] dark:bg-[#252321] py-2.5 px-3.5 text-base sm:text-xs font-bold text-[#161514] dark:text-[#FAF8F5] outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5] shadow-xs transition-all"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="edit-test-total" className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
                Total Score
              </label>
              <input
                id="edit-test-total"
                type="number"
                value={editTestTotalScore}
                onChange={(e) => setEditTestTotalScore(Number(e.target.value))}
                min={1}
                required
                className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FFFDF8] dark:bg-[#252321] py-2.5 px-3.5 text-base sm:text-xs font-bold text-[#161514] dark:text-[#FAF8F5] outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5] shadow-xs transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-test-date" className="text-[10px] font-heading font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] block">
              Test Date
            </label>
            <input
              id="edit-test-date"
              type="date"
              value={editTestDate}
              onChange={(e) => setEditTestDate(e.target.value)}
              required
              className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-[#FFFDF8] dark:bg-[#252321] py-2.5 px-3.5 text-base sm:text-xs font-bold text-[#161514] dark:text-[#FAF8F5] outline-none focus:border-[#161514] dark:focus:border-[#FAF8F5] shadow-xs transition-all"
            />
          </div>

          <Button
            type="submit"
            disabled={updateTestMutation.isPending}
            className="w-full bg-[#03D26F] hover:bg-[#02B75F] text-[#161514] font-heading font-black text-xs uppercase py-3 rounded-xl border border-[#03D26F] shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer tracking-wider"
          >
            {updateTestMutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </ResponsiveFormContainer>

      {/* Delete Mock Test Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteTestId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTestId(null);
        }}
        onConfirm={async () => {
          if (deleteTestId) {
            const testToDelete = tests.find((t) => t.id === deleteTestId);
            try {
              await deleteTestMutation.mutateAsync(deleteTestId);
              toast.success("Mock test score removed", {
                description: testToDelete ? `"${testToDelete.name}" deleted` : undefined,
                action: testToDelete
                  ? {
                      label: "Undo",
                      onClick: () => {
                        addTestMutation.mutate({
                          name: testToDelete.name,
                          date: testToDelete.date,
                          score: testToDelete.score,
                          totalScore: testToDelete.totalScore,
                          scope: testToDelete.scope || [],
                          weakAreas: testToDelete.weakAreas || [],
                        });
                        toast.info("Mock test restored", {
                          description: `"${testToDelete.name}" restored`,
                        });
                      },
                    }
                  : undefined,
              });
            } catch {
              toast.error("Failed to delete mock test");
            }
            setDeleteTestId(null);
          }
        }}
        title="Delete Mock Test"
        description="Are you sure you want to delete this mock test score? This cannot be undone."
      />
    </div>
  );
}

export default function StudyPage() {
  return (
    <Suspense fallback={<StudyCockpitSkeleton />}>
      <StudyPageContent />
    </Suspense>
  );
}
