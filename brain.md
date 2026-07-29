# 🧠 BRAIN.md — Invictus Project Knowledge Base

> **Read this file first.** It is the single source of truth for any AI agent working on this codebase. It maps where everything lives, what conventions to follow, and the current build status. Updated after every major change.

---

## 1. What Is Invictus?

A **playful, all-in-one personal life tracker** webapp with three core modules:

| Module | Purpose | Accent Color |
|--------|---------|-------------|
| **Goals / Habits** | Daily routines, streaks, moods, wellness scores | Amber / Gold |
| **Study** | Generic exam/study tracking (any age, any exam) — subjects → topics → sessions, tests, analytics | Orange |
| **Money** | Income, expenses, budgets, savings goals | Mint / Green |

**Design mood:** Warm, rounded, pastel/mustard, progress rings, stat tiles. "Cute pet-app energy" — never corporate.

**Target user:** Single user (you). Mobile-first responsive (375px → 1440px+). Firebase Auth per-user isolation.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | **Next.js 16** (App Router) | `params` is a `Promise` — must `await`. `PageProps<>` / `LayoutProps<>` are global helpers (no import). |
| Language | **TypeScript** | `strict: true`. No `any` unless commented. |
| Styling | **Tailwind CSS v4** + CSS variables | Design tokens in `globals.css`. |
| Components | **shadcn/ui** (Radix base, Nova preset) | Don't hand-edit `/components/ui/*` — wrap instead. |
| Icons | **lucide-react** | Line-style, 1.5–2px stroke. |
| Charts | **Recharts** | Line/bar/donut/pie for analytics. |
| Forms | **react-hook-form** + **zod** | Friendly validation messages. |
| Server State | **TanStack Query (React Query)** | Wraps all Firestore calls. No Redux. |
| UI State | **Zustand** | Modal open/close, selected date, theme, active tab only. |
| Auth | **Firebase Authentication** | Email/Password + Google. |
| Database | **Cloud Firestore** | NoSQL, real-time listeners, per-user scoped. |
| File Storage | **Firebase Storage** | Receipts, test PDFs, avatars. |
| Dates | **date-fns** | Lightweight, tree-shakeable. |
| Toasts | **sonner** | Toast notifications. |
| Deploy | **Vercel** | Firebase only for Auth/Firestore/Storage. |

---

## 3. Directory Map

```
d:\Invictus\
├── Project details/          # 📋 Planning docs (DO NOT delete or move)
│   ├── prd.md                # Product requirements (what to build)
│   ├── techspec.md           # Technical specification (how to build)
│   ├── schema.md             # Firestore data model (source of truth for DB)
│   ├── design.md             # Design system (colors, typography, components)
│   ├── webappflow.md         # App flow & navigation (screens, user journeys)
│   ├── rules.md              # Coding conventions & rules
│   ├── implementationplan.md # Phased build plan (10 phases, 0–9)
│   └── tracker.md            # Build progress tracker
│
├── src/
│   ├── app/
│   │   ├── globals.css       # Tailwind + shadcn theme + design tokens
│   │   ├── layout.tsx        # Root layout (fonts, html/body)
│   │   ├── page.tsx          # Landing page (default Next.js — to be replaced)
│   │   ├── favicon.ico
│   │   ├── (auth)/           # 🔓 Public auth routes (TO BUILD)
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── onboarding/page.tsx
│   │   │   └── layout.tsx
│   │   └── (app)/            # 🔒 Protected routes (TO BUILD)
│   │       ├── layout.tsx    # Shell with bottom nav / sidebar + auth guard
│   │       ├── today/page.tsx
│   │       ├── goals/
│   │       │   ├── page.tsx
│   │       │   └── [habitId]/page.tsx
│   │       ├── study/
│   │       │   ├── page.tsx
│   │       │   ├── [subjectId]/page.tsx
│   │       │   ├── tests/page.tsx
│   │       │   └── analytics/page.tsx
│   │       ├── money/
│   │       │   ├── page.tsx
│   │       │   ├── budgets/page.tsx
│   │       │   └── analytics/page.tsx
│   │       ├── settings/page.tsx
│   │       └── profile/page.tsx
│   │
│   ├── components/
│   │   ├── ui/               # shadcn primitives (DO NOT hand-edit, wrap instead)
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── sheet.tsx
│   │   │   └── tabs.tsx
│   │   ├── shared/           # Cross-module shared components (TO BUILD)
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── Providers.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── StatTile.tsx
│   │   │   ├── ProgressRing.tsx
│   │   │   ├── CalendarStrip.tsx
│   │   │   ├── InsightCard.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ResponsiveFormContainer.tsx
│   │   │   └── FAB.tsx
│   │   ├── goals/            # Goals/Habits domain components (TO BUILD)
│   │   ├── study/            # Study domain components (TO BUILD)
│   │   └── money/            # Money domain components (TO BUILD)
│   │
│   ├── lib/
│   │   ├── utils.ts          # cn() helper (exists)
│   │   ├── firebase.ts       # Firebase client SDK init (TO BUILD)
│   │   ├── queries/          # React Query hooks per domain (TO BUILD)
│   │   │   ├── useHabits.ts
│   │   │   ├── useTransactions.ts
│   │   │   └── useStudySessions.ts
│   │   ├── schemas/          # Zod validation schemas (TO BUILD)
│   │   │   ├── user.ts
│   │   │   ├── habit.ts
│   │   │   ├── study.ts
│   │   │   └── money.ts
│   │   └── utils/            # Domain-specific pure functions (TO BUILD)
│   │       ├── streaks.ts
│   │       ├── analytics.ts
│   │       └── insights.ts
│   │
│   ├── store/
│   │   └── ui-store.ts       # Zustand store for UI state (TO BUILD)
│   │
│   └── types/
│       └── index.ts          # Shared TS types from Zod schemas (TO BUILD)
│
├── public/                   # Static assets
├── brain.md                  # ← YOU ARE HERE
├── package.json              # Project manifest
├── tsconfig.json             # TypeScript config (strict: true)
├── next.config.ts            # Next.js config
├── postcss.config.mjs        # PostCSS config
├── eslint.config.mjs         # ESLint config
├── components.json           # shadcn/ui config
├── firestore.rules           # Firestore security rules (TO BUILD)
├── storage.rules             # Storage security rules (TO BUILD)
├── .env.local                # Firebase secrets (DO NOT COMMIT)
└── .env.example              # Template for .env.local (TO BUILD)
```

