# 📱 Mobile UI/UX Overhaul: Habits Space Task Checklist (Phase 1)

## Phase 1: Store & Navigation Foundation
- [x] **Task 1.1**: Update `src/store/ui-store.ts` to default `habitLayoutStyle` to `"compact"`.
- [x] **Task 1.2**: Support contextual Add Habit action via thumb-zone floating action button (`+`) and `invictus:open-new-habit` event listener on `/goals`.
- [x] **Task 1.3**: Update `src/components/goals/LifeSpaceSubNav.tsx` for slim mobile padding and smooth scroll snap.

## Phase 2: Unified Hero Pager & Integrated Mascot Component
- [x] **Task 2.1**: Build `src/components/goals/HabitsHeroPager.tsx` (3-slide swipeable deck with pager dots: Arc Gauge + Strobi, Weekly bars, Streak shield).
- [x] **Task 2.2**: Refactor `src/components/goals/HabitsCockpitDeck.tsx` (embed `HabitsHeroPager`, remove standalone Strobi card, position 7-day scrubber directly beneath, remove top `+ New Habit`).

## Phase 3: Habit Row Density & Anti-Truncation Polish
- [x] **Task 3.1**: Refactor `src/components/goals/HabitCard.tsx` (Compact View: 44px touch targets, `line-clamp-2` anti-truncation, badge wrapping on 360px).
- [x] **Task 3.2**: Refactor Habits Filter Dock in `src/app/(app)/goals/page.tsx` (compact ~36px height, preserved `Check All` / `Reset`).

## Phase 4: User Reference Water Tracker & Health Stats Relocation
- [x] **Task 4.1**: Rebuild `src/components/goals/WaterTracker.tsx` to match user reference (compact ~140px card with right vertical fluid reservoir).
- [x] **Task 4.2**: Relocate `Body profile` (`68 kg • 24 Yrs`) to `/goals/analytics` and User Profile.
- [x] **Task 4.3**: Adjust `StickyHabitsMiniCockpit.tsx` scroll threshold and mobile positioning to prevent header occlusion.

## Phase 5: Verification, Quality Gate & Visual Evidence
- [x] **Task 5.1**: Run TypeScript verification (`npx tsc --noEmit`) — 0 errors.
- [x] **Task 5.2**: Run full Vitest test suite (`npm test`) — 100% green (340 tests across 59 files).
- [x] **Task 5.3**: Run Playwright audit across 360px, 390px, 412px viewports (light and dark mode) to capture visual proof.
