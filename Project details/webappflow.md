# webappflow.md — App Flow & Navigation

## 1. Sitemap
```
/login
/signup
/onboarding                     (first-time setup wizard)

/today                          (home dashboard)  <-- default landing after login

/goals                          (habit/goal list + calendar + streaks overview)
/goals/[habitId]                (single habit detail + its analytics)
/goals/new                      (create habit/goal modal or route)

/study                          (subjects overview)
/study/[subjectId]              (topics list within a subject)
/study/[subjectId]/[topicId]    (topic detail: sessions log, notes, confidence)
/study/tests                    (mock test list + add test)
/study/tests/[testId]           (test detail)
/study/analytics                (syllabus completion, hours, score trend)

/money                          (transaction list, filters)
/money/budgets                  (category budgets)
/money/analytics                (spend breakdown, trends)
/money/new                      (add transaction modal or route)

/settings
/profile
```

## 2. Navigation Model
- **Mobile (≤1024px):** fixed bottom pill nav bar, 5 icons — matches reference mockups exactly:
  1. **Overview/Map icon** → `/today` alternate view or a "life map" visualization (optional creative reuse of the location icon as a visual timeline) — default: routes to `/today`.
  2. **Analytics (pie chart icon)** → opens an analytics hub (tabs: Goals / Study / Money analytics).
  3. **Home (house icon)** → `/today` (primary landing tab, center position, slightly emphasized like the reference).
  4. **Trends (line chart icon)** → `/goals` calendar/journal-style view (mirrors the reference "Journal" screen).
  5. **Profile (person icon)** → `/profile`.
- **Desktop (≥1024px):** left vertical sidebar with the same 5 destinations plus module labels (Today, Goals, Study, Money, Settings), persistent and expanded (icon + label). Bottom nav is hidden.
- Each module (`Goals`, `Study`, `Money`) has its own **internal sub-tabs** at the top of the page (e.g. Goals: `List | Calendar | Analytics`) — consistent 3-tab pattern reused across all three modules for muscle-memory.

## 3. Core User Journeys

### 3.1 First-Time User (Signup → Onboarding → First Data)
1. Land on `/signup` → email/password or "Continue with Google."
2. Redirect to `/onboarding`:
   - Step 1: Name + optional avatar.
   - Step 2: Timezone + week-start day + currency.
   - Step 3: "What do you want to track?" → checkboxes for Goals/Habits, Study (customizable exam/study tracking), Money — all default checked, user can deselect modules they don't need (hides that bottom-nav module without deleting future ability to enable it in Settings).
   - Step 4 (conditional, if Study selected): target exam/subject name + target/exam date.
   - Step 5: Quick-add first habit + first budget category (skippable) to avoid an empty first screen.
3. Redirect to `/today` — dashboard shows starter state with a friendly empty-state illustration + CTA per module if nothing logged yet.

### 3.2 Returning User — Daily Check-in (primary loop, target < 2 min)
1. Open app → `/today` (auto-redirect if session valid).
2. See calendar strip (current week, today circled — exact reference pattern) + 4 stat tiles (Needs Satisfaction / Activity Goal / Sleep-equivalent / Wellness-equivalent, mapped to this app's own metrics — see design.md for tile mapping).
3. Tap into a stat tile → expands or routes to that module's detail.
4. Quick-log actions available directly from Today: check off a habit, log a quick expense, log study minutes — via a floating "+" action button (FAB) that opens a bottom-sheet with 3 quick-add options (Habit check-in / Add expense / Log study time).
5. Insights card at bottom surfaces 1–2 auto-generated observations.

### 3.3 Habit/Goal Management
1. `/goals` → List tab shows all habits as colorful cards (icon, streak flame badge, today's status toggle).
2. Tap "+ New" → form (title, icon picker, color, frequency, reminder) → save → optimistic card appears.
3. Tap a habit card → `/goals/[habitId]` → detail with streak counter, calendar heatmap for that habit, weekly completion chart, edit/delete actions.
4. Calendar tab (`/goals` → Calendar) → month grid, color-coded per day (composite of all habits that day), tap a day → bottom sheet listing that day's habit log.
5. Analytics tab → composite trend charts, best/worst day-of-week, longest streaks leaderboard (of the user's own habits).

### 3.4 Study Tracker Flow (General Study / Any Exam)
1. `/study` → subject cards (progress ring per subject showing % topics completed).
2. Tap "+ New Subject" → name, color, icon.
3. Tap subject → `/study/[subjectId]` → topic list (checklist-style rows with status pill: Not Started/In Progress/Completed/Needs Revision).
4. Tap "+ New Topic" → title, estimated hours, notes.
5. Tap a topic → `/study/[subjectId]/[topicId]` → log a study session (duration, type, notes) via a simple form or start/stop timer widget; set confidence rating; view session history for that topic.
6. `/study/tests` → list of mock tests, "+ Add Test" → name, date, score/total, scope, optional PDF upload (Firebase Storage) → score trend chart auto-updates.
7. `/study/analytics` → syllabus completion donut, hours-per-day bar chart, days-remaining-to-exam countdown banner, revision-due list (topics not touched in X days + confidence < 4).

### 3.5 Money Tracker Flow
1. `/money` → running list of transactions (grouped by date), filter chips (category, income/expense, date range).
2. FAB "+ Add Transaction" → amount, type, category, date, note, optional receipt photo upload.
3. `/money/budgets` → category cards each with a horizontal progress bar (Below Average / Average / Above Average style bands exactly like reference), edit budget amount inline.
4. `/money/analytics` → income vs expense summary card, category donut chart, month-over-month bar chart, savings rate stat tile.

### 3.6 Settings / Profile / Account Deletion
1. `/profile` → avatar, name, edit button, "Settings" link, "Log out" button.
2. `/settings` → module toggles (show/hide Goals/Study/Money in nav), theme, notification toggle (stubbed v1), currency/timezone, exam date edit, **Export my data** (CSV/JSON download via Firestore query + client-side file generation), **Delete account** (double-confirm modal → deletes Firestore user subtree + Storage files + Firebase Auth user).

## 4. State Transitions / Edge Cases
- **Unauthenticated user hits any `/(app)` route** → redirect to `/login`, preserve intended destination via `?redirect=` param, return there post-login.
- **Authenticated but not onboarded** (`users/{uid}.onboarded !== true`) → force-redirect to `/onboarding` regardless of requested route.
- **Empty states**: every list view (no habits yet / no topics yet / no transactions yet) shows a friendly illustrated empty state with a single clear CTA button — never a blank screen.
- **Offline**: banner at top ("You're offline — changes will sync when you're back") using Firestore's offline persistence; queued writes sync automatically on reconnect.
- **Deleting a habit/topic/transaction**: always via confirm dialog; soft-delete not required for v1 (hard delete acceptable, but export-before-delete is encouraged in the confirm copy).

## 5. Modal / Sheet Conventions
- **Mobile**: creation/edit forms open as bottom sheets (slide up, rounded top corners matching the card radius in design.md).
- **Desktop**: same forms open as centered modals (dialogs), same form component reused — only the container/animation differs (handled by one `<ResponsiveFormContainer>` wrapper component).
