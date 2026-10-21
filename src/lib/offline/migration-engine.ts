"use client";

import { getPendingOfflineMutations, saveOfflineMutation } from "./indexeddb-store";

export interface MigrationStep {
  version: number;
  description: string;
  run: () => Promise<void>;
}

const SCHEMA_VERSION_KEY = "invictus_schema_version";
const BACKUP_SNAPSHOT_KEY = "invictus_pre_migration_backup";
export const CURRENT_TARGET_SCHEMA_VERSION = 3;

/**
 * Production Client-Side Zero-Downtime Storage Migration Engine
 * Modeled after Linear & Slack local-first migration pipelines.
 */
class ClientStorageMigrationEngine {
  private static instance: ClientStorageMigrationEngine;
  private isRunning: boolean = false;
  private logs: string[] = [];

  public static getInstance(): ClientStorageMigrationEngine {
    if (!ClientStorageMigrationEngine.instance) {
      ClientStorageMigrationEngine.instance = new ClientStorageMigrationEngine();
    }
    return ClientStorageMigrationEngine.instance;
  }

  public getCurrentVersion(): number {
    if (typeof window === "undefined") return CURRENT_TARGET_SCHEMA_VERSION;
    try {
      const stored = localStorage.getItem(SCHEMA_VERSION_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  }

  private setVersion(v: number) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(SCHEMA_VERSION_KEY, v.toString());
    } catch {}
  }

  /**
   * Captures a safe JSON snapshot of core local storage tables before migration.
   */
  private createBackupSnapshot() {
    if (typeof window === "undefined") return;
    try {
      const keysToBackup = [
        "invictus_tasks_db",
        "invictus_habits_db",
        "invictus_money_preferences",
        "invictus_water_db",
      ];
      const snapshot: Record<string, string | null> = {};
      keysToBackup.forEach((k) => {
        snapshot[k] = localStorage.getItem(k);
      });
      localStorage.setItem(
        BACKUP_SNAPSHOT_KEY,
        JSON.stringify({ timestamp: new Date().toISOString(), snapshot })
      );
    } catch (err) {
      console.warn("Failed to create pre-migration backup snapshot:", err);
    }
  }

  /**
   * Restores data from the pre-migration snapshot in case of a fatal migration failure.
   */
  public restoreFromSnapshot(): boolean {
    if (typeof window === "undefined") return false;
    try {
      const raw = localStorage.getItem(BACKUP_SNAPSHOT_KEY);
      if (!raw) return false;
      const { snapshot } = JSON.parse(raw);
      if (snapshot && typeof snapshot === "object") {
        Object.entries(snapshot).forEach(([k, v]) => {
          if (v !== null && typeof v === "string") {
            localStorage.setItem(k, v);
          }
        });
        return true;
      }
    } catch (err) {
      console.error("Critical: Failed to restore backup snapshot:", err);
    }
    return false;
  }

  /**
   * Runs all pending migrations sequentially up to CURRENT_TARGET_SCHEMA_VERSION.
   */
  public async runMigrations(): Promise<{
    migrated: boolean;
    fromVersion: number;
    toVersion: number;
    logs: string[];
  }> {
    if (this.isRunning) {
      return {
        migrated: false,
        fromVersion: this.getCurrentVersion(),
        toVersion: this.getCurrentVersion(),
        logs: ["Migration already in progress"],
      };
    }

    this.isRunning = true;
    this.logs = [];

    const fromVersion = this.getCurrentVersion();
    let currentVersion = fromVersion;

    if (currentVersion >= CURRENT_TARGET_SCHEMA_VERSION) {
      this.isRunning = false;
      return {
        migrated: false,
        fromVersion,
        toVersion: currentVersion,
        logs: ["Schema is already up to date"],
      };
    }

    this.logs.push(`Starting schema migrations: v${fromVersion} -> v${CURRENT_TARGET_SCHEMA_VERSION}`);
    this.createBackupSnapshot();

    const MIGRATION_STEPS: MigrationStep[] = [
      {
        version: 1,
        description: "Baseline data integrity & strip legacy mock seeds",
        run: async () => {
          if (typeof window === "undefined") return;
          const raw = localStorage.getItem("invictus_tasks_db");
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                const cleaned = parsed.filter((t) => !t.id?.startsWith("task_seed_"));
                localStorage.setItem("invictus_tasks_db", JSON.stringify(cleaned));
              }
            } catch {}
          }
        },
      },
      {
        version: 2,
        description: "Normalize habit frequency structure and reminder timestamps",
        run: async () => {
          if (typeof window === "undefined") return;
          const raw = localStorage.getItem("invictus_habits_db");
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                const normalized = parsed.map((h) => {
                  if (!h.frequency || typeof h.frequency === "string") {
                    return {
                      ...h,
                      frequency: {
                        type: typeof h.frequency === "string" ? h.frequency : "daily",
                        targetPerDay: 1,
                        daysOfWeek: [],
                      },
                    };
                  }
                  return h;
                });
                localStorage.setItem("invictus_habits_db", JSON.stringify(normalized));
              }
            } catch {}
          }
        },
      },
      {
        version: 3,
        description: "Ensure offline mutations contain valid idempotency UUIDs",
        run: async () => {
          try {
            const pending = await getPendingOfflineMutations();
            for (const job of pending) {
              if (!job.id || job.id.startsWith("pending_")) {
                job.id = `job_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
                await saveOfflineMutation(job);
              }
            }
          } catch {}
        },
      },
    ];

    try {
      for (const step of MIGRATION_STEPS) {
        if (step.version > currentVersion) {
          this.logs.push(`Applying migration v${step.version}: ${step.description}`);
          await step.run();
          currentVersion = step.version;
          this.setVersion(currentVersion);
        }
      }
      this.logs.push(`All migrations applied successfully. Schema now at v${currentVersion}`);
    } catch (error: any) {
      this.logs.push(`Migration failure at v${currentVersion + 1}: ${error?.message}`);
      console.error("Migration error encountered, rolling back to pre-migration snapshot:", error);
      this.restoreFromSnapshot();
      this.isRunning = false;
      return {
        migrated: false,
        fromVersion,
        toVersion: currentVersion,
        logs: this.logs,
      };
    }

    this.isRunning = false;
    return {
      migrated: true,
      fromVersion,
      toVersion: currentVersion,
      logs: this.logs,
    };
  }
}

export const migrationEngine = ClientStorageMigrationEngine.getInstance();
