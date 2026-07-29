# rules.md — Project Rules & Conventions

These are binding conventions for anyone (human or AI coding agent) working on this codebase. Follow the docs in this order of authority when there's a conflict: `prd.md` (what to build) → `techspec.md`/`schema.md` (how, technically) → `design.md` (how it should look) → `webappflow.md` (how screens connect) → this file (how to write the code) → `implementationplan.md`/`tracker.md` (sequencing/status).

## 1. General Principles
- Build in the phase order defined in `implementationplan.md`. Don't jump ahead to Phase 5 features while Phase 2 is incomplete.
- Every phase should leave the app in a runnable, non-broken state (`npm run build` passes) before moving on.
- Prefer boring, explicit code over clever abstractions. This is a solo/small-team production app, not a library — optimize for readability and easy future edits.
- Mobile-first: build and visually check every screen at 375px width first, then verify tablet/desktop.

## 2. TypeScript
- `strict: true` in `tsconfig.json`. No `any` unless truly unavoidable (and commented why).
- All Firestore document shapes must have a corresponding TS type in `/types`, generated from or matching the zod schema in `/lib/schemas`.
- Prefer `type` over `interface` for data shapes; `interface` acceptable for component prop contracts.

## 3. Component Conventions
- One component per file, filename matches component name (`StatTile.tsx` exports `StatTile`).
- Co-locate domain components under `/components/goals`, `/components/study`, `/components/money`; truly shared/generic components go in `/components/shared`; unstyled primitives in `/components/ui` (shadcn output — do not hand-edit primitives beyond initial styling pass, wrap instead).
- Props: always typed explicitly, no implicit `any` props. Destructure props in the function signature.
- Client components need `"use client"` only where actually required (state, effects, event handlers, browser APIs) — keep server components for static/layout shells where possible per Next.js App Router best practice.
- No inline style objects for anything themeable — use Tailwind classes + the design.md CSS variables. Inline `style` only for truly dynamic values (e.g. a computed stroke-dashoffset for a progress ring).

## 4. Styling Rules
- All colors must reference the design tokens defined in `design.md` §2 (as Tailwind theme extensions / CSS vars) — no ad-hoc hex codes scattered in components.
- Use the radius scale (`--radius-sm/md/lg/xl`) consistently; don't invent new radius values per component.
- Every new UI element should be checked against `design.md` before being considered "done" — if it doesn't fit the playful/rounded/warm aesthetic, it's not done yet.

## 5. Data Layer Rules
- Never call Firestore SDK functions directly from a component. Always go through a hook in `/lib/queries`.
- Every mutation hook must implement optimistic update + rollback-on-error (React Query pattern) for anything triggered by a common/frequent user action (habit toggle, add transaction, log study session). Rarer actions (delete subject, delete account) can skip optimistic UI and just show a loading state.
- Any new Firestore collection or field must be added to `schema.md` in the same PR/change — schema.md is the source of truth and must never drift from actual Firestore usage.
- Any new collection must be covered by the existing `users/{uid}/**` security rule pattern — do not create top-level collections outside a user's namespace without updating `firestore.rules` and re-documenting in `techspec.md` §8.

## 6. Forms
- All forms use `react-hook-form` + a `zod` resolver. Validation error messages should be short and friendly (matches the playful tone — e.g. "Give this habit a name" not "Field required").
- Reuse `<ResponsiveFormContainer>` for all create/edit forms so mobile = bottom sheet, desktop = modal, automatically.

## 7. Naming Conventions
- Files/folders: `kebab-case` for route folders, `PascalCase.tsx` for components, `camelCase.ts` for hooks/utils.
- React Query keys: `[domain, uid, ...params]`, e.g. `["habits", uid]`, `["habitLogs", uid, habitId, month]`.
- Firestore field names: `camelCase`, matching `schema.md` exactly — never rename a field in code without updating schema.md.
- Dates stored as `"yyyy-mm-dd"` strings for day-level data (habit logs, transactions, sessions) for easy range queries and sorting; use Firestore `Timestamp` only for true instant-in-time fields (`createdAt`, `updatedAt`).

## 8. Git / Commit Conventions
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- One phase (from `implementationplan.md`) ≈ one feature branch, e.g. `feat/phase-3-goals-module`, merged via PR even in a solo workflow (keeps history clean and reviewable).
- Update `tracker.md` status + change log as part of the same PR that completes a phase item — not as an afterthought later.

## 9. Testing Expectations
- Any pure function added to `/lib/utils` (streak calc, budget calc, insight rules, analytics aggregation) must have a unit test. These are exactly the functions most likely to have subtle bugs and are cheap to test.
- Don't block shipping v1 on 100% E2E coverage — prioritize the 3 critical flows listed in `implementationplan.md` Phase 8 first.

## 10. Accessibility & Responsiveness Checklist (apply to every new screen)
- [ ] Works and looks correct at 375px width.
- [ ] Works and looks correct at ≥1024px width (sidebar layout, not just a stretched mobile view).
- [ ] All icon-only buttons have an `aria-label`.
- [ ] Color is never the only signal for status (pair with icon/text).
- [ ] Loading and empty states exist — no raw blank screens or unhandled `undefined` renders.

## 11. What NOT to Do
- Don't add a new top-level nav destination without updating `webappflow.md` and both nav renderers (bottom nav + sidebar).
- Don't introduce a second state-management library (Redux, MobX, Jotai, etc.) — Zustand (UI state) + React Query (server state) is the whole state story for this app.
- Don't hardcode currency symbols — use the user's `currency` setting from `users/{uid}`.
- Don't build features from `implementationplan.md`'s "Post-v1" list until v1 phases (0–9) are complete and tracked as Done in `tracker.md`.
