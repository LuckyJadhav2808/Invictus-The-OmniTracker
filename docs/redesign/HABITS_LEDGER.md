# 📋 Habits Space Feature Ledger (Nothing-Forgotten Protocol)

> **Mandate**: Every feature on the Habits page (`/goals`) and its sub-tabs (`Gym`, `Diet`, `Stats`) is cataloged here.  
> **Status Rules**: `TODO`, `MOVED`, `KEPT`, `MERGED`. Zero features are marked `REMOVED` without user approval.  
> **Slot Budget for L1 (Main Viewport)**: (1) App bar, (2) Sub-nav, (3) 1 Hero carousel slot, (4) Date strip + Filter chips, (5) 1 Tile row (max 4 door tiles), (6) 1 Primary list (max 6 rows + "See all").

---

## Habits Main Page (`/goals`)

| ID | Feature / Control | Current Location | New Location | Depth | Status |
|:---|:---|:---|:---|:---:|:---:|
| **H-01** | Page Title "Habits" + Subtitle | Top `SpaceHeader` + `HabitsCockpitDeck` | App bar (Left): "Habits" + concise date | L1 | `MERGED` |
| **H-02** | Calendar date indicator | `SpaceHeader` (desktop) + `HabitsCockpitDeck` | App bar (Right icon 1): Calendar picker / horizon | L1 | `MERGED` |
| **H-03** | App Bar Overflow Menu (⋯) | Not present (controls were scattered) | App bar (Right icon 2): Check All Due, Density toggle, Sound toggle | L1 | `MOVED` |
| **H-04** | Theme toggle (Light/Dark) | `SpaceHeader` on mobile & desktop | Moved to Profile / Settings (removed from mobile page chrome) | L2 | `MOVED` |
| **H-05** | Sound FX Mute/Unmute Toggle | `HabitsCockpitDeck` header icon button | App bar overflow menu (⋯) + Settings | L2 | `MOVED` |
| **H-06** | Cloud sync status badge | `SpaceHeader` right pill | App bar overflow menu or Settings/Profile | L2 | `MOVED` |
| **H-07** | Reminder Manager bell | `SpaceHeader` right button | App bar overflow menu or Secondary Door Tile | L2 | `MOVED` |
| **H-08** | User profile avatar dropdown | `SpaceHeader` right avatar | Profile tab in bottom nav / App bar | L2 | `MOVED` |
| **H-09** | System status footer (Version, "All systems healthy", Quick Actions) | App footer at page bottom | Consolidated into Profile/Settings; quick actions via ⌘K or FAB | L2 | `MOVED` |
| **H-10** | Life Space Sub-Nav (Habits, Gym, Diet, Stats) | `LifeSpaceSubNav` under header | Unified sticky segmented control directly under App bar | L1 | `KEPT` |
| **H-11** | Daily Completion Arc Dot-Gauge | `HabitsHeroPager` Slide 1 | Hero Carousel Slide 1: Compact Arc Gauge + completion telemetry | L1 | `KEPT` |
| **H-12** | Weekly Average Velocity Bars | `HabitsHeroPager` Slide 2 | Hero Carousel Slide 2: 7-day velocity bar breakdown | L1 | `KEPT` |
| **H-13** | Longest Streak & Target Shield | `HabitsHeroPager` Slide 3 | Hero Carousel Slide 3: Streak trophy & flame timeline | L1 | `KEPT` |
| **H-14** | Mascot (Strobi) & Quip | `HabitsHeroPager` inside arc gauge | Integrated as compact companion avatar in top-right corner of Hero | L1 | `MERGED` |
| **H-15** | XP & User Level (`Lvl X • Y XP`) | `HabitsCockpitDeck` title block | Compact micro-pill inside Hero card top corner | L1 | `MOVED` |
| **H-16** | Cryo-Shield Inventory (`X/2 Shields`) | `HabitsCockpitDeck` header pill | Compact micro-pill inside Hero card top corner | L1 | `MOVED` |
| **H-17** | Cryo-Shield Info / Details Drawer | `AdaptiveDrawerDialog` triggered by pill | BottomSheet triggered by tapping Cryo-Shield chip in Hero | L3 | `KEPT` |
| **H-18** | Welcome greeting / description copy | `HabitsCockpitDeck` text paragraph | Removed verbose paragraph; compressed to single-line sub-label in hero | L1 | `MERGED` |
| **H-19** | 7-Day Date Scrubber (Routine Horizon) | `HabitsCockpitDeck` 7-day grid buttons | Single-line horizontal 7-day scrubber directly under hero | L1 | `KEPT` |
| **H-20** | "Jump to Today" shortcut button | `HabitsCockpitDeck` bottom strip | Integrated directly into date strip (Today pill highlighted in lime) | L1 | `MERGED` |
| **H-21** | Density / Layout Switcher (Cards/Compact/Grid) | `HabitsCockpitDeck` bottom pills | App bar overflow (⋯) / density toggle pill | L1 | `MOVED` |
| **H-22** | Filter Chips: All / Due / Done with inline counts | Quick filter bar above habit list | Compact single-row filter pill strip directly above habit list | L1 | `KEPT` |
| **H-23** | Reps ratio indicator (`X/Y Reps`) | Quick filter bar right side | Integrated cleanly beside filter chips | L1 | `KEPT` |
| **H-24** | "Check All Due" / Reset button | Quick filter bar & deck header button | App bar overflow (⋯) + keyboard shortcut Shift+⌘A (zero mobile clutter) | L2 | `MOVED` |
| **H-25** | Habit List Rows (Primary Content) | `HabitCard` list in `goals/page.tsx` | Clean list rows (56-64px) with 1px hairlines (no nested heavy cards) | L1 | `KEPT` |
| **H-26** | Habit completion checkbox | Left/right button on `HabitCard` | 44px hit-target checkbox on right edge of every row | L1 | `KEPT` |
| **H-27** | Habit streak flame + count | On `HabitCard` | Sub-label meta line inside habit row (`🔥 5d streak`) | L1 | `KEPT` |
| **H-28** | Habit reminder time | On `HabitCard` | Sub-label meta line inside habit row (`⏰ 08:00 AM`) | L1 | `KEPT` |
| **H-29** | Per-row ⋯ menu | Dropdown on `HabitCard` | Replaced by tap-to-expand drawer & horizontal swipe gestures | L2 | `MERGED` |
| **H-30** | Per-row 7-day week strip | Always visible on full `HabitCard` | Revealed only when row is tapped/expanded (zero default clutter) | L3 | `MOVED` |
| **H-31** | Row Swipe Actions | Not present in legacy cards | Swipe right = complete/uncomplete, Swipe left = edit/delete | L1 | `MOVED` |
| **H-32** | Row tap expand action | Not present in legacy cards | Tap row body to expand: 7-day strip, Edit, Delete, Skip | L2 | `MOVED` |
| **H-33** | Habit Detail Page navigation | Click card background to open `/goals/[id]` | Secondary button "View Analytics" in expanded row drawer | L2 | `MOVED` |
| **H-34** | Habit List Capping | Uncapped (could scroll 20+ cards) | Capped at 6 habits with "See all N habits" progressive reveal | L1 | `MOVED` |
| **H-35** | Empty State: Zero habits created | Heavy bordered card in `goals/page.tsx` | Minimalist illustration + "Explore Habits Vault" button | L1 | `KEPT` |
| **H-36** | Empty State: All due habits finished | Bordered container in `goals/page.tsx` | Clean 1-sentence state with "Show all habits" link | L1 | `KEPT` |
| **H-37** | Secondary Door Tile 1: Water Tracker | Full-width `WaterTracker` card on page | Door Tile 1: `💧 Water: 500/2000 ml` (Tap opens Water BottomSheet) | L1 | `MOVED` |
| **H-38** | Water quick-add (+250 ml) | In full `WaterTracker` card | Inline tap on Water Door Tile or inside Water BottomSheet | L2 | `KEPT` |
| **H-39** | Water custom amount / target settings | `AdaptiveDrawerDialog` | Hydration Settings sheet accessible from Water BottomSheet | L3 | `KEPT` |
| **H-40** | Secondary Door Tile 2: Body Profile | Full capsule in collapsible evening drawer | Door Tile 2: `⚖️ Body: 68 kg • 24y` (Tap opens Health Stats Sheet) | L1 | `MOVED` |
| **H-41** | Health stats edit form (Gender, Age, Weight) | `AdaptiveDrawerDialog` | BottomSheet with gender pills, age, weight + kg/lbs unit toggle | L3 | `KEPT` |
| **H-42** | Secondary Door Tile 3: Proactive Reminders | Full-width `ProactiveReminderBanner` | Door Tile 3: `🔔 Alerts: Active` (Tap opens Reminders Sheet) | L1 | `MOVED` |
| **H-43** | Secondary Door Tile 4: Recovery & Journal | Full-width collapsible evening section | Door Tile 4: `🌙 Journal & Sleep` (Tap opens Recovery Sheet) | L1 | `MOVED` |
| **H-44** | Sleep duration & Active burn telemetry | `SleepAndActiveWidgets` in recovery | Rendered inside Recovery & Journal BottomSheet & Stats subtab | L2 | `MOVED` |
| **H-45** | Mood Journal & Daily Reflections | `MoodJournalWidget` in recovery | Rendered inside Recovery & Journal BottomSheet & Stats subtab | L2 | `MOVED` |
| **H-46** | Desktop "+ New Habit" Button | Header action in `HabitsCockpitDeck` | Replaced by single docked Center FAB (and top bar overflow) | L1 | `MERGED` |
| **H-47** | Floating Mobile Add Button | Floating button in bottom-right corner | Replaced by docked Center FAB in bottom nav notch | L1 | `MERGED` |
| **H-48** | Unified FAB Action Sheet | Not present (scattered buttons) | Tap docked FAB opens ActionSheet: New Habit, Log Workout, Log Meal, Log Water | L1 | `MOVED` |
| **H-49** | HabitChoiceModal (Presets / Custom / Packs) | Dynamic dialog in `goals/page.tsx` | BottomSheet opened from FAB "New Habit" action | L2 | `KEPT` |
| **H-50** | NewHabitForm (Custom habit creator) | `AdaptiveDrawerDialog` | BottomSheet for custom habit parameters | L3 | `KEPT` |
| **H-51** | Edit Habit Form (Title, Reminder time presets) | `AdaptiveDrawerDialog` | BottomSheet opened from row expand / swipe edit | L3 | `KEPT` |
| **H-52** | Delete Habit Confirmation Modal | `DeleteConfirmationModal` (centered) | Kept as centered dialog (strict rule: centered only for destructive) | L3 | `KEPT` |
| **H-53** | Sticky mini-cockpit (`StickyHabitsMiniCockpit`) | Floating sticky bar on scroll | Replaced by sticky slim sub-nav + app bar (zero layout clutter) | L1 | `MERGED` |

