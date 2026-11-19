# 📋 Invictus OS Feature Ledger (Universal Architecture)

> **Mandate**: Every user-facing feature, button, modal, toggle, setting, empty state, and widget is cataloged here.  
> **Status Rules**: `TODO`, `MOVED`, `KEPT`, `MERGED`, `REMOVED (needs founder approval)`. Zero features are removed without approval.  
> **Columns Required by Skill**:
> - `ID`: Unique identifier
> - `Domain`: Domain Cluster (`HABITS CORE` | `BODY & GYM` | `NUTRITION` | `RECOVERY` | `MONEY` | `STUDY`)
> - `Page`: Primary parent page route
> - `Feature / Control`: User-facing capability
> - `Current Location`: Component or route in codebase
> - `New Location`: Destination per redesign architecture
> - `Depth`: `L1` (on-page main viewport) | `L2` (1 tap: tile, "See all", sub-tab) | `L3` (sheet/expand: form, filter, settings)
> - `Container`: `TAB` | `SCREEN` | `SHEET` | `INLINE`
> - `Status`: Implementation status

---

## Habits Space (`/goals`) & Sub-Tabs

| ID | Domain | Page | Feature / Control | Current Location | New Location | Depth | Container | Status |
|:---|:---|:---|:---|:---|:---|:---:|:---:|:---:|
| **H-01** | `HABITS CORE` | `/goals` | Page Title "Habits" + Live Date | `MobileAppBar` left | `MobileAppBar` (Left): "Habits" + compact date | L1 | `INLINE` | `KEPT` |
| **H-02** | `HABITS CORE` | `/goals` | Calendar jump-to-today shortcut | `MobileAppBar` right icon 1 | `MobileAppBar` (Right icon 1): Jump to today | L1 | `INLINE` | `KEPT` |
| **H-03** | `HABITS CORE` | `/goals` | App Bar Overflow Menu (⋯) | `MobileAppBar` right icon 2 | `MobileAppBar` (Right icon 2): Check All Due, Density toggle, Sound toggle | L1 | `INLINE` | `KEPT` |
| **H-04** | `SYSTEM` | `/goals` | Theme toggle (Light/Dark) | `MobileAppBar` / `SpaceHeader` | Profile / Settings drawer (removed from mobile page chrome) | L2 | `SCREEN` | `MOVED` |
| **H-05** | `HABITS CORE` | `/goals` | Sound FX Mute/Unmute Toggle | `MobileAppBar` overflow menu | App bar overflow (⋯) + Settings | L2 | `SHEET` | `MOVED` |
| **H-06** | `SYSTEM` | `/goals` | Cloud sync status badge | `SpaceHeader` desktop | App bar overflow menu or Settings/Profile | L2 | `SCREEN` | `MOVED` |
| **H-07** | `HABITS CORE` | `/goals` | Reminder Manager notification bell | `DoorTileRow` (Alerts) | Door Tile 3: `🔔 Alerts: Active` $\rightarrow$ Alerts Sheet | L2 | `SHEET` | `MOVED` |
| **H-08** | `SYSTEM` | `/goals` | User profile avatar dropdown | BottomNav / `SpaceHeader` | BottomNav profile tab | L1 | `TAB` | `MOVED` |
| **H-09** | `SYSTEM` | `/goals` | System status footer (Build v1.8.3, All systems healthy) | Page bottom `footer` | Clean production status footer above BottomNav clearance | L1 | `INLINE` | `KEPT` |
| **H-10** | `HABITS CORE` | `/goals` | Life Space Sub-Nav (Habits, Gym, Diet, Stats) | `SegmentedSubNav` | Sticky segmented pill control directly under App bar | L1 | `TAB` | `KEPT` |
| **H-11** | `HABITS CORE` | `/goals` | Daily Completion Arc Dot-Gauge Hero | `HabitsHeroPager` Slide 0 | `<Hero variant="gauge" />` Slide 0: Borderless Amphitheater Arc Gauge (58px dominant number) | L1 | `INLINE` | `KEPT` |
| **H-12** | `HABITS CORE` | `/goals` | Weekly Velocity 7-Day Bars | `HabitsHeroPager` Slide 1 | `<Hero variant="gauge" />` Slide 1: Borderless Weekly Velocity Display (7 bars + 58px avg) | L1 | `INLINE` | `KEPT` |
| **H-13** | `HABITS CORE` | `/goals` | Longest Streak & Cryo-Shield Target | `HabitsHeroPager` Slide 2 | `<Hero variant="gauge" />` Slide 2: Borderless Active Streak Display (58px days + shield status) | L1 | `INLINE` | `KEPT` |
| **H-14** | `HABITS CORE` | `/goals` | Mascot (Strobi) & Reaction | Inside old arc gauge card | Shrunk to 26px avatar companion in Hero top-right corner (never overlaps arc) | L1 | `INLINE` | `MERGED` |
| **H-15** | `HABITS CORE` | `/goals` | XP & User Level (`Lvl X • Y XP`) | Inside old card title | Compact chip in Hero top-left corner | L1 | `INLINE` | `MOVED` |
| **H-16** | `HABITS CORE` | `/goals` | Cryo-Shield Inventory (`X/2 Shields`) | Inside old card header | Compact chip in Hero top-right corner | L1 | `INLINE` | `MOVED` |
| **H-17** | `HABITS CORE` | `/goals` | Cryo-Shield Vault Details Drawer | `AdaptiveDrawerDialog` | BottomSheet triggered by tapping Cryo-Shield chip in Hero | L3 | `SHEET` | `KEPT` |
| **H-18** | `HABITS CORE` | `/goals` | Welcome greeting copy | Verbose card paragraph | Single-line caption beneath primary number (`% TODAY`) | L1 | `INLINE` | `MERGED` |
| **H-19** | `HABITS CORE` | `/goals` | 7-Day Routine Horizon Date Scrubber | `HabitsDateStrip` | Single-line horizontal 7-day scrubber directly under hero | L1 | `INLINE` | `KEPT` |
| **H-20** | `HABITS CORE` | `/goals` | "Jump to Today" pill shortcut | `HabitsDateStrip` | Today pill highlighted in Electric Lime with 1-tap select | L1 | `INLINE` | `MERGED` |
| **H-21** | `HABITS CORE` | `/goals` | Density Switcher (Cards / Compact / Grid) | `MobileAppBar` overflow menu | App bar overflow (⋯) density picker; saved in UI store | L2 | `SHEET` | `MOVED` |
| **H-22** | `HABITS CORE` | `/goals` | Filter Chips (All / Due / Done) | Filter chip strip | Single-row filter pills with live count badges | L1 | `INLINE` | `KEPT` |
| **H-23** | `HABITS CORE` | `/goals` | Reps Ratio Indicator (`X/Y Reps`) | Quick filter right side | Inline telemetry beside filter chips (`3/5 Reps`) | L1 | `INLINE` | `KEPT` |
| **H-24** | `HABITS CORE` | `/goals` | "Check All Due" One-Tap Action | In-page button | App bar overflow (⋯) + keyboard shortcut Shift+⌘A | L2 | `SHEET` | `MOVED` |
| **H-25** | `HABITS CORE` | `/goals` | Primary Habit List Rows | `HabitListRow` in `goals/page.tsx` | 56-64px list rows on canvas with 1px hairline dividers | L1 | `INLINE` | `KEPT` |
| **H-26** | `HABITS CORE` | `/goals` | Habit Completion Checkbox | `HabitListRow` right | 44px hit-target checkbox on right edge of every row | L1 | `INLINE` | `KEPT` |
| **H-27** | `HABITS CORE` | `/goals` | Habit Streak Flame + Count | `HabitListRow` subtitle | Meta line inside habit row (`🔥 5d streak`) | L1 | `INLINE` | `KEPT` |
| **H-28** | `HABITS CORE` | `/goals` | Habit Reminder Time | `HabitListRow` subtitle | Meta line inside habit row (`⏰ 07:30 AM`) | L1 | `INLINE` | `KEPT` |
| **H-29** | `HABITS CORE` | `/goals` | Per-row ⋯ menu | Dropdown on old cards | Replaced by tap-to-expand drawer & swipe gestures | L2 | `INLINE` | `MERGED` |
| **H-30** | `HABITS CORE` | `/goals` | Per-row 7-day week completion dots | Always visible on old card | Revealed only when row is tapped/expanded | L3 | `INLINE` | `MOVED` |
| **H-31** | `HABITS CORE` | `/goals` | Row Swipe Gestures | `HabitListRow` | Swipe right = complete, swipe left = edit/delete drawer | L1 | `INLINE` | `KEPT` |
| **H-32** | `HABITS CORE` | `/goals` | Row Tap Expansion Drawer | `HabitListRow` | Tap row body expands inline: 7-day strip, Edit, Delete, Skip | L2 | `INLINE` | `KEPT` |
| **H-33** | `HABITS CORE` | `/goals` | Habit Detail Analytics View | Click old card background | "View Analytics" button in expanded row drawer $\rightarrow$ `/goals/[id]` | L2 | `SCREEN` | `MOVED` |
| **H-34** | `HABITS CORE` | `/goals` | List Capping + "See all N" | Uncapped scroll | Capped at 6 habits with "See all N habits" progressive reveal | L1 | `INLINE` | `KEPT` |
| **H-35** | `HABITS CORE` | `/goals` | Empty State: Zero habits created | Heavy card | Minimalist empty state + "Explore Vault" CTA | L1 | `INLINE` | `KEPT` |
| **H-36** | `HABITS CORE` | `/goals` | Empty State: All due habits finished | Heavy card | Clean 1-sentence state with "Show all habits" link | L1 | `INLINE` | `KEPT` |
| **H-37** | `NUTRITION` | `/goals` | Door Tile 1: Water Intake Tracker | `DoorTileRow` tile 1 | Door Tile 1: `💧 Water: 0/2000 ml` $\rightarrow$ Nutrition Hydration Sheet | L2 | `SHEET` | `MOVED` |
| **H-38** | `NUTRITION` | `/goals` | Water Quick-Add (+250 ml / +500 ml) | In water card | Quick-log buttons inside Hydration BottomSheet & FAB sheet | L3 | `SHEET` | `KEPT` |
| **H-39** | `NUTRITION` | `/goals` | Water Goal / Hydration Settings | In water card | Hydration Settings view inside Water BottomSheet | L3 | `SHEET` | `KEPT` |
| **H-40** | `BODY & GYM` | `/goals` | Door Tile 2: Body Profile (Weight, Age) | `DoorTileRow` tile 2 | Door Tile 2: `⚖️ Body: 68 kg • 24y` $\rightarrow$ Body & Gym Profile Sheet | L2 | `SHEET` | `MOVED` |
| **H-41** | `BODY & GYM` | `/goals` | Body Profile Edit Form | `AdaptiveDrawerDialog` | Body & Gym Profile BottomSheet with kg/lbs toggle | L3 | `SHEET` | `KEPT` |
| **H-42** | `HABITS CORE` | `/goals` | Door Tile 3: Proactive Reminders | `DoorTileRow` tile 3 | Door Tile 3: `🔔 Alerts: Active` $\rightarrow$ Reminders BottomSheet | L2 | `SHEET` | `MOVED` |
| **H-43** | `RECOVERY` | `/goals` | Door Tile 4: Recovery & Sleep Journal | `DoorTileRow` tile 4 | Door Tile 4: `🌙 Sleep & Journal` $\rightarrow$ Recovery BottomSheet | L2 | `SHEET` | `MOVED` |
| **H-44** | `RECOVERY` | `/goals` | Sleep duration & Active burn telemetry | `SleepAndActiveWidgets` | Rendered inside Recovery & Journal BottomSheet & Stats subtab | L2 | `SHEET` | `MOVED` |
| **H-45** | `RECOVERY` | `/goals` | Mood Journal & Daily Reflections | `MoodJournalWidget` | Rendered inside Recovery & Journal BottomSheet & Stats subtab | L2 | `SHEET` | `MOVED` |
| **H-46** | `HABITS CORE` | `/goals` | Desktop "+ New Habit" Button | Old deck header button | Merged into single docked Center FAB (and top bar overflow) | L1 | `SHEET` | `MERGED` |
| **H-47** | `HABITS CORE` | `/goals` | Floating Mobile Add Button | Old floating bottom button | Merged into single docked Center FAB in BottomNav notch | L1 | `SHEET` | `MERGED` |
| **H-48** | `HABITS CORE` | `/goals` | Docked Center FAB Action Sheet | `BottomNav` notch button | Tap docked FAB opens `ActionSheet`: New Habit, Log Workout, Log Meal, Log Water | L1 | `SHEET` | `KEPT` |
| **H-49** | `HABITS CORE` | `/goals` | Habit Choice Modal (Vault / Custom) | `HabitChoiceModal` | BottomSheet opened from FAB "New Habit" action | L2 | `SHEET` | `KEPT` |
| **H-50** | `HABITS CORE` | `/goals` | Custom New Habit Form | `AdaptiveDrawerDialog` | BottomSheet with key fields + "More options" expandable | L3 | `SHEET` | `KEPT` |
| **H-51** | `HABITS CORE` | `/goals` | Edit Habit Form | `AdaptiveDrawerDialog` | BottomSheet opened from row expand / swipe edit | L3 | `SHEET` | `KEPT` |
| **H-52** | `HABITS CORE` | `/goals` | Delete Habit Confirmation Modal | `DeleteConfirmationModal` | Centered dialog (strictly preserved for destructive actions) | L3 | `SHEET` | `KEPT` |
| **H-53** | `HABITS CORE` | `/goals` | Sticky mini-cockpit | `StickyHabitsMiniCockpit` | Replaced by sticky slim sub-nav + app bar | L1 | `INLINE` | `MERGED` |

