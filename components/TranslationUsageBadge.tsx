"use client";

import clsx from "clsx";
import { useTranslationUsage } from "@/hooks/useTranslationUsage";
import type { UsageLevel } from "@/services/translationService";

// ── Visual config per level ──────────────────────────────────────────────────
const LEVEL_CONFIG: Record<
  UsageLevel,
  {
    label: string;
    sublabel: string;
    bar: string;
    badge: string;
    border: string;
    icon: "ok" | "warn" | "crit" | "exceeded";
  }
> = {
  ok: {
    label: "Traducciones",
    sublabel: "Disponibles",
    bar: "bg-accent",
    badge: "bg-accent/10 text-accent border-accent/20",
    border: "border-transparent",
    icon: "ok",
  },
  warning: {
    label: "Traducciones",
    sublabel: "Pocas disponibles",
    bar: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    border: "border-amber-300",
    icon: "warn",
  },
  critical: {
    label: "¡Límite próximo!",
    sublabel: "Quedan muy pocas",
    bar: "bg-orange-500",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    border: "border-orange-400",
    icon: "crit",
  },
  exceeded: {
    label: "Límite alcanzado",
    sublabel: "Conecta una API de pago",
    bar: "bg-destructive",
    badge: "bg-destructive/10 text-destructive border-destructive/30",
    border: "border-destructive",
    icon: "exceeded",
  },
};

// ── Main component ───────────────────────────────────────────────────────────

export function TranslationUsageBadge() {
  const { count, limit, level, pct, limitReached } = useTranslationUsage();

  // Don't render anything until at least one request has been made
  if (count === 0) return null;

  const cfg = LEVEL_CONFIG[level];

  return (
    <div
      role={level !== "ok" ? "alert" : undefined}
      aria-live="polite"
      className={clsx(
        "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-all duration-300 animate-fade-in",
        cfg.badge,
        cfg.border
      )}
    >
      {/* Icon */}
      <span className="shrink-0" aria-hidden="true">
        <LevelIcon level={cfg.icon} />
      </span>

      {/* Text + bar */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-heading font-semibold leading-tight">
            {cfg.label}
          </span>
          <span className="shrink-0 font-mono text-xs tabular-nums opacity-80">
            {count} / {limit}
          </span>
        </div>
        <p className="text-xs opacity-70">{cfg.sublabel}</p>

        {/* Progress bar */}
        <div
          className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-current/10"
          aria-label={`${pct}% del límite diario usado`}
        >
          <div
            className={clsx(
              "h-full rounded-full transition-all duration-500",
              cfg.bar
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Inline banner — shown below ControlBar when limit is exceeded ─────────────

export function TranslationLimitBanner() {
  const { limitReached } = useTranslationUsage();
  if (!limitReached) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive animate-fade-in"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="mt-0.5 h-5 w-5 shrink-0"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
      <div>
        <p className="font-heading font-semibold">
          Límite diario de traducciones alcanzado
        </p>
        <p className="mt-0.5 text-xs text-destructive/80">
          MyMemory permite 1,000 traducciones gratis por día. La transcripción sigue funcionando, pero no habrá traducción automática hasta mañana.{" "}
          <strong>Para más capacidad:</strong> conecta Google Translate, DeepL u OpenAI en{" "}
          <code className="rounded bg-destructive/10 px-1 py-0.5 text-xs">
            services/translationService.ts
          </code>
        </p>
      </div>
    </div>
  );
}

// ── Icon per level ────────────────────────────────────────────────────────────

function LevelIcon({ level }: { level: "ok" | "warn" | "crit" | "exceeded" }) {
  if (level === "ok") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM8 4a.75.75 0 0 1 .75.75v3.25h2a.75.75 0 0 1 0 1.5H7.25V4.75A.75.75 0 0 1 8 4Z" clipRule="evenodd" />
      </svg>
    );
  }
  if (level === "exceeded") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
      </svg>
    );
  }
  // warn / crit
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
    </svg>
  );
}
