# 📱 Invictus Mobile Redesign: Habits Space Implementation Plan

> **Scope**: Redesign ONLY the Habits Space (`/goals` and its sub-tabs `Gym`, `Diet`, `Stats`).  
> **Skill Governing**: `invictus-mobile-redesign` (Nothing-Forgotten Protocol & 5-Slot Budget).  
> **Viewport Target**: 360px – 430px (tested on 390×844). Entire main screen fits $\le 1.5$ screens of scroll with realistic data (10 habits).  
> **Card & Border Budget**: Maximum 2 elevated cards with hard shadows (1 Hero card + 1 Door Tile row). All habit list rows sit flat on the cream canvas with 1px hairlines.

---

## 🏛️ Slot Budget & Ergonomic Layout (390×844 Viewport)

```
┌──────────────────────────────────────────────┐
│ Slot 1: App Bar (48-56px)                    │
│ "Habits" · Tue, Nov 19          [📅] [⋯]     │
├──────────────────────────────────────────────┤
│ Slot 2: Sticky Sub-Nav (44px)                │
│ [Habits (Lime)] [Gym] [Diet] [Stats]         │
├──────────────────────────────────────────────┤
│ Slot 3: ONE Hero Slot (~180px Carousel)      │
│ [Arc Gauge | Week Velocity | Streak Shield]  │
│ [Lvl 1 · 100XP] [Strobi avatar] [2/2 Shields]│
│                  ● ○ ○                       │
├──────────────────────────────────────────────┤
│ Slot 4a: Date Scrubber (44px)                │
│ [M] [T] [W] [T] [F] [S] [S] (Active = Lime)  │
├──────────────────────────────────────────────┤
│ Slot 4b: Filter Chips (34px)                 │
│ [All (8)] [Due (3)] [Done (5)]    3/8 Reps   │
├──────────────────────────────────────────────┤
│ Slot 5: Primary Habit List (Rows 56-64px)    │
│ ┌──────────────────────────────────────────┐ │
│ │ 🎯 Drink 500ml Water     ⏰ 8am  🔥4d [✓]│ │
│ ├──────────────────────────────────────────┤ │
│ │ 📖 Read 15 Pages        ⏰ 9pm  🔥7d [ ]│ │
│ ├──────────────────────────────────────────┤ │
│ │ 🏋️ Workout Session       ⏰ 6pm  🔥2d [ ]│ │
│ └──────────────────────────────────────────┘ │
│    [See all 8 habits (progressive reveal)]   │
├──────────────────────────────────────────────┤
│ Slot 6: Door Tile Row (Max 4 Secondary Tiles)│
│ [💧 Water]  [⚖️ Body]  [🔔 Alerts] [🌙 Sleep] │
│ 500/2000ml   68kg·24y    Active     Journal  │
├──────────────────────────────────────────────┤
│ Unified Docked Bottom Nav + Center FAB       │
│ [Today] [Habits]    (+)    [Study] [Money]   │
└──────────────────────────────────────────────┘
```

---

## 🛠️ Step-by-Step Execution Plan

### Step 1: Shared Mobile Components
1. **`MobileAppBar` (`src/components/mobile/MobileAppBar.tsx`)**:
   - 48-56px height, sticky top.
   - Left: Page title ("Habits") + concise date (`Tue, Nov 19`).
   - Right: Max 2 action icons:
     - Calendar icon (quick date selector / jump to today).
     - Overflow menu button (`⋯`) containing: "Check All Due / Reset" (with Shift+⌘A hint), View density switcher (`List` / `Compact` / `Grid`), Sound FX toggle, and Cloud sync status.
   - Moves theme toggle, system status, sound, and profile clutter out of mobile page chrome into Profile/Settings.
2. **`SegmentedSubNav` (`src/components/mobile/SegmentedSubNav.tsx`)**:
   - Sticky single row directly under the app bar.
   - 4 tabs: `Habits` | `Gym` | `Diet` | `Stats`.
   - Active state = filled `#CEF431` (Electric Lime) pill with obsidian `#161514` text and hard border.
   - Same unified component used across all spaces.