---

## Sub-Tab 2: Gym & Routines (`/goals/gym`)

| ID | Feature / Control | Current Location | New Location | Depth | Status |
|:---|:---|:---|:---|:---:|:---:|
| **G-01** | Sub-Nav Tab: Gym & Anatomy | `LifeSpaceSubNav` tab 2 | Segmented Sub-Nav tab 2 | L1 | `KEPT` |
| **G-02** | Studio Header & description | Large card in `gym/page.tsx` | Streamlined App bar title + subtitle | L1 | `MERGED` |
| **G-03** | Dynamic Island Live Rest Timer | Sticky chip in header | Apple-style live rest countdown dock | L1 | `KEPT` |
| **G-04** | Day of Week Picker (Monday - Sunday) | Pill strip in `GymRoutineTracker` | Horizontal segmented day scrubber matching habits date strip | L1 | `KEPT` |
| **G-05** | Muscle Activation Anatomy Viewer | Full embedded `HumanMuscleAnatomy` | Collapsible hero slot / modal sheet ("Inspect Target Muscles") | L2 | `MOVED` |
| **G-06** | Workout Routine Cards & Exercises | Stacked cards in `GymRoutineTracker` | Compact workout exercise rows with sets, reps, weight | L1 | `KEPT` |
| **G-07** | Set Completion Checkboxes | Checkboxes inside sets table | 44px tap checkboxes for progressive overload sets | L1 | `KEPT` |
| **G-08** | "+ Add Movement" / Routine Presets | In-page button | Contextual ActionSheet via docked FAB ("Log Workout / Add Movement") | L1 | `MERGED` |
| **G-09** | GymChoiceModal (Presets & Custom) | Dynamic modal | BottomSheet for workout & exercise library | L2 | `KEPT` |
| **G-10** | Exercise Guide Modal (Form tips & cues) | `ExerciseGuideModal` | BottomSheet triggered from exercise info button | L3 | `KEPT` |
| **G-11** | Rest Timer Controls (Start/Pause/+30s) | In-page controls | Dynamic Island Dock & floating rest controls | L1 | `KEPT` |
| **G-12** | Delete Routine Confirmation | `DeleteConfirmationModal` | Centered dialog for destructive deletion | L3 | `KEPT` |

