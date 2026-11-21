import { describe, it, expect } from "vitest";
import { fastHashSync, fastHash64, fastHash32, initFastHash } from "./fast-hash";

describe("fast-hash engine", () => {
  it("generates deterministic synchronous hashes", () => {
    const hash1 = fastHashSync("test_transaction_450_swiggy");
    const hash2 = fastHashSync("test_transaction_450_swiggy");
    const hashDiff = fastHashSync("test_transaction_451_swiggy");

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hashDiff);
    expect(hash1.length).toBeGreaterThanOrEqual(8);
  });

  it("initializes xxhash-wasm and generates 64-bit and 32-bit hashes", async () => {
    await initFastHash();
    const h64 = await fastHash64("sms_dedup_hdfc_500");
    const h32 = await fastHash32("sms_dedup_hdfc_500");

    expect(typeof h64).toBe("string");
    expect(typeof h32).toBe("string");
    expect(h64.length).toBeGreaterThan(0);
    expect(h32.length).toBeGreaterThan(0);
  });
});
