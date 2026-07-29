import { TemplatePack } from "@/components/shared/TemplateSelectionModal";

/* -------------------------------------------------------------------------- */
/*                              1. LIFE SPACE PACKS                           */
/* -------------------------------------------------------------------------- */

export const HABIT_TEMPLATE_PACKS: TemplatePack[] = [
  {
    id: "monk-mode",
    name: "Monk Mode Protocol",
    tagline: "High focus, intense discipline & digital minimalism",
    badge: "🔥 Most Popular",
    icon: "🧘",
    items: [
      { id: "mm1", title: "5:00 AM Wake Up", category: "Mindset", desc: "No snooze allowed" },
      { id: "mm2", title: "2 Liters Water Intake", category: "Health", desc: "Hydrate immediately after waking up" },
      { id: "mm3", title: "1 Hour Deep Work", category: "Focus", desc: "Zero distractions, phone in another room" },
      { id: "mm4", title: "No Social Media", category: "Discipline", desc: "Zero brain rot doomscrolling" },
      { id: "mm5", title: "30 Min Daily Exercise", category: "Fitness", desc: "Gym, run or bodyweight workout" },
    ],
  },
  {
    id: "reddit-essentials",
    name: "Reddit Essentials Routine",
    tagline: "Self-improvement core habits loved by r/getdisciplined",
    badge: "⭐ Reddit Choice",
    icon: "🚀",
    items: [
      { id: "re1", title: "Cold Shower Challenge", category: "Discipline", desc: "Build mental resilience" },
      { id: "re2", title: "10 Minutes Meditation", category: "Mindset", desc: "Mindful breathing reset" },
      { id: "re3", title: "Daily Journaling", category: "Reflect", desc: "Write 3 things you are grateful for" },
      { id: "re4", title: "Read 10 Pages", category: "Knowledge", desc: "Non-fiction self improvement book" },
    ],
  },
  {
    id: "fitness-champ",
    name: "Fitness & Nutrition Champ",
    tagline: "Body transformation & active athletic living",
    badge: "💪 Athletic",
    icon: "🏋️",
    items: [
      { id: "fc1", title: "10,000 Daily Steps", category: "Activity", desc: "Keep moving throughout the day" },
      { id: "fc2", title: "Hit 140g Protein Target", category: "Nutrition", desc: "Fuel muscle recovery" },
      { id: "fc3", title: "Weight Training Session", category: "Fitness", desc: "Lift heavy with good form" },
      { id: "fc4", title: "8 Hours Quality Sleep", category: "Recovery", desc: "Sleep by 10:30 PM" },
    ],
  },
];

export const GYM_TEMPLATE_PACKS: TemplatePack[] = [
  {
    id: "ppl-push",
    name: "Push Day (Chest, Shoulders, Triceps)",
    tagline: "Upper body pushing hypertrophy workout split",
    badge: "🔥 Classic PPL",
    icon: "🏋️",
    items: [
      { id: "ppl1", title: "Barbell Flat Bench Press", desc: "4 Sets x 8-10 Reps" },
      { id: "ppl2", title: "Incline Dumbbell Press", desc: "3 Sets x 10-12 Reps" },
      { id: "ppl3", title: "Seated Dumbbell Shoulder Press", desc: "3 Sets x 10 Reps" },
      { id: "ppl4", title: "Tricep Rope Pushdowns", desc: "4 Sets x 12-15 Reps" },
    ],
  },
  {
    id: "ppl-pull",
    name: "Pull Day (Back & Biceps)",
    tagline: "Back width, thickness & bicep builder split",
    badge: "💪 Hypertrophy",
    icon: "🧗",
    items: [
      { id: "pul1", title: "Lat Pulldown (Wide Grip)", desc: "4 Sets x 10-12 Reps" },
      { id: "pul2", title: "Seated Cable Row", desc: "3 Sets x 10 Reps" },
      { id: "pul3", title: "Barbell Bicep Curls", desc: "4 Sets x 10 Reps" },
      { id: "pul4", title: "Face Pulls (Rear Delts)", desc: "3 Sets x 15 Reps" },
    ],
  },
];

