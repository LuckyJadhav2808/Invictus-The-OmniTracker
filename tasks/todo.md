# Tasks: Production-Grade App Updates, Cloud Sync Hub & Version Control

## Phase 1: Foundation & Version Control Automation

### Task 1: Production Health Check Probe & Runtime Env Validation
**Description:** Implement the production `/api/health` endpoint and runtime env validation (`src/lib/env.ts`) according to the production-grade engineering standard.
**Acceptance criteria:**
- [x] `/api/health` returns HTTP 200 with `{ status: "healthy", db: "connected", latencyMs, uptimeSeconds, version }`
- [x] `src/lib/env.ts` validates required server/client environment variables with Zod
**Verification:**
- [x] `npx tsc --noEmit` passes
- [x] Fetching `/api/health` returns valid JSON
**Dependencies:** None
**Files:** `src/app/api/health/route.ts`, `src/lib/env.ts`
**Estimated scope:** Small (2 files)

---

### Task 2: Automated Single-Source SemVer CLI Tooling
**Description:** Create `scripts/bump-version.mjs` to synchronize version numbers across `package.json`, `android/app/build.gradle` (`versionCode`, `versionName`), and `src/config/version.ts`.
**Acceptance criteria:**
- [x] `node scripts/bump-version.mjs --check` verifies all 3 files match
- [x] `node scripts/bump-version.mjs patch|minor|major` updates all 3 files synchronously
- [x] Unit tests in `src/config/version.test.ts` test `compareSemver`
**Verification:**
- [x] `npm test` passes
- [x] `node scripts/bump-version.mjs --check` exits with 0
**Dependencies:** None
**Files:** `scripts/bump-version.mjs`, `src/config/version.test.ts`
**Estimated scope:** Small (2 files)

---

### Checkpoint: Foundation
- [x] Tests pass (`npm test`)
- [x] Health endpoint responds
- [x] Version files are in 100% sync

---

## Phase 2: Android Native In-App APK Downloader & Installer Bridge

### Task 3: Android Native Permissions & FileProvider Configuration
**Description:** Add necessary Android permissions and FileProvider paths to allow in-app APK downloads and package installation.
**Acceptance criteria:**
- [x] `AndroidManifest.xml` includes `REQUEST_INSTALL_PACKAGES`
- [x] `file_paths.xml` includes cache and external paths
**Verification:**
- [x] XML files are well-formed and valid
**Dependencies:** None
**Files:** `android/app/src/main/AndroidManifest.xml`, `android/app/src/main/res/xml/file_paths.xml`
**Estimated scope:** Small (2 files)

---

### Task 4: Native AppUpdateBridgePlugin
**Description:** Implement `AppUpdateBridgePlugin.java` in the Android project to download APKs with progress reporting and launch the Android PackageInstaller intent.
**Acceptance criteria:**
- [x] `downloadAndInstallApk` downloads APK to app cache
- [x] Emits progress events (`downloadProgress`) to JavaScript
- [x] On completion, creates `FileProvider` URI and starts `Intent.ACTION_VIEW` for package archive
- [x] Registered in `MainActivity.java`
**Verification:**
- [x] Plugin class compiles without syntax errors
- [x] Registered in `MainActivity.java`
**Dependencies:** Task 3
**Files:** `android/app/src/main/java/com/invictus/omnitracker/AppUpdateBridgePlugin.java`, `android/app/src/main/java/com/invictus/omnitracker/MainActivity.java`
**Estimated scope:** Small (2 files)

---

### Task 5: Web TypeScript Client Bridge & In-App Update Modal Enhancement
**Description:** Build `src/lib/native/app-update-bridge.ts` and update `UpdateCheckModal.tsx` to display in-app download progress bar and invoke the native installer.
**Acceptance criteria:**
- [x] `UpdateCheckModal` displays live progress bar (`%`, downloaded MB, speed) when downloading
- [x] Seamlessly switches between native in-app download and web direct download
- [x] Clean error handling if download is interrupted
**Verification:**
- [x] `npx tsc --noEmit` passes
- [x] Modal renders properly in browser
**Dependencies:** Task 4
**Files:** `src/lib/native/app-update-bridge.ts`, `src/components/shared/UpdateCheckModal.tsx`
**Estimated scope:** Medium (2 files)

