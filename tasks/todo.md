# 📱 Mobile Viewport & Ergonomics Audit: Task Breakdown (v1.8.4)

## Phase 1: Global Chrome, Banners & Overlays (Cross-Cutting)
- [x] **Task 1.1**: Refactor `AutoUpdateBanner.tsx` for mobile viewports (`sm:hidden` compact badge `⚡ v1.8.4 Available` + `Reload` button, eliminate clipped `NEW V1.8.3 AVAILABL...`).
- [x] **Task 1.2**: Refactor `DynamicIslandDock.tsx` to hide static ambient stats pill on mobile screens (<1024px), reserving the floating island exclusively for active Pomodoro or Gym Rest timers.
- [x] **Task 1.3**: Refactor `layout.tsx` Footer to wrap cleanly on mobile, hide the desktop shortcut pill `<kbd>⌘ K</kbd>` on touch screens, and prevent `All systems healthy` right-edge clipping.

## Phase 2: Space Sub-Navigation & Filter Bars (Fading Masks & Ergonomics)
- [x] **Task 2.1**: Refactor `LifeSpaceSubNav.tsx` (`/goals`, `/goals/gym`, `/goals/nutrition`) with CSS fading scroll mask `mask-image` and responsive short labels (`Gym`, `Diet`) on mobile.
- [x] **Task 2.2**: Refactor `MoneyTabView.tsx` & `LedgerTabView.tsx` with smooth horizontal snap scrolling, fading mask, and responsive transaction filter wrapping.
- [x] **Task 2.3**: Refactor Settings Tablist (`src/app/(app)/settings/page.tsx`) with horizontal snap scroll, edge fading, and concise mobile tab labels (`General`, `Spaces`, `Alerts`, `SMS`, `Vault`).

## Phase 3: Page-Specific Text & Layout Reflows
- [ ] **Task 3.1**: Refactor `/today` Daily Command Deck (`TodayCommandDeck.tsx` & `MasterTodayHero.tsx`) — shorten telemetry titles on mobile (`Progress`, `4.0h goal`), replace `truncate` on AI Coach message with `line-clamp-2`, and wrap greeting badges cleanly.
- [ ] **Task 3.2**: Refactor `/money` Cashflow Cards & Tab Views — stack `"INCOME"` and `"SPENT"` neatly in `WalletCardDeck.tsx`, shorten `+ Monthly Envelope` to `+ Envelope` in `BudgetsTabView.tsx`, and prevent header collision in `WhoOwesWhoTabView.tsx`.
- [ ] **Task 3.3**: Refactor `/goals` Habits Cockpit (`HabitsCockpitDeck.tsx`) — hide view switcher text labels (`Cards`, `Compact`, `Matrix`) on mobile to show icons only (saving 130px and fixing date crushing to `"T.."`), and adjust sticky mini-cockpit scroll-spy threshold.
- [ ] **Task 3.4**: Refactor `/tasks` Kanban Board (`TasksPageContent.tsx`) — stack Kanban header and `+ NEW TASK` button (`flex-col sm:flex-row`), and enable horizontal scroll with `pr-4` for priority filter pills.
- [ ] **Task 3.5**: Fix `/study` critical contrast bug (`src/app/(app)/study/page.tsx`) — replace hardcoded light text classes with semantic `text-foreground` and `text-muted-foreground`, and shorten tab labels on mobile (`Syllabus`, `Sessions`, `Mocks & Stats`).
- [ ] **Task 3.6**: Refactor `/analytics` Charts & Matrix (`/analytics/page.tsx`) — fix streak chart X-axis label squashing on mobile, and add horizontal scroll padding `pr-4` to matrix filter pills.

## Phase 4: Quality Gate & Verification
- [ ] **Task 4.1**: Run TypeScript verification (`npx tsc --noEmit`) to guarantee 0 type errors.
- [ ] **Task 4.2**: Run full Vitest suite (`npm test`) to guarantee 100% green tests.
- [ ] **Task 4.3**: Run Next.js production build (`npm run build`) to ensure 0 bundle or syntax issues.
- [ ] **Task 4.4**: Re-run mobile browser subagent at 390px across all 9 pages to verify zero text clipping, zero collisions, and perfect readability.
