"use client";

import { useEffect } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { ControlBar } from "@/components/ControlBar";
import { TranscriptPanel } from "@/components/TranscriptPanel";
import { TranslationUsageBadge, TranslationLimitBanner } from "@/components/TranslationUsageBadge";

export default function Home() {
  const {
    isSupported,
    status,
    activeSpeaker,
    entries,
    interim,
    errorMessage,
    isListening,
    toggleListening,
    switchSpeaker,
    clearSession,
  } = useSpeechRecognition();

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  // Espacio  → iniciar / pausar
  // P        → cambiar a Paciente (español)
  // D        → cambiar a Doctor (inglés)
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Ignore when user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          toggleListening();
          break;
        case "p":
          switchSpeaker("patient");
          break;
        case "d":
          switchSpeaker("doctor");
          break;
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [toggleListening, switchSpeaker]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-border bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm"
              aria-hidden="true"
            >
              {/* Bridge + mic icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-5 w-5">
                <path d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            </div>
            <div>
              <h1 className="font-heading text-lg font-semibold leading-tight text-foreground">
                MediBridge Live
              </h1>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">
                Intérprete médico en tiempo real
              </p>
            </div>
          </div>

          {/* Usage badge + session info */}
          <div className="flex items-center gap-2">
            <TranslationUsageBadge />
            <div className="hidden items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-heading font-medium text-muted-foreground sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
              Solo sesión · Sin datos guardados
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3 px-4 py-4 sm:px-6 sm:py-5">

        {/* Error banner */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Limit banner — only visible when daily quota is exhausted */}
        <TranslationLimitBanner />

        {/* Control bar */}
        <ControlBar
          status={status}
          activeSpeaker={activeSpeaker}
          isListening={isListening}
          isSupported={isSupported}
          onToggle={toggleListening}
          onSwitchSpeaker={switchSpeaker}
          onClear={clearSession}
        />

        {/* Dual transcript panels */}
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
          <TranscriptPanel
            side="es"
            entries={entries}
            interim={interim}
            activeSpeaker={activeSpeaker}
            isActive={activeSpeaker === "patient" && isListening}
          />
          <TranscriptPanel
            side="en"
            entries={entries}
            interim={interim}
            activeSpeaker={activeSpeaker}
            isActive={activeSpeaker === "doctor" && isListening}
          />
        </div>

        {/* Session summary */}
        {entries.length > 0 && (
          <div className="flex justify-center">
            <p className="text-xs text-muted-foreground">
              {entries.length} intervención{entries.length !== 1 ? "es" : ""} esta sesión · Se borra al refrescar la página
            </p>
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-white/60 px-4 py-3 text-center text-xs text-muted-foreground sm:px-6">
        MediBridge Live es una herramienta de apoyo. No reemplaza el criterio profesional de la intérprete médica certificada. No se almacena audio ni texto en ningún momento.
      </footer>
    </div>
  );
}
