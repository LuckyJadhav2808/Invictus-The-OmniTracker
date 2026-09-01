"use client";

import { useState, useEffect } from "react";
import { useHabits, useStreaks } from "@/lib/queries/goals";
import { useSubjects, useStudySessions, useTests } from "@/lib/queries/study";
import { useCategories, useTransactions } from "@/lib/queries/money";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, BookOpen, Wallet, Flame, Trophy, Award, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { SpaceHeroBanner } from "@/components/shared/SpaceHeroBanner";
import { useUIStore } from "@/store/ui-store";
import { YearlyActivityMatrix } from "@/components/profile/YearlyActivityMatrix";

export default function AnalyticsHubPage() {
  const { activeTracker } = useUIStore();
  const [activeTab, setActiveTab] = useState(activeTracker === "life" ? "goals" : activeTracker);

  // Synchronize tab when space is toggled
  useEffect(() => {
    setActiveTab(activeTracker === "life" ? "goals" : activeTracker);
  }, [activeTracker]);

  // Load All Data
  const { data: habits = [] } = useHabits();
  const { data: streaks = {} } = useStreaks();
  const { data: subjects = [] } = useSubjects();
  const { data: studySessions = [] } = useStudySessions();
  const { data: tests = [] } = useTests();
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useTransactions();

  // --- GOALS ANALYTICS ---
  const activeHabits = habits.filter((h) => !h.archived);
  const totalHabits = activeHabits.length;

  // Streak details
  const maxStreak = Object.values(streaks).reduce((max, s) => Math.max(max, s.currentStreak), 0);
  const longestStreakOverall = Object.values(streaks).reduce((max, s) => Math.max(max, s.longestStreak), 0);

  const habitsChartData = activeHabits.map((h) => {
    const streak = streaks[h.id];
    return {
      name: h.title,
      Streak: streak?.currentStreak || 0,
      Record: streak?.longestStreak || 0,
    };
  });

  // --- STUDY ANALYTICS ---
  const totalStudyMinutes = studySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);

  const studyBarData = [
    { name: "Mon", hours: 1.2 },
    { name: "Tue", hours: 2.5 },
    { name: "Wed", hours: 0.8 },
    { name: "Thu", hours: 3.0 },
    { name: "Fri", hours: 1.5 },
    { name: "Sat", hours: 4.2 },
    { name: "Sun", hours: 2.0 },
  ];

  const testTrendData = tests
    .map((t) => ({
      name: t.name,
      score: t.totalScore > 0 ? Math.round((t.score / t.totalScore) * 100) : 0,
    }))
    .reverse();

  // --- MONEY ANALYTICS ---
  const currentMonthStr = format(new Date(), "yyyy-MM");
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const colorMap: Record<string, string> = {
    amber: "#F5B942",
    orange: "#F0824A",
    mint: "#7CC3A2",
    lavender: "#C9BEEA",
    coral: "#F2A6A0",
  };

  const expensePieData = categories
    .filter((c) => c.type === "expense")
    .map((c) => ({
      name: c.name,
      value: transactions
        .filter((t) => t.categoryId === c.id && t.type === "expense" && t.date.startsWith(currentMonthStr))
        .reduce((sum, t) => sum + t.amount, 0),
      color: colorMap[c.color] || "#F5B942",
    }))
    .filter((d) => d.value > 0);

  const moneyBarData = [
    { name: "Financial comparison", Income: totalIncome, Expense: totalExpense },
  ];

  return (
    <div className="min-h-screen bg-cream-bg p-4 md:p-8 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Space Hero Banner */}
        <SpaceHeroBanner
          space="analytics"
          badgeText="📊 Performance & Analytics Hub"
          title="Unified Life Intelligence."
          subtitle="Cross-module tracking metrics, study trends, and financial health."
          stats={[
            { label: "Total Habits", value: `${totalHabits}`, icon: "🌱" },
            { label: "Study Logged", value: `${totalStudyHours}h`, icon: "📚" },
            { label: "Net Savings", value: `$${netBalance}`, icon: "💰" },
          ]}
        />

        {/* Tab Controls */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white rounded-full p-1 border border-border shadow-sm flex w-full max-w-[500px] mb-6">
            <TabsTrigger value="goals" className="flex-1 rounded-full text-xs font-bold py-2 data-state=active:bg-navy-900 data-state=active:text-white transition-all cursor-pointer">
              Goals
            </TabsTrigger>
            <TabsTrigger value="study" className="flex-1 rounded-full text-xs font-bold py-2 data-state=active:bg-navy-900 data-state=active:text-white transition-all cursor-pointer">
              Study
            </TabsTrigger>
            <TabsTrigger value="money" className="flex-1 rounded-full text-xs font-bold py-2 data-state=active:bg-navy-900 data-state=active:text-white transition-all cursor-pointer">
              Money
            </TabsTrigger>
            <TabsTrigger value="matrix" className="flex-1 rounded-full text-xs font-bold py-2 data-state=active:bg-navy-900 data-state=active:text-white transition-all cursor-pointer">
              ⚡ 365d Matrix
            </TabsTrigger>
          </TabsList>

          {/* Goals Tab */}
          <TabsContent id="goals-analytics" value="goals" className="space-y-6 scroll-mt-24">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-sm border flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Flame className="h-5 w-5 fill-amber-500" />
                </div>
                <div>
                  <h5 className="text-[10px] font-bold text-navy-600 uppercase tracking-wider">Active Streak</h5>
                  <p className="text-xl font-extrabold text-navy-900 mt-0.5">{maxStreak} days</p>
                </div>
              </div>

              <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-sm border flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-mint-600/10 flex items-center justify-center text-mint-600">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-[10px] font-bold text-navy-600 uppercase tracking-wider">Record Streak</h5>
                  <p className="text-xl font-extrabold text-navy-900 mt-0.5">{longestStreakOverall} days</p>
                </div>
              </div>

              <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-sm border flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-lavender-400/20 flex items-center justify-center text-lavender-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-[10px] font-bold text-navy-600 uppercase tracking-wider">Active Habits</h5>
                  <p className="text-xl font-extrabold text-navy-900 mt-0.5">{totalHabits}</p>
                </div>
              </div>
            </div>

            {habitsChartData.length > 0 && (
              <div className="bg-white rounded-[var(--radius-lg)] p-6 shadow-sm border space-y-4">
                <h3 className="font-bold text-sm text-navy-900 uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>
                  Streaks comparison per habit
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={habitsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#565C6B" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                      <YAxis stroke="#565C6B" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                      <Legend />
                      <Bar dataKey="Streak" fill="#F5B942" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="Record" fill="#C9BEEA" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Study Tab */}
          <TabsContent id="study-analytics" value="study" className="space-y-6 scroll-mt-24">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-sm border flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-[10px] font-bold text-navy-600 uppercase tracking-wider">Total Hours</h5>
                  <p className="text-xl font-extrabold text-navy-900 mt-0.5">{totalStudyHours}h</p>
                </div>
              </div>

              <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-sm border flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-mint-600/10 flex items-center justify-center text-mint-600">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-[10px] font-bold text-navy-600 uppercase tracking-wider">Subjects Tracking</h5>
                  <p className="text-xl font-extrabold text-navy-900 mt-0.5">{subjects.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[var(--radius-lg)] p-6 shadow-sm border space-y-4">
              <h3 className="font-bold text-sm text-navy-900 uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>
                Daily Focus Hours Trend
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studyBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#565C6B" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                    <YAxis stroke="#565C6B" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
                    <Tooltip formatter={(v) => [`${v}h`]} contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                    <Bar dataKey="hours" fill="#F0824A" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {testTrendData.length > 0 && (
              <div className="bg-white rounded-[var(--radius-lg)] p-6 shadow-sm border space-y-4">
                <h3 className="font-bold text-sm text-navy-900 uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>
                  Mock Score Trends (%)
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={testTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#565C6B" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                      <YAxis stroke="#565C6B" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip formatter={(v) => [`${v}%`]} contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                      <Line type="monotone" dataKey="score" stroke="#F5B942" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Money Tab */}
          <TabsContent id="money-analytics" value="money" className="space-y-6 scroll-mt-24">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-sm border flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-mint-600/10 flex items-center justify-center text-mint-600">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-[10px] font-bold text-navy-600 uppercase tracking-wider">Total Income</h5>
                  <p className="text-xl font-extrabold text-navy-900 mt-0.5">{totalIncome.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-sm border flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-coral-400/20 flex items-center justify-center text-coral-500">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-[10px] font-bold text-navy-600 uppercase tracking-wider">Total Expense</h5>
                  <p className="text-xl font-extrabold text-navy-900 mt-0.5">{totalExpense.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {expensePieData.length > 0 && (
              <div className="bg-white rounded-[var(--radius-lg)] p-6 shadow-sm border space-y-4">
                <h3 className="font-bold text-sm text-navy-900 uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>
                  Expense Share per Category
                </h3>
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expensePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="bg-white rounded-[var(--radius-lg)] p-6 shadow-sm border space-y-4">
              <h3 className="font-bold text-sm text-navy-900 uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>
                Income vs Expense Bar
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moneyBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#565C6B" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                    <YAxis stroke="#565C6B" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                    <Legend />
                    <Bar dataKey="Income" fill="#7CC3A2" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Expense" fill="#F2A6A0" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          {/* 365-Day Activity Matrix Tab */}
          <TabsContent id="matrix-analytics" value="matrix" className="space-y-6 scroll-mt-24">
            <YearlyActivityMatrix title="365-DAY LIFE MOMENTUM HEATMAP MATRIX" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
