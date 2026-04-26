"use client";

import { useCallback, useEffect, useState } from "react";
import { subscribeToUsage, getUsageStats } from "@/services/translationService";

// ── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = "medibridge_monthly_usage";
const FREE_TIER   = 500_000; // Google Cloud Translation free chars/month

interface StoredData {
  month: string;   // "YYYY-MM"
  chars: number;
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function loadStored(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { month: currentMonth(), chars: 0 };
    const parsed: StoredData = JSON.parse(raw);
    // Auto-reset if new month
    if (parsed.month !== currentMonth()) {
      return { month: currentMonth(), chars: 0 };
    }
    return parsed;
  } catch {
    return { month: currentMonth(), chars: 0 };
  }
}

function saveStored(data: StoredData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export interface MonthlyUsage {
  charsThisMonth: number;
  freeTier: number;
  pct: number;           // 0–100
  charsRemaining: number;
  isOverFree: boolean;
  month: string;         // "YYYY-MM"
  resetDate: string;     // "1 de <mes>"
}

const MONTH_NAMES = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre",
];

function buildUsage(stored: StoredData): MonthlyUsage {
  const pct = Math.min(100, Math.round((stored.chars / FREE_TIER) * 100));
  const nextMonth = new Date();
  nextMonth.setDate(1);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return {
    charsThisMonth: stored.chars,
    freeTier: FREE_TIER,
    pct,
    charsRemaining: Math.max(0, FREE_TIER - stored.chars),
    isOverFree: stored.chars > FREE_TIER,
    month: stored.month,
    resetDate: `1 de ${MONTH_NAMES[nextMonth.getMonth()]}`,
  };
}

export function useMonthlyUsage(): MonthlyUsage {
  const [stored, setStored] = useState<StoredData>(() => {
    // SSR-safe: return empty until mounted
    return { month: currentMonth(), chars: 0 };
  });

  // Hydrate from localStorage on mount
  useEffect(() => {
    const s = loadStored();
    setStored(s);
  }, []);

  // Listen to translation service and accumulate chars
  const prevSessionChars = useCallback(() => getUsageStats().charCount, []);
  const lastSeen = useCallback(() => ({ chars: 0 }), []);
  const lastSeenRef = { current: 0 };

  useEffect(() => {
    const unsub = subscribeToUsage(() => {
      const { charCount } = getUsageStats();
      const delta = charCount - lastSeenRef.current;
      if (delta <= 0) return;
      lastSeenRef.current = charCount;

      setStored((prev) => {
        const month = currentMonth();
        // Reset if new month
        const base = prev.month === month ? prev.chars : 0;
        const next: StoredData = { month, chars: base + delta };
        saveStored(next);
        return next;
      });
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return buildUsage(stored);
}