---

## Sub-Tab 2: Gym & Routines (`/goals/gym`) — Domain: `BODY & GYM`

| ID | Domain | Page | Feature / Control | Current Location | New Location | Depth | Container | Status |
|:---|:---|:---|:---|:---|:---|:---:|:---:|:---:|
| **G-01** | `BODY & GYM` | `/goals/gym` | Sub-Nav Tab: Gym | `SegmentedSubNav` tab 2 | Segmented Sub-Nav tab 2 (`Gym`) | L1 | `TAB` | `KEPT` |
| **G-02** | `BODY & GYM` | `/goals/gym` | Gym Studio Header | Header card in `gym/page.tsx` | Streamlined App bar title + subtitle | L1 | `INLINE` | `MERGED` |
| **G-03** | `BODY & GYM` | `/goals/gym` | Dynamic Island Live Rest Timer | Sticky chip in header | Header-docked Dynamic Island live rest countdown | L1 | `INLINE` | `KEPT` |
| **G-04** | `BODY & GYM` | `/goals/gym` | Day of Week Picker (Mon - Sun) | `GymRoutineTracker` strip | Horizontal segmented day scrubber matching habits date strip | L1 | `INLINE` | `KEPT` |
| **G-05** | `BODY & GYM` | `/goals/gym` | Muscle Activation Anatomy Viewer | Full embedded `HumanMuscleAnatomy` | L2 entry button / sheet ("Inspect Target Muscles") | L2 | `SCREEN` | `MOVED` |
| **G-06** | `BODY & GYM` | `/goals/gym` | Workout Routine Cards & Exercises | Stacked cards in `GymRoutineTracker` | Compact workout exercise rows with sets, reps, weight | L1 | `INLINE` | `KEPT` |
| **G-07** | `BODY & GYM` | `/goals/gym` | Set Completion Checkboxes | Checkboxes inside sets table | 44px tap checkboxes for progressive overload sets | L1 | `INLINE` | `KEPT` |
| **G-08** | `BODY & GYM` | `/goals/gym` | "+ Add Movement" Button | In-page button | Contextual ActionSheet via docked FAB ("Log Workout / Add Movement") | L1 | `SHEET` | `MERGED` |
| **G-09** | `BODY & GYM` | `/goals/gym` | Workout Presets & Custom Modal | `GymChoiceModal` | BottomSheet for workout & exercise library | L2 | `SHEET` | `KEPT` |
| **G-10** | `BODY & GYM` | `/goals/gym` | Exercise Form Guide & Video/Cues | `ExerciseGuideModal` | BottomSheet triggered from exercise info (i) button | L3 | `SHEET` | `KEPT` |
| **G-11** | `BODY & GYM` | `/goals/gym` | Rest Timer Duration Controls | In-page controls | Dynamic Island HUD & quick rest adjustment sheet | L1 | `INLINE` | `KEPT` |
| **G-12** | `BODY & GYM` | `/goals/gym` | Delete Routine Confirmation | Centered dialog | Centered dialog for destructive deletion | L3 | `SHEET` | `KEPT` |

