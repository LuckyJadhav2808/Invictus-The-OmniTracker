# Implementation Plan: Production-Grade App Updates, Cloud Sync Hub & Version Control

## Overview
Elevate the Invictus Android Capacitor app and web client to production-grade enterprise standards by delivering:
1. An in-app direct APK downloader and native Android `PackageInstaller` bridge (eliminating browser redirection).
2. An instant OTA web update detector with 1-tap cache flush.
3. An interactive Cloud Sync Hub with live MongoDB Atlas ping latency, pending mutation queue inspection, and manual sync trigger.
4. Single-source automated SemVer synchronization across `package.json`, `android/app/build.gradle`, and `src/config/version.ts` with a production `/api/health` probe.

---

## Architecture Decisions

- **Hybrid Dual Update Engine**:
  - Native binary updates (new native plugins, permissions, major bumps) are downloaded in-app with a visual progress bar and launched directly via Android's native `PackageInstaller` (`FileProvider` intent).
  - Web/UI updates served from Vercel are detected via `/api/version` and offer an instant 1-tap cache-busting reload.
- **Reactive Cloud Sync State Machine**:
  - Replace the static `navigator.onLine` check in `SpaceHeader` with a live subscription to `OfflineSyncEngine`.
  - Provide a tactile Neobrutalist `CloudSyncDrawer` displaying real DB latency (ping ms to `/api/health`), pending mutation queue details, and an animated "Sync Now" button.
- **Single-Source Version Control**:
  - Create `scripts/bump-version.mjs` ensuring that `package.json`, `android/app/build.gradle` (`versionCode`, `versionName`), and `src/config/version.ts` stay 100% in sync.
  - Implement `/api/health` returning DB connectivity, uptime, response time, and app version per `/production-grade-engineering`.

---

## Task List

### Phase 1: Foundation & Version Control Automation
- [ ] **Task 1**: Implement `/api/health` production probe and runtime environment validation (`src/lib/env.ts`).
- [ ] **Task 2**: Create automated SemVer CLI synchronization script (`scripts/bump-version.mjs`) and version unit tests.
- [ ] **Checkpoint 1**: Health probe pings MongoDB, version sync script checks pass, TypeScript passes.

### Phase 2: Android Native In-App APK Downloader & Installer Bridge
- [ ] **Task 3**: Configure Android permissions (`REQUEST_INSTALL_PACKAGES`) and `FileProvider` paths (`file_paths.xml`).
- [ ] **Task 4**: Create `AppUpdateBridgePlugin.java` with background streaming download, progress events, and `PackageInstaller` intent.
- [ ] **Task 5**: Build frontend TypeScript bridge (`src/lib/native/app-update-bridge.ts`) and enhance `UpdateCheckModal.tsx` with live download progress.
- [ ] **Checkpoint 2**: Native plugin builds, modal displays in-app progress bar, web fallback functions cleanly.

### Phase 3: Interactive Cloud Sync Hub & Telemetry Engine
- [ ] **Task 6**: Upgrade `OfflineSyncEngine` (`src/lib/offline/sync-manager.ts`) with reactive state machine, DB latency probe, and queue telemetry.
- [ ] **Task 7**: Create `CloudSyncDrawer.tsx` Neobrutalist bottom sheet/drawer with live connection pulse, latency ms, pending queue list, and "Sync Now".
- [ ] **Task 8**: Wire `SpaceHeader.tsx` with dynamic `CloudSyncPill` and connect to `CloudSyncDrawer`.
- [ ] **Checkpoint 3**: Header displays live sync states, clicking opens drawer, manual sync triggers queue flush, DB ping measures latency.

### Phase 4: Web OTA Instant Updates & Verification
- [ ] **Task 9**: Enhance `AutoUpdateBanner.tsx` with OTA live reload detection and cache invalidation.
- [ ] **Task 10**: Full verification: TypeScript `tsc --noEmit`, Vitest test suite, and live browser Playwright checks.
- [ ] **Checkpoint 4**: Production hardening complete, zero errors, walkthrough documented.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Android 8.0+ restricts unknown sources installation | High | Detect `canRequestPackageInstalls()`; if false, guide user directly to system toggle with helpful explanatory copy. |
| In-app download interrupted by network drop | Medium | Support chunked download or clear retry state with friendly error toast. |
| DB health ping creates excessive traffic | Low | Cache health probe results for 30 seconds; only actively ping when Cloud Sync Drawer opens or user taps "Sync Now". |
