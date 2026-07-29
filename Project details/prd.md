# Product Requirements Document (PRD)
## Project: Invictus — The Playful Life Tracker

**Version:** 1.0
**Status:** Draft for build
**Owner:** You (Product Owner) + Claude (Build Assistant)

---

## 1. Vision

Invictus is a single, playful, all-in-one webapp that helps one person track the three things that quietly run their life:

1. **Life Goals & Habits** — daily routines, streaks, moods/needs.
2. **Study** — General study / exam prep (any age group, any exam/topic): topics, syllabus coverage, test scores, revision.
3. **Money** — income, expenses, budgets, savings goals.

Instead of three separate apps (a habit tracker, a study planner, a budgeting app), Invictus unifies them into one dashboard with a consistent, warm, illustrated visual language (inspired by the attached pet-tracker mockups: rounded cards, colored progress rings, pastel palette, bottom tab navigation).

**Design mood:** fun, warm, rounded, encouraging — never sterile or corporate. Progress should feel like a game, not a chore.

---

## 2. Problem Statement

Tracking habits, exam prep, and money each require different mental models (calendars, checklists, ledgers), so people either:
- Use 3+ disconnected apps and lose the "whole picture" of their life, or
- Use a notebook/spreadsheet that has no reminders, streaks, or analytics.

There is no single, personal, delightful tool that treats **routine, study, and money** as three views of the same life.

---

## 3. Target User

- Primary: **You** — a student/professional/learner tracking studies for any exam, subject, or interest (any age group), while also managing daily habits and personal finances.
- Single-user first (auth exists, but architecture should not assume multi-tenant complexity beyond simple Firebase Auth per user).
- Desktop + mobile web (responsive), used daily, multiple times a day (morning check-in, study logging, expense logging at point of spend).

---

## 4. Goals & Success Metrics

| Goal | Metric |
|---|---|
| Daily engagement | User opens app and logs at least 1 entry (habit/study/expense) 6/7 days a week |
| Habit consistency | Streak length trending upward month over month |
| Study coverage | % of syllabus/subject topics marked "Complete" increases weekly; test score trend visible |
| Financial awareness | User can see monthly spend vs budget at a glance, no manual spreadsheet needed |
| Delight | UI feels "fun to open" — playful colors, smooth motion, satisfying progress rings |

---

## 5. Scope — Core Modules

