"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import type { InterimTranscript, Language, Speaker, TranscriptEntry } from "@/types/transcript";

interface TranscriptPanelProps {
  side: Language;
  entries: TranscriptEntry[];
  interim: InterimTranscript | null;
  activeSpeaker: Speaker;
  isActive: boolean;
}

const PANEL_CONFIG = {
  es: {
    label: "Español",
    speaker: "Paciente" as const,
    speakerKey: "patient" as Speaker,
    flagEmoji: "🇲🇽",
    originalLabel: "Original",
    translationLabel: "Traducción al inglés",
    bgClass: "bg-spanish-bg",
    borderClass: "border-spanish-border",
    badgeClass: "bg-[#0E7490] text-white",
    activePingClass: "bg-primary",
    headerGrad: "from-[#0891B2]/10 to-[#ECFEFF]",
    dividerClass: "border-spanish-border",
    interimClass: "text-[#0E7490]",
    translationFgClass: "text-muted-foreground",
    ringClass: "ring-primary/40",
  },
  en: {
    label: "English",
    speaker: "Doctor" as const,
    speakerKey: "doctor" as Speaker,
    flagEmoji: "🇺🇸",
    originalLabel: "Original",
    translationLabel: "Traducción al español",
    bgClass: "bg-english-bg",
    borderClass: "border-english-border",
    badgeClass: "bg-[#065F46] text-white",
    activePingClass: "bg-accent",
    headerGrad: "from-[#059669]/10 to-[#F0FDF9]",
    dividerClass: "border-english-border",
    interimClass: "text-[#065F46]",
    translationFgClass: "text-muted-foreground",
    ringClass: "ring-accent/40",
  },
};

type PanelConfig = (typeof PANEL_CONFIG)[keyof typeof PANEL_CONFIG];

function EntryCard({ entry, cfg }: { entry: TranscriptEntry; cfg: PanelConfig }) {
  const isTranslating = !entry.translatedText;

  return (
    <div
      className={clsx(
        "rounded-xl border p-4 shadow-sm transition-all duration-200 animate-slide-up",
        cfg.borderClass,
        "bg-white/80 backdrop-blur-sm"
      )}
    >
      {/* Original */}
      <p className="text-base font-semibold leading-snug text-foreground sm:text-lg">
        {entry.originalText}
      </p>

      {/* Divider */}
      <div className={clsx("my-3 border-t", cfg.dividerClass)} aria-hidden="true" />

      {/* Translation */}
      <div className="flex items-start gap-2">
        <span
          className={clsx(
            "mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-heading font-semibold uppercase tracking-wide",
            cfg.badgeClass
          )}
        >
          {entry.originalLang === "es" ? "EN" : "ES"}
        </span>
        {isTranslating ? (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span
              className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-label="Translating…"
            />
            Translating…
          </span>
        ) : (
          <p className={clsx("text-base leading-snug sm:text-lg", cfg.translationFgClass)}>
            {entry.translatedText}
          </p>
        )}
      </div>

      {/* Timestamp */}
      <p className="mt-2 text-xs text-muted-foreground">
        {new Date(entry.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </p>
    </div>
  );
}

export function TranscriptPanel({
  side,
  entries,
  interim,
  activeSpeaker,
  isActive,
}: TranscriptPanelProps) {
  const cfg = PANEL_CONFIG[side];
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter entries that belong to this panel's language
  const panelEntries = entries.filter((e) => e.originalLang === side);

  // Show interim only when active speaker matches this panel
  const showInterim =
    interim !== null && interim.originalLang === side;

  // Auto-scroll to bottom whenever content changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [panelEntries.length, showInterim]);

  return (
    <section
      aria-label={`${cfg.label} transcript panel`}
      className={clsx(
        "flex flex-col rounded-2xl border-2 transition-all duration-300",
        cfg.bgClass,
        isActive
          ? clsx("border-2", side === "es" ? "border-primary" : "border-accent", cfg.ringClass, "ring-4")
          : cfg.borderClass
      )}
    >
      {/* Panel Header */}
      <div
        className={clsx(
          "flex items-center justify-between rounded-t-2xl bg-gradient-to-r px-4 py-3",
          cfg.headerGrad
        )}
      >
        <div className="flex items-center gap-3">
          {/* Active indicator */}
          <span className="relative flex h-3 w-3" aria-hidden="true">
            {isActive && (
              <span
                className={clsx(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                  cfg.activePingClass
                )}
              />
            )}
            <span
              className={clsx(
                "relative inline-flex h-3 w-3 rounded-full",
                isActive ? cfg.activePingClass : "bg-muted-foreground/30"
              )}
            />
          </span>

          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground leading-none">
              {cfg.label}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {cfg.flagEmoji} {cfg.speaker}
            </p>
          </div>
        </div>

        {/* Entry count badge */}
        {panelEntries.length > 0 && (
          <span
            className={clsx(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              cfg.badgeClass
            )}
          >
            {panelEntries.length}
          </span>
        )}
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
        style={{ minHeight: "320px", maxHeight: "calc(100vh - 340px)" }}
      >
        {panelEntries.length === 0 && !showInterim ? (
          <EmptyState cfg={cfg} />
        ) : (
          <>
            {panelEntries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} cfg={cfg} />
            ))}

            {/* Interim (live partial recognition) */}
            {showInterim && interim && (
              <div
                className={clsx(
                  "rounded-xl border border-dashed p-4 animate-fade-in",
                  cfg.borderClass,
                  "bg-white/50"
                )}
                aria-live="polite"
                aria-atomic="true"
              >
                <p className={clsx("text-base italic leading-snug", cfg.interimClass)}>
                  {interim.text}
                  <span className="ml-1 inline-block h-1 w-4 animate-pulse rounded bg-current align-middle" />
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Listening…</p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function EmptyState({ cfg }: { cfg: PanelConfig }) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 text-center">
      <div
        className={clsx(
          "flex h-14 w-14 items-center justify-center rounded-full",
          "bg-white/60 border",
          cfg.borderClass
        )}
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="h-7 w-7 text-muted-foreground"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
          />
        </svg>
      </div>
      <div>
        <p className="font-heading font-medium text-foreground">
          Waiting for {cfg.speaker}…
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Press <strong>Start</strong> and select{" "}
          <strong>{cfg.speaker} speaking {cfg.label}</strong>
        </p>
      </div>
    </div>
  );
}
