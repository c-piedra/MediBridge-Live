"use client";

import clsx from "clsx";
import type { AppStatus, Speaker } from "@/types/transcript";

interface ControlBarProps {
  status: AppStatus;
  activeSpeaker: Speaker;
  isListening: boolean;
  isSupported: boolean;
  onToggle: () => void;
  onSwitchSpeaker: (speaker: Speaker) => void;
  onClear: () => void;
}

const STATUS_CONFIG: Record<
  AppStatus,
  { label: string; color: string; dotColor: string; animate: boolean }
> = {
  idle:        { label: "Listo",        color: "text-muted-foreground", dotColor: "bg-muted-foreground/40", animate: false },
  listening:   { label: "Escuchando",   color: "text-primary",          dotColor: "bg-primary",             animate: true  },
  processing:  { label: "Procesando",   color: "text-[#0E7490]",        dotColor: "bg-secondary",           animate: true  },
  translating: { label: "Traduciendo",  color: "text-accent",           dotColor: "bg-accent",              animate: true  },
  paused:      { label: "Pausado",      color: "text-muted-foreground", dotColor: "bg-amber-400",           animate: false },
  error:       { label: "Error",        color: "text-destructive",      dotColor: "bg-destructive",         animate: false },
};

export function ControlBar({
  status,
  activeSpeaker,
  isListening,
  isSupported,
  onToggle,
  onSwitchSpeaker,
  onClear,
}: ControlBarProps) {
  const statusCfg = STATUS_CONFIG[status];

  return (
    <div className="rounded-2xl border border-border bg-white/90 shadow-md backdrop-blur-sm">
      {/* ── Top row: speaker selector ── */}
      <div className="flex items-stretch gap-0 overflow-hidden rounded-t-2xl border-b border-border">
        <SpeakerTab
          active={activeSpeaker === "patient"}
          disabled={!isSupported}
          onClick={() => onSwitchSpeaker("patient")}
          isListening={isListening && activeSpeaker === "patient"}
          flag="🇲🇽"
          role="Paciente"
          lang="Español"
          activeColor="bg-primary"
          activeBorder="border-primary"
          hint="Teclado: P"
        />

        <div className="w-px bg-border" aria-hidden="true" />

        <SpeakerTab
          active={activeSpeaker === "doctor"}
          disabled={!isSupported}
          onClick={() => onSwitchSpeaker("doctor")}
          isListening={isListening && activeSpeaker === "doctor"}
          flag="🇺🇸"
          role="Doctor"
          lang="English"
          activeColor="bg-accent"
          activeBorder="border-accent"
          hint="Keyboard: D"
        />
      </div>

      {/* ── Bottom row: status + actions ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">

        {/* Status indicator */}
        <div
          className="flex items-center gap-2"
          aria-live="polite"
          aria-label={`Estado actual: ${statusCfg.label}`}
        >
          <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
            {statusCfg.animate && (
              <span className={clsx(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                statusCfg.dotColor
              )} />
            )}
            <span className={clsx(
              "relative inline-flex h-2.5 w-2.5 rounded-full",
              statusCfg.dotColor
            )} />
          </span>
          <span className={clsx("text-sm font-heading font-semibold", statusCfg.color)}>
            {statusCfg.label}
          </span>
        </div>

        {/* Keyboard shortcut hints */}
        <p className="hidden text-xs text-muted-foreground sm:block">
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">Espacio</kbd>{" "}
          iniciar / pausar
          {" · "}
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">P</kbd> paciente
          {" · "}
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">D</kbd> doctor
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            disabled={!isSupported}
            aria-label="Limpiar sesión"
            className="
              flex items-center gap-1.5 rounded-xl border border-border px-3 py-2
              text-sm font-heading font-medium text-muted-foreground
              transition-colors hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive
              focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
              disabled:cursor-not-allowed disabled:opacity-40
            "
          >
            <TrashIcon />
            Limpiar
          </button>

          {!isSupported ? (
            <div
              role="alert"
              className="rounded-xl bg-destructive/10 px-4 py-2 text-sm font-heading font-semibold text-destructive"
            >
              Navegador no compatible
            </div>
          ) : (
            <button
              onClick={onToggle}
              aria-label={isListening ? "Detener escucha" : "Iniciar escucha"}
              aria-pressed={isListening}
              className={clsx(
                "flex min-w-[130px] items-center justify-center gap-2 rounded-xl px-5 py-2.5",
                "text-sm font-heading font-semibold transition-all duration-150",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "touch-manipulation select-none",
                isListening
                  ? "bg-destructive text-white shadow-md hover:bg-destructive/90 active:scale-95"
                  : "bg-primary text-white shadow-md hover:bg-primary/90 active:scale-95"
              )}
            >
              {isListening ? <><StopIcon /> Detener</> : <><MicIcon /> Iniciar</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Speaker Tab — big, clear, easy to tap/click
// ---------------------------------------------------------------------------

function SpeakerTab({
  active,
  disabled,
  onClick,
  isListening,
  flag,
  role,
  lang,
  activeColor,
  hint,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  isListening: boolean;
  flag: string;
  role: string;
  lang: string;
  activeColor: string;
  activeBorder: string;
  hint: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={clsx(
        "relative flex flex-1 items-center gap-3 px-5 py-3.5 text-left",
        "transition-colors duration-150",
        "focus:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "touch-manipulation select-none",
        active
          ? clsx(activeColor, "text-white")
          : "bg-muted/30 text-foreground hover:bg-muted/60"
      )}
    >
      {/* Mic pulse when actively listening */}
      {isListening && (
        <span className="relative flex h-3 w-3 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
        </span>
      )}

      <span className="text-2xl leading-none" aria-hidden="true">{flag}</span>

      <span className="flex flex-col">
        <span className={clsx(
          "font-heading text-base font-semibold leading-tight",
          active ? "text-white" : "text-foreground"
        )}>
          {role}
        </span>
        <span className={clsx(
          "text-xs",
          active ? "text-white/80" : "text-muted-foreground"
        )}>
          {lang}
        </span>
      </span>

      <span className={clsx(
        "ml-auto hidden text-xs sm:block",
        active ? "text-white/60" : "text-muted-foreground/50"
      )}>
        {hint}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function MicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
      <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5H10.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M5.25 3A2.25 2.25 0 003 5.25v9.5A2.25 2.25 0 005.25 17h9.5A2.25 2.25 0 0017 14.75v-9.5A2.25 2.25 0 0014.75 3h-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
    </svg>
  );
}
