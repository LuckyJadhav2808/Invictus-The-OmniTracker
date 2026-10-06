"use client";

import { useState, useEffect, useMemo } from "react";
import { useHabits, useStreaks } from "@/lib/queries/goals";
import { useSubjects, useStudySessions, useTests } from "@/lib/queries/study";
import { useCategories, useTransactions } from "@/lib/queries/money";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, BookOpen, Wallet, Flame, Trophy, Award, Clock, BarChart2 } from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { useUIStore } from "@/store/ui-store";
import { YearlyActivityMatrix } from "@/components/profile/YearlyActivityMatrix";
import { useAuth } from "@/components/shared/AuthProvider";

export default function AnalyticsHubPage() {
  const { user } = useAuth();
  const { activeTracker } = useUIStore();
  const [activeTab, setActiveTab] = useState(activeTracker === "life" ? "goals" : activeTracker);
  const [currency, setCurrency] = useState("INR");

  // Load currency preferences
  useEffect(() => {
    if (user?.currency) {
      setCurrency(user.currency);
    } else if (typeof window !== "undefined") {
      const profileStr = localStorage.getItem("invictus_user_profile");
      if (profileStr) {
        try {
          const profile = JSON.parse(profileStr);
          if (profile.currency) setCurrency(profile.currency);
        } catch {
          // ignore
        }
      }
    }
  }, [user]);

  const currencySymbol = useMemo(() => {
    switch (currency) {
      case "USD": return "$";
      case "EUR": return "€";
      case "GBP": return "£";
      case "JPY": return "¥";
      default: return "₹";
    }
  }, [currency]);

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

  const studyBarData = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(monday, i);
      const dayStr = format(day, "yyyy-MM-dd");
      const dayName = format(day, "EEE");
      const minutes = studySessions
        .filter((s) => s.date === dayStr)
        .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
      return {
        name: dayName,
        hours: Number((minutes / 60).toFixed(1)),
      };
    });
  }, [studySessions]);

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
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Clean Neobrutalist Analytics Header Card */}
        <div className="neo-card p-5 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-heading font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border-2 border-[#161514] bg-[#7DD3FC] text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] flex items-center gap-1">
                <BarChart2 className="size-3 stroke-[2.5]" />
                <span>Analytics & Insights</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-heading font-black text-[#161514] tracking-tight">
              Life Momentum Hub
            </h1>
            <p className="text-xs font-medium text-[#161514]/70 max-w-lg">
              Cross-module tracking metrics, habit consistency, study volume, and financial performance.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="px-3 py-2 rounded-xl border-2 border-[#161514] bg-[#FAF8F5] shadow-[2px_2px_0px_0px_#161514] text-center min-w-[70px]">
              <span className="text-[9px] font-heading font-black uppercase text-[#161514]/60 block leading-tight">Habits</span>
              <span className="text-sm font-heading font-black text-[#161514]">{totalHabits}</span>
            </div>
            <div className="px-3 py-2 rounded-xl border-2 border-[#161514] bg-purple-50 shadow-[2px_2px_0px_0px_#161514] text-center min-w-[70px]">
              <span className="text-[9px] font-heading font-black uppercase text-purple-700 block leading-tight">Studied</span>
              <span className="text-sm font-heading font-black text-[#161514] flex items-center justify-center gap-1">
                <Clock className="size-3 text-purple-700" />
                {totalStudyHours}h
              </span>
            </div>
            <div className="px-3 py-2 rounded-xl border-2 border-[#161514] bg-emerald-50 shadow-[2px_2px_0px_0px_#161514] text-center min-w-[70px]">
              <span className="text-[9px] font-heading font-black uppercase text-emerald-800 block leading-tight">Savings</span>
              <span className="text-sm font-heading font-black text-emerald-950 flex items-center justify-center gap-1">
                <Wallet className="size-3 text-emerald-700" />
                {currencySymbol}{netBalance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white rounded-2xl sm:rounded-3xl p-1.5 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] flex w-full max-w-[560px] mb-6 gap-1.5 overflow-x-auto no-scrollbar">
            <TabsTrigger
              value="goals"
              className="flex-1 rounded-xl sm:rounded-2xl text-xs font-heading font-extrabold py-2 uppercase tracking-wider border-2 border-transparent transition-all cursor-pointer data-[state=active]:bg-[#161514] data-[state=active]:text-white data-[state=active]:border-[#161514] data-[state=active]:shadow-[1.5px_1.5px_0px_0px_#161514] flex items-center justify-center gap-1.5"
            >
              <Flame className="size-3.5" />
              <span>Goals</span>
            </TabsTrigger>
            <TabsTrigger
              value="study"
              className="flex-1 rounded-xl sm:rounded-2xl text-xs font-heading font-extrabold py-2 uppercase tracking-wider border-2 border-transparent transition-all cursor-pointer data-[state=active]:bg-[#161514] data-[state=active]:text-white data-[state=active]:border-[#161514] data-[state=active]:shadow-[1.5px_1.5px_0px_0px_#161514] flex items-center justify-center gap-1.5"
            >
              <BookOpen className="size-3.5" />
              <span>Study</span>
            </TabsTrigger>
            <TabsTrigger
              value="money"
              className="flex-1 rounded-xl sm:rounded-2xl text-xs font-heading font-extrabold py-2 uppercase tracking-wider border-2 border-transparent transition-all cursor-pointer data-[state=active]:bg-[#161514] data-[state=active]:text-white data-[state=active]:border-[#161514] data-[state=active]:shadow-[1.5px_1.5px_0px_0px_#161514] flex items-center justify-center gap-1.5"
            >
              <Wallet className="size-3.5" />
              <span>Money</span>
            </TabsTrigger>
            <TabsTrigger
              value="matrix"
              className="flex-1 rounded-xl sm:rounded-2xl text-xs font-heading font-extrabold py-2 uppercase tracking-wider border-2 border-transparent transition-all cursor-pointer data-[state=active]:bg-[#CEF431] data-[state=active]:text-[#161514] data-[state=active]:border-[#161514] data-[state=active]:shadow-[1.5px_1.5px_0px_0px_#161514] flex items-center justify-center gap-1.5"
            >
              <Calendar className="size-3.5" />
              <span>Matrix</span>
            </TabsTrigger>
          </TabsList>

          {/* Goals Tab */}
          <TabsContent id="goals-analytics" value="goals" className="space-y-6 scroll-mt-24">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-4 sm:p-5 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex items-center gap-3.5 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                <div className="h-11 w-11 rounded-xl bg-amber-400 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center text-[#161514] shrink-0">
                  <Flame className="h-5 w-5 fill-[#161514]" />
                </div>
                <div>
                  <h5 className="text-[10px] font-black text-[#161514]/70 uppercase tracking-wider">Active Streak</h5>
                  <p className="text-xl font-black text-[#161514] mt-0.5 font-heading">{maxStreak} days</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-5 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex items-center gap-3.5 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                <div className="h-11 w-11 rounded-xl bg-[#03D26F] border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center text-[#161514] shrink-0">
                  <Trophy className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <h5 className="text-[10px] font-black text-[#161514]/70 uppercase tracking-wider">Record Streak</h5>
                  <p className="text-xl font-black text-[#161514] mt-0.5 font-heading">{longestStreakOverall} days</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-5 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex items-center gap-3.5 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                <div className="h-11 w-11 rounded-xl bg-[#C084FC] border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center text-[#161514] shrink-0">
                  <Calendar className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <h5 className="text-[10px] font-black text-[#161514]/70 uppercase tracking-wider">Active Habits</h5>
                  <p className="text-xl font-black text-[#161514] mt-0.5 font-heading">{totalHabits}</p>
                </div>
              </div>
            </div>

            {habitsChartData.length > 0 && (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-4">
                <h3 className="font-black text-xs sm:text-sm text-[#161514] uppercase tracking-wider font-heading">
                  Streaks comparison per habit
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={habitsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#161514" fontSize={11} fontWeight={700} tickLine={false} axisLine={{ stroke: "#161514", strokeWidth: 2 }} />
                      <YAxis stroke="#161514" fontSize={11} fontWeight={700} tickLine={false} axisLine={{ stroke: "#161514", strokeWidth: 2 }} />
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "2px solid #161514", boxShadow: "3px 3px 0px 0px #161514", fontWeight: "bold" }} />
                      <Legend />
                      <Bar dataKey="Streak" fill="#F59E0B" stroke="#161514" strokeWidth={1.5} radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Record" fill="#C084FC" stroke="#161514" strokeWidth={1.5} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Study Tab */}
          <TabsContent id="study-analytics" value="study" className="space-y-6 scroll-mt-24">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-4 sm:p-5 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex items-center gap-3.5 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                <div className="h-11 w-11 rounded-xl bg-orange-400 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center text-[#161514] shrink-0">
                  <Clock className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <h5 className="text-[10px] font-black text-[#161514]/70 uppercase tracking-wider">Total Hours</h5>
                  <p className="text-xl font-black text-[#161514] mt-0.5 font-heading">{totalStudyHours}h</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-5 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex items-center gap-3.5 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                <div className="h-11 w-11 rounded-xl bg-[#CEF431] border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center text-[#161514] shrink-0">
                  <Award className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <h5 className="text-[10px] font-black text-[#161514]/70 uppercase tracking-wider">Subjects Tracking</h5>
                  <p className="text-xl font-black text-[#161514] mt-0.5 font-heading">{subjects.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 sm:p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-4">
              <h3 className="font-black text-xs sm:text-sm text-[#161514] uppercase tracking-wider font-heading">
                Daily Focus Hours Trend
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studyBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#161514" fontSize={11} fontWeight={700} tickLine={false} axisLine={{ stroke: "#161514", strokeWidth: 2 }} />
                    <YAxis stroke="#161514" fontSize={11} fontWeight={700} tickLine={false} axisLine={{ stroke: "#161514", strokeWidth: 2 }} tickFormatter={(v) => `${v}h`} />
                    <Tooltip formatter={(v) => [`${v}h`]} contentStyle={{ borderRadius: "12px", border: "2px solid #161514", boxShadow: "3px 3px 0px 0px #161514", fontWeight: "bold" }} />
                    <Bar dataKey="hours" fill="#FB923C" stroke="#161514" strokeWidth={1.5} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {testTrendData.length > 0 && (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-4">
                <h3 className="font-black text-xs sm:text-sm text-[#161514] uppercase tracking-wider font-heading">
                  Mock Score Trends (%)
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={testTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#161514" fontSize={11} fontWeight={700} tickLine={false} axisLine={{ stroke: "#161514", strokeWidth: 2 }} />
                      <YAxis stroke="#161514" fontSize={11} fontWeight={700} tickLine={false} axisLine={{ stroke: "#161514", strokeWidth: 2 }} domain={[0, 100]} />
                      <Tooltip formatter={(v) => [`${v}%`]} contentStyle={{ borderRadius: "12px", border: "2px solid #161514", boxShadow: "3px 3px 0px 0px #161514", fontWeight: "bold" }} />
                      <Line type="monotone" dataKey="score" stroke="#F59E0B" strokeWidth={3.5} dot={{ r: 5, fill: "#F59E0B", stroke: "#161514", strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Money Tab */}
          <TabsContent id="money-analytics" value="money" className="space-y-6 scroll-mt-24">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-4 sm:p-5 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex items-center gap-3.5 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                <div className="h-11 w-11 rounded-xl bg-[#03D26F] border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center text-[#161514] shrink-0">
                  <Wallet className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <h5 className="text-[10px] font-black text-[#161514]/70 uppercase tracking-wider">Total Income</h5>
                  <p className="text-xl font-black text-[#03D26F] mt-0.5 font-heading">{currencySymbol}{totalIncome.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-5 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex items-center gap-3.5 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                <div className="h-11 w-11 rounded-xl bg-rose-400 border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center text-[#161514] shrink-0">
                  <Wallet className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <h5 className="text-[10px] font-black text-[#161514]/70 uppercase tracking-wider">Total Expense</h5>
                  <p className="text-xl font-black text-rose-600 mt-0.5 font-heading">{currencySymbol}{totalExpense.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {expensePieData.length > 0 && (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-4">
                <h3 className="font-black text-xs sm:text-sm text-[#161514] uppercase tracking-wider font-heading">
                  Expense Share per Category
                </h3>
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="#161514"
                        strokeWidth={2}
                      >
                        {expensePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "2px solid #161514", boxShadow: "3px 3px 0px 0px #161514", fontWeight: "bold" }} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl p-5 sm:p-6 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-4">
              <h3 className="font-black text-xs sm:text-sm text-[#161514] uppercase tracking-wider font-heading">
                Income vs Expense Bar
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moneyBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#161514" fontSize={11} fontWeight={700} tickLine={false} axisLine={{ stroke: "#161514", strokeWidth: 2 }} />
                    <YAxis stroke="#161514" fontSize={11} fontWeight={700} tickLine={false} axisLine={{ stroke: "#161514", strokeWidth: 2 }} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "2px solid #161514", boxShadow: "3px 3px 0px 0px #161514", fontWeight: "bold" }} />
                    <Legend />
                    <Bar dataKey="Income" fill="#03D26F" stroke="#161514" strokeWidth={1.5} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Expense" fill="#FB7185" stroke="#161514" strokeWidth={1.5} radius={[6, 6, 0, 0]} />
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
