# 📱 Mobile Viewport & Ergonomics Audit: Production Benchmark Plan (v1.8.4)

## Executive Summary & Mission
Before finalizing `v1.8.3` / `v1.8.4`, a comprehensive visual inspection on a standard mobile viewport (390px × 844px) revealed pervasive text clipping, horizontal flex overcrowding, badge/button collisions, contrast degradation on `/study`, and floating pill/toast occlusions across all 9 application routes.

This plan executes a production-grade refactor to eliminate all clipping, establish Apple HIG & Neobrutalist mobile ergonomics, and ensure zero information loss on 360px–390px screens without altering desktop layouts.

---

## 🏆 Production Benchmark Reference (Apple iOS, Linear, Spotify, Hevy, Raycast)

| Feature / UI Area | Current Invictus (Flaw) | Production Leader Benchmark | Architectural Resolution |
| :--- | :--- | :--- | :--- |
| **Top Update Alert** | Single row `flex items-center justify-between` clips `"NEW V1.8.3 AVAILABL..."` | **Apple iOS System Banners**: Compact dismissible pill, tap entire banner to act | Collapse to `v1.8.4 Available ⚡` + single action pill on mobile; stack/reflow gracefully |
| **Space Sub-Nav Tabs** | Raw horizontal overflow cuts off `"Meal & Fue"` with no visual cue; `"Analytics"` hidden | **Spotify / Apple Music Tab Bar**: Smooth drag-scroll with alpha fade mask on right edge | Add CSS `mask-image: linear-gradient(to right, black 85%, transparent)` + `no-scrollbar` + shorter mobile labels |
| **Daily Command Deck** | 3 rigid 103px columns clip `"4.0h dai... goal"`, motivation cuts off mid-sentence | **Hevy / Things 3 Daily Summary**: Responsive label abbreviation, wrap text directives | Abbreviate `"Daily Progress"` -> `"Progress"` on mobile, allow 2-line wrap on coach directive |
| **Cashflow & Wallets** | Label `"INCOME THIS MONTH"` wraps into 2 lines, breaking vertical baseline alignment | **Cash App / Revolut Card Deck**: Clean uppercase stat headers with tabular currency below | Stack label + balance in clean vertical micro-capsule; tabular nums with currency symbol |
| **Habits & Horizon** | View switcher row (`Cards/Compact/Matrix` + Date) overflows 450px on 390px screen | **Routinr / Apple Fitness**: Icon-only mode toggle on mobile, full labels on desktop | Show icon-only (`hidden sm:inline` for labels), saving 130px; prevents crushing date to `"T.."` |
| **Kanban & Task Lists** | Title `"PRODUCTION KANBAN BOARD"` collides with `"+ NEW TASK"` | **Linear Mobile Task Deck**: Vertical header stacking (`flex-col sm:flex-row`), clean gap | Stack header title and primary CTA cleanly on mobile viewports (<640px) |
| **Study & Academics** | Near-white CSS text on cream background (completely unreadable) | **Raycast / Linear Theming**: Semantic color tokens (`text-foreground`, `text-muted-foreground`) | Replace hardcoded light text classes with semantic theme variables |
| **Analytics Charts** | 4-item horizontal streak chart drops or squashes X-axis habit names | **Apple Health / Strava Mobile**: Horizontal telemetry progress bars on touch screens | Responsive chart sizing with abbreviated labels or clean horizontal telemetry list |
| **Settings Navigation** | Tablist (`Preferences`, `Workspaces`, `Alerts`, `SMS`, `Vault`) clips `"ALERTS"` | **Apple Settings / Telegram**: Scrollable pills with fading edges and concise labels | Concise mobile labels (`General`, `Spaces`, `Alerts`, `SMS`, `Vault`) with snap scroll |
| **Floating Overlays** | Live Activity pill hovers over form controls and checkboxes | **Apple Dynamic Island**: Floats ONLY for active background tasks (timer/rest), never static stats | Hide ambient stats pill on mobile viewports; reserve island exclusively for active Pomodoro/Gym rest |

---

## 🧠 The Educational Audit Layer: The "Why", "How", & Framework Basics