3. **`BottomNav` with Center Notch FAB (`src/components/shared/BottomNav.tsx`)**:
   - Global 5-item bottom nav (Today, Habits, Tasks, Study, Money) with a center-docked notch FAB button (`+`).
   - On tap, FAB opens the context-aware `ActionSheet`:
     - In Habits space: `New habit`, `Log workout`, `Log meal`, `Log water`.
   - Eliminates all scattered "+ New Habit" buttons from the page.
4. **`ActionSheet` & `BottomSheet` (`src/components/mobile/ActionSheet.tsx` & `BottomSheet.tsx`)**:
   - Native-feeling bottom sheet with drag handle, top border only, backdrop dim, swipe-to-dismiss, and keyboard-safe forms.
5. **`HabitListRow` (`src/components/goals/HabitListRow.tsx`)**:
   - 56-64px height.
   - Left: Lucide icon + habit title (2-line clamp, zero truncation).
   - Meta: reminder time + flame streak badge (`🔥 4d`).
   - Right: 44px hit-target checkbox.
   - Gestures: Swipe right = complete, Swipe left = edit/delete.
   - Tap-to-expand drawer: 7-day strip, Edit, Delete, Skip, Detail view link.
6. **`DoorTileRow` (`src/components/goals/DoorTileRow.tsx`)**:
   - 4 horizontal compact tiles acting as entry doors to L2/L3 bottom sheets:
     - **Water Tile**: `💧 Water` · `500/2000 ml` (Tap opens Water Sheet with vertical fluid gauge & quick-add).
     - **Body Profile Tile**: `⚖️ Body` · `68 kg • 24y` (Tap opens Health Stats Sheet).
     - **Reminders Tile**: `🔔 Reminders` · `Active` (Tap opens Reminder Manager Sheet).
     - **Evening Recovery Tile**: `🌙 Journal` · `Sleep & Mood` (Tap opens Recovery & Reflection Sheet).

---

### Step 2: Main Habits Screen (`src/app/(app)/goals/page.tsx`)
1. Replace top chrome with `MobileAppBar` and `SegmentedSubNav`.
2. Render `HabitsHeroPager` (Slide 1: Arc gauge + Strobi companion avatar; Slide 2: Weekly velocity bars; Slide 3: Streak shield).
3. Render single-line 7-day Routine Horizon date scrubber directly beneath the hero.
4. Render compact filter chip strip (`All (8)`, `Due (3)`, `Done (5)`) with reps telemetry.
5. Render `HabitListRow` list capped at 6 items + "See all N habits" progressive reveal toggle.
6. Render `DoorTileRow` (Water, Body, Reminders, Recovery/Journal) at the bottom.
7. Connect FAB ActionSheet to trigger `HabitChoiceModal`, `NewHabitForm`, `MealTracker`, `GymChoiceModal`, and `WaterTracker`.
8. Ensure zero full widgets clutter the main screen.

---

### Step 3: Sub-Tabs Alignment (Gym, Diet, Stats)
1. **Gym Space (`/goals/gym`)**:
   - Retain `SegmentedSubNav`.
   - Hero summary: Today's target muscle group + Dynamic Island live rest timer.
   - Exercise list with sets, reps, progressive overload checkboxes.
   - Human Muscle Anatomy viewer accessible via hero expand or detail sheet.
2. **Diet Space (`/goals/nutrition`)**:
   - Retain `SegmentedSubNav`.
   - Hero summary: 4-segment macro gauge card (Calories, Protein, Carbs, Fat).
   - Accordion meal list (Breakfast, Lunch, Dinner, Snacks).
3. **Stats Space (`/goals/analytics`)**:
   - Retain `SegmentedSubNav`.
   - 30-day heatmap matrix card + 4-week bar chart.
   - Absorbs deep recovery archives and weekly velocity tables.

---

### Step 4: Verification, Gates & Delivery
1. **Type & Test Quality Gates**:
   - `npx tsc --noEmit` (0 errors).
   - `npm test` (`vitest run src` 100% green).
2. **Density & Layout Audit**:
   - Scroll height measured at 390×844: Target $\le 1.5$ viewports.
   - Count of visible bordered cards: $\le 2$ on main screen.
   - Screenshots captured at 375px and 430px in Light and Dark modes.
3. **Nothing-Forgotten Verification**:
   - Update `docs/redesign/HABITS_LEDGER.md` with final status.
   - Update `docs/redesign/PROGRESS.md`.