export const MEAL_TEMPLATE_PACKS: TemplatePack[] = [
  {
    id: "high-protein-bulk",
    name: "High Protein Muscle Bulk (2800 kcal)",
    tagline: "Lean muscle building meal structure",
    badge: "🥩 160g+ Protein",
    icon: "🍳",
    items: [
      { id: "mp1", title: "Oats & Egg White Bowl", desc: "600 kcal • 40g Protein" },
      { id: "mp2", title: "Grilled Chicken & Brown Rice", desc: "750 kcal • 55g Protein" },
      { id: "mp3", title: "Whey Protein & Banana Shake", desc: "350 kcal • 30g Protein" },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*                             2. MONEY SPACE PACKS                           */
/* -------------------------------------------------------------------------- */

export const BUDGET_CATEGORY_TEMPLATE_PACKS: TemplatePack[] = [
  {
    id: "50-30-20-rule",
    name: "50 / 30 / 20 Budgeting Rule",
    tagline: "Balanced financial framework for needs, wants & wealth building",
    badge: "📊 Recommended",
    icon: "💰",
    items: [
      { id: "bc1", title: "Essential Needs (Rent, Bills & Groceries)", amount: 1500, type: "Expense" },
      { id: "bc2", title: "Lifestyle Wants (Dining, Entertainment)", amount: 900, type: "Expense" },
      { id: "bc3", title: "Savings & Investments", amount: 600, type: "Savings" },
    ],
  },
  {
    id: "student-budget",
    name: "Student Frugal Budget",
    tagline: "Cost-effective spending structure for college & university",
    badge: "🎓 Student Choice",
    icon: "📚",
    items: [
      { id: "sb1", title: "Tuition & Books", amount: 300, type: "Expense" },
      { id: "sb2", title: "Campus Canteen & Snacks", amount: 200, type: "Expense" },
      { id: "sb3", title: "Metro & Transport Pass", amount: 80, type: "Expense" },
    ],
  },
];

export const SAVINGS_GOAL_TEMPLATE_PACKS: TemplatePack[] = [
  {
    id: "emergency-fund",
    name: "3-Month Safety Net Fund",
    tagline: "Essential financial shield for peace of mind",
    badge: "🛡️ Safety Net",
    icon: "🏦",
    items: [
      { id: "sg1", title: "3-Month Emergency Savings", target: 3000 },
    ],
  },
  {
    id: "tech-upgrade",
    name: "MacBook & Tech Upgrade",
    tagline: "Fund for your next workspace setup",
    badge: "💻 Tech Setup",
    icon: "⚡",
    items: [
      { id: "sg2", title: "MacBook Pro Fund", target: 2000 },
    ],
  },
];

export const SUBSCRIPTION_TEMPLATE_PACKS: TemplatePack[] = [
  {
    id: "entertainment-pack",
    name: "Streaming & Media Pack",
    tagline: "Essential movies, music & video streaming",
    badge: "🎬 Media",
    icon: "🍿",
    items: [
      { id: "sub1", title: "Netflix Premium", amount: 15.99, category: "Entertainment" },
      { id: "sub2", title: "Spotify Family", amount: 10.99, category: "Music" },
      { id: "sub3", title: "YouTube Premium", amount: 13.99, category: "Media" },
    ],
  },
  {
    id: "dev-tools-pack",
    name: "Developer & Creator Suite",
    tagline: "AI tools & cloud platform subscriptions",
    badge: "⚡ AI & Code",
    icon: "🛠️",
    items: [
      { id: "sub4", title: "ChatGPT Plus", amount: 20.00, category: "AI Tools" },
      { id: "sub5", title: "GitHub Copilot", amount: 10.00, category: "Developer" },
      { id: "sub6", title: "Vercel Pro", amount: 20.00, category: "Hosting" },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*                             3. STUDY SPACE PACKS                           */
/* -------------------------------------------------------------------------- */

export const SUBJECT_TEMPLATE_PACKS: TemplatePack[] = [
  {
    id: "cs-degree",
    name: "Computer Science Core Syllabus",
    tagline: "Complete foundational CS subjects for software engineering",
    badge: "💻 CS Degree",
    icon: "🖥️",
    items: [
      { id: "cs1", title: "Data Structures & Algorithms", desc: "Arrays, Trees, Graphs, Sorting & Dynamic Programming" },
      { id: "cs2", title: "Web Development Stack", desc: "HTML, CSS, React, Next.js, Node.js & Databases" },
      { id: "cs3", title: "Operating Systems & Networking", desc: "Processes, Memory Management, TCP/IP & HTTP" },
    ],
  },
  {
    id: "stem-prep",
    name: "STEM & Engineering Syllabus",
    tagline: "Higher mathematics and physical science modules",
    badge: "📐 STEM",
    icon: "🧬",
    items: [
      { id: "st1", title: "Calculus & Linear Algebra", desc: "Limits, Derivatives, Integrals & Matrix Math" },
      { id: "st2", title: "Applied Physics", desc: "Mechanics, Thermodynamics & Electromagnetism" },
    ],
  },
];

export const MOCK_TEST_TEMPLATE_PACKS: TemplatePack[] = [
  {
    id: "full-length-exam",
    name: "Full Length Mock Exam (3 Hours)",
    tagline: "Standard full exam simulation",
    badge: "⏱️ Full Exam",
    icon: "🎯",
    items: [
      { id: "mt1", title: "Full Subject Test 1", target: 100, desc: "100 Questions • 180 Minutes" },
    ],
  },
  {
    id: "chapter-quiz",
    name: "Sprint Chapter Quiz (30 Mins)",
    tagline: "Quick topic assessment test",
    badge: "⚡ Quiz",
    icon: "📝",
    items: [
      { id: "mt2", title: "Chapter Speed Quiz", target: 20, desc: "20 Questions • 30 Minutes" },
    ],
  },
];
