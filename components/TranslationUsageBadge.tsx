"use client";

import clsx from "clsx";
import { useTranslationUsage } from "@/hooks/useTranslationUsage";

// ── Provider label config ────────────────────────────────────────────────────
const PROVIDER_CONFIG = {
  google: {
    label: "Google Translate",
    sublabel: "500K chars/mes gratis",
    dot: "bg-accent",
    badge: "bg-accent/10 text-accent border-accent/20",
    icon: "✓",
    showBar: false,
  },
  deepl: {
    label: "DeepL",
    sublabel: "500K chars/mes gratis",
    dot: "bg-accent",
    badge: "bg-accent/10 text-accent border-accent/20",
    icon: "✓",
    showBar: false,
  },
  mymemory: {
    label: "MyMemory",
    sublabel: "Solo para pruebas",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    icon: "⚠",
    showBar: true,
  },
} as const;

const LEVEL_BAR: Record<string, string> = {
  ok:       "bg-accent",
  warning:  "bg-amber-400",
  critical: "bg-orange-500",
  exceeded: "bg-destructive",
};

// ── Badge in header ──────────────────────────────────────────────────────────

export function TranslationUsageBadge() {
  const { requestCount, provider, level, pct, limitReached } =
    useTranslationUsage();

  // Don't render until at least one translation ran
  if (requestCount === 0) return null;

  const cfg = PROVIDER_CONFIG[provider];

  return (
    <div
      className={clsx(
        "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition-all duration-300 animate-fade-in",
        limitReached
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : cfg.badge
      )}
      aria-live="polite"
    >
      {/* Status dot */}
      <span
        className={clsx(
          "h-2 w-2 rounded-full shrink-0",
          limitReached ? "bg-destructive animate-pulse" : cfg.dot
        )}
        aria-hidden="true"
      />

      <span className="font-heading font-semibold">
        {limitReached ? "Límite alcanzado" : cfg.label}
      </span>

      {/* For MyMemory show request counter */}
      {cfg.showBar && !limitReached && (
        <span className="font-mono tabular-nums opacity-70">
          {requestCount}/1000
        </span>
      )}

      {/* For paid APIs show chars translated */}
      {!cfg.showBar && !limitReached && (
        <span className="opacity-60 hidden sm:inline">{cfg.sublabel}</span>
      )}
    </div>
  );
}

// ── MyMemory progress bar (only shown when using free fallback) ──────────────

export function MyMemoryProgressBar() {
  const { provider, requestCount, level, pct, limitReached } =
    useTranslationUsage();

  // Only relevant for MyMemory
  if (provider !== "mymemory" || requestCount === 0) return null;

  const levelColors: Record<string, string> = {
    ok:       "text-muted-foreground",
    warning:  "text-amber-600",
    critical: "text-orange-600",
    exceeded: "text-destructive",
  };

  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm animate-fade-in",
        limitReached
          ? "border-destructive/30 bg-destructive/5"
          : level === "warning" || level === "critical"
          ? "border-amber-200 bg-amber-50"
          : "border-border bg-muted/30"
      )}
      aria-live="polite"
    >
      <WarningIcon className={clsx("h-4 w-4 shrink-0", levelColors[level])} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className={clsx("font-heading font-semibold text-xs", levelColors[level])}>
            {limitReached
              ? "Límite diario alcanzado — traducción pausada"
              : level === "critical"
              ? "¡Quedan muy pocas traducciones!"
              : level === "warning"
              ? "Traducciones limitadas disponibles"
              : "Usando MyMemory (modo prueba)"}
          </span>
          <span className="font-mono text-xs tabular-nums shrink-0 text-muted-foreground">
            {requestCount} / 1,000
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div
            className={clsx("h-full rounded-full transition-all duration-500", LEVEL_BAR[level])}
            style={{ width: `${pct}%` }}
          />
        </div>

        {!limitReached && (
          <p className="mt-1 text-xs text-muted-foreground">
            Para 8 horas de llamadas necesitas Google Translate o DeepL.{" "}
            <span className="font-medium">Configura una API key en <code>.env.local</code></span>
          </p>
        )}
      </div>
    </div>
  );
}

// ── Full banner when limit is hit ────────────────────────────────────────────

export function TranslationLimitBanner() {
  const { limitReached, provider } = useTranslationUsage();
  if (!limitReached) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive animate-fade-in"
    >
      <WarningIcon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-heading font-semibold">
          {provider === "mymemory"
            ? "Límite diario de MyMemory alcanzado (1,000 req)"
            : "Límite de cuota alcanzado"}
        </p>
        <p className="mt-0.5 text-xs text-destructive/80 leading-relaxed">
          La <strong>transcripción sigue funcionando</strong> — solo la traducción
          automática está pausada hasta mañana.{" "}
          Para uso profesional, configura{" "}
          <strong>Google Translate</strong> (500K chars/mes gratis) o{" "}
          <strong>DeepL</strong> (500K chars/mes gratis) en{" "}
          <code className="rounded bg-destructive/10 px-1 py-0.5 font-mono text-xs">
            .env.local
          </code>
          .
        </p>
      </div>
    </div>
  );
}

// ── Shared icon ──────────────────────────────────────────────────────────────

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}
