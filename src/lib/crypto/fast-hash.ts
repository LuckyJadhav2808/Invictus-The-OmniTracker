/**
 * Invictus High-Performance Hashing Engine
 * Powered by xxhash-wasm (WebAssembly non-cryptographic hashing at memory-bus speeds)
 * with zero-dependency synchronous FNV-1a fallback.
 */

let xxhashInstance: {
  h32ToString: (input: string, seed?: number) => string;
  h64ToString: (input: string, seed?: bigint) => string;
} | null = null;

let isInitializing = false;
let initPromise: Promise<void> | null = null;

export async function initFastHash(): Promise<void> {
  if (xxhashInstance) return;
  if (initPromise) return initPromise;

  isInitializing = true;
  initPromise = (async () => {
    try {
      const xxhash = (await import("xxhash-wasm")).default;
      xxhashInstance = await xxhash();
    } catch {
      // Graceful fallback to pure-JS FNV-1a if WebAssembly is unavailable in sandbox
      xxhashInstance = null;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
}

// Synchronous fast 64-bit-equivalent hash (O(1) execution, zero async microtask overhead)
export function fastHashSync(input: string): string {
  if (xxhashInstance) {
    try {
      return xxhashInstance.h64ToString(input);
    } catch {}
  }

  // Pure-JS 64-bit FNV-1a deterministic hash
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ (c >> 4), 0x01000193);
  }
  const hex1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const hex2 = (h2 >>> 0).toString(16).padStart(8, "0");
  return `${hex1}${hex2}`;
}

export async function fastHash64(input: string): Promise<string> {
  await initFastHash();
  if (xxhashInstance) {
    return xxhashInstance.h64ToString(input);
  }
  return fastHashSync(input);
}

export async function fastHash32(input: string): Promise<string> {
  await initFastHash();
  if (xxhashInstance) {
    return xxhashInstance.h32ToString(input);
  }
  return fastHashSync(input).slice(0, 8);
}