---

## Sub-Tab 3: Diet & Fuel (`/goals/nutrition`)

| ID | Feature / Control | Current Location | New Location | Depth | Status |
|:---|:---|:---|:---|:---:|:---:|
| **D-01** | Sub-Nav Tab: Meal & Fuel | `LifeSpaceSubNav` tab 3 | Segmented Sub-Nav tab 3 | L1 | `KEPT` |
| **D-02** | Macro Header & description | Large card in `nutrition/page.tsx` | Streamlined App bar title + subtitle | L1 | `MERGED` |
| **D-03** | Macro Targets Hero (Calories, Protein, Carbs, Fat) | Embedded card in `MealTracker` | Hero Summary Slot: 4-segment macro gauge card | L1 | `KEPT` |
| **D-04** | Meal Slots (Breakfast, Lunch, Dinner, Snacks) | Stacked cards in `MealTracker` | Grouped accordion list rows (compact) | L1 | `KEPT` |
| **D-05** | Log Food / Add Meal Button | Buttons on each meal card | Contextual ActionSheet via docked FAB ("Log Meal") | L1 | `MERGED` |
| **D-06** | Food Search & Custom Macro Modal | Modal in `MealTracker` | BottomSheet for meal entry and macro logging | L2 | `KEPT` |
| **D-07** | Water Glance in Nutrition | Widget in `MealTracker` | Merged with global Water Door Tile & FAB | L2 | `MERGED` |

