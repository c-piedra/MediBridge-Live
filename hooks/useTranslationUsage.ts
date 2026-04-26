"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getUsageCount,
  getUsageLevel,
  isLimitReached,
  subscribeToUsage,
  USAGE_LIMIT,
  USAGE_WARN,
  type UsageLevel,
} from "@/services/translationService";

export interface TranslationUsage {
  count: number;
  limit: number;
  warnAt: number;
  level: UsageLevel;
  limitReached: boolean;
  /** 0–100 percentage of the daily limit used */
  pct: number;
}

export function useTranslationUsage(): TranslationUsage {
  const snapshot = useCallback(
    (): TranslationUsage => ({
      count: getUsageCount(),
      limit: USAGE_LIMIT,
      warnAt: USAGE_WARN,
      level: getUsageLevel(),
      limitReached: isLimitReached(),
      pct: Math.min(100, Math.round((getUsageCount() / USAGE_LIMIT) * 100)),
    }),
    []
  );

  const [usage, setUsage] = useState<TranslationUsage>(snapshot);

  useEffect(() => {
    // Re-read whenever the service fires a change
    const unsub = subscribeToUsage(() => setUsage(snapshot()));
    return unsub;
  }, [snapshot]);

  return usage;
}
