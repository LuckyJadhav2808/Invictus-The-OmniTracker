# implementationplan.md — Phased Build Plan

Each phase should end in a working, deployable state. Check items off in `tracker.md` as they're completed (this file defines *what*, tracker.md tracks *done/not done*).

## Phase 0 — Project Setup
- [ ] Init Next.js 14 (App Router) + TypeScript project.
- [ ] Install & configure Tailwind CSS, set up `design.md` tokens as CSS variables in `globals.css` / `tailwind.config.ts`.
- [ ] Install shadcn/ui, generate base primitives (button, dialog, sheet, tabs, calendar, dropdown, toast/sonner).
- [ ] Install lucide-react, Recharts, date-fns, react-hook-form, zod, @tanstack/react-query, zustand.
- [ ] Set up ESLint + Prettier + Tailwind Prettier plugin, Husky pre-commit (lint + typecheck).
- [ ] Create Firebase project (console): enable Auth (Email/Password + Google), Firestore (production mode), Storage.
- [ ] Add `.env.local` with Firebase config, `.env.example` committed.
- [ ] `lib/firebase.ts` client SDK init.
- [ ] Write initial `firestore.rules` and `storage.rules` per techspec.md §8, deploy via Firebase CLI.
- [ ] Set up base folder structure exactly as in techspec.md §3.
- [ ] Deploy empty shell to Vercel, confirm CI pipeline (build passes on push).

## Phase 1 — Auth & Onboarding
- [ ] `AuthProvider` context wrapping app, `useAuth()` hook.
- [ ] `/login`, `/signup` pages (email/password + Google button), styled per design.md.
- [ ] Route protection for `(app)` group (redirect unauthenticated users).
- [ ] `users/{uid}` doc creation on first signup (Cloud Function trigger or client-side on first login — client-side acceptable for v1).
- [ ] `/onboarding` multi-step wizard (per webappflow.md §3.1), writes to `users/{uid}`.
- [ ] Onboarding-complete redirect guard in `(app)/layout.tsx`.
- [ ] `/profile` page: view/edit name & avatar (avatar upload to Storage), logout.
- [ ] `/settings` shell page (module toggles, currency, timezone, exam date, theme placeholder).
- [ ] Account deletion flow (confirm modal → delete Firestore subtree + Storage files + Auth user).

## Phase 2 — App Shell & Navigation
- [ ] Bottom nav (mobile) + sidebar nav (desktop) shared config, per design.md §5.6/5.7.
- [ ] Responsive layout breakpoints wired (webappflow.md §2, design.md §8).
- [ ] Shared components: `StatTile`, `ProgressRing`, `CalendarStrip`, `InsightCard`, `EmptyState`, `ResponsiveFormContainer` (modal↔sheet), `FAB`.
- [ ] `/today` page skeleton with placeholder tiles wired to shared components (no real data yet).

## Phase 3 — Goals / Habit Module (full CRUD + core features)
- [ ] Zod schemas + TS types for `habits`, `habitLogs`, `streaks` (mirrors schema.md).
- [ ] React Query hooks: `useHabits`, `useAddHabit`, `useUpdateHabit`, `useDeleteHabit`, `useToggleHabitLog`.
- [ ] `/goals` List tab: habit cards, today-toggle, streak badge.
- [ ] New/Edit habit form (title, icon picker, color, frequency, reminder, grace-skip toggle).
- [ ] Streak calculation logic (`lib/utils/streaks.ts`) + denormalized write on log toggle.
- [ ] `/goals/[habitId]` detail page: streak stats, per-habit calendar heatmap, weekly chart.
- [ ] `/goals` Calendar tab: month grid, composite daily completion heatmap, tap-day bottom sheet.
- [ ] `/goals` Analytics tab: completion % trend chart, best/worst day-of-week, streak leaderboard.
- [ ] Quick-log tags (customizable) wired into habit log form.
- [ ] Wire real Goals data into `/today` stat tiles + calendar strip.

