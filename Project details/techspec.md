# techspec.md — Technical Specification

## 1. Stack Overview
| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 14+ (App Router)** | React Server Components where useful, but most of this app is interactive client state, so most module pages are `"use client"`. |
| Language | **TypeScript** | Strict mode on. |
| Styling | **Tailwind CSS** + CSS variables for the color system in `design.md` | Utility-first, fast to iterate, easy responsive breakpoints. |
| Component layer | **shadcn/ui** (Radix primitives) customized to match design.md | Gives accessible dialogs, dropdowns, tabs, calendars for free; restyle via Tailwind. |
| Icons | **lucide-react** | Matches the line-icon style in the reference screenshots. |
| Charts | **Recharts** | Line/bar/donut/pie for analytics; lightweight, good with React. |
| Forms | **react-hook-form** + **zod** | Validation schemas shared with Firestore data shape (see schema.md). |
| State/data layer | **TanStack Query (React Query)** wrapping Firestore calls | Caching, optimistic updates, background refetch. Avoid Redux — app state is mostly server state. |
| Local/UI state | **Zustand** (small) | For UI-only state: active tab, modal open/close, selected date, theme. |
| Auth | **Firebase Authentication** | Email/password + Google provider. |
| Database | **Cloud Firestore** | NoSQL, real-time listeners, per-user scoped via security rules. |
| File storage | **Firebase Storage** | Receipt images, test PDFs, avatar images. |
| Hosting/Deploy | **Vercel** (Next.js native) — Firebase used only for Auth/Firestore/Storage, not Hosting | Keeps Next.js SSR/ISR features intact. |
| Date handling | **date-fns** | Lightweight, tree-shakeable, good for streak/calendar math. |
| PWA | **next-pwa** or manual manifest + service worker | Installable app, basic offline caching of shell. |
| Testing | **Vitest** + **React Testing Library** for units; **Playwright** for critical E2E flows (auth, add habit, add transaction) | |
| Linting/format | **ESLint** (next/core-web-vitals config) + **Prettier** + **Tailwind plugin for Prettier** | |

