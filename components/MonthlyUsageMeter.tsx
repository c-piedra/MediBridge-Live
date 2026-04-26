"use client";

import clsx from "clsx";
import { useMonthlyUsage } from "@/hooks/useMonthlyUsage";
import { useTranslationUsage } from "@/hooks/useTranslationUsage";

const FREE_TIER = 500_000;

// ── Helper ───────────────────────────────────────────────────────────────────
function formatChars(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

// ── Component ────────────────────────────────────────────────────────────────
export function MonthlyUsageMeter() {
  const monthly  = useMonthlyUsage();
  const { provider } = useTranslationUsage();

  // Only meaningful for Google Translate
  if (provider !== "google") return null;
  // Don't show until at least one char has been translated
  if (monthly.charsThisMonth === 0) return null;

  const { pct, charsThisMonth, charsRemaining, isOverFree, resetDate } = monthly;

  // Color thresholds
  const barColor =
    pct >= 100 ? "bg-destructive" :
    pct >= 85  ? "bg-orange-500"  :
    pct >= 60  ? "bg-amber-400"   :
                 "bg-accent";

  const textColor =
    pct >= 100 ? "text-destructive" :
    pct >= 85  ? "text-orange-600"  :
    pct >= 60  ? "text-amber-600"   :
                 "text-accent";

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-white/80 px-4 py-3 shadow-sm animate-fade-in">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
            className={clsx("h-4 w-4 shrink-0", textColor)} aria-hidden="true">
            <path fillRule="evenodd" d="M9.58 1.077a.75.75 0 0 1 .405.82L9.165 6h4.085a.75.75 0 0 1 .567 1.241l-6.5 7.5a.75.75 0 0 1-1.302-.638L6.835 10H2.75a.75.75 0 0 1-.567-1.241l6.5-7.5a.75.75 0 0 1 .897-.182Z" clipRule="evenodd" />
          </svg>
          <span className="font-heading text-sm font-semibold text-foreground">
            Uso mensual · Google Translate
          </span>
        </div>

        <span className={clsx("font-mono text-xs font-semibold tabular-nums", textColor)}>
          {formatChars(charsThisMonth)} / 500K
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pct}% del límite mensual gratuito usado`}
      >
        <div
          className={clsx("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {isOverFree ? (
            <span className="font-medium text-destructive">
              Límite gratuito superado · ~${((charsThisMonth - FREE_TIER) / 1_000_000 * 20).toFixed(2)} extra
            </span>
          ) : (
            <>
              <span className="font-medium text-foreground">
                {formatChars(charsRemaining)}
              </span>{" "}
              caracteres restantes gratis este mes
            </>
          )}
        </span>
        <span className="shrink-0">
          Se reinicia el <span className="font-medium text-foreground">{resetDate}</span>
        </span>
      </div>
    </div>
  );
}
