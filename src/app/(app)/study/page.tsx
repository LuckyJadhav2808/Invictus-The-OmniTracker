"use client";

import { useState, useEffect, Suspense } from "react";
import { useSubjects, useAddSubject, useUpdateSubject, useDeleteSubject, useTests, useAddTest, useUpdateTest, useDeleteTest, useStudySessions, useAllTopics, useAddTopic, useUpdateTopic, useDeleteTopic, useAddStudySession } from "@/lib/queries/study";
import { ExamSyllabusTracker } from "@/components/study/ExamSyllabusTracker";
import { StudySessionLogger } from "@/components/study/StudySessionLogger";
import { DraggableDashboardGrid } from "@/components/shared/DraggableDashboardGrid";
import { EmptyState } from "@/components/shared/EmptyState";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { InvictusLoadingScreen } from "@/components/shared/InvictusLoadingScreen";
import { TemplateSelectionModal, TemplatePack } from "@/components/shared/TemplateSelectionModal";
import { SUBJECT_TEMPLATE_PACKS, MOCK_TEST_TEMPLATE_PACKS } from "@/lib/templates-data";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { BookOpen, Plus, Calendar as CalendarIcon, Trophy, BarChart2, AlertCircle, FileText, ChevronRight, Clock, Sparkles, Edit3, Trash2 } from "lucide-react";
import { format, differenceInDays, differenceInCalendarDays, parseISO, getDay, subWeeks, eachDayOfInterval } from "date-fns";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/shared/AuthProvider";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, LineChart, Line, Legend } from "recharts";
import { SpaceHeroBanner } from "@/components/shared/SpaceHeroBanner";
import { ProactiveReminderBanner } from "@/components/shared/ProactiveReminderBanner";

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

  // Color mapping utility (Neo-Brutalist palettes)
  const colorMap: Record<string, { bg: string; text: string; ring: string; badge: string }> = {
    amber: { bg: "bg-[#FDE047]", text: "text-[#161514]", ring: "stroke-[#EAB308]", badge: "bg-[#FEF08A]" },
    orange: { bg: "bg-[#FB923C]", text: "text-[#161514]", ring: "stroke-[#F97316]", badge: "bg-[#FED7AA]" },
    mint: { bg: "bg-[#03D26F]", text: "text-[#161514]", ring: "stroke-[#059669]", badge: "bg-[#A7F3D0]" },
    lavender: { bg: "bg-[#C084FC]", text: "text-[#161514]", ring: "stroke-[#9333EA]", badge: "bg-[#E9D5FF]" },
    coral: { bg: "bg-[#F472B6]", text: "text-[#161514]", ring: "stroke-[#E11D48]", badge: "bg-[#FBCFE8]" },
    indigo: { bg: "bg-[#818CF8]", text: "text-[#161514]", ring: "stroke-[#4F46E5]", badge: "bg-[#C7D2FE]" },
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
          badgeText="Study & Exams"
          title="Study & Revision"
          subtitle={studyTarget?.examName ? `Target Exam: ${studyTarget.examName} (${daysLeft !== null ? `${daysLeft} days remaining` : "Scheduled"})` : "Track subjects, topics, and revision progress."}
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

        {/* Proactive Reminder Banner */}
        <ProactiveReminderBanner space="study" />

        {/* Countdown Banner */}
        {studyTarget && daysLeft !== null && (
          <div className="bg-white rounded-3xl p-5 md:p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-[#FED7AA] border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[2px_2px_0px_0px_#161514] shrink-0">
                <Trophy className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-sm md:text-base font-black text-[#161514] font-heading uppercase tracking-wide">
                  {studyTarget.examName} Countdown
                </h4>
                <p className="text-xs font-semibold text-[#161514]/70 mt-0.5">
                  Stay consistent with daily study and revision sessions.
                </p>
              </div>
            </div>
            <div className="flex items-center sm:flex-col sm:items-end gap-1.5 shrink-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-[#EA580C] font-heading tracking-tight">{daysLeft}</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#161514] px-2 py-0.5 rounded-lg bg-[#FED7AA] border-2 border-[#161514]">
                  Days Left
                </span>
              </div>
            </div>
          </div>
        )}


        {/* Draggable Study Widgets Grid */}
        <DraggableDashboardGrid
          storageKey="study"
          widgets={[
            {
              id: "syllabus-tracker",
              title: "📚 Exam Syllabus & Revision Tracker",
              component: (
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
              ),
            },
            {
              id: "session-logger",
              title: "✍️ Study Session Logger & Focus Meter",
              component: (
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
              ),
            },
          ]}
        />
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="w-full overflow-x-auto no-scrollbar pb-1 mb-5">
            <TabsList className="bg-[#FAF8F5] rounded-2xl p-1.5 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] flex items-center gap-1.5 w-max min-w-full sm:min-w-0 sm:w-auto">
              <TabsTrigger
                value="subjects"
                className="rounded-xl text-xs font-black py-2 px-4 border-2 border-transparent data-[state=active]:border-[#161514] data-[state=active]:bg-[#C084FC] data-[state=active]:text-[#161514] data-[state=active]:shadow-[2px_2px_0px_0px_#161514] text-[#161514]/70 hover:text-[#161514] hover:bg-white/60 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>📚</span>
                <span>Subjects</span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="rounded-xl text-xs font-black py-2 px-4 border-2 border-transparent data-[state=active]:border-[#161514] data-[state=active]:bg-[#C084FC] data-[state=active]:text-[#161514] data-[state=active]:shadow-[2px_2px_0px_0px_#161514] text-[#161514]/70 hover:text-[#161514] hover:bg-white/60 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>📊</span>
                <span>Analytics</span>
              </TabsTrigger>
              <TabsTrigger
                value="tests"
                className="rounded-xl text-xs font-black py-2 px-4 border-2 border-transparent data-[state=active]:border-[#161514] data-[state=active]:bg-[#C084FC] data-[state=active]:text-[#161514] data-[state=active]:shadow-[2px_2px_0px_0px_#161514] text-[#161514]/70 hover:text-[#161514] hover:bg-white/60 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>📝</span>
                <span>Mock Tests</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Subjects List Tab */}
          <TabsContent id="subjects-list" value="subjects" className="scroll-mt-24">
            {subjectsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-3xl p-5 h-28 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] animate-pulse" />
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
                      className="break-inside-avoid block w-full bg-white rounded-3xl p-5 border-[2.5px] border-[#161514] shadow-[3.5px_3.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer select-none flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`h-12 w-12 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center shrink-0 ${colors.bg} ${colors.text}`}>
                          <BookOpen className="h-6 w-6 stroke-[2.5]" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm md:text-base text-[#161514] font-heading leading-tight">{sub.name}</h4>
                          <span className="text-[10px] font-black text-[#161514]/70 uppercase tracking-wider block mt-1">
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
                            className="bg-[#FFFDF8] hover:bg-[#FFF9EA] text-[#161514] p-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                            title="Edit Subject"
                          >
                            <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" />
                          </button>
                          <button
                            onClick={() => setDeleteSubjectId(sub.id)}
                            className="bg-[#FEE2E2] hover:bg-[#FCA5A5] text-[#991B1B] p-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                            title="Delete Subject"
                          >
                            <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                          </button>
                        </div>

                        {/* Progress ring & chevron */}
                        <ProgressRing
                          percentage={subPercentage}
                          size={34}
                          strokeWidth={3.5}
                          colorClass={colors.ring}
                        />
                        <div className="bg-[#FAF8F5] p-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]">
                          <ChevronRight className="h-4 w-4 text-[#161514] stroke-[3]" />
                        </div>
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
                <div className="bg-white rounded-3xl p-5 border-[2.5px] border-[#161514] shadow-[3.5px_3.5px_0px_0px_#161514] flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-[#FED7AA] border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center text-[#161514] shrink-0">
                    <Clock className="h-6 w-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black text-[#161514]/70 uppercase tracking-wider">Logged Hours</h5>
                    <p className="text-2xl font-black text-[#161514] font-heading tracking-tight mt-0.5">{totalLoggedHours}h</p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 border-[2.5px] border-[#161514] shadow-[3.5px_3.5px_0px_0px_#161514] flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-[#CEF431] border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center text-[#161514] shrink-0">
                    <Trophy className="h-6 w-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black text-[#161514]/70 uppercase tracking-wider">Mastery Rate</h5>
                    <p className="text-2xl font-black text-[#161514] font-heading tracking-tight mt-0.5">{masteryRate}%</p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 border-[2.5px] border-[#161514] shadow-[3.5px_3.5px_0px_0px_#161514] flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-[#FCA5A5] border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center text-[#161514] shrink-0">
                    <AlertCircle className="h-6 w-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black text-[#161514]/70 uppercase tracking-wider">Revision Due</h5>
                    <p className="text-2xl font-black text-[#161514] font-heading tracking-tight mt-0.5">{revisionDueCount} topic{revisionDueCount !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              </div>

              {/* Bar Chart Logged study hours */}
              <div className="bg-white rounded-3xl p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-4">
                <h3 className="font-black text-sm text-[#161514] uppercase tracking-wider font-heading flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 stroke-[2.5]" /> Daily Study Hours Trend
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
                        <XAxis dataKey="name" stroke="#161514" fontSize={11} fontWeight={800} tickLine={false} axisLine={false} />
                        <YAxis stroke="#161514" fontSize={11} fontWeight={800} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
                        <Tooltip formatter={(v) => [`${v}h`, "Logged study hours"]} contentStyle={{ borderRadius: "12px", border: "2px solid #161514", boxShadow: "2px 2px 0px 0px #161514", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "12px" }} />
                        <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                          {barChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.hours >= 3.0 ? "#03D26F" : entry.hours >= 1.5 ? "#FACC15" : "#FB923C"} stroke="#161514" strokeWidth={1.5} />
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
          <TabsContent id="mock-tests" value="tests" className="scroll-mt-24">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm uppercase tracking-wider text-[#161514] font-heading flex items-center gap-2">
                  <FileText className="h-4 w-4 stroke-[2.5]" /> Exam Mock Scores
                </h3>
                <button
                  type="button"
                  onClick={() => setIsTestChoiceOpen(true)}
                  className="bg-[#CEF431] hover:bg-[#b8dd24] text-[#161514] font-black text-xs uppercase py-2 px-4 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4 stroke-[3]" /> Log Test
                </button>
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
                  <div className="bg-white rounded-3xl p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={testTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#161514" fontSize={11} fontWeight={800} tickLine={false} axisLine={false} />
                        <YAxis stroke="#161514" fontSize={11} fontWeight={800} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                        <Tooltip formatter={(v) => [`${v}%`, "Test score"]} contentStyle={{ borderRadius: "12px", border: "2px solid #161514", boxShadow: "2px 2px 0px 0px #161514", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "12px" }} />
                        <Line type="monotone" dataKey="percentage" stroke="#C084FC" strokeWidth={3.5} activeDot={{ r: 6, stroke: "#161514", strokeWidth: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* List of tests */}
                  <div className="space-y-3">
                    {tests.map((test) => {
                      const scorePercentage = test.totalScore > 0 ? Math.round((test.score / test.totalScore) * 100) : 0;
                      return (
                        <div
                          key={test.id}
                          className="bg-white rounded-2xl p-4 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] flex items-center justify-between hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                        >
                          <div>
                            <h4 className="font-black text-sm text-[#161514] font-heading">{test.name}</h4>
                            <p className="text-[10px] font-bold text-[#161514]/70 uppercase tracking-wider mt-0.5">{test.date}</p>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <span className="text-base font-black text-[#161514] font-heading">{test.score}/{test.totalScore}</span>
                              <p className="text-[10px] font-black text-[#161514] px-2 py-0.5 rounded-lg border-2 border-[#161514] bg-[#A7F3D0] uppercase tracking-wider mt-0.5">{scorePercentage}% Score</p>
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
                                className="bg-[#FFFDF8] hover:bg-[#FFF9EA] text-[#161514] p-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                                title="Edit test score"
                              >
                                <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" />
                              </button>
                              <button
                                onClick={() => setDeleteTestId(test.id)}
                                className="bg-[#FEE2E2] hover:bg-[#FCA5A5] text-[#991B1B] p-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                                title="Delete test log"
                              >
                                <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
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
            <label htmlFor="subj-name" className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">
              Subject Name
            </label>
            <input
              id="subj-name"
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. Physics, Chemistry, Japanese N3..."
              required
              className="w-full rounded-xl border-2 border-[#161514] bg-[#FFFDF8] py-2.5 px-3.5 text-xs font-black text-[#161514] outline-none focus:bg-[#FFF9EA] shadow-[2px_2px_0px_0px_#161514] transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">
              Select Color
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
                    className={`h-9 w-9 rounded-xl transition-all border-2 border-[#161514] cursor-pointer shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 ${bgClass} ${isSelected ? "ring-2 ring-offset-2 ring-[#161514] scale-110" : ""}`}
                  />
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={addSubjectMutation.isPending}
            className="w-full bg-[#03D26F] hover:bg-[#02B75F] text-[#161514] font-black text-xs uppercase py-3 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer tracking-wider"
          >
            {addSubjectMutation.isPending ? "Adding…" : "Create Subject 📚"}
          </button>
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
            <label htmlFor="test-title" className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">
              Test Name / Title
            </label>
            <input
              id="test-title"
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g. Mock Test 1, Unit Test A..."
              required
              className="w-full rounded-xl border-2 border-[#161514] bg-[#FFFDF8] py-2.5 px-3.5 text-xs font-black text-[#161514] outline-none focus:bg-[#FFF9EA] shadow-[2px_2px_0px_0px_#161514] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="test-score" className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">
                Your Score
              </label>
              <input
                id="test-score"
                type="number"
                value={testScore}
                onChange={(e) => setTestScore(Number(e.target.value))}
                min={0}
                required
                className="w-full rounded-xl border-2 border-[#161514] bg-[#FFFDF8] py-2.5 px-3.5 text-xs font-black text-[#161514] outline-none focus:bg-[#FFF9EA] shadow-[2px_2px_0px_0px_#161514] transition-all"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="test-total" className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">
                Total Score
              </label>
              <input
                id="test-total"
                type="number"
                value={testTotalScore}
                onChange={(e) => setTestTotalScore(Number(e.target.value))}
                min={1}
                required
                className="w-full rounded-xl border-2 border-[#161514] bg-[#FFFDF8] py-2.5 px-3.5 text-xs font-black text-[#161514] outline-none focus:bg-[#FFF9EA] shadow-[2px_2px_0px_0px_#161514] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="test-date" className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">
              Test Date
            </label>
            <input
              id="test-date"
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              required
              className="w-full rounded-xl border-2 border-[#161514] bg-[#FFFDF8] py-2.5 px-3.5 text-xs font-black text-[#161514] outline-none focus:bg-[#FFF9EA] shadow-[2px_2px_0px_0px_#161514] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={addTestMutation.isPending}
            className="w-full bg-[#03D26F] hover:bg-[#02B75F] text-[#161514] font-black text-xs uppercase py-3 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer tracking-wider"
          >
            {addTestMutation.isPending ? "Logging…" : "Log Score 📝"}
          </button>
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
            <label htmlFor="edit-subject-name" className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">
              Subject Name
            </label>
            <input
              id="edit-subject-name"
              type="text"
              value={editSubjectName}
              onChange={(e) => setEditSubjectName(e.target.value)}
              placeholder="e.g. Mathematics, Biology..."
              required
              className="w-full rounded-xl border-2 border-[#161514] bg-[#FFFDF8] py-2.5 px-3.5 text-xs font-black text-[#161514] outline-none focus:bg-[#FFF9EA] shadow-[2px_2px_0px_0px_#161514] transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">Theme Color</label>
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
                    className={`h-9 w-9 rounded-xl transition-all border-2 border-[#161514] cursor-pointer shadow-[2px_2px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 ${bgClass} ${isSelected ? "ring-2 ring-offset-2 ring-[#161514] scale-110" : ""}`}
                  />
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={updateSubjectMutation.isPending}
            className="w-full bg-[#03D26F] hover:bg-[#02B75F] text-[#161514] font-black text-xs uppercase py-3 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer tracking-wider"
          >
            {updateSubjectMutation.isPending ? "Updating…" : "Save Changes 📝"}
          </button>
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
            <label htmlFor="edit-test-title" className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">
              Test Name / Title
            </label>
            <input
              id="edit-test-title"
              type="text"
              value={editTestName}
              onChange={(e) => setEditTestName(e.target.value)}
              placeholder="e.g. Mock Test 1, Unit Test A..."
              required
              className="w-full rounded-xl border-2 border-[#161514] bg-[#FFFDF8] py-2.5 px-3.5 text-xs font-black text-[#161514] outline-none focus:bg-[#FFF9EA] shadow-[2px_2px_0px_0px_#161514] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="edit-test-score" className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">
                Your Score
              </label>
              <input
                id="edit-test-score"
                type="number"
                value={editTestScore}
                onChange={(e) => setEditTestScore(Number(e.target.value))}
                min={0}
                required
                className="w-full rounded-xl border-2 border-[#161514] bg-[#FFFDF8] py-2.5 px-3.5 text-xs font-black text-[#161514] outline-none focus:bg-[#FFF9EA] shadow-[2px_2px_0px_0px_#161514] transition-all"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="edit-test-total" className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">
                Total Score
              </label>
              <input
                id="edit-test-total"
                type="number"
                value={editTestTotalScore}
                onChange={(e) => setEditTestTotalScore(Number(e.target.value))}
                min={1}
                required
                className="w-full rounded-xl border-2 border-[#161514] bg-[#FFFDF8] py-2.5 px-3.5 text-xs font-black text-[#161514] outline-none focus:bg-[#FFF9EA] shadow-[2px_2px_0px_0px_#161514] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-test-date" className="text-[10px] font-black uppercase tracking-wider text-[#161514] block">
              Test Date
            </label>
            <input
              id="edit-test-date"
              type="date"
              value={editTestDate}
              onChange={(e) => setEditTestDate(e.target.value)}
              required
              className="w-full rounded-xl border-2 border-[#161514] bg-[#FFFDF8] py-2.5 px-3.5 text-xs font-black text-[#161514] outline-none focus:bg-[#FFF9EA] shadow-[2px_2px_0px_0px_#161514] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={updateTestMutation.isPending}
            className="w-full bg-[#03D26F] hover:bg-[#02B75F] text-[#161514] font-black text-xs uppercase py-3 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer tracking-wider"
          >
            {updateTestMutation.isPending ? "Saving…" : "Save Changes 📝"}
          </button>
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
    <Suspense fallback={<InvictusLoadingScreen message="Loading Study Tracker…" />}>
      <StudyPageContent />
    </Suspense>
  );
}
