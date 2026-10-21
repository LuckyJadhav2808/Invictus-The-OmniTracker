/**
 * Lexicographical Fractional Indexing (Benchmark: Linear Sync Engine)
 * Generates arbitrary-precision midpoint strings to allow O(1) drag-and-drop reordering
 * without batch-updating sibling records in the database.
 */

const BASE_CHAR_SET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const MID_CHAR = "V";

export function generateInitialKey(): string {
  return "a0";
}

/**
 * Calculates a midpoint string lexicographically strictly between prevKey and nextKey.
 */
export function generateKeyBetween(prevKey?: string, nextKey?: string): string {
  if (!prevKey && !nextKey) {
    return generateInitialKey();
  }

  // Prepend before first item
  if (!prevKey && nextKey) {
    const firstChar = nextKey[0] || "a";
    const idx = BASE_CHAR_SET.indexOf(firstChar);
    if (idx > 0) {
      return BASE_CHAR_SET[idx - 1] + "z";
    }
    return "0" + nextKey;
  }

  // Append after last item
  if (prevKey && !nextKey) {
    const lastChar = prevKey[prevKey.length - 1];
    const idx = BASE_CHAR_SET.indexOf(lastChar);
    if (idx < BASE_CHAR_SET.length - 1) {
      return prevKey.slice(0, -1) + BASE_CHAR_SET[idx + 1];
    }
    return prevKey + "0";
  }

  if (prevKey && nextKey) {
    if (prevKey >= nextKey) {
      // Degenerate case fallback
      return prevKey + MID_CHAR;
    }

    let i = 0;
    while (i < prevKey.length && i < nextKey.length && prevKey[i] === nextKey[i]) {
      i++;
    }

    const prevChar = prevKey[i] || "0";
    const nextChar = nextKey[i] || "z";
    const prevIdx = BASE_CHAR_SET.indexOf(prevChar);
    const nextIdx = BASE_CHAR_SET.indexOf(nextChar);

    if (nextIdx - prevIdx > 1) {
      const midIdx = Math.floor((prevIdx + nextIdx) / 2);
      return prevKey.slice(0, i) + BASE_CHAR_SET[midIdx];
    } else {
      // Append midpoint character to the common prefix + prevChar
      return prevKey.slice(0, i + 1) + MID_CHAR;
    }
  }

  return generateInitialKey();
}
