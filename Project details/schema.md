# schema.md — Firestore Data Model

All user data lives under a single top-level document per user, with subcollections. Path root: `users/{uid}`. This keeps Firestore security rules simple (one rule secures everything, see techspec.md §8) and keeps all of one user's data logically grouped.

## 1. `users/{uid}` (document)
```ts
{
  uid: string
  email: string
  displayName: string
  avatarUrl?: string
  timezone: string              // e.g. "Asia/Kolkata"
  weekStartsOn: 0 | 1            // 0 = Sunday, 1 = Monday
  currency: string               // e.g. "INR"
  onboarded: boolean
  modulesEnabled: {
    goals: boolean
    study: boolean
    money: boolean
  }
  studyTarget?: {
    examName: string             // e.g. "GATE 2027", "Japanese N3", "General Study"
    examDate: Timestamp
  }
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

## 2. Goals / Habit Module

### `users/{uid}/habits/{habitId}`
```ts
{
  id: string
  title: string
  icon: string                   // emoji or lucide icon key
  color: string                  // design token key, e.g. "amber"
  frequency: {
    type: "daily" | "weekly" | "customDays"
    daysOfWeek?: number[]        // [1,3,5] if customDays
    targetPerDay: number         // e.g. 1, or 8 (glasses of water)
  }
  reminderTime?: string          // "07:00"
  allowGraceSkip: boolean        // streak-freeze toggle
  isGoalStyle: boolean           // true = long-term numeric/checklist goal, false = simple habit
  goalTarget?: number            // for goalStyle habits, e.g. 12 (books)
  goalUnit?: string              // "books", "km", etc.
  archived: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `users/{uid}/habitLogs/{logId}`
One doc per habit per day (id convention: `{habitId}_{yyyy-mm-dd}` for easy upsert).
```ts
{
  id: string
  habitId: string
  date: string                   // "yyyy-mm-dd"
  completed: boolean
  countLogged: number            // for multi-count habits (e.g. 5/8 glasses)
  note?: string
  quickTags?: string[]           // e.g. ["Focused","Tired"] freeform quick-log tags
  createdAt: Timestamp
}
```

### `users/{uid}/streaks/{habitId}` (denormalized, updated on log write)
```ts
{
  habitId: string
  currentStreak: number
  longestStreak: number
  lastCompletedDate: string      // "yyyy-mm-dd"
  updatedAt: Timestamp
}
```

## 3. Study Module

### `users/{uid}/subjects/{subjectId}`
```ts
{
  id: string
  name: string
  color: string
  icon: string
  archived: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `users/{uid}/subjects/{subjectId}/topics/{topicId}`
```ts
{
  id: string
  title: string
  status: "notStarted" | "inProgress" | "completed" | "needsRevision"
  estimatedHours: number
  loggedHours: number            // denormalized sum of sessions, updated on session write
  confidence: number             // 1-5
  notes?: string
  resourceLinks?: string[]
  lastStudiedAt?: Timestamp
  order: number                  // for manual drag-reorder within subject
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `users/{uid}/studySessions/{sessionId}`
```ts
{
  id: string
  subjectId: string
  topicId: string
  date: string                   // "yyyy-mm-dd"
  durationMinutes: number
  type: "reading" | "practice" | "revision" | "mockTest"
  notes?: string
  createdAt: Timestamp
}
```

### `users/{uid}/tests/{testId}`
```ts
{
  id: string
  name: string
  date: string                   // "yyyy-mm-dd"
  scope: string[]                // subjectIds covered
  score: number
  totalScore: number
  timeTakenMinutes?: number
  weakAreas?: string[]           // free text or topicIds
  attachmentUrl?: string         // Firebase Storage path/URL
  createdAt: Timestamp
}
```

## 4. Money Module

### `users/{uid}/categories/{categoryId}`
```ts
{
  id: string
  name: string
  type: "income" | "expense"
  icon: string
  color: string
  monthlyBudget?: number         // only relevant for expense categories
  archived: boolean
  createdAt: Timestamp
}
```

### `users/{uid}/transactions/{transactionId}`
```ts
{
  id: string
  amount: number                  // always positive; sign implied by `type`
  type: "income" | "expense"
  categoryId: string
  date: string                    // "yyyy-mm-dd"
  note?: string
  paymentMethod?: string          // "cash" | "card" | "upi" | custom
  attachmentUrl?: string          // receipt image in Firebase Storage
  isRecurring: boolean
  recurringRuleId?: string        // links to recurringRules doc if generated
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `users/{uid}/recurringRules/{ruleId}`
```ts
{
  id: string
  amount: number
  type: "income" | "expense"
  categoryId: string
  dayOfMonth: number              // 1-28 for safety across months
  note?: string
  active: boolean
  createdAt: Timestamp
}
```

## 5. Cross-Module

### `users/{uid}/insights/{insightId}` (rule-generated, ephemeral/rolling)
```ts
{
  id: string
  module: "goals" | "study" | "money"
  text: string
  severity: "info" | "positive" | "warning"
  dateGenerated: string
  dismissed: boolean
  createdAt: Timestamp
}
```

## 6. Firebase Storage Layout
```
/users/{uid}/avatar/{filename}
/users/{uid}/receipts/{transactionId}/{filename}
/users/{uid}/tests/{testId}/{filename}
```

## 7. Indexing Notes
- Composite indexes needed (Firestore will prompt on first query, but pre-plan):
  - `habitLogs`: where `habitId ==` + orderBy `date desc` (for a single habit's history).
  - `transactions`: where `date >= / <=` range + orderBy `date desc`, and where `categoryId ==` + `date` range for budget calc.
  - `studySessions`: where `subjectId ==` + orderBy `date desc`; where `topicId ==` + orderBy `date desc`.
  - `tests`: orderBy `date desc`.

## 8. Denormalization Rationale
- `loggedHours` on topics and `currentStreak`/`longestStreak` on habits are denormalized (computed once on write, not recomputed on every read) to keep the "Today" and list screens fast without aggregation queries on every page load. Update these via a small transaction/batch write whenever the source log/session is created or edited (client-side in v1; can move to Cloud Functions triggers later for consistency guarantees — noted in implementationplan.md as a hardening task).
