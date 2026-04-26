"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getUsageLevel,
  getUsageStats,
  isLimitReached,
  MYMEMORY_LIMIT,
  MYMEMORY_WARN,
  subscribeToUsage,
  type UsageLevel,
} from "@/services/translationService";

export interface TranslationUsage {
  charCount: number;
  requestCount: number;
  limitReached: boolean;
  level: UsageLevel;
  provider: "google" | "deepl" | "mymemory";
  /** Only meaningful for MyMemory (request-based limit) */
  pct: number;
}

export function useTranslationUsage(): TranslationUsage {
  const snapshot = useCallback((): TranslationUsage => {
    const stats = getUsageStats();
    return {
      ...stats,
      level: getUsageLevel(),
      limitReached: isLimitReached(),
      pct: Math.min(
        100,
        Math.round((stats.requestCount / MYMEMORY_LIMIT) * 100)
      ),
    };
  }, []);

  const [usage, setUsage] = useState<TranslationUsage>(snapshot);

  useEffect(() => {
    const unsub = subscribeToUsage(() => setUsage(snapshot()));
    return unsub;
  }, [snapshot]);

  return usage;
}