> Items marked **TO BUILD** do not exist yet. Items marked **exists** are already created.

---

## 4. Firestore Schema (Quick Reference)

All data lives under `users/{uid}/...`. See `Project details/schema.md` for full field details.

| Collection Path | Purpose | Key Fields |
|----------------|---------|------------|
| `users/{uid}` | User profile | `displayName`, `email`, `timezone`, `currency`, `onboarded`, `modulesEnabled`, `studyTarget?` |
| `users/{uid}/habits/{habitId}` | Habit definitions | `title`, `icon`, `color`, `frequency`, `archived` |
| `users/{uid}/habitLogs/{logId}` | Daily habit logs | `habitId`, `date` (yyyy-mm-dd), `completed`, `countLogged` |
| `users/{uid}/streaks/{habitId}` | Denormalized streaks | `currentStreak`, `longestStreak`, `lastCompletedDate` |
| `users/{uid}/subjects/{subjectId}` | Study subjects | `name`, `color`, `icon` |
| `users/{uid}/subjects/{subjectId}/topics/{topicId}` | Topics within subject | `title`, `status`, `loggedHours`, `confidence` |
| `users/{uid}/studySessions/{sessionId}` | Study session logs | `subjectId`, `topicId`, `durationMinutes`, `type` |
| `users/{uid}/tests/{testId}` | Mock test records | `name`, `score`, `totalScore`, `scope[]` |
| `users/{uid}/categories/{categoryId}` | Money categories | `name`, `type` (income/expense), `monthlyBudget?` |
| `users/{uid}/transactions/{transactionId}` | Financial transactions | `amount`, `type`, `categoryId`, `date` |
| `users/{uid}/recurringRules/{ruleId}` | Recurring transactions | `amount`, `dayOfMonth`, `active` |
| `users/{uid}/insights/{insightId}` | Auto-generated insights | `module`, `text`, `severity`, `dismissed` |

**Date convention:** Day-level data stored as `"yyyy-mm-dd"` strings. Instant-in-time fields use Firestore `Timestamp`.

**Security rule:** Single wildcard rule secures everything — `request.auth.uid == uid`.

---

## 5. Design Tokens (Quick Reference)

From `Project details/design.md`. These must be in `globals.css` as CSS variables.

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-cream-bg` | `#FBEFE0` | App background |
| `--color-amber-500` | `#F5B942` | Primary header, CTA |
| `--color-amber-600` | `#EFA928` | Amber hover/active |
| `--color-orange-500` | `#F0824A` | Study module accent |
| `--color-mint-400` | `#A9DDC3` | Money module / success |
| `--color-mint-600` | `#7CC3A2` | Mint accents |
| `--color-lavender-400` | `#C9BEEA` | Calm/neutral accent |
| `--color-coral-400` | `#F2A6A0` | Wellness accent |
| `--color-navy-900` | `#1F2430` | Primary text |
| `--color-navy-600` | `#565C6B` | Secondary text |
| `--color-success` | `#4CAF7D` | Positive state |
| `--color-warning` | `#E0A72E` | Average state |
| `--color-danger` | `#E2694F` | Negative state |