## Phase 4 — Study Module (full CRUD + core features)
- [ ] Zod schemas + TS types for `subjects`, `topics`, `studySessions`, `tests`.
- [ ] React Query hooks for subjects/topics/sessions/tests CRUD.
- [ ] `/study` subjects overview with per-subject progress rings.
- [ ] Subject create/edit; `/study/[subjectId]` topic list w/ status pills + reordering.
- [ ] Topic create/edit; `/study/[subjectId]/[topicId]` detail: session log form (+ optional start/stop timer), confidence slider, notes, resource links, session history list.
- [ ] `loggedHours` denormalization on session write.
- [ ] `/study/tests` list + add/edit test (with PDF/image upload to Storage), score trend chart.
- [ ] `/study/analytics`: syllabus completion donut, hours/day bar chart, exam-countdown banner, revision-due list logic (`lastStudiedAt` + confidence threshold).
- [ ] Wire real Study data into `/today` stat tiles.

## Phase 5 — Money Module (full CRUD + core features)
- [ ] Zod schemas + TS types for `categories`, `transactions`, `recurringRules`.
- [ ] React Query hooks for categories/transactions/recurring CRUD.
- [ ] `/money` transaction list (grouped by date, filter chips), FAB add-transaction form (with receipt upload).
- [ ] Category management UI (icon/color picker, budget field) — could live in `/settings` or `/money/budgets`.
- [ ] `/money/budgets`: budget vs spent bars (Below/Average/Above visual per design.md §5.8).
- [ ] Recurring transaction rule creation + a scheduled job (Cloud Function scheduled trigger, or client-side "generate missing recurring entries on load" fallback for v1 simplicity).
- [ ] `/money/analytics`: income vs expense summary, category donut, month-over-month trend, savings rate.
- [ ] Wire real Money data into `/today` stat tiles.

## Phase 6 — Cross-Module Dashboard & Insights
- [ ] Finalize `/today` full dashboard: calendar strip, 4 stat tiles (mixed modules), Active Session card (live study timer if running), Insights card.
- [ ] Rule-based insight generation logic (`lib/utils/insights.ts`) — runs client-side on dashboard load, writes/upserts to `insights` collection, dismiss action.
- [ ] Global date/day-tap: tapping any calendar day surfaces a cross-module summary bottom sheet.
- [ ] Analytics hub route bundling Goals/Study/Money analytics tabs behind the bottom-nav pie-chart icon.

## Phase 7 — Polish, PWA, Performance
- [ ] Empty states for every list (illustrations or icon-based, per webappflow.md §4).
- [ ] Loading skeletons matching card shapes for every async view.
- [ ] Motion pass: card entrances, progress ring animation, streak milestone celebration (canvas-confetti on 7/30/100-day streaks only).
- [ ] PWA manifest + icons + basic service worker (installable, offline shell).
- [ ] Firestore offline persistence enabled + offline banner.
- [ ] Data export (CSV/JSON) implementation in Settings.
- [ ] Accessibility pass: contrast check, keyboard nav, aria labels on icon-only buttons.
- [ ] Lighthouse pass (target: Performance 90+, Accessibility 95+, PWA installable) on mobile profile.

## Phase 8 — Testing & QA
- [ ] Unit tests: streak calc, budget calc, insight rules, syllabus completion %.
- [ ] Component tests: StatTile, ProgressRing, CalendarStrip render + interaction.
- [ ] E2E (Playwright): signup→onboarding→first habit log; add transaction→see it in analytics; add study session→see hours update.
- [ ] Manual cross-device pass: iPhone SE width (375px), standard mobile (390–430px), tablet (768px), desktop (1280px+).
- [ ] Security rules test (Firebase emulator suite): confirm user A cannot read/write user B's data.

## Phase 9 — Launch
- [ ] Final env var check on Vercel (production Firebase project, not a dev/test project).
- [ ] Deploy production Firestore/Storage rules.
- [ ] Custom domain (optional) + HTTPS confirmed.
- [ ] Smoke test full signup→daily-use flow on production.

## Post-v1 / Future Enhancements (not in initial build)
- Cloud Functions for server-side denormalization & recurring-transaction generation.
- Push notifications (FCM) for habit reminders & revision-due alerts.
- Dark mode.
- AI-assisted study plan generation.
- Bank/UPI statement import for money module.
- Multi-user shared goals/household budget.