### 1. The "Why" (Root Architectural Causes)
1. **The Rigid Width Trap**: Setting fixed widths or 3 equal columns (`grid-cols-3`) on a 390px screen leaves only ~100px per column after subtracting 48px padding. English words like `"Daily Progress"` (14 chars) or `"4.0h daily goal"` (15 chars) physically exceed 100px in 12px bold typography.
2. **The Truncation Fallacy**: Applying `truncate` (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap`) as a quick fix produces broken fragments (`"4.0h dai... goal"`, `"NEW V1.8.3 AVAILABL..."`, `"Food..."`) that destroy user trust.
3. **Missing Overflow Affordance**: Without an alpha fade mask, horizontally scrollable containers look clipped and broken rather than intentionally scrollable.
4. **Z-Index & Floating Pill Stacking**: A static ambient pill positioned at `fixed bottom-20` creates a permanent touch obstruction over lower-screen interactive items.

### 2. Approach Comparison & Trade-Off Matrix

#### A. Handling Multi-Word Mobile Headers & Telemetry Labels
| Approach | Visual Quality | Screen Space Efficiency | Code Complexity | Final Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **CSS `truncate`** | ❌ Ugly ellipses mid-word | High | Low | **Banned for critical telemetry** |
| **CSS `line-clamp-2`** | ⭐ High readability | Moderate | Low | **Adopted for coach quips & notes** |
| **Responsive Responsive Label Sizing** (`<span className="hidden sm:inline">Daily </span>Progress`) | ⭐⭐ World-class (Apple/Linear) | Maximum | Low | **Adopted for telemetry & tab bars** |

#### B. Horizontally Scrollable Tab Bars (SubNav, Settings, Filters)
| Approach | Visual Cue | Touch Panning | Desktop Look | Final Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **Wrap to 2-3 lines** | ❌ Clutters screen, layout thrash | None | Same | ❌ Banned |
| **Raw `overflow-x-auto`** | ⚠️ Clipped text looks like a bug | Yes | Clean | ⚠️ Incomplete |
| **Fading Mask + `no-scrollbar`** | ⭐⭐ Smooth Spotify-grade fade | Native touch snap | Unaffected | **Preferred Standard** |

### 3. Framework Demystification in Plain English
- **`min-w-0` in Flexbox**: By default, a flex child has `min-width: auto`, meaning it refuses to shrink smaller than its content. Adding `min-w-0` tells the browser: *"You are allowed to shrink this container smaller than its text"*, which allows `truncate` or wrapping to work without blowing out the screen width.
- **`mask-image: linear-gradient(...)`**: A CSS mask acts like a digital stencil. An alpha gradient from 100% black to 0% transparent at the right edge causes overflowing tabs to fade smoothly into the background, signaling to the user that more content is waiting to be swiped.
- **Tabular Numerals (`font-mono tabular-nums`)**: Regular numbers have proportional widths (e.g. "1" is narrower than "8"). Tabular numerals force every digit to occupy the exact same horizontal width, preventing numbers from jittering or causing layout shifts when ticking.

---

## 📐 The 10 Real Engineering & Production Factors Applied

1. **State Topology & Cache Independence**: Viewport layout adjustments are purely presentational CSS/Tailwind classes—zero impact on Zustand stores or IndexedDB schema.
2. **Re-Render Blast Radius**: Use CSS media queries (`sm:`, `hidden sm:inline`) rather than JavaScript `useWindowDimensions()` resize listeners to avoid triggering React component re-renders on scroll or keyboard popups.
3. **Layout Geometry & CLS = 0**: Pre-allocate fixed container heights for banners, tabs, and headers so reflows never cause cumulative layout shift.
4. **Touch Targets (Apple HIG 44px Rule)**: Even when labels are hidden on mobile (icon-only mode), the clickable button wrapper maintains a minimum 44px × 44px hit target.
5. **Safe Area Insets**: Ensure `pb-28` to `pb-36` bottom clearance on mobile routes so content scrolls completely clear of the floating navigation dock.
6. **Hardware Acceleration**: Transitions on tabs and sheets utilize `will-change: transform` and CSS transitions without touching layout-triggering properties.
7. **Semantic Color Integrity**: All text colors on `/study` and other routes use semantic tokens (`text-foreground`, `text-muted-foreground`) to guarantee contrast compliance in both light (`#FAF8F5`) and dark (`#161514`) modes.
8. **Defensive Isolation**: Modals, banners, and floating pills use explicit `z-index` layering (`z-30`, `z-40`, `z-50`) to prevent modal-under-card overlap bugs.
9. **Zero-Error Hydration**: Eliminate any remaining client/server date or random mismatches so Next.js dev issue overlays do not appear.
10. **Bundle Budget**: Zero external packages added; all enhancements implemented via native CSS/Tailwind primitives.

---

## 📋 Phased Execution Roadmap

### Phase 1: Global Chrome, Banners & Overlays (Cross-Cutting)
- [ ] **Task 1.1**: Refactor `AutoUpdateBanner.tsx`:
  - On mobile (`sm:hidden`), collapse to concise badge + single action: `⚡ v1.8.4 Available` + `Reload` button.
  - Eliminate the duplicate `"Tap to update"` + `"Reload ⚡"` combo that caused `"NEW V1.8.3 AVAILABL..."`.
- [ ] **Task 1.2**: Refactor `DynamicIslandDock.tsx`:
  - On mobile, hide the static ambient stats pill (`₹657 left • 4/4`).
  - Reserve the mobile floating dock strictly for active background activities (`gym_rest` or `pomodoro`).
  - This immediately eliminates the persistent occlusion over checkmarks, cards, and buttons across all pages!
- [ ] **Task 1.3**: Refactor `layout.tsx` Footer:
  - Change footer status row to `flex-wrap gap-2 justify-center sm:justify-between`.
  - Hide desktop shortcut `<kbd>⌘ K</kbd>` on touch screens (`hidden sm:inline-block`), displaying `Quick Actions` cleanly.
  - Prevents `"• All systems healthy"` from clipping against the screen border.

### Phase 2: Space Sub-Navigation & Filter Bars (Fading Alpha Masks)
- [ ] **Task 2.1**: Refactor `LifeSpaceSubNav.tsx` (`/goals`, `/goals/gym`, `/goals/nutrition`):
  - Add smooth CSS fading scroll mask: `[mask-image:linear-gradient(to_right,black_85%,transparent)]` on mobile.
  - Use responsive short labels on mobile (`<span className="sm:hidden">Gym</span><span className="hidden sm:inline">Gym & Anatomy</span>`).
  - Ensures tabs like `Meal & Fuel` and `Analytics` are never clipped without an obvious swipe cue.
- [ ] **Task 2.2**: Refactor `MoneyTabView.tsx` & `LedgerTabView.tsx` (`/money`):
  - Apply the fading scroll mask to the money tab bar (`Ledger`, `Budgets`, `IOUs`, `Vault`, `Analytics`).
  - Make transaction search and filter bar wrap cleanly on mobile.
- [ ] **Task 2.3**: Refactor Settings Tablist (`/settings`):
  - Add horizontal snap scrolling and right fade mask to settings tabs (`Preferences`, `Workspaces`, `Alerts`, `SMS`, `Vault`).
  - Shorten tab labels on mobile viewports.

### Phase 3: Page-Specific Text & Layout Reflows
- [ ] **Task 3.1**: `/today` Daily Command Deck (`TodayCommandDeck.tsx` & `MasterTodayHero.tsx`):
  - Reflow 3-column telemetry headers: `"DAILY PROGRESS"` -> `"<span className='hidden sm:inline'>Daily </span>Progress"`.
  - Abbreviate study target: `"4.0h daily goal"` -> `"4.0h goal"`.
  - Replace `truncate` on AI Coach quip with `line-clamp-2` or natural wrap so sentences are never cut off mid-word.
  - Reflow top greeting row (`streak`, `shield`, `notes`, `review`) with `flex-wrap gap-1.5`.
- [ ] **Task 3.2**: `/money` Monthly Cashflow & Tab Views:
  - Refactor `WalletCardDeck.tsx` footer: stack `"INCOME"` and `"SPENT"` neatly with tabular currency below.
  - In `BudgetsTabView.tsx`, resize `"+ Monthly Envelope"` button to `"+ Envelope"` on mobile.
  - In `WhoOwesWhoTabView.tsx`, apply `flex-wrap gap-2` to header to prevent collision with `"Student Debt Deck"` badge.
- [ ] **Task 3.3**: `/goals` Habits Cockpit (`HabitsCockpitDeck.tsx`):
  - In bottom controls strip, hide text labels (`Cards`, `Compact`, `Matrix`) on mobile (`hidden sm:inline`), showing icons only.
  - Fix sticky mini-cockpit scroll-spy threshold so it never collides with `"7-Day Routine Horizon"`.
- [ ] **Task 3.4**: `/tasks` Kanban Board (`TasksPageContent.tsx` / `KanbanBoard.tsx`):
  - Reflow Kanban board header: `flex-col sm:flex-row sm:items-center justify-between gap-2.5`.
  - Add horizontal scroll with `no-scrollbar pr-4` to status and priority filter pills (`All`, `To Do`, `In Progress`, `P1 Urgent`).
- [ ] **Task 3.5**: `/study` Critical Contrast & Layout Repair (`/study/page.tsx`):
  - Eliminate hardcoded light-colored text classes on cream surfaces; enforce semantic `text-foreground` and `text-muted-foreground`.
  - Ensure subjects count, exam title, and description are crisp and 100% readable.
  - Apply responsive shortening to study tabs: `Syllabus`, `Sessions`, `Mocks & Stats`.
- [ ] **Task 3.6**: `/analytics` Charts & Matrix (`/analytics/page.tsx`):
  - Format habit streak chart X-axis labels to truncate/rotate or display as a clean vertical telemetry breakdown on mobile.
  - Add horizontal scroll padding `pr-4` to matrix filter pills.

### Phase 4: Verification, Quality Gate & Documentation
- [ ] **Task 4.1**: Run TypeScript type check (`npx tsc --noEmit`) - zero errors.
- [ ] **Task 4.2**: Run full unit test suite (`npm test`) - 100% green.
- [ ] **Task 4.3**: Run Next.js production build (`npm run build`) - zero errors.
- [ ] **Task 4.4**: Re-run mobile browser subagent at 390px across all 9 pages to capture before/after visual proof.