---

## Sub-Tab 3: Diet & Fuel (`/goals/nutrition`) — Domain: `NUTRITION`

| ID | Domain | Page | Feature / Control | Current Location | New Location | Depth | Container | Status |
|:---|:---|:---|:---|:---|:---|:---:|:---:|:---:|
| **D-01** | `NUTRITION` | `/goals/nutrition` | Sub-Nav Tab: Diet | `SegmentedSubNav` tab 3 | Segmented Sub-Nav tab 3 (`Diet`) | L1 | `TAB` | `KEPT` |
| **D-02** | `NUTRITION` | `/goals/nutrition` | Macro Header | Large card in `nutrition/page.tsx` | Streamlined App bar title + subtitle | L1 | `INLINE` | `MERGED` |
| **D-03** | `NUTRITION` | `/goals/nutrition` | Macro Targets Hero (Cal, Protein, Carbs, Fat) | Embedded card in `MealTracker` | Hero Summary Slot: 4-segment macro gauge card | L1 | `INLINE` | `KEPT` |
| **D-04** | `NUTRITION` | `/goals/nutrition` | Meal Slots (Breakfast, Lunch, Dinner, Snack) | Stacked cards in `MealTracker` | Grouped accordion list rows (compact) | L1 | `INLINE` | `KEPT` |
| **D-05** | `NUTRITION` | `/goals/nutrition` | Log Food / Add Meal Button | Buttons on each meal card | Contextual ActionSheet via docked FAB ("Log Meal") | L1 | `SHEET` | `MERGED` |
| **D-06** | `NUTRITION` | `/goals/nutrition` | Food Search & Custom Macro Modal | Modal in `MealTracker` | BottomSheet for meal entry and macro logging | L2 | `SHEET` | `KEPT` |
| **D-07** | `NUTRITION` | `/goals/nutrition` | Water Glance in Nutrition | Widget in `MealTracker` | Merged with global Water Sheet family & FAB | L2 | `SHEET` | `MERGED` |