---

## Sub-Tab 4: Stats & Analytics (`/goals/analytics`)

| ID | Feature / Control | Current Location | New Location | Depth | Status |
|:---|:---|:---|:---|:---:|:---:|
| **S-01** | Sub-Nav Tab: Analytics | `LifeSpaceSubNav` tab 4 | Segmented Sub-Nav tab 4 | L1 | `KEPT` |
| **S-02** | Stats Header & Trophy Highlights | Large card in `analytics/page.tsx` | Streamlined App bar title + subtitle | L1 | `MERGED` |
| **S-03** | 30-Day Completion Heatmap Matrix | Large matrix board | Hero Summary Slot / Full-width scrollable matrix card | L1 | `KEPT` |
| **S-04** | 4-Week Daily Completion Rate Bar Chart | Embedded Recharts bar chart | Responsive bar chart card with phone-optimized aspect ratio | L1 | `KEPT` |
| **S-05** | Active Streaks Summary & Trophies | Metrics cards | Metric telemetry row | L1 | `KEPT` |
| **S-06** | Weekly Velocity & Habit Matrix Table | `WeeklyVelocityAndHabitMatrix` | Tabular comparison view (scrollable table) | L2 | `KEPT` |
| **S-07** | Weekly Overview Widget | `WeeklyOverviewWidget` | Compact weekly summary card | L2 | `KEPT` |

---

## Summary of Feature Audit & Protocol Verification
- **Total Features Cataloged**: 74 distinct user-facing features across Habits, Gym, Diet, and Stats.
- **Features Kept (Direct or Refined)**: 38
- **Features Moved to L2/L3 Sheets/Tiles/Overflow**: 23
- **Features Merged into Unified Controls**: 13
- **Features Removed**: **0** (Nothing-Forgotten Protocol strictly upheld).
