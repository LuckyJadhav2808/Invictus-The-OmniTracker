# Implementation Plan: Ambient Notification Dock + Translucent Floating Micro-Dialog

## Overview
Streamline out-of-app expense logging into a focused, 2-tier ambient flow:
1. **Clean Ambient Notification in Notification Shade**: A silent, low-priority pinned notification displaying real-time financial telemetry (`⚡ Safe to Spend Today: ₹1,420 • Tap to Log`).
2. **Translucent Floating Micro-Dialog (`QuickLogDialogActivity`)**: Tapping the notification (or the Android Quick Settings tile) immediately slides up a translucent, Neobrutalist floating bottom-sheet dialog directly over whatever app the user has open. It features a tactile mechanical numpad (1-9, 0, ⌫), quick habit chips (`Chai ₹30`, `Meal ₹100`), 4 core category pills, and a 1-tap `[LOG EXPENSE ⚡]` button. Upon submission, it logs the expense in the background, updates the notification's remaining balance, buzzes haptically, and calls `finish()` in under 1.5 seconds without ever loading the full Next.js/Capacitor WebView.

---

## User Experience Journey

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ANDROID SYSTEM SHADE / TILE                     │
├────────────────────────────────────────────────────────────────────────┤
│  ⚡ Invictus Ambient Fast-Log                                          │
│  Remaining Today: ₹1,420 • Tap to log expense                          │
└────────────────────────────────────────────────────────────────────────┘
                                │
                  Tap notification or Quick Tile
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│             TRANSLUCENT FLOATING MICRO-DIALOG (Native Android)         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ⚡ QUICK EXPENSE                                        [X]      │  │
│  │  Remaining Today: ₹1,420                                         │  │
│  │                                                                  │  │
│  │                       ₹ 4 5                                      │  │
│  │                                                                  │  │
│  │  [☕ Chai ₹30]   [🍛 Meal ₹100]   [🚇 Metro ₹40]                 │  │
│  │  [🍔 Food]      [🚕 Travel]      [🛒 Grocery]     [💡 Bills]    │  │
│  │                                                                  │  │
│  │  [ 1 ] [ 2 ] [ 3 ]                                               │  │
│  │  [ 4 ] [ 5 ] [ 6 ]                                               │  │
│  │  [ 7 ] [ 8 ] [ 9 ]                                               │  │
│  │  [ . ] [ 0 ] [ ⌫ ]                                               │  │
│  │                                                                  │  │
│  │               [ LOG EXPENSE ⚡ ]                                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                                │
                   Submits in 50ms & finish()
                                │
                                ▼
• Activity closes instantly (total time ~1.5s)
• User returns seamlessly to Instagram/WhatsApp/GPay
• Notification updates to "Remaining Today: ₹1,375"
• Full app / WebView is NEVER launched
```

---

## Architecture & Dependency Graph

```
[Android System Shade / Quick Settings Tile]
        │                       │
        ▼                       ▼
[Notification Click]    [QuickLogTileService]
        │                       │
        └───────────┬───────────┘
                    ▼
     [QuickLogDialogActivity.java]
     (Translucent Dialog with Numpad & Habits)
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
[HTTP POST Sync]       [Update Notification]
/api/money/sms-webhook QuickLogNotificationManager
         │                     │
         └──────────┬──────────┘
                    ▼
          [finish() in 1.5s]
```

---

## Phased Execution Plan

### Phase 1: Native Translucent Dialog Layout & Theme
- Create `@style/Theme.Invictus.TranslucentDialog` enabling transparent background with dimmed backdrop.
- Build `activity_quick_log_dialog.xml` in Neobrutalist design (`#FAF8F5`, obsidian `#161514`, hard ink shadow, big amount display, mechanical numpad grid, quick habit chips, category selector).

### Phase 2: Dialog Logic, Auto-Dismissal & Headless Sync
- Implement `QuickLogDialogActivity.java` with numpad state, habit chip auto-fill, category selection, and haptics.
- On `[LOG EXPENSE ⚡]`, asynchronously dispatch payload to `/api/money/sms-webhook` or offline queue, update SharedPreferences, and call `finish()` immediately.

### Phase 3: Ambient Notification Manager & Quick Settings Tile
- Implement `QuickLogNotificationManager.java` to post a silent, ongoing notification dock in the shade with PendingIntent launching `QuickLogDialogActivity`.
- Implement `QuickLogTileService.java` for Android pull-down Quick Settings control center.

### Phase 4: Capacitor Bridge & Settings Integration
- Implement `QuickLogBridgePlugin.java` & TypeScript client `quick-log-bridge.ts` to sync daily budget and frequent habit amounts from React to native SharedPreferences.
- Add an Ambient Quick-Log toggle card in the Money page.
- Create standalone `/quick-log` page with tactile mechanical numpad for web/PWA users.
- Full verification: TypeScript, Vitest suite, build check.