---

## Sub-Tab 4: Stats & Analytics (`/goals/analytics`) — Domain: `HABITS CORE` & `RECOVERY`

| ID | Domain | Page | Feature / Control | Current Location | New Location | Depth | Container | Status |
|:---|:---|:---|:---|:---|:---|:---:|:---:|:---:|
| **S-01** | `HABITS CORE` | `/goals/analytics` | Sub-Nav Tab: Stats | `SegmentedSubNav` tab 4 | Segmented Sub-Nav tab 4 (`Stats`) | L1 | `TAB` | `KEPT` |
| **S-02** | `HABITS CORE` | `/goals/analytics` | Stats Header & Trophy Highlights | Large card in `analytics/page.tsx` | Streamlined App bar title + subtitle | L1 | `INLINE` | `MERGED` |
| **S-03** | `HABITS CORE` | `/goals/analytics` | 30-Day Completion Heatmap Matrix | Large matrix board | Hero Summary Slot / Full-width matrix view | L1 | `INLINE` | `KEPT` |
| **S-04** | `HABITS CORE` | `/goals/analytics` | 4-Week Daily Completion Rate Chart | Embedded Recharts bar chart | Chart Carousel Slide with metric picker (7D / 30D / 90D) | L1 | `INLINE` | `KEPT` |
| **S-05** | `HABITS CORE` | `/goals/analytics` | Active Streaks Summary & Trophies | Metrics cards | Metric telemetry row under chart | L1 | `INLINE` | `KEPT` |
| **S-06** | `HABITS CORE` | `/goals/analytics` | Weekly Velocity & Habit Matrix Table | `WeeklyVelocityAndHabitMatrix` | Tabular comparison view (scrollable table) | L2 | `SCREEN` | `KEPT` |
| **S-07** | `RECOVERY` | `/goals/analytics` | Weekly Overview Widget | `WeeklyOverviewWidget` | Compact weekly summary card | L2 | `SCREEN` | `KEPT` |