### Typography
- **Headings/Stats:** Nunito (weight 700–800, rounded, geometric)
- **Body/UI:** Inter (weight 500–600, legible at small sizes)
- **Stat numbers:** 2rem–2.25rem, weight 800
- **Screen titles:** 1.1rem, weight 800, uppercase, letter-spacing 0.05em

### Radius Scale
| Token | Value |
|-------|-------|
| `--radius-sm` | `12px` (chips, buttons) |
| `--radius-md` | `20px` (small cards) |
| `--radius-lg` | `28px` (main cards) |
| `--radius-xl` | `36px` (header containers) |

### Shadows
- Cards: `box-shadow: 0 8px 24px rgba(31,36,48,0.08)`

---

## 6. Navigation Structure

### Mobile (≤1024px): Bottom pill nav, 5 icons
1. **Overview** (map icon) → `/today`
2. **Analytics** (pie chart icon) → Analytics hub
3. **Home** (house icon) → `/today` (center, emphasized)
4. **Trends** (line chart icon) → `/goals` calendar/journal view
5. **Profile** (person icon) → `/profile`

### Desktop (≥1024px): Left sidebar
Same 5 destinations + expanded module labels (Today, Goals, Study, Money, Settings). Bottom nav hidden.

### Module internal tabs (consistent 3-tab pattern)
Each module page has: **List | Calendar | Analytics** tabs at top.

---

## 7. Key Conventions & Rules

### File naming
- Route folders: `kebab-case`
- Components: `PascalCase.tsx` (one component per file, filename = component name)
- Hooks/utils: `camelCase.ts`

### State management
- **Server state:** TanStack Query only (no Redux, no MobX)
- **UI state:** Zustand only (modals, tabs, selected date, theme)
- **Never** call Firestore SDK directly from components — always go through hooks in `/lib/queries`

### React Query keys
- Pattern: `[domain, uid, ...params]`
- Examples: `["habits", uid]`, `["habitLogs", uid, habitId, month]`

### Components
- `"use client"` only where actually required (state, effects, event handlers)
- No inline style objects for themeable values — use Tailwind + CSS variables
- All icon-only buttons must have `aria-label`

### Forms
- Always use `react-hook-form` + zod resolver
- Friendly validation messages ("Give this habit a name" not "Field required")
- All create/edit forms use `<ResponsiveFormContainer>` (mobile = bottom sheet, desktop = modal)

### Data integrity
- Every new Firestore collection/field must be added to `Project details/schema.md`
- `schema.md` is the source of truth — code must never drift from it
- Dates as `"yyyy-mm-dd"` strings for day-level data
- Don't hardcode currency symbols — use user's `currency` setting

---

## 8. Build Status

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Project Setup | 🟡 Partial — Next.js init done, deps installed, shadcn init done. Still need: design tokens in CSS, Firebase init, folder structure, rules files |
| 1 | Auth & Onboarding | ⬜ Not Started |
| 2 | App Shell & Navigation | ⬜ Not Started |
| 3 | Goals / Habit Module | ⬜ Not Started |
| 4 | Study Module | ⬜ Not Started |
| 5 | Money Module | ⬜ Not Started |
| 6 | Cross-Module Dashboard & Insights | ⬜ Not Started |
| 7 | Polish, PWA, Performance | ⬜ Not Started |
| 8 | Testing & QA | ⬜ Not Started |
| 9 | Launch | ⬜ Not Started |

---

## 9. Important Gotchas

1. **C: drive has 0 bytes free.** All npm operations must use `$env:TEMP='D:\temp'; $env:TMP='D:\temp'` prefix. npm cache is set to `D:\npm-cache`.
2. **Next.js 16 breaking changes.** `params` is now a `Promise` — must `await`. `PageProps<'/route'>` and `LayoutProps<'/route'>` are global helpers, no import needed. Always check `node_modules/next/dist/docs/` before using unfamiliar APIs.
3. **Tailwind v4** uses `@theme inline {}` blocks and `@import` syntax — not the old `tailwind.config.js` approach.
4. **Import alias** is `src/*` (e.g., `import { cn } from "src/lib/utils"`).
5. **shadcn/ui components** live in `src/components/ui/` — do NOT hand-edit them. Wrap with custom components instead.
6. **Every phase must leave the app buildable** — `npm run build` must pass before moving on.

---

## 10. How to Use This File

**For adding a feature:**
1. Read §3 (Directory Map) to find where the relevant code lives
2. Read §4 (Schema) if the feature touches Firestore
3. Read §7 (Conventions) for coding rules
4. Check §8 (Build Status) to know what's built vs planned
5. Consult `Project details/` docs for deeper specs

**For debugging:**
1. Check §9 (Gotchas) first — many issues are environment-related
2. Check §6 (Navigation) if it's a routing issue
3. Check §5 (Design Tokens) if it's a styling issue

---

*Last updated: 2026-07-19 — Agent: Claude Opus 4.6*
