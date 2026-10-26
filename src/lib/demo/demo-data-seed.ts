import { format, subDays, addDays, subMonths } from "date-fns";
import { TaskItem, Habit, Subject, Topic, StudySession, Test, Category, Transaction, Debt } from "@/types";

export const DEMO_DATA_FLAG_KEY = "invictus_demo_data_active";

export function isDemoDataActive(): boolean {
  if (typeof window === "undefined" && typeof localStorage === "undefined") return false;
  return localStorage.getItem(DEMO_DATA_FLAG_KEY) === "true";
}

/**
 * Generates an exhaustive, high-utility evaluator showcase dataset with dynamic relative timestamps.
 * Benchmarked for students, indie builders, and evaluators.
 */
export function generateEvaluatorDemoDataset() {
  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  const yesterdayStr = format(subDays(now, 1), "yyyy-MM-dd");
  const tomorrowStr = format(addDays(now, 1), "yyyy-MM-dd");
  const dayAfterTomorrowStr = format(addDays(now, 2), "yyyy-MM-dd");
  const currentMonthKey = format(now, "yyyy-MM");
  const lastMonthKey = format(subMonths(now, 1), "yyyy-MM");

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. TASKS SPACE (invictus_tasks_db)
  // ─────────────────────────────────────────────────────────────────────────────
  const tasks: TaskItem[] = [
    {
      id: "demo_task_1",
      userId: "guest-user",
      title: "Finalize Next.js 15 Server Action Optimizations",
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
      title: "Review Discrete Mathematics Chapter 4 Graph Algorithms",
      description: "Prepare Dijkstra, Bellman-Ford, and topological sort flashcard deck for final exam.",
      status: "todo",
      priority: "p2",
      dueDate: todayStr,
      projectTag: "Academics",
      orderKey: "a1",
      subtasks: [
        { id: "st_4", title: "Solve 5 practice problems on Euler circuits", completed: false },
        { id: "st_5", title: "Review adjacency matrix proofs", completed: false },
      ],
      createdAt: new Date(subDays(now, 1)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo_task_3",
      userId: "guest-user",
      title: "Submit Distributed Systems Lab Report 2",
      description: "Document Raft consensus leader election implementation and test under network partition.",
      status: "todo",
      priority: "p1",
      dueDate: tomorrowStr,
      projectTag: "Academics",
      orderKey: "a2",
      subtasks: [
        { id: "st_6", title: "Run 3-node chaos simulation", completed: true },
        { id: "st_7", title: "Write partition recovery conclusion", completed: false },
      ],
      createdAt: new Date(subDays(now, 3)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo_task_4",
      userId: "guest-user",
      title: "Weekly Budget & Cashflow Audit",
      description: "Review UPI transactions, reconcile petty cash expenses, and check remaining rollover.",
      status: "todo",
      priority: "p3",
      dueDate: dayAfterTomorrowStr,
      projectTag: "Finances",
      orderKey: "a3",
      subtasks: [],
      createdAt: new Date(subDays(now, 1)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo_task_5",
      userId: "guest-user",
      title: "Design Neobrutalist UI components for Life Space",
      description: "Craft 4-stage gym and nutrition studios with hard drop shadows and ink borders.",
      status: "completed",
      priority: "p2",
      dueDate: yesterdayStr,
      completedAt: new Date(subDays(now, 1)).toISOString(),
      projectTag: "Design",
      orderKey: "a4",
      subtasks: [
        { id: "st_8", title: "Target Muscle Body SVG layout", completed: true },
        { id: "st_9", title: "Caloric Fuel Distribution Bar", completed: true },
      ],
      createdAt: new Date(subDays(now, 4)).toISOString(),
      updatedAt: new Date(subDays(now, 1)).toISOString(),
    },
    {
      id: "demo_task_6",
      userId: "guest-user",
      title: "Book train tickets for Regional Hackathon",
      description: "Confirm ticket reservations and hotel room for hackathon weekend.",
      status: "completed",
      priority: "p3",
      dueDate: yesterdayStr,
      completedAt: new Date(subDays(now, 1)).toISOString(),
      projectTag: "Personal",
      orderKey: "a5",
      subtasks: [],
      createdAt: new Date(subDays(now, 5)).toISOString(),
      updatedAt: new Date(subDays(now, 1)).toISOString(),
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. HABITS & LIFE SPACE (invictus_habits, logs, streaks, water)
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
      createdAt: new Date(subDays(now, 30)).toISOString(),
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
      createdAt: new Date(subDays(now, 30)).toISOString(),
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
      createdAt: new Date(subDays(now, 30)).toISOString(),
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
      createdAt: new Date(subDays(now, 30)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo_h_protein",
      title: "Hit 140g Protein Target",
      icon: "Apple",
      color: "emerald",
      frequency: { type: "daily", targetPerDay: 1 },
      reminderTime: "08:00 PM",
      allowGraceSkip: false,
      isGoalStyle: true,
      goalTarget: 140,
      goalUnit: "g",
      archived: false,
      createdAt: new Date(subDays(now, 30)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo_h_sleep",
      title: "Sleep by 10:45 PM",
      icon: "Moon",
      color: "purple",
      frequency: { type: "daily", targetPerDay: 1 },
      reminderTime: "10:30 PM",
      allowGraceSkip: true,
      isGoalStyle: false,
      archived: false,
      createdAt: new Date(subDays(now, 30)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Generate 30 days of realistic habit logs for the heatmap & velocity charts
  const habitLogs: any[] = [];
  const streaks: Record<string, any> = {
    demo_h_water: { habitId: "demo_h_water", currentStreak: 14, longestStreak: 21, lastCompletedDate: todayStr },
    demo_h_steps: { habitId: "demo_h_steps", currentStreak: 9, longestStreak: 18, lastCompletedDate: todayStr },
    demo_h_reading: { habitId: "demo_h_reading", currentStreak: 21, longestStreak: 21, lastCompletedDate: yesterdayStr },
    demo_h_deepwork: { habitId: "demo_h_deepwork", currentStreak: 12, longestStreak: 15, lastCompletedDate: todayStr },
    demo_h_protein: { habitId: "demo_h_protein", currentStreak: 8, longestStreak: 14, lastCompletedDate: todayStr },
    demo_h_sleep: { habitId: "demo_h_sleep", currentStreak: 5, longestStreak: 10, lastCompletedDate: yesterdayStr },
  };

  // Populate 30 days of history
  for (let i = 29; i >= 0; i--) {
    const dStr = format(subDays(now, i), "yyyy-MM-dd");
    const isToday = i === 0;

    // Log water for almost every day
    if (i < 28) {
      habitLogs.push({ id: `demo_h_water_${dStr}`, habitId: "demo_h_water", date: dStr, completed: true, countLogged: 1 });
    }
    // Steps logged for ~85% of days
    if (i % 7 !== 3) {
      habitLogs.push({ id: `demo_h_steps_${dStr}`, habitId: "demo_h_steps", date: dStr, completed: true, countLogged: 1 });
    }
    // Reading logged for consecutive streak
    if (i <= 21 && !isToday) {
      habitLogs.push({ id: `demo_h_reading_${dStr}`, habitId: "demo_h_reading", date: dStr, completed: true, countLogged: 1 });
    }
    // Deep work logged weekdays
    if (i % 7 !== 0 && i % 7 !== 6) {
      habitLogs.push({ id: `demo_h_deepwork_${dStr}`, habitId: "demo_h_deepwork", date: dStr, completed: true, countLogged: 1 });
    }
    // Protein target logged
    if (i < 8 || (i > 10 && i < 20)) {
      habitLogs.push({ id: `demo_h_protein_${dStr}`, habitId: "demo_h_protein", date: dStr, completed: true, countLogged: 1 });
    }
    // Sleep logged
    if (i < 6) {
      habitLogs.push({ id: `demo_h_sleep_${dStr}`, habitId: "demo_h_sleep", date: dStr, completed: true, countLogged: 1 });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. THE IRON ARENA GYM ROUTINES (invictus_gym_routines)
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
            { id: "s3", setNumber: 3, weight: 32, reps: 8, completed: true, targetReps: 8, previousWeight: 30, previousReps: 8 },
            { id: "s4", setNumber: 4, weight: 32, reps: 6, completed: false, targetReps: 8, previousWeight: 32, previousReps: 7 },
          ],
        },
        {
          id: "ex_2",
          name: "Standing Dumbbell Lateral Raise",
          targetMuscle: "Shoulders",
          equipment: "Dumbbells",
          sets: [
            { id: "s5", setNumber: 1, weight: 10, reps: 15, completed: true, targetReps: 15 },
            { id: "s6", setNumber: 2, weight: 12, reps: 12, completed: true, targetReps: 12 },
            { id: "s7", setNumber: 3, weight: 12, reps: 12, completed: false, targetReps: 12 },
          ],
        },
        {
          id: "ex_3",
          name: "Tricep Cable Rope Pushdown",
          targetMuscle: "Triceps",
          equipment: "Cable",
          sets: [
            { id: "s8", setNumber: 1, weight: 25, reps: 15, completed: true, targetReps: 15 },
            { id: "s9", setNumber: 2, weight: 30, reps: 12, completed: true, targetReps: 12 },
            { id: "s10", setNumber: 3, weight: 30, reps: 10, completed: false, targetReps: 10 },
          ],
        },
      ],
    },
    {
      id: "gr_wed_pull",
      dayOfWeek: "Wednesday",
      title: "Pull Day A (Back & Biceps)",
      notes: "Drive through elbows on pulldowns and keep torso still on rows.",
      exercises: [
        {
          id: "ex_4",
          name: "Wide Grip Lat Pulldown",
          targetMuscle: "Back",
          equipment: "Cable",
          sets: [
            { id: "s11", setNumber: 1, weight: 60, reps: 10, completed: true, targetReps: 10 },
            { id: "s12", setNumber: 2, weight: 65, reps: 8, completed: true, targetReps: 8 },
            { id: "s13", setNumber: 3, weight: 70, reps: 8, completed: true, targetReps: 8 },
          ],
        },
        {
          id: "ex_5",
          name: "Incline Dumbbell Bicep Curl",
          targetMuscle: "Biceps",
          equipment: "Dumbbells",
          sets: [
            { id: "s14", setNumber: 1, weight: 14, reps: 12, completed: true, targetReps: 12 },
            { id: "s15", setNumber: 2, weight: 14, reps: 10, completed: true, targetReps: 10 },
          ],
        },
      ],
    },
    {
      id: "gr_fri_legs",
      dayOfWeek: "Friday",
      title: "Legs & Core Overload",
      notes: "Barbell back squat progressive overload followed by RDL hamstrings focus.",
      exercises: [
        {
          id: "ex_6",
          name: "Barbell Back Squat",
          targetMuscle: "Quads",
          equipment: "Barbell",
          sets: [
            { id: "s16", setNumber: 1, weight: 80, reps: 10, completed: true, targetReps: 10 },
            { id: "s17", setNumber: 2, weight: 90, reps: 8, completed: true, targetReps: 8 },
            { id: "s18", setNumber: 3, weight: 100, reps: 6, completed: true, targetReps: 6 },
          ],
        },
        {
          id: "ex_7",
          name: "Dumbbell Romanian Deadlift",
          targetMuscle: "Hamstrings",
          equipment: "Dumbbells",
          sets: [
            { id: "s19", setNumber: 1, weight: 26, reps: 10, completed: true, targetReps: 10 },
            { id: "s20", setNumber: 2, weight: 28, reps: 8, completed: true, targetReps: 8 },
          ],
        },
      ],
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. THE MACRO FORGE NUTRITION (invictus_meal_plans, targets)
  // ─────────────────────────────────────────────────────────────────────────────
  const nutritionTargets = {
    calories: 2400,
    protein: 145,
    carbs: 240,
    fat: 65,
  };

  const mealPlans = [
    {
      id: "meal_demo_1",
      date: todayStr,
      name: "Oatmeal, Whey Protein & Peanut Butter Bowl",
      mealType: "Breakfast",
      calories: 540,
      protein: 42,
      carbs: 58,
      fat: 16,
      time: "08:30 AM",
      completed: true,
    },
    {
      id: "meal_demo_2",
      date: todayStr,
      name: "Grilled Chicken / Paneer Rice Bowl with Broccoli",
      mealType: "Lunch",
      calories: 680,
      protein: 52,
      carbs: 72,
      fat: 18,
      time: "01:15 PM",
      completed: true,
    },
    {
      id: "meal_demo_3",
      date: todayStr,
      name: "Greek Yogurt, Raw Almonds & Honey Parfait",
      mealType: "Snack",
      calories: 320,
      protein: 26,
      carbs: 34,
      fat: 9,
      time: "05:00 PM",
      completed: true,
    },
    {
      id: "meal_demo_4",
      date: todayStr,
      name: "Baked Salmon / Tofu Quinoa Harvest Bowl",
      mealType: "Dinner",
      calories: 580,
      protein: 38,
      carbs: 48,
      fat: 15,
      time: "08:30 PM",
      completed: false,
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. STUDY SPACE (invictus_subjects, topics, study_sessions, tests)
  // ─────────────────────────────────────────────────────────────────────────────
  const subjects: Subject[] = [
    {
      id: "demo_sub_cs",
      name: "Computer Science: Distributed Systems",
      color: "indigo",
      icon: "Cpu",
      archived: false,
      createdAt: new Date(subDays(now, 20)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo_sub_math",
      name: "Discrete Mathematics & Graph Theory",
      color: "emerald",
      icon: "Binary",
      archived: false,
      createdAt: new Date(subDays(now, 20)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo_sub_ml",
      name: "Machine Learning & Neural Architectures",
      color: "amber",
      icon: "Brain",
      archived: false,
      createdAt: new Date(subDays(now, 15)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const topics: Topic[] = [
    {
      id: "demo_top_1",
      subjectId: "demo_sub_cs",
      title: "Raft Consensus Algorithm",
      status: "completed",
      estimatedHours: 4,
      loggedHours: 3.5,
      confidence: 5,
      revisionsCount: 4,
      easinessFactor: 2.5,
      intervalDays: 4,
      nextRevisionDate: format(addDays(now, 3), "yyyy-MM-dd"),
      lastRevisedAt: yesterdayStr,
      notes: "Leader election heartbeat timeout 150-300ms, log replication appendEntries RPC.",
      resourceLinks: ["https://raft.github.io/"],
      order: 0,
      createdAt: new Date(subDays(now, 10)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo_top_2",
      subjectId: "demo_sub_cs",
      title: "Two-Phase Commit (2PC) & CAP Theorem",
      status: "needsRevision",
      estimatedHours: 3,
      loggedHours: 2,
      confidence: 3,
      revisionsCount: 3,
      easinessFactor: 2.4,
      intervalDays: 3,
      nextRevisionDate: todayStr,
      lastRevisedAt: format(subDays(now, 2), "yyyy-MM-dd"),
      notes: "Prepare phase followed by Commit/Abort. Blocking protocol drawback.",
      resourceLinks: [],
      order: 1,
      createdAt: new Date(subDays(now, 12)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo_top_3",
      subjectId: "demo_sub_math",
      title: "Dijkstra vs Bellman-Ford Algorithms",
      status: "completed",
      estimatedHours: 5,
      loggedHours: 4,
      confidence: 5,
      revisionsCount: 5,
      easinessFactor: 2.6,
      intervalDays: 5,
      nextRevisionDate: format(addDays(now, 2), "yyyy-MM-dd"),
      lastRevisedAt: format(subDays(now, 3), "yyyy-MM-dd"),
      notes: "Dijkstra uses greedy min-priority queue (non-negative edges). Bellman-Ford handles negative cycles.",
      resourceLinks: [],
      order: 0,
      createdAt: new Date(subDays(now, 15)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo_top_4",
      subjectId: "demo_sub_math",
      title: "Eulerian & Hamiltonian Graph Paths",
      status: "inProgress",
      estimatedHours: 3,
      loggedHours: 1,
      confidence: 2,
      revisionsCount: 1,
      easinessFactor: 2.1,
      intervalDays: 1,
      nextRevisionDate: todayStr,
      lastRevisedAt: format(subDays(now, 5), "yyyy-MM-dd"),
      notes: "Eulerian path visits every edge once. Degree conditions for connected graph.",
      resourceLinks: [],
      order: 1,
      createdAt: new Date(subDays(now, 8)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "demo_top_5",
      subjectId: "demo_sub_ml",
      title: "Backpropagation & Gradient Descent",
      status: "completed",
      estimatedHours: 4,
      loggedHours: 3.5,
      confidence: 4,
      revisionsCount: 3,
      easinessFactor: 2.5,
      intervalDays: 4,
      nextRevisionDate: format(addDays(now, 4), "yyyy-MM-dd"),
      lastRevisedAt: yesterdayStr,
      notes: "Chain rule of calculus to compute partial derivatives of loss with respect to weights.",
      resourceLinks: [],
      order: 0,
      createdAt: new Date(subDays(now, 14)).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const studySessions: StudySession[] = [
    {
      id: "demo_sess_1",
      subjectId: "demo_sub_cs",
      topicId: "demo_top_1",
      date: yesterdayStr,
      durationMinutes: 90,
      type: "revision",
      notes: "Deep focus Pomodoro on Raft leader election failure recoveries.",
      createdAt: new Date(subDays(now, 1)).toISOString(),
    },
    {
      id: "demo_sess_2",
      subjectId: "demo_sub_math",
      topicId: "demo_top_3",
      date: format(subDays(now, 2), "yyyy-MM-dd"),
      durationMinutes: 60,
      type: "practice",
      notes: "Solved practice graph algorithm complexity questions.",
      createdAt: new Date(subDays(now, 2)).toISOString(),
    },
    {
      id: "demo_sess_3",
      subjectId: "demo_sub_ml",
      topicId: "demo_top_5",
      date: format(subDays(now, 3), "yyyy-MM-dd"),
      durationMinutes: 45,
      type: "reading",
      notes: "Implemented toy backpropagation network in PyTorch.",
      createdAt: new Date(subDays(now, 3)).toISOString(),
    },
  ];

  const tests: Test[] = [
    {
      id: "demo_test_1",
      name: "Distributed Systems Mid-Term Examination",
      date: format(addDays(now, 12), "yyyy-MM-dd"),
      scope: ["demo_sub_cs"],
      score: 88,
      totalScore: 100,
      timeTakenMinutes: 75,
      weakAreas: ["2PC Network Partitions", "Vector Clock Concurrency"],
      createdAt: new Date().toISOString(),
    },
    {
      id: "demo_test_2",
      name: "Discrete Mathematics Departmental Final",
      date: format(addDays(now, 24), "yyyy-MM-dd"),
      scope: ["demo_sub_math"],
      score: 92,
      totalScore: 100,
      timeTakenMinutes: 90,
      weakAreas: ["Hamiltonian Cycle Proofs"],
      createdAt: new Date().toISOString(),
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. MONEY SPACE (invictus_categories, transactions, debts, savings)
  // ─────────────────────────────────────────────────────────────────────────────
  const categories: Category[] = [
    { id: "cat-salary", name: "Salary & Stipends", type: "income", icon: "DollarSign", color: "mint", archived: false },
    { id: "cat-freelance", name: "Freelance & Projects", type: "income", icon: "Briefcase", color: "amber", archived: false },
    { id: "cat-food", name: "Food & Dining", type: "expense", icon: "Coffee", color: "coral", monthlyBudget: 5000, archived: false },
    { id: "cat-groceries", name: "Groceries & Kitchen", type: "expense", icon: "ShoppingBag", color: "mint", monthlyBudget: 3500, archived: false },
    { id: "cat-transport", name: "Commute & Transit", type: "expense", icon: "Car", color: "orange", monthlyBudget: 2000, archived: false },
    { id: "cat-education", name: "Books & Courses", type: "expense", icon: "BookOpen", color: "indigo", monthlyBudget: 2500, archived: false },
    { id: "cat-bills", name: "Tech & Subscriptions", type: "expense", icon: "Zap", color: "sky", monthlyBudget: 1500, archived: false },
    { id: "cat-health", name: "Gym & Healthcare", type: "expense", icon: "HeartPulse", color: "rose", monthlyBudget: 2000, archived: false },
  ];

  const transactions: Transaction[] = [
    // Today
    {
      id: "tx_demo_1",
      amount: 180,
      type: "expense",
      categoryId: "cat-food",
      date: todayStr,
      note: "Campus Cafeteria Lunch Bowl",
      paymentMethod: "upi",
      isRecurring: false,
    },
    {
      id: "tx_demo_2",
      amount: 60,
      type: "expense",
      categoryId: "cat-transport",
      date: todayStr,
      note: "Metro Rapid Transit Ticket",
      paymentMethod: "cash",
      isRecurring: false,
    },
    {
      id: "tx_demo_3",
      amount: 120,
      type: "expense",
      categoryId: "cat-food",
      date: todayStr,
      note: "Local Coffee & Pastry",
      paymentMethod: "cash",
      isRecurring: false,
    },
    // Yesterday & Recent Days
    {
      id: "tx_demo_4",
      amount: 1240,
      type: "expense",
      categoryId: "cat-groceries",
      date: yesterdayStr,
      note: "Weekly Groceries, Oats & Fruits",
      paymentMethod: "upi",
      isRecurring: false,
    },
    {
      id: "tx_demo_5",
      amount: 420,
      type: "expense",
      categoryId: "cat-bills",
      date: format(subDays(now, 3), "yyyy-MM-dd"),
      note: "AWS Cloud Server Hosting",
      paymentMethod: "card",
      isRecurring: true,
    },
    {
      id: "tx_demo_6",
      amount: 850,
      type: "expense",
      categoryId: "cat-education",
      date: format(subDays(now, 4), "yyyy-MM-dd"),
      note: "Textbook: Algorithms in C++",
      paymentMethod: "upi",
      isRecurring: false,
    },
    {
      id: "tx_demo_7",
      amount: 250,
      type: "expense",
      categoryId: "cat-transport",
      date: format(subDays(now, 5), "yyyy-MM-dd"),
      note: "Auto Rickshaw to Campus",
      paymentMethod: "cash",
      isRecurring: false,
    },
    {
      id: "tx_demo_8",
      amount: 650,
      type: "expense",
      categoryId: "cat-food",
      date: format(subDays(now, 7), "yyyy-MM-dd"),
      note: "Weekend Team Pizza Sprint",
      paymentMethod: "upi",
      isRecurring: false,
    },
    {
      id: "tx_demo_9",
      amount: 1500,
      type: "expense",
      categoryId: "cat-health",
      date: format(subDays(now, 10), "yyyy-MM-dd"),
      note: "Gym Membership Monthly Dues",
      paymentMethod: "upi",
      isRecurring: true,
    },
    // Inflow Income
    {
      id: "tx_demo_10",
      amount: 15000,
      type: "income",
      categoryId: "cat-salary",
      date: format(subDays(now, 12), "yyyy-MM-dd"),
      note: "Part-Time Research Assistant Stipend",
      paymentMethod: "bank",
      isRecurring: true,
    },
    {
      id: "tx_demo_11",
      amount: 8500,
      type: "income",
      categoryId: "cat-freelance",
      date: format(subDays(now, 6), "yyyy-MM-dd"),
      note: "Freelance React Consulting Milestone 1",
      paymentMethod: "upi",
      isRecurring: false,
    },
    {
      id: "tx_demo_12",
      amount: 140,
      type: "expense",
      categoryId: "cat-food",
      date: format(subDays(now, 2), "yyyy-MM-dd"),
      note: "Evening Tea & Snacks",
      paymentMethod: "cash",
      isRecurring: false,
    },
    {
      id: "tx_demo_13",
      amount: 299,
      type: "expense",
      categoryId: "cat-bills",
      date: format(subDays(now, 8), "yyyy-MM-dd"),
      note: "Spotify Premium Duo",
      paymentMethod: "upi",
      isRecurring: true,
    },
    {
      id: "tx_demo_14",
      amount: 320,
      type: "expense",
      categoryId: "cat-transport",
      date: format(subDays(now, 9), "yyyy-MM-dd"),
      note: "Uber to Tech Meetup",
      paymentMethod: "upi",
      isRecurring: false,
    },
  ];

  const debts: Debt[] = [
    {
      id: "debt_demo_1",
      userId: "guest-user",
      personName: "Alex Vance (Study Partner)",
      type: "lent",
      amount: 600,
      note: "Lent for algorithms textbook sharing",
      dueDate: format(addDays(now, 7), "yyyy-MM-dd"),
      status: "pending",
      createdAt: new Date(subDays(now, 3)).toISOString(),
    },
    {
      id: "debt_demo_2",
      userId: "guest-user",
      personName: "Devon (Roommate)",
      type: "borrowed",
      amount: 250,
      note: "Borrowed for grocery delivery split",
      status: "settled",
      settledAt: yesterdayStr,
      createdAt: new Date(subDays(now, 6)).toISOString(),
    },
  ];

  const savingsGoals = [
    {
      id: "goal_demo_mac",
      name: "M3 MacBook Pro Setup Fund",
      targetAmount: 120000,
      currentAmount: 85000,
      icon: "Laptop",
      color: "indigo",
      targetDate: format(addDays(now, 90), "yyyy-MM-dd"),
    },
    {
      id: "goal_demo_emergency",
      name: "Emergency Rainy Day Buffer",
      targetAmount: 30000,
      currentAmount: 25000,
      icon: "Shield",
      color: "emerald",
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
    {
      id: "sub_github",
      name: "GitHub Copilot Pro",
      amount: 830,
      billingCycle: "monthly",
      nextBillingDate: format(addDays(now, 18), "yyyy-MM-dd"),
      category: "Tech",
      icon: "Code",
    },
    {
      id: "sub_chatgpt",
      name: "ChatGPT Plus Subscription",
      amount: 1999,
      billingCycle: "monthly",
      nextBillingDate: format(addDays(now, 22), "yyyy-MM-dd"),
      category: "Productivity",
      icon: "Sparkles",
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. TODAY DASHBOARD & SCRATCHPAD (invictus_sticky_scratchpad)
  // ─────────────────────────────────────────────────────────────────────────────
  const scratchpadContent = `# ⚡ FOUNDER & STUDENT RADAR
- [ ] Deploy Next.js RSC production build by 6pm @p1
- [ ] Review Raft consensus election timeouts #CS
- [x] Paid ₹180 for lunch at cafeteria #Food
- [ ] Pick up creatine & electrolytes from store ₹450 #Health
- [x] Read 15 pages of Designing Data-Intensive Applications
*Key note*: "Good architecture is about what you can postpone without making it hard to change later."`;

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
    localStorage.setItem(`invictus_water_${data.todayStr}`, "2250");
    localStorage.setItem("invictus_water_goal", "3000");
    localStorage.setItem(
      `invictus_mood_${data.todayStr}`,
      JSON.stringify({
        dateStr: data.todayStr,
        rating: 4,
        energy: 4,
        tags: ["high_focus", "flow_state", "gym_pr"],
        note: "Crushed 90m deep work sprint on Invictus and hit a personal record on incline press.",
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
    localStorage.setItem("invictus_monthly_upi_budget", "12000");
    localStorage.setItem("invictus_monthly_cash_budget", "3000");
    localStorage.setItem("invictus_enable_rollover", "true");
    localStorage.setItem("invictus_custom_daily_budget", "500");

    // 6. Scratchpad
    localStorage.setItem("invictus_sticky_scratchpad", data.scratchpadContent);

    // 7. Profile & Session
    localStorage.setItem("invictus_guest_mode", "true");
    localStorage.setItem("invictus_guest_name", "Alex Vance (Guest Evaluator)");
    localStorage.setItem("invictus_onboarded", "true");
    localStorage.setItem(
      "invictus_user_profile",
      JSON.stringify({
        displayName: "Alex Vance",
        age: "22 Years",
        weight: "72 kg",
        gender: "Male",
        waterGoal: 3000,
        currency: "INR",
        timezone: "Asia/Kolkata",
        weekStartsOn: 1,
        modulesEnabled: { goals: true, study: true, money: true },
      })
    );

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