---

## Money Space (`/money`) & Sub-Views — Domain: `MONEY`

| ID | Domain | Page | Feature / Control | Current Location | New Location | Depth | Container | Status |
|:---|:---|:---|:---|:---|:---|:---:|:---:|:---:|
| **M-01** | `MONEY` | `/money` | Page Title "Money" + Live Date | `MobileAppBar` | `MobileAppBar`: "Money" + compact date | L1 | `INLINE` | `KEPT` |
| **M-02** | `MONEY` | `/money` | Calendar jump / Month selector | `MobileAppBar` right | Jump to current month / today | L1 | `INLINE` | `KEPT` |
| **M-03** | `MONEY` | `/money` | Money Sub-Nav (Overview, Budgets, IOUs, Vault) | Old tab strip | `SegmentedSubNav` (4 pills: Overview, Budgets, IOUs, Vault) | L1 | `TAB` | `KEPT` |
| **M-04** | `MONEY` | `/money` | WalletCardDeck 3D physical card deck | `WalletCardDeck.tsx` | Main hero component (**kept 100% as it is**) rendered strictly on Overview tab | L1 | `INLINE` | `KEPT` |
| **M-05** | `MONEY` | `/money` | Balance privacy toggle & masking | In `WalletCardDeck` | Untouched in `WalletCardDeck` | L1 | `INLINE` | `KEPT` |
| **M-06** | `MONEY` | `/money` | Squircle quick launchers (Scan, Add, Calc, Refill) | In `WalletCardDeck` | Untouched in `WalletCardDeck` | L1 | `INLINE` | `KEPT` |
| **M-07** | `MONEY` | `/money` | Cash Till Refill quick action | In `WalletCardDeck` | Untouched in `WalletCardDeck` | L1 | `INLINE` | `KEPT` |
| **M-08** | `MONEY` | `/money` | Strobi pace companion telemetry | Heavy bordered card box | Sleek ambient telemetry ribbon (no border fatigue) | L1 | `INLINE` | `REFINED` |
| **M-09** | `MONEY` | `/money` | Duplicate RecentAccountFeed in hero | Hero card bottom | Removed from hero; card taps filter & open Full Ledger BottomSheet | L1 | `INLINE` | `REMOVED` |
| **M-10** | `MONEY` | `/money` | Door Tile 1: Limits & Allowances | In-page button | `MoneyDoorTileRow` tile 1 $\rightarrow$ `AllowanceSettingsModal` | L2 | `SHEET` | `MOVED` |
| **M-11** | `MONEY` | `/money` | Door Tile 2: Financial Analytics & Trends | In-page button / 5th tab | `MoneyDoorTileRow` tile 2 $\rightarrow$ `AnalyticsTabView` | L2 | `SCREEN` | `MOVED` |
| **M-12** | `MONEY` | `/money` | Door Tile 3: Neobrutalist Calculator | In-page button | `MoneyDoorTileRow` tile 3 $\rightarrow$ `NeobrutalistCalculator` | L2 | `SHEET` | `MOVED` |
| **M-13** | `MONEY` | `/money` | Door Tile 4: Export Statement PDF & CSV | In-page button | `MoneyDoorTileRow` tile 4 $\rightarrow$ `PDFExportModal` (redundant menu entry removed) | L2 | `SHEET` | `MOVED` |
| **M-14** | `MONEY` | `/money` | Category Envelopes chip filter rail | Top of ledger view | Capped rail with active filter pills in `LedgerTabView` (inside L3 BottomSheet) | L3 | `SHEET` | `MOVED` |
| **M-15** | `MONEY` | `/money` | Envelope Studio page-in-page drawer | In `LedgerTabView` | In-situ category budget drawer inside `LedgerTabView` (L3 BottomSheet) | L3 | `SHEET` | `MOVED` |
| **M-16** | `MONEY` | `/money` | Recent Activity Glance (5-Row Feed) | Uncapped list | Slot 5 capped at 5 recent rows with `BelanjeTransactionRow` + Neobrutalist Action Dock | L1 | `INLINE` | `REFINED` |
| **M-17** | `MONEY` | `/money` | Transaction Inspection modal | `TransactionDetailModal` | Inspection modal with receipt breakdown | L3 | `SHEET` | `KEPT` |
| **M-18** | `MONEY` | `/money` | Transaction Form Modal (Add / Edit) | `TransactionFormModal` | Add/Edit modal with rapid keypad logging | L3 | `SHEET` | `KEPT` |
| **M-19** | `MONEY` | `/money` | Duplicate Transaction 1-Tap Action | In transaction row menu | Instant duplicate mutation with sound FX | L1 | `INLINE` | `KEPT` |
| **M-20** | `MONEY` | `/money` | Delete Transaction Safeguard Modal | `DeleteConfirmationModal` | Destructive deletion confirmation dialog | L3 | `SHEET` | `KEPT` |
| **M-21** | `MONEY` | `/money` | Full Ledger BottomSheet (`money.ledger-sheet`) | Inline monolithic page | Dedicated L3 `BottomSheet` with search, category envelopes rail, payment method filters | L3 | `SHEET` | `MOVED` |
| **M-22** | `MONEY` | `/money` | Ledger Search & Multi-Filter Bar | In `LedgerTabView` | Responsive search input + method / type filters inside `LedgerTabView` | L3 | `SHEET` | `MOVED` |
| **M-23** | `MONEY` | `/money` | Monthly Statement Summary Strip | In `LedgerTabView` | Statement record count and total expense readout inside `LedgerTabView` | L3 | `SHEET` | `MOVED` |
| **M-24** | `MONEY` | `/money` | First-run zero-state onboarding cockpit | In `LedgerTabView` | 1-tap starter expense presets on Overview Slot 5 & inside Ledger sheet | L1 | `INLINE` | `KEPT` |
| **M-25** | `MONEY` | `/money` | No search results empty state | In `LedgerTabView` | Reset filter shortcut button inside `LedgerTabView` | L3 | `SHEET` | `MOVED` |
| **M-26** | `MONEY` | `/money` | Budgets Sub-Page: Category envelopes & caps | `BudgetTabView` | Standalone domain canvas under sub-nav (no card deck on top) | L1 | `TAB` | `REFINED` |
| **M-27** | `MONEY` | `/money` | Budgets Sub-Page: Template Packs selector | `BudgetTabView` | Student & minimalist pack picker modal | L2 | `SHEET` | `KEPT` |
| **M-28** | `MONEY` | `/money` | IOUs Sub-Page: Who Owes Who debt tracker | `WhoOwesWhoTabView` | Standalone domain canvas under sub-nav with 3-pillar metric strip | L1 | `TAB` | `REFINED` |
| **M-29** | `MONEY` | `/money` | Vault Sub-Page: Savings Goals & Lockups | `VaultTabView` | Standalone domain canvas under sub-nav for subscriptions & savings | L1 | `TAB` | `REFINED` | |
| **M-30** | `MONEY` | `/money` | Docked FAB Financial Actions | Old floating buttons | Contextual `ActionSheet` (Log Expense, Log Income, Transfer, Split) | L1 | `SHEET` | `MERGED` |

---

## Summary of Feature Audit & Protocol Verification
- **Total Features Cataloged**: 104 features across Habits, Gym, Diet, Stats, and Money.
- **Features Kept (Direct or Refined)**: 64
- **Features Moved to L2/L3 Sheets/Tiles/Overflow**: 26
- **Features Merged into Unified Controls**: 14
- **Features Removed**: 0 without founder approval (duplicate hero feed removed to prevent redundant view).
- **Domain Breakdown**:
  - `HABITS CORE`: 48 features
  - `BODY & GYM`: 14 features
  - `NUTRITION`: 6 features
  - `RECOVERY`: 3 features
  - `MONEY`: 30 features
  - `SYSTEM`: 3 features