## 2. Why Firebase (Auth + Storage) here
- Auth: Firebase Auth handles email/password + OAuth (Google) with minimal backend code — no custom server needed for session management (use Firebase's client SDK + `next-firebase-auth` or a lightweight custom context + middleware for protecting routes).
- Firestore: real-time listeners are a natural fit for a dashboard that shows "today" data updating live across tabs/devices; flexible schema fits 3 different domains (habits/study/money) without a rigid relational migration story.
- Storage: needed for receipt photos (money module) and test PDFs/screenshots (study module) and avatar uploads.
- This keeps the whole backend serverless — no custom API server required for CRUD; Firestore security rules do authorization.

## 3. Project Structure (Next.js App Router)
```
/app
  /(auth)
    /login/page.tsx
    /signup/page.tsx
    /onboarding/page.tsx
  /(app)                      <- protected route group
    /today/page.tsx           <- home dashboard
    /goals
      /page.tsx                (list + calendar + streaks)
      /[habitId]/page.tsx       (habit detail + analytics)
    /study
      /page.tsx                (subjects overview)
      /[subjectId]/page.tsx     (topics list)
      /tests/page.tsx
      /analytics/page.tsx
    /money
      /page.tsx                (transactions list)
      /budgets/page.tsx
      /analytics/page.tsx
    /settings/page.tsx
    /profile/page.tsx
    layout.tsx                <- shell w/ bottom nav (mobile) / side nav (desktop)
  layout.tsx                   <- root layout, fonts, providers
  globals.css
/components
  /ui                          <- shadcn primitives, restyled
  /shared                      <- StatTile, ProgressRing, StreakBadge, CalendarStrip, BottomNav, InsightCard...
  /goals /study /money          <- domain-specific components
/lib
  /firebase.ts                 <- client SDK init
  /firebase-admin.ts            <- (only if server actions need admin, e.g. account deletion)
  /queries                      <- React Query hooks per domain (useHabits, useTransactions, useStudySessions...)
  /schemas                      <- zod schemas (mirrors schema.md)
  /utils                        <- streak calc, date helpers, analytics aggregation helpers
/store
  ui-store.ts                   <- Zustand store
/types
  index.ts                      <- shared TS types generated from zod schemas
```

## 4. Auth Flow (technical)
1. Firebase client SDK initialized once (`lib/firebase.ts`), config from `.env.local`.
2. `AuthProvider` (React context) subscribes to `onAuthStateChanged`, exposes `user`, `loading`.
3. Route protection: middleware or a client-side guard in `(app)/layout.tsx` — redirect to `/login` if no user once auth state resolves. (Next.js middleware can't read Firebase client auth directly, so use a lightweight session cookie set via `signInWithIdToken` callback on the server, or simpler v1 approach: client-side redirect guard + Firestore rules as the real security boundary.)
4. New users routed to `/onboarding` if their `users/{uid}` Firestore doc doesn't exist yet or `onboarded !== true`.

## 5. Data Access Pattern
- All reads/writes go through typed hooks in `lib/queries/*`, e.g.:
  - `useHabits()`, `useAddHabit()`, `useUpdateHabit()`, `useDeleteHabit()`, `useToggleHabitLog(date)`
  - `useTransactions(filters)`, `useAddTransaction()`, ...
  - `useTopics(subjectId)`, `useLogStudySession()`, ...
- Each hook wraps a Firestore call in a React Query `useQuery`/`useMutation`, with `queryKey` scoped by `uid` + domain + params, and optimistic updates on mutations for snappy mobile UX.
- Firestore `onSnapshot` real-time listeners used for the "Today" dashboard (so multi-tab / multi-device stays in sync); simple `getDocs` for paginated historical lists (e.g. transaction history) to control read costs.

## 6. Analytics Computation
- Prefer **client-side aggregation** over Cloud Functions in v1 (keeps it serverless-simple): fetch raw logs for the relevant date range, compute streaks/completion %/sums in `lib/utils/analytics.ts` with pure functions (unit-testable).
- If data volume grows large (long-time users), add a **Cloud Function** later to maintain denormalized rollup docs (`stats/{uid}/monthly/{yyyy-mm}`) — noted as a v2 optimization in implementationplan.md, not required for v1.

## 7. Responsive Strategy
- Mobile-first Tailwind breakpoints: base (≤640px) is the primary design target (matches reference mockups 1:1 in spirit).
- `sm/md`: tablet — 2-column stat grids.
- `lg+`: desktop — persistent left sidebar nav replaces bottom tab bar; main content area max-width ~1100px centered; multi-column dashboards (e.g. Today screen becomes a 3-column layout: goals | study | money).
- Bottom nav bar (mobile) and side nav (desktop) share the same nav-item config array — one source of truth, two renderers.

## 8. Firebase Security Rules (approach)
- All top-level user-owned collections nested or tagged by `uid`; rule pattern:
```
match /databases/{database}/documents {
  match /users/{uid} {
    allow read, write: if request.auth != null && request.auth.uid == uid;
    match /{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```
- All domain collections (habits, transactions, topics, etc.) live under `users/{uid}/...` subcollections — see schema.md — so this single rule secures everything.
- Firebase Storage rules mirror this: files stored at `users/{uid}/...` paths only, readable/writable by that uid.

## 9. Environment & Config
- `.env.local`: `NEXT_PUBLIC_FIREBASE_API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID`.
- Firebase project setup: enable Email/Password + Google sign-in providers, create Firestore in production mode with rules above, enable Storage.

## 10. Error Handling & Loading States
- React Query's `isLoading`/`isError` drives skeleton loaders (styled as soft rounded gray-blocks matching card shapes) and toast-based error messages (`sonner` or shadcn `toast`).
- Firestore write failures roll back optimistic UI updates automatically via React Query's `onError` rollback pattern.

## 11. Key Third-Party Packages (final list)
```
next, react, react-dom, typescript
firebase
@tanstack/react-query
zustand
react-hook-form, zod, @hookform/resolvers
recharts
date-fns
lucide-react
tailwindcss, tailwind-merge, clsx
shadcn/ui deps (@radix-ui/*)
sonner (toasts)
next-pwa (or manual sw)
```

## 12. Deployment
- Vercel project connected to GitHub repo, auto-deploy on `main` push, preview deployments per PR.
- Firebase project configured separately (console.firebase.google.com); rules deployed via `firebase deploy --only firestore:rules,storage:rules` from CLI, kept in repo (`firestore.rules`, `storage.rules`).
