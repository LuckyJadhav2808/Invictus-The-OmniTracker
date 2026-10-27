import { format, subDays, addDays, subMonths } from "date-fns";
import { TaskItem, Habit, Subject, Topic, StudySession, Test, Category, Transaction, Debt } from "@/types";

export const DEMO_DATA_FLAG_KEY = "invictus_demo_data_active";

export function isDemoDataActive(): boolean {
  if (typeof window === "undefined" && typeof localStorage === "undefined") return false;
  return localStorage.getItem(DEMO_DATA_FLAG_KEY) === "true";
}

/**
 * Generates a clean, calibrated evaluator showcase dataset with dynamic relative timestamps.
 * Benchmarked for students, indie builders, and evaluators: lightweight, realistic, and zero clutter.
 */
export function generateEvaluatorDemoDataset() {
  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  const yesterdayStr = format(subDays(now, 1), "yyyy-MM-dd");
  const tomorrowStr = format(addDays(now, 1), "yyyy-MM-dd");
  const currentMonthKey = format(now, "yyyy-MM");
  const lastMonthKey = format(subMonths(now, 1), "yyyy-MM");

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. TASKS SPACE (invictus_tasks_db) - Exactly 3 crisp, purposeful tasks
  // ─────────────────────────────────────────────────────────────────────────────
  const tasks: TaskItem[] = [
    {
      id: "demo_task_1",
      userId: "guest-user",
      title: "Finalize Next.js Server Action Optimizations",
      description: "Audit layout thrashing, implement cache invalidation, and benchmark load times.",
      status: "in_progress",
      priority: "p1",
      dueDate: todayStr,
      projectTag: "Engineering",
      orderKey: "a0",
      subtasks: [
        { id: "st_1", title: "Profile React Server Components payload", completed: true },
        { id: "st_2", title: "Add optimistic UI rollback tests", completed: true },
        { id: "st_3", title: "Verify mobile safe-area insets", completed: false },
      ],
      createdAt: new Date(subDays(now, 2)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo_task_2",
      userId: "guest-user",
      title: "Review Computer Networks Chapter 3 (TCP Congestion)",
      description: "Review TCP slow start, congestion avoidance, and fast retransmit flashcards.",
      status: "todo",
      priority: "p2",
      dueDate: tomorrowStr,
      projectTag: "Academics",
      orderKey: "a1",
      subtasks: [
        { id: "st_4", title: "Solve 3 practice problems on sliding window", completed: false },
      ],
      createdAt: new Date(subDays(now, 1)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo_task_3",
      userId: "guest-user",
      title: "Submit Database Management Systems Lab Report",
      description: "B-Tree indexing and query optimization analysis document.",
      status: "completed",
      priority: "p3",
      dueDate: yesterdayStr,
      completedAt: new Date(subDays(now, 1)).toISOString(),
      projectTag: "Academics",
      orderKey: "a2",
      subtasks: [
        { id: "st_5", title: "Export EXPLAIN query plan graphs", completed: true },
      ],
      createdAt: new Date(subDays(now, 3)).toISOString(),
      updatedAt: new Date(subDays(now, 1)).toISOString(),
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. HABITS & LIFE SPACE - 4 Core Habits & 7-Day History
  // ─────────────────────────────────────────────────────────────────────────────
  const habits: Habit[] = [
    {
      id: "demo_h_water",
      title: "500ml Water Upon Waking",
      icon: "Droplet",
      color: "sky",
      frequency: { type: "daily", targetPerDay: 1 },
      reminderTime: "07:00 AM",
      allowGraceSkip: true,
      isGoalStyle: true,
      goalTarget: 500,
      goalUnit: "ml",
      archived: false,
      createdAt: new Date(subDays(now, 7)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo_h_steps",
      title: "10,000 Daily Steps",
      icon: "Flame",
      color: "emerald",
      frequency: { type: "daily", targetPerDay: 1 },
      reminderTime: "06:00 PM",
      allowGraceSkip: false,
      isGoalStyle: true,
      goalTarget: 10000,
      goalUnit: "steps",
      archived: false,
      createdAt: new Date(subDays(now, 7)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo_h_reading",
      title: "Read 15 Pages of Non-Fiction",
      icon: "BookOpen",
      color: "amber",
      frequency: { type: "daily", targetPerDay: 1 },
      reminderTime: "08:30 PM",
      allowGraceSkip: false,
      isGoalStyle: true,
      goalTarget: 15,
      goalUnit: "pages",
      archived: false,
      createdAt: new Date(subDays(now, 7)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo_h_deepwork",
      title: "90-Min Deep Work Sprint",
      icon: "Target",
      color: "purple",
      frequency: { type: "daily", targetPerDay: 1 },
      reminderTime: "09:30 AM",
      allowGraceSkip: true,
      isGoalStyle: true,
      goalTarget: 90,
      goalUnit: "mins",
      archived: false,
      createdAt: new Date(subDays(now, 7)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Populate past 7 days of realistic habit logs (instead of 30 days)
  const habitLogs: any[] = [];
  const streaks: Record<string, any> = {
    demo_h_water: { habitId: "demo_h_water", currentStreak: 6, longestStreak: 7, lastCompletedDate: todayStr },
    demo_h_steps: { habitId: "demo_h_steps", currentStreak: 4, longestStreak: 5, lastCompletedDate: todayStr },
    demo_h_reading: { habitId: "demo_h_reading", currentStreak: 5, longestStreak: 6, lastCompletedDate: yesterdayStr },
    demo_h_deepwork: { habitId: "demo_h_deepwork", currentStreak: 4, longestStreak: 5, lastCompletedDate: todayStr },
  };

  for (let i = 6; i >= 0; i--) {
    const dStr = format(subDays(now, i), "yyyy-MM-dd");
    const isToday = i === 0;

    // Water logged 6 of 7 days
    if (i !== 3) {
      habitLogs.push({ id: `demo_h_water_${dStr}`, habitId: "demo_h_water", date: dStr, completed: true, countLogged: 1 });
    }
    // Steps logged 5 of 7 days
    if (i !== 2 && i !== 5) {
      habitLogs.push({ id: `demo_h_steps_${dStr}`, habitId: "demo_h_steps", date: dStr, completed: true, countLogged: 1 });
    }
    // Reading logged 5 of 7 days
    if (i <= 5 && !isToday) {
      habitLogs.push({ id: `demo_h_reading_${dStr}`, habitId: "demo_h_reading", date: dStr, completed: true, countLogged: 1 });
    }
    // Deep work logged weekdays
    if (i % 7 !== 0 && i % 7 !== 6) {
      habitLogs.push({ id: `demo_h_deepwork_${dStr}`, habitId: "demo_h_deepwork", date: dStr, completed: true, countLogged: 1 });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. THE IRON ARENA GYM ROUTINES - 1 Clean Push Day Routine
  // ─────────────────────────────────────────────────────────────────────────────
  const gymRoutines = [
    {
      id: "gr_mon_push",
      dayOfWeek: "Monday",
      title: "Push Day A (Hypertrophy)",
      notes: "Focus on controlled eccentric on bench and full tricep stretch on cable extensions.",
      exercises: [
        {
          id: "ex_1",
          name: "Incline Dumbbell Bench Press",
          targetMuscle: "Chest",
          equipment: "Dumbbells",
          sets: [
            { id: "s1", setNumber: 1, weight: 28, reps: 10, completed: true, targetReps: 10, previousWeight: 26, previousReps: 10 },
            { id: "s2", setNumber: 2, weight: 30, reps: 8, completed: true, targetReps: 8, previousWeight: 28, previousReps: 8 },
            { id: "s3", setNumber: 3, weight: 32, reps: 8, completed: false, targetReps: 8, previousWeight: 30, previousReps: 8 },
          ],
        },
        {
          id: "ex_2",
          name: "Standing Dumbbell Lateral Raise",
          targetMuscle: "Shoulders",
          equipment: "Dumbbells",
          sets: [
            { id: "s4", setNumber: 1, weight: 10, reps: 15, completed: true, targetReps: 15 },
            { id: "s5", setNumber: 2, weight: 12, reps: 12, completed: true, targetReps: 12 },
          ],
        },
        {
          id: "ex_3",
          name: "Tricep Cable Rope Pushdown",
          targetMuscle: "Triceps",
          equipment: "Cable",
          sets: [
            { id: "s6", setNumber: 1, weight: 25, reps: 15, completed: true, targetReps: 15 },
            { id: "s7", setNumber: 2, weight: 30, reps: 12, completed: false, targetReps: 12 },
          ],
        },
      ],
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. THE MACRO FORGE NUTRITION - Streamlined Targets & Today's Meals
  // ─────────────────────────────────────────────────────────────────────────────
  const nutritionTargets = {
    calories: 2200,
    protein: 135,
    carbs: 230,
    fat: 60,
  };

  const mealPlans = [
    {
      id: "meal_demo_1",
      date: todayStr,
      name: "Oatmeal, Whey Protein & Peanut Butter Bowl",
      mealType: "Breakfast",
      calories: 520,
      protein: 40,
      carbs: 55,
      fat: 15,
      time: "08:30 AM",
      completed: true,
    },
    {
      id: "meal_demo_2",
      date: todayStr,
      name: "Grilled Paneer / Chicken Rice Bowl with Greens",
      mealType: "Lunch",
      calories: 650,
      protein: 48,
      carbs: 70,
      fat: 16,
      time: "01:15 PM",
      completed: true,
    },
    {
      id: "meal_demo_3",
      date: todayStr,
      name: "Greek Yogurt Parfait & Almonds",
      mealType: "Snack",
      calories: 280,
      protein: 22,
      carbs: 28,
      fat: 8,
      time: "05:00 PM",
      completed: true,
    },
    {
      id: "meal_demo_4",
      date: todayStr,
      name: "Tofu / Salmon Quinoa Bowl",
      mealType: "Dinner",
      calories: 550,
      protein: 36,
      carbs: 45,
      fat: 14,
      time: "08:30 PM",
      completed: false,
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. STUDY SPACE - 2 Core Subjects & 3 Topics
  // ─────────────────────────────────────────────────────────────────────────────
  const subjects: Subject[] = [
    {
      id: "demo_sub_cs",
      name: "Computer Networks & Protocols",
      color: "indigo",
      icon: "Cpu",
      archived: false,
      createdAt: new Date(subDays(now, 10)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo_sub_dbms",
      name: "Database Management Systems",
      color: "emerald",
      icon: "Binary",
      archived: false,
      createdAt: new Date(subDays(now, 10)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const topics: Topic[] = [
    {
      id: "demo_top_1",
      subjectId: "demo_sub_cs",
      title: "TCP 3-Way Handshake & Flow Control",
      status: "completed",
      estimatedHours: 3,
      loggedHours: 2.5,
      confidence: 5,
      revisionsCount: 3,
      easinessFactor: 2.5,
      intervalDays: 4,
      nextRevisionDate: format(addDays(now, 3), "yyyy-MM-dd"),
      lastRevisedAt: yesterdayStr,
      notes: "SYN, SYN-ACK, ACK. Sliding window buffer flow control.",
      resourceLinks: [],
      order: 0,
      createdAt: new Date(subDays(now, 7)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo_top_2",
      subjectId: "demo_sub_cs",
      title: "TCP Congestion Avoidance & Fast Recovery",
      status: "needsRevision",
      estimatedHours: 3,
      loggedHours: 1.5,
      confidence: 3,
      revisionsCount: 2,
      easinessFactor: 2.3,
      intervalDays: 2,
      nextRevisionDate: todayStr,
      lastRevisedAt: format(subDays(now, 2), "yyyy-MM-dd"),
      notes: "Slow start threshold (ssthresh), additive increase multiplicative decrease (AIMD).",
      resourceLinks: [],
      order: 1,
      createdAt: new Date(subDays(now, 6)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo_top_3",
      subjectId: "demo_sub_dbms",
      title: "B+ Tree Indexing & Query Execution Plans",
      status: "completed",
      estimatedHours: 4,
      loggedHours: 3.5,
      confidence: 4,
      revisionsCount: 3,
      easinessFactor: 2.6,
      intervalDays: 5,
      nextRevisionDate: format(addDays(now, 4), "yyyy-MM-dd"),
      lastRevisedAt: format(subDays(now, 3), "yyyy-MM-dd"),
      notes: "B+ Tree node fanout, clustered vs secondary indexing, range scan optimality.",
      resourceLinks: [],
      order: 0,
      createdAt: new Date(subDays(now, 8)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const studySessions: StudySession[] = [
    {
      id: "demo_sess_1",
      subjectId: "demo_sub_cs",
      topicId: "demo_top_1",
      date: yesterdayStr,
      durationMinutes: 60,
      type: "revision",
      notes: "Reviewed TCP handshake wireshark captures.",
      createdAt: new Date(subDays(now, 1)).toISOString(),
    },
  ];

  const tests: Test[] = [
    {
      id: "demo_test_1",
      name: "Computer Networks Mid-Semester Exam",
      date: format(addDays(now, 10), "yyyy-MM-dd"),
      scope: ["demo_sub_cs"],
      score: 88,
      totalScore: 100,
      timeTakenMinutes: 60,
      weakAreas: ["Congestion Control Window calculations"],
      createdAt: new Date().toISOString(),
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. MONEY SPACE - Calibrated, Normal Daily Transactions (Zero Clutter)
  // ─────────────────────────────────────────────────────────────────────────────
  const categories: Category[] = [
    { id: "cat-salary", name: "Salary & Stipends", type: "income", icon: "DollarSign", color: "mint", archived: false },
    { id: "cat-food", name: "Food & Dining", type: "expense", icon: "Coffee", color: "coral", monthlyBudget: 4000, archived: false },
    { id: "cat-groceries", name: "Groceries & Kitchen", type: "expense", icon: "ShoppingBag", color: "mint", monthlyBudget: 3000, archived: false },
    { id: "cat-transport", name: "Commute & Transit", type: "expense", icon: "Car", color: "orange", monthlyBudget: 1500, archived: false },
    { id: "cat-education", name: "Books & Study", type: "expense", icon: "BookOpen", color: "indigo", monthlyBudget: 1500, archived: false },
    { id: "cat-bills", name: "Tech & Subscriptions", type: "expense", icon: "Zap", color: "sky", monthlyBudget: 1000, archived: false },
  ];

  const transactions: Transaction[] = [
    // Today
    {
      id: "tx_demo_1",
      amount: 140,
      type: "expense",
      categoryId: "cat-food",
      date: todayStr,
      note: "Campus Cafeteria Lunch Bowl",
      paymentMethod: "upi",
      isRecurring: false,
    },
    {
      id: "tx_demo_2",
      amount: 40,
      type: "expense",
      categoryId: "cat-transport",
      date: todayStr,
      note: "Metro Transit Smart Card",
      paymentMethod: "cash",
      isRecurring: false,
    },
    // Yesterday
    {
      id: "tx_demo_3",
      amount: 350,
      type: "expense",
      categoryId: "cat-groceries",
      date: yesterdayStr,
      note: "Oats, Fruits & Greek Yogurt",
      paymentMethod: "upi",
      isRecurring: false,
    },
    // Past 3 days
    {
      id: "tx_demo_4",
      amount: 180,
      type: "expense",
      categoryId: "cat-education",
      date: format(subDays(now, 3), "yyyy-MM-dd"),
      note: "Engineering Spiral Notebooks & Pens",
      paymentMethod: "cash",
      isRecurring: false,
    },
    // Inflow Income
    {
      id: "tx_demo_5",
      amount: 8000,
      type: "income",
      categoryId: "cat-salary",
      date: format(subDays(now, 5), "yyyy-MM-dd"),
      note: "Research Assistant Monthly Stipend",
      paymentMethod: "bank",
      isRecurring: true,
    },
  ];

  const debts: Debt[] = [
    {
      id: "debt_demo_1",
      userId: "guest-user",
      personName: "Alex Vance (Lab Partner)",
      type: "lent",
      amount: 200,
      note: "Lent for lab manual printing split",
      dueDate: format(addDays(now, 5), "yyyy-MM-dd"),
      status: "pending",
      createdAt: new Date(subDays(now, 2)).toISOString(),
    },
  ];

  const savingsGoals = [
    {
      id: "goal_demo_laptop",
      name: "Laptop Setup Upgrade Fund",
      targetAmount: 25000,
      currentAmount: 18000,
      icon: "Laptop",
      color: "indigo",
      targetDate: format(addDays(now, 60), "yyyy-MM-dd"),
    },
  ];

  const subscriptions = [
    {
      id: "sub_spotify",
      name: "Spotify Student Premium",
      amount: 59,
      billingCycle: "monthly",
      nextBillingDate: format(addDays(now, 14), "yyyy-MM-dd"),
      category: "Entertainment",
      icon: "Music",
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. TODAY DASHBOARD & SCRATCHPAD
  // ─────────────────────────────────────────────────────────────────────────────
  const scratchpadContent = `# ⚡ FOUNDER & STUDENT RADAR
- [ ] Finalize Next.js Server Action benchmarks @p1
- [ ] Review TCP congestion control notes #CS
- [x] Paid ₹140 for cafeteria lunch #Food
- [x] Read 15 pages of technical book`;

  return {
    todayStr,
    currentMonthKey,
    lastMonthKey,
    tasks,
    habits,
    habitLogs,
    streaks,
    gymRoutines,
    nutritionTargets,
    mealPlans,
    subjects,
    topics,
    studySessions,
    tests,
    categories,
    transactions,
    debts,
    savingsGoals,
    subscriptions,
    scratchpadContent,
  };
}

/**
 * Loads the complete evaluator showcase dataset into localStorage and sets active flags.
 */
export function loadEvaluatorDemoData(): boolean {
  if (typeof window === "undefined" && typeof localStorage === "undefined") return false;

  // SAFETY AIR-GAP: Strictly block demo data loading if an active authenticated main account is detected!
  if (typeof window !== "undefined") {
    try {
      const activeUserStr = localStorage.getItem("invictus_active_user");
      const sessionToken = localStorage.getItem("invictus_custom_session_token");
      if (activeUserStr && sessionToken) {
        const parsed = JSON.parse(activeUserStr);
        if (parsed.uid && parsed.uid !== "guest-user") {
          console.warn("[DEMO SEED BLOCKED]: Active main user account detected. Demo seed rejected to protect user data.");
          return false;
        }
      }
    } catch {}
  }

  try {
    const data = generateEvaluatorDemoDataset();

    // 1. Tasks
    localStorage.setItem("invictus_tasks_db", JSON.stringify(data.tasks));

    // 2. Habits & Life Space
    localStorage.setItem("invictus_habits", JSON.stringify(data.habits));
    localStorage.setItem("invictus_habit_logs", JSON.stringify(data.habitLogs));
    localStorage.setItem("invictus_streaks", JSON.stringify(data.streaks));
    localStorage.setItem(
      "invictus_streak_freeze",
      JSON.stringify({
        userId: "guest-user",
        tokensAvailable: 2,
        lastMonthlyCredit: data.currentMonthKey,
        frozenDates: [],
        autoShieldEvent: null,
      })
    );
    localStorage.setItem(`invictus_water_${data.todayStr}`, "2000");
    localStorage.setItem("invictus_water_goal", "3000");
    localStorage.setItem(
      `invictus_mood_${data.todayStr}`,
      JSON.stringify({
        dateStr: data.todayStr,
        rating: 4,
        energy: 4,
        tags: ["high_focus", "flow_state"],
        note: "Crushed 90m deep work sprint on Invictus.",
      })
    );

    // 3. Gym & Nutrition
    localStorage.setItem("invictus_gym_routines", JSON.stringify(data.gymRoutines));
    localStorage.setItem("invictus_nutrition_targets", JSON.stringify(data.nutritionTargets));
    localStorage.setItem("invictus_meal_plans", JSON.stringify(data.mealPlans));

    // 4. Study
    localStorage.setItem("invictus_subjects", JSON.stringify(data.subjects));
    localStorage.setItem("invictus_topics", JSON.stringify(data.topics));
    localStorage.setItem("invictus_study_sessions", JSON.stringify(data.studySessions));
    localStorage.setItem("invictus_tests", JSON.stringify(data.tests));

    // 5. Money
    localStorage.setItem("invictus_categories", JSON.stringify(data.categories));
    localStorage.setItem("invictus_transactions", JSON.stringify(data.transactions));
    localStorage.setItem("invictus_debts", JSON.stringify(data.debts));
    localStorage.setItem("invictus_savings_goals", JSON.stringify(data.savingsGoals));
    localStorage.setItem("invictus_subscriptions", JSON.stringify(data.subscriptions));
    localStorage.setItem("invictus_monthly_upi_budget", "8000");
    localStorage.setItem("invictus_monthly_cash_budget", "2000");
    localStorage.setItem("invictus_enable_rollover", "true");
    localStorage.setItem("invictus_custom_daily_budget", "350");

    // 6. Scratchpad
    localStorage.setItem("invictus_sticky_scratchpad", data.scratchpadContent);

    // 7. Profile & Session (Only set if not a real authenticated user)
    const activeUserStr = typeof window !== "undefined" ? localStorage.getItem("invictus_active_user") : null;
    const sessionToken = typeof window !== "undefined" ? localStorage.getItem("invictus_custom_session_token") : null;
    const isMainUser = activeUserStr && sessionToken;

    if (!isMainUser) {
      localStorage.setItem("invictus_guest_mode", "true");
      localStorage.setItem("invictus_guest_name", "Alex Vance (Guest Evaluator)");
      localStorage.setItem("invictus_onboarded", "true");
      localStorage.setItem(
        "invictus_user_profile",
        JSON.stringify({
          displayName: "Alex Vance",
          age: "21 Years",
          weight: "70 kg",
          gender: "Male",
          waterGoal: 3000,
          currency: "INR",
          timezone: "Asia/Kolkata",
          weekStartsOn: 1,
          modulesEnabled: { goals: true, study: true, money: true },
        })
      );
    }

    // Mark demo data active
    localStorage.setItem(DEMO_DATA_FLAG_KEY, "true");
    return true;
  } catch (err) {
    console.error("Failed to load evaluator demo data:", err);
    return false;
  }
}

/**
 * Wipes all demo records cleanly from localStorage without destroying the guest session token.
 */
export function clearEvaluatorDemoData(): boolean {
  if (typeof window === "undefined" && typeof localStorage === "undefined") return false;

  // SAFETY AIR-GAP: Protect main accounts from accidental demo purging
  if (typeof window !== "undefined") {
    try {
      const isGuest = localStorage.getItem("invictus_guest_mode") === "true";
      const isDemoActive = localStorage.getItem(DEMO_DATA_FLAG_KEY) === "true";
      const activeUserStr = localStorage.getItem("invictus_active_user");
      if (activeUserStr && !isGuest && !isDemoActive) {
        const parsed = JSON.parse(activeUserStr);
        if (parsed.uid && parsed.uid !== "guest-user") {
          console.warn("[DEMO PURGE BLOCKED]: Active main account without demo flag. Clearance rejected to protect user data.");
          return false;
        }
      }
    } catch {}
  }

  try {
    const keysToPurge = [
      "invictus_tasks_db",
      "invictus_habits",
      "invictus_habit_logs",
      "invictus_streaks",
      "invictus_streak_freeze",
      "invictus_gym_routines",
      "invictus_nutrition_targets",
      "invictus_meal_plans",
      "invictus_subjects",
      "invictus_topics",
      "invictus_study_sessions",
      "invictus_tests",
      "invictus_categories",
      "invictus_transactions",
      "invictus_debts",
      "invictus_savings_goals",
      "invictus_subscriptions",
      "invictus_monthly_upi_budget",
      "invictus_monthly_cash_budget",
      "invictus_enable_rollover",
      "invictus_custom_daily_budget",
      "invictus_sticky_scratchpad",
      DEMO_DATA_FLAG_KEY,
    ];

    keysToPurge.forEach((key) => localStorage.removeItem(key));

    // Also remove date-keyed items (water, mood, budget months, workouts)
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (
        k &&
        (k.startsWith("invictus_water_") ||
          k.startsWith("invictus_mood_") ||
          k.startsWith("invictus_workouts_") ||
          k.startsWith("invictus_diet_") ||
          k.startsWith("invictus_macros_") ||
          k.startsWith("invictus_monthly_"))
      ) {
        localStorage.removeItem(k);
      }
    }

    return true;
  } catch (err) {
    console.error("Failed to clear evaluator demo data:", err);
    return false;
  }
}