### 5.1 Life Goals / Habit Tracker
- Create/edit/delete habits & goals (name, icon, color, frequency: daily/weekly/custom days, target count, category, reminder time).
- Daily check-in view (today's habits as tappable cards, like the "TODAY" screen in the mockup) with a week strip (Mon–Sun) to jump between days.
- **Streaks**: current streak, longest streak, per habit and overall; streak-saving grace logic (configurable, e.g., 1 freeze/week).
- **Calendar view**: month grid, color-coded per-day completion %, click a day to see/edit that day's log.
- **Needs Satisfaction / Wellness score**: a composite daily score (weighted average of habit completion) shown as a % + progress bar, similar to "Needs Satisfaction" and "Wellness Index" rings in the mockup.
- **Mood / behavior tags**: optional quick-tag log (e.g., "Anxious, Tired, Energetic, Focused") attached to a day, shown as small icons on the today view.
- **Analytics**: weekly/monthly completion rate charts, per-habit trend lines, best/worst day of week, category breakdown (donut chart).
- **Insights feed**: simple rule-based insights (e.g., "You complete 'Read' 80% more often on weekends") shown as a card feed, with dismiss/mark-read.
- CRUD everything: habits, daily logs, tags, insights (insights can be system-generated, but manually dismissible).

### 5.2 Study Tracker (General / Any Exam)
- **Subjects → Topics → Sub-topics** hierarchy (CRUD), each topic has status: Not Started / In Progress / Complete / Needs Revision.
- **Study session logging**: subject/topic, duration (timer or manual entry), date, notes, session type (Learning / Revision / Practice / Test).
- **Test tracker**: log mock test attempts — test name, date, subject(s) covered, score, max score, percentile (optional), time taken; list + detail view.
- **Remaining topics view**: auto-calculated list of Not Started / In Progress topics, filterable by subject, sortable by priority/weightage.
- **Syllabus coverage %**: overall and per-subject progress bar/ring (mirrors "Needs Satisfaction 38%" style widget).
- **Calendar/Journal view**: like the mockup's "JOURNAL" screen — day strip + today's study summary (time studied, sessions, target vs actual) with horizontal progress bars per activity (mirrors Eating/Drinking/Moving bars — here: per-subject minutes studied today vs. daily average).
- **Analytics**: study hours per day/week/month (bar chart), subject-wise time distribution (donut), score trend across tests (line chart), streak of consecutive study days.
- **Revision reminders**: topics marked "Complete" surface again after N days (spaced repetition-lite) for revision.

### 5.3 Money Tracker
- **Accounts** (optional, simple: Cash, Bank, UPI, Card) CRUD.
- **Transactions** CRUD: amount, type (income/expense), category, account, date, note, tags.
- **Categories** CRUD with icon + color (Food, Transport, Rent, Subscriptions, Study Materials, etc.), default seeded categories.
- **Budgets**: monthly budget per category + overall; progress bar (spent vs budget), similar visual language to habit progress rings.
- **Savings Goals**: target amount, target date, current saved, contributions log; progress ring.
- **Calendar view**: month grid showing daily net spend (color intensity = spend amount), click a day for transaction list.
- **Analytics**: monthly spend vs income (bar), category breakdown (donut/pie), trend over months (line), top spending categories, average daily spend.
- **Recurring transactions**: mark a transaction as recurring (monthly rent, subscriptions) so it auto-suggests/auto-creates next month.

### 5.4 Cross-cutting / Home Dashboard
- Unified "Today" dashboard combining a snapshot of all three modules (habit completion %, study time today, money spent today) — visually similar to the first mockup screen.
- Global bottom navigation (5 tabs, matching the mockup icons): **Map/Overview | Analytics (pie) | Home | Trends (line chart) | Profile**. (Exact mapping defined in `webappflow.md`.)
- Global search (optional, later phase) across habits/topics/transactions.
- Notifications/reminders (in-app first; push later phase).
- Dark mode (optional, later phase) — keep playful palette adapted.

### 5.5 Auth & Account
- Firebase Authentication: Email/Password + Google Sign-In.
- Single-user data isolation via Firebase UID as the partition key for all Firestore documents.
- Profile page: name, avatar, email, theme preference, exam/target date (used for countdown widget, optional), currency preference (for money module).
- Onboarding flow on first login (see `webappflow.md`).

---

## 6. Non-Functional Requirements

- **Responsive**: mobile-first, must look good at 375px width (as in the mockup) up to desktop (1440px+).
- **Performance**: initial load < 2.5s on 4G, route transitions feel instant (optimistic UI for CRUD).
- **Offline resilience**: basic offline read via Firestore's built-in local cache; writes queue and sync when back online.
- **Data integrity**: all writes validated client-side (Zod) and enforced server-side (Firestore Security Rules).
- **Accessibility**: color contrast AA minimum despite pastel palette; all interactive elements keyboard-navigable; icons paired with text/aria-labels.
- **Security**: no data readable/writable across users; Firebase Storage rules scoped per-user for avatar/attachment uploads.
- **Extensibility**: schema and code structure should allow adding a 4th "module" (e.g., Fitness) later without rewriting core patterns.

---

## 7. Out of Scope (v1)

- Multi-user collaboration / sharing data with others.
- Native mobile apps (PWA-installable web app is enough).
- Bank account syncing (Plaid-like) — transactions are manual entry only.
- AI-generated insights beyond simple rule-based ones (can be a fast-follow).
- Push notifications (v1 uses in-app reminders only).

---

## 8. Assumptions

- Single user, so no roles/permissions system needed beyond "signed in vs not."
- Firebase (Auth + Firestore + Storage) is the committed backend — no other DB.
- Built with Next.js + React, deployed to Vercel.
- The study tracker is a generic study tracker that supports any exam, syllabus, or learning track for any age group, customizable by the user.

---

## 9. Future Roadmap (Post-v1)

- Push notifications & reminders.
- AI-generated weekly summary ("Your week in review").
- Recurring transaction automation + bill reminders.
- Export data (CSV/PDF reports).
- Shared/family money tracking mode.
- Spaced-repetition flashcards for study topics.
