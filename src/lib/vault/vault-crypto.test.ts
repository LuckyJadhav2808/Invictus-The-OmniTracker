import { describe, it, expect, beforeAll } from "vitest";
import { encryptVaultPayload, decryptVaultPayload } from "./vault-crypto";
import { webcrypto } from "node:crypto";

describe("Encrypted Vault Engine (AES-GCM 256-bit)", () => {
  beforeAll(() => {
    // Polyfill window.crypto if running in node/vitest environment
    if (typeof window === "undefined") {
      (globalThis as any).window = { crypto: webcrypto };
    } else if (!window.crypto) {
      (window as any).crypto = webcrypto;
    }
  });

  it("encrypts and decrypts a comprehensive workspace backup correctly", async () => {
    const mockBackup = {
      version: 2,
      exportedAt: "2026-10-25T19:00:00.000Z",
      mode: "cloud",
      user: { uid: "test_user_1", email: "warrior@invictus.app", displayName: "Gladiator" },
      data: {
        invictus_user_profile: { currency: "INR" },
        invictus_onboarded: "true",
      },
      cloudData: {
        habits: [{ id: "h1", title: "Morning Cold Shower", frequency: { type: "daily" } }],
        tasks: [{ id: "t1", title: "Conquer the day", priority: "p1" }],
        transactions: [{ id: "tx1", amount: 450, categoryId: "c_food" }],
      },
    };

    const encryptedString = await encryptVaultPayload(mockBackup);
    expect(encryptedString).toBeDefined();

    const envelope = JSON.parse(encryptedString);
    expect(envelope.version).toBe(2);
    expect(envelope.format).toBe("invictus-encrypted-vault");
    expect(envelope.algorithm).toBe("AES-GCM-256");
    expect(Array.isArray(envelope.iv)).toBe(true);
    expect(Array.isArray(envelope.salt)).toBe(true);
    expect(Array.isArray(envelope.ciphertext)).toBe(true);

    const decrypted = await decryptVaultPayload(encryptedString);
    expect(decrypted).toEqual(mockBackup);
  });

  it("gracefully decrypts legacy unencrypted JSON backups without errors", async () => {
    const legacyBackup = {
      version: 1,
      exportedAt: "2026-10-20T12:00:00.000Z",
      mode: "guest",
      data: { invictus_guest_mode: "true" },
    };

    const plainString = JSON.stringify(legacyBackup);
    const restored = await decryptVaultPayload(plainString);
    expect(restored).toEqual(legacyBackup);
  });
});
