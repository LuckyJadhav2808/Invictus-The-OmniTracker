"use client";

import { useState, useEffect, Suspense } from "react";
import { useSubjects, useAddSubject, useUpdateSubject, useDeleteSubject, useTests, useAddTest, useUpdateTest, useDeleteTest, useStudySessions, useAllTopics, useAddTopic, useUpdateTopic, useDeleteTopic, useAddStudySession } from "@/lib/queries/study";
import { ExamSyllabusTracker } from "@/components/study/ExamSyllabusTracker";
import { StudySessionLogger } from "@/components/study/StudySessionLogger";
import { EmptyState } from "@/components/shared/EmptyState";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { TemplateSelectionModal, TemplatePack } from "@/components/shared/TemplateSelectionModal";
import { SUBJECT_TEMPLATE_PACKS, MOCK_TEST_TEMPLATE_PACKS } from "@/lib/templates-data";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { BookOpen, Plus, Calendar as CalendarIcon, Trophy, BarChart2, AlertCircle, FileText, ChevronRight, Clock, Sparkles, Edit3, Trash2 } from "lucide-react";
import { format, differenceInDays, getDay, subWeeks, eachDayOfInterval } from "date-fns";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/shared/AuthProvider";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, LineChart, Line, Legend } from "recharts";
import { SpaceHeroBanner } from "@/components/shared/SpaceHeroBanner";

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
        icon: "📚",
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
      toast.success("Subject added! Time to learn 📖");
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
      toast.success("Subject updated successfully! 📝");
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
      toast.success("Mock test logged! Keep pushing 🏆");
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
      toast.success("Mock test updated successfully! 📝");
      setEditingTest(null);
    } catch {
      toast.error("Failed to update test");
    }
  };

  // Color mapping utility
  const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
    amber: { bg: "bg-amber-500/10", text: "text-amber-600", ring: "stroke-amber-500" },
    orange: { bg: "bg-orange-500/10", text: "text-orange-600", ring: "stroke-orange-500" },
    mint: { bg: "bg-mint-600/10", text: "text-mint-600", ring: "stroke-mint-600" },
    lavender: { bg: "bg-lavender-400/20", text: "text-lavender-600", ring: "stroke-lavender-400" },
    coral: { bg: "bg-coral-400/20", text: "text-coral-500", ring: "stroke-coral-400" },
    indigo: { bg: "bg-indigo-500/10", text: "text-indigo-600", ring: "stroke-indigo-500" },
  };

  // Compute total logged study hours (from sessions)
  const totalLoggedMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalLoggedHours = (totalLoggedMinutes / 60).toFixed(1);

  // Compute Countdown Days
  const countdownDays = () => {
    if (!studyTarget?.examDate) return null;
    const diff = differenceInDays(new Date(studyTarget.examDate), new Date());
    return diff >= 0 ? diff : 0;
  };

  const daysLeft = countdownDays();

  // Real study hours per day of week from sessions
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const barChartData = (() => {
    // Group sessions by day-of-week
    const dayCounts: Record<number, { totalHours: number; totalDays: number }> = {};
    for (let i = 0; i < 7; i++) dayCounts[i] = { totalHours: 0, totalDays: 0 };
    // Count weekdays in the past 4 weeks
    const fourWeekStart = subWeeks(new Date(), 4);
    const windowDays = eachDayOfInterval({ start: fourWeekStart, end: new Date() });
    for (const day of windowDays) {
      dayCounts[getDay(day)].totalDays++;
    }
    // Accumulate session hours per day-of-week
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

  return (
    <div className="min-h-screen bg-cream-bg p-4 md:p-8 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Space Hero Banner */}
        <SpaceHeroBanner
          space="study"
          badgeText="📚 Study & Exam Focus Space"
          title="Master Your Syllabus. Achieve Excellence."
          subtitle={studyTarget?.examName ? `Target Exam: ${studyTarget.examName} (${daysLeft !== null ? `${daysLeft} days remaining` : "Scheduled"})` : "Level up your learning at your own pace."}
          stats={[
            { label: "Subjects", value: `${subjects.length}`, icon: "📖" },
            { label: "Total Studied", value: `${totalLoggedHours}h`, icon: "⏱️" },
            { label: "Mastery Rate", value: `${masteryRate}%`, icon: "🏆" },
          ]}
          actionButton={{
            label: "+ Add Subject",
            onClick: () => setIsSubjectChoiceOpen(true),
          }}
        />

        {/* Countdown Banner */}
        {studyTarget && daysLeft !== null && (
          <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-[0_8px_24px_rgba(31,36,48,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4 border-l-4 border-orange-500">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-navy-900">{studyTarget.examName} Countdown</h4>
                <p className="text-xs text-navy-600 mt-0.5">Stay consistent and keep studying!</p>
              </div>
            </div>
            <div className="text-center sm:text-right shrink-0">
              <span className="text-3xl font-extrabold text-orange-500 font-heading">{daysLeft}</span>
              <span className="text-xs font-bold text-navy-900 ml-1.5 uppercase tracking-wide">Days Left</span>
            </div>
          </div>
        )}

        {/* EXAM SYLLABUS DATASET TRACKER */}
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
            toast.success("Topic added to syllabus! 📚");
          }}
          onUpdateTopicStatus={(topicId, status, revisionsCount) => {
            updateTopicMutation.mutate({
              id: topicId,
              status: status as any,
              revisionsCount,
            } as any);
          }}
          onEditTopic={(topicId, title) => {
            updateTopicMutation.mutate({
              id: topicId,
              title,
            } as any);
            toast.success("Topic title updated! 📝");
          }}
          onDeleteTopic={(topicId) => {
            deleteTopicMutation.mutate(topicId);
            toast.success("Topic removed 🗑️");
          }}
        />

        {/* STUDY SESSION LOGGER & SATISFACTION METER */}
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white rounded-full p-1 border border-border shadow-sm flex w-full max-w-[400px] mb-6">
            <TabsTrigger value="subjects" className="flex-1 rounded-full text-xs font-bold py-2 data-state=active:bg-navy-900 data-state=active:text-white transition-all cursor-pointer">
              Subjects
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1 rounded-full text-xs font-bold py-2 data-state=active:bg-navy-900 data-state=active:text-white transition-all cursor-pointer">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="tests" className="flex-1 rounded-full text-xs font-bold py-2 data-state=active:bg-navy-900 data-state=active:text-white transition-all cursor-pointer">
              Mock Tests
            </TabsTrigger>
          </TabsList>

          {/* Subjects List Tab */}
          <TabsContent value="subjects">
            {subjectsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-[var(--radius-lg)] p-5 h-24 animate-pulse" />
                ))}
              </div>
            ) : subjects.length === 0 ? (
              <EmptyState
                title="Start your learning path! 📖"
                description="Break down your studies into organized subjects (e.g. Mathematics, Science, Literature) to track topic mastery."
                Icon={BookOpen}
                ctaText="Create a Subject"
                onCtaClick={() => setIsSubjectChoiceOpen(true)}
                iconBgClass="bg-orange-500/15"
                iconColorClass="text-orange-500"
              />
            ) : (
              <div className="columns-1 md:columns-2 gap-4 space-y-4 [column-fill:_balance]">
                {subjects.map((sub) => {
                  const colors = colorMap[sub.color] || colorMap.orange;
                  const subTopics = allTopics.filter((t) => t.subjectId === sub.id);
                  const subCompleted = subTopics.filter((t) => t.status === "completed").length;
                  const subPercentage = subTopics.length > 0 ? Math.round((subCompleted / subTopics.length) * 100) : 0;

                  return (
                    <div
                      key={sub.id}
                      onClick={() => router.push(`/study/${sub.id}`)}
                      className="break-inside-avoid block w-full bg-white border border-border rounded-[var(--radius-lg)] p-5 flex items-center justify-between shadow-[0_8px_24px_rgba(31,36,48,0.02)] hover:shadow-[0_8px_24px_rgba(31,36,48,0.06)] hover:scale-[1.005] active:scale-[0.995] transition-all cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-11 w-11 rounded-[var(--radius-md)] flex items-center justify-center ${colors.bg} ${colors.text}`}>
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-navy-900">{sub.name}</h4>
                          <span className="text-[10px] font-semibold text-navy-600 uppercase tracking-wide">
                            {subTopics.length} topic{subTopics.length !== 1 ? "s" : ""} • {subPercentage}% completed
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-1.5 mr-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setEditingSubject(sub);
                              setEditSubjectName(sub.name);
                              setEditSubjectColor(sub.color);
                            }}
                            className="text-navy-600 hover:text-navy-900 p-1 cursor-pointer transition-colors outline-none border-none bg-transparent"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteSubjectId(sub.id)}
                            className="text-red-500 hover:text-red-600 p-1 cursor-pointer transition-colors outline-none border-none bg-transparent"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Progress ring & chevron */}
                        <ProgressRing
                          percentage={subPercentage}
                          size={32}
                          strokeWidth={3}
                          colorClass={colors.ring}
                        />
                        <ChevronRight className="h-4 w-4 text-navy-600" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* Stat summary grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-[0_8px_24px_rgba(31,36,48,0.04)] flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-bold text-navy-600 uppercase tracking-wider">Logged Hours</h5>
                    <p className="text-xl font-extrabold text-navy-900 mt-0.5">{totalLoggedHours}h</p>
                  </div>
                </div>

                <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-[0_8px_24px_rgba(31,36,48,0.04)] flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-mint-600/10 flex items-center justify-center text-mint-600">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-bold text-navy-600 uppercase tracking-wider">Mastery Rate</h5>
                    <p className="text-xl font-extrabold text-navy-900 mt-0.5">{masteryRate}%</p>
                  </div>
                </div>

                <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-[0_8px_24px_rgba(31,36,48,0.04)] flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-bold text-navy-600 uppercase tracking-wider">Revision Due</h5>
                    <p className="text-xl font-extrabold text-navy-900 mt-0.5">{revisionDueCount} topic{revisionDueCount !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              </div>

              {/* Bar Chart Logged study hours */}
              <div className="bg-white rounded-[var(--radius-lg)] p-6 shadow-[0_8px_24px_rgba(31,36,48,0.06)] space-y-4">
                <h3 className="font-bold text-sm text-navy-900 uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>
                  Daily Study Hours Trend
                </h3>
                {sessions.length === 0 ? (
                  <EmptyState
                    title="No study sessions logged yet! ⏱️"
                    description="Start the stopwatch or log a study session in any topic to see your weekly study trend analytics."
                    Icon={Clock}
                    ctaText="Go to Subjects"
                    onCtaClick={() => setActiveTab("subjects")}
                    iconBgClass="bg-orange-500/15"
                    iconColorClass="text-orange-500"
                  />
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#565C6B" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                        <YAxis stroke="#565C6B" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
                        <Tooltip formatter={(v) => [`${v}h`, "Logged study hours"]} contentStyle={{ borderRadius: "12px", fontFamily: "var(--font-sans)", fontSize: "12px" }} />
                        <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                          {barChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.hours >= 3.0 ? "#7CC3A2" : entry.hours >= 1.5 ? "#F5B942" : "#F2A6A0"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Mock Tests Tab */}
          <TabsContent value="tests">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-navy-600" style={{ fontFamily: "var(--font-heading)" }}>
                  Exam Mock Scores
                </h3>
                <Button
                  onClick={() => setIsTestChoiceOpen(true)}
                  variant="outline"
                  size="sm"
                  className="rounded-full border-input text-navy-900 bg-white cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Log Test
                </Button>
              </div>

              {tests.length === 0 ? (
                <EmptyState
                  title="Track your readiness! 📝"
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
                  <div className="bg-white rounded-[var(--radius-lg)] p-6 shadow-[0_8px_24px_rgba(31,36,48,0.06)] h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={testTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#565C6B" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                        <YAxis stroke="#565C6B" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                        <Tooltip formatter={(v) => [`${v}%`, "Test score"]} contentStyle={{ borderRadius: "12px", fontFamily: "var(--font-sans)", fontSize: "12px" }} />
                        <Line type="monotone" dataKey="percentage" stroke="#F5B942" strokeWidth={3} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* List of tests */}
                  <div className="space-y-2">
                    {tests.map((test) => {
                      const scorePercentage = test.totalScore > 0 ? Math.round((test.score / test.totalScore) * 100) : 0;
                      return (
                        <div
                          key={test.id}
                          className="bg-white rounded-[var(--radius-md)] p-4 shadow-[0_4px_12px_rgba(31,36,48,0.02)] flex items-center justify-between border"
                        >
                          <div>
                            <h4 className="font-bold text-sm text-navy-900">{test.name}</h4>
                            <p className="text-[10px] font-semibold text-navy-600 mt-0.5">{test.date}</p>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <span className="text-base font-extrabold text-navy-900">{test.score}/{test.totalScore}</span>
                              <p className="text-[10px] font-bold text-mint-600 uppercase mt-0.5">{scorePercentage}% Score</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingTest(test);
                                  setEditTestName(test.name);
                                  setEditTestDate(test.date);
                                  setEditTestScore(test.score);
                                  setEditTestTotalScore(test.totalScore);
                                }}
                                className="text-navy-600 hover:text-navy-900 transition-colors p-1 cursor-pointer outline-none border-none bg-transparent"
                                title="Edit test score"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTestId(test.id)}
                                className="text-red-500 hover:text-red-600 transition-colors p-1 cursor-pointer outline-none border-none bg-transparent"
                                title="Delete test log"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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
          <div className="space-y-1">
            <label htmlFor="subj-name" className="text-xs font-bold uppercase tracking-wider text-navy-600">
              Subject Name
            </label>
            <input
              id="subj-name"
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. Physics, Chemistry, Japanese N3..."
              required
              className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all text-navy-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-navy-600">
              Select Color
            </label>
            <div className="flex gap-3">
              {["orange", "amber", "mint", "lavender", "coral", "indigo"].map((c) => {
                const isSelected = subjectColor === c;
                const bgClass =
                  c === "amber"
                    ? "bg-amber-500"
                    : c === "orange"
                    ? "bg-orange-500"
                    : c === "mint"
                    ? "bg-mint-600"
                    : c === "lavender"
                    ? "bg-lavender-400"
                    : c === "coral"
                    ? "bg-coral-400"
                    : "bg-indigo-500";
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSubjectColor(c)}
                    className={`h-8 w-8 rounded-full transition-all border-2 border-transparent cursor-pointer ${bgClass} ${isSelected && "border-navy-900 scale-110"}`}
                  />
                );
              })}
            </div>
          </div>

          <Button
            type="submit"
            disabled={addSubjectMutation.isPending}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full py-2.5 shadow-sm border-none cursor-pointer"
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
          <div className="space-y-1">
            <label htmlFor="test-title" className="text-xs font-bold uppercase tracking-wider text-navy-600">
              Test Name / Title
            </label>
            <input
              id="test-title"
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g. Mock Test 1, Unit Test A..."
              required
              className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all text-navy-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="test-score" className="text-xs font-bold uppercase tracking-wider text-navy-600">
                Your Score
              </label>
              <input
                id="test-score"
                type="number"
                value={testScore}
                onChange={(e) => setTestScore(Number(e.target.value))}
                min={0}
                required
                className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all text-navy-900"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="test-total" className="text-xs font-bold uppercase tracking-wider text-navy-600">
                Total Score
              </label>
              <input
                id="test-total"
                type="number"
                value={testTotalScore}
                onChange={(e) => setTestTotalScore(Number(e.target.value))}
                min={1}
                required
                className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all text-navy-900"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="test-date" className="text-xs font-bold uppercase tracking-wider text-navy-600">
              Test Date
            </label>
            <input
              id="test-date"
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              required
              className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all text-navy-900"
            />
          </div>

          <Button
            type="submit"
            disabled={addTestMutation.isPending}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full py-2.5 shadow-sm border-none cursor-pointer"
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
            <label htmlFor="edit-subject-name" className="text-xs font-bold uppercase tracking-wider text-navy-600">
              Subject Name
            </label>
            <input
              id="edit-subject-name"
              type="text"
              value={editSubjectName}
              onChange={(e) => setEditSubjectName(e.target.value)}
              placeholder="e.g. Mathematics, Biology..."
              required
              className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all text-navy-900"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-navy-600 block">Theme Color</label>
            <div className="flex gap-3">
              {["orange", "amber", "mint", "lavender", "coral", "indigo"].map((c) => {
                const isSelected = editSubjectColor === c;
                const bgClass =
                  c === "amber"
                    ? "bg-amber-500"
                    : c === "orange"
                    ? "bg-orange-500"
                    : c === "mint"
                    ? "bg-mint-600"
                    : c === "lavender"
                    ? "bg-lavender-400"
                    : c === "coral"
                    ? "bg-coral-400"
                    : "bg-indigo-500";
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditSubjectColor(c)}
                    className={`h-8 w-8 rounded-full transition-all border-2 border-transparent cursor-pointer ${bgClass} ${isSelected && "border-navy-900 scale-110"}`}
                  />
                );
              })}
            </div>
          </div>

          <Button
            type="submit"
            disabled={updateSubjectMutation.isPending}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full py-2.5 shadow-sm border-none cursor-pointer"
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
            try {
              await deleteSubjectMutation.mutateAsync(deleteSubjectId);
              toast.success("Subject archived");
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
            <label htmlFor="edit-test-title" className="text-xs font-bold uppercase tracking-wider text-navy-600">
              Test Name / Title
            </label>
            <input
              id="edit-test-title"
              type="text"
              value={editTestName}
              onChange={(e) => setEditTestName(e.target.value)}
              placeholder="e.g. Mock Test 1, Unit Test A..."
              required
              className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none text-navy-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="edit-test-score" className="text-xs font-bold uppercase tracking-wider text-navy-600">
                Your Score
              </label>
              <input
                id="edit-test-score"
                type="number"
                value={editTestScore}
                onChange={(e) => setEditTestScore(Number(e.target.value))}
                min={0}
                required
                className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none text-navy-900"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="edit-test-total" className="text-xs font-bold uppercase tracking-wider text-navy-600">
                Total Score
              </label>
              <input
                id="edit-test-total"
                type="number"
                value={editTestTotalScore}
                onChange={(e) => setEditTestTotalScore(Number(e.target.value))}
                min={1}
                required
                className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none text-navy-900"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-test-date" className="text-xs font-bold uppercase tracking-wider text-navy-600">
              Test Date
            </label>
            <input
              id="edit-test-date"
              type="date"
              value={editTestDate}
              onChange={(e) => setEditTestDate(e.target.value)}
              required
              className="w-full rounded-[var(--radius-sm)] border border-input bg-cream-bg/50 py-2.5 px-3 text-sm outline-none text-navy-900"
            />
          </div>

          <Button
            type="submit"
            disabled={updateTestMutation.isPending}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full py-2.5 shadow-sm border-none cursor-pointer"
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
            try {
              await deleteTestMutation.mutateAsync(deleteTestId);
              toast.success("Mock test score removed");
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-cream-bg">
        <div className="h-8 w-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
      </div>
    }>
      <StudyPageContent />
    </Suspense>
  );
}
