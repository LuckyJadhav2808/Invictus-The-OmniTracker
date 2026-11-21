"use client";

import { useRef } from "react";
import equal from "fast-deep-equal";

/**
 * Custom React hook that memoizes a complex object or array based on deep value equality
 * using the ultra-fast fast-deep-equal package (~600B).
 * Prevents unnecessary re-renders and stale effect executions.
 */
export function useDeepEqualMemo<T>(value: T): T {
  const ref = useRef<T>(value);

  if (!equal(ref.current, value)) {
    ref.current = value;
  }

  return ref.current;
}

export { equal };