---

### Checkpoint: In-App Updates
- [x] Native bridge and web bridge are connected
- [x] Modal displays in-app download states and progress bar

---

## Phase 3: Interactive Cloud Sync Hub & Telemetry Engine

### Task 6: Reactive Cloud Sync Engine Upgrade
**Description:** Upgrade `OfflineSyncEngine` in `src/lib/offline/sync-manager.ts` with reactive state management, active DB latency ping to `/api/health`, and detailed queue inspection.
**Acceptance criteria:**
- [x] Tracks `isOnline`, `isSyncing`, `pendingCount`, `lastSyncTime`, and `dbLatencyMs`
- [x] Exposes `pingHealth()` to measure live MongoDB roundtrip latency
- [x] Notifies subscribers on all state changes
**Verification:**
- [x] `npx tsc --noEmit` passes
**Dependencies:** Task 1
**Files:** `src/lib/offline/sync-manager.ts`
**Estimated scope:** Small (1 file)

---

### Task 7: Neobrutalist Cloud Sync Telemetry Drawer Component
**Description:** Create `src/components/shared/CloudSyncDrawer.tsx` displaying live connection pulse, DB ping latency, pending mutation queue, and "Sync Now" button.
**Acceptance criteria:**
- [x] Neobrutalist tactile styling matching Invictus design system
- [x] Live connection status indicator (`🟢 Connected`, `🟡 Syncing`, `🔴 Disconnected`)
- [x] Real-time latency display (`XX ms to MongoDB Atlas`)
- [x] Interactive `[ Sync Now 🔄 ]` trigger with spin animation
**Verification:**
- [x] Component renders cleanly with zero console warnings
**Dependencies:** Task 6
**Files:** `src/components/shared/CloudSyncDrawer.tsx`
**Estimated scope:** Medium (1 file)

---

### Task 8: SpaceHeader Integration with Tactile Sync Badge
**Description:** Replace the static `isOnline ? "Synced" : "Offline"` badge in `SpaceHeader.tsx` with an interactive badge that opens `CloudSyncDrawer`.
**Acceptance criteria:**
- [x] Renders dynamic state: `● Cloud Synced`, `🔄 Syncing (N)...`, or `📴 Offline (N Queued)`
- [x] Clicking the badge opens `CloudSyncDrawer`
**Verification:**
- [x] Browser test: clicking the badge opens the drawer
**Dependencies:** Task 7
**Files:** `src/components/shared/SpaceHeader.tsx`
**Estimated scope:** Small (1 file)

---

### Checkpoint: Cloud Sync Hub
- [x] Header sync badge reacts to network changes
- [x] Clicking badge opens Cloud Sync Telemetry Drawer
- [x] "Sync Now" button triggers queue flush and pings DB

---

## Phase 4: Web OTA Instant Updates & Verification

### Task 9: Web OTA Deployment Watcher & Auto-Reload Banner
**Description:** Enhance `AutoUpdateBanner.tsx` to detect web deployments and offer 1-tap instant cache reload.
**Acceptance criteria:**
- [x] Distinguishes between Web OTA updates and Native APK releases
- [x] Provides 1-tap `[ Quick Reload ⚡ ]` for web updates
**Verification:**
- [x] `npx tsc --noEmit` passes
**Dependencies:** Task 2, Task 5
**Files:** `src/components/shared/AutoUpdateBanner.tsx`
**Estimated scope:** Small (1 file)

---

### Task 10: Full End-to-End Verification & Walkthrough
**Description:** Run all test suites, typechecks, and browser visual tests. Document final walkthrough with screenshots.
**Acceptance criteria:**
- [x] `npx tsc --noEmit` passes with 0 errors
- [x] `npm test` passes 100%
- [x] Playwright visual inspection of Cloud Sync Hub and Update Modal
- [x] `walkthrough.md` updated
**Verification:**
- [x] All automated tests green
- [x] Walkthrough artifact generated
**Dependencies:** Tasks 1-9
**Files:** `walkthrough.md`
**Estimated scope:** Small (1 file)

---

### Checkpoint: Complete
- [x] All acceptance criteria met
- [x] Ready for user review
