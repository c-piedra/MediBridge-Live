"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { translateText } from "@/services/translationService";
import type {
  AppStatus,
  InterimTranscript,
  Language,
  Speaker,
  SpeechRecognitionErrorEvent,
  SpeechRecognitionEvent,
  TranscriptEntry,
} from "@/types/transcript";

// ---------------------------------------------------------------------------
// Web Speech API browser shim
// ---------------------------------------------------------------------------

function getSpeechRecognition(): typeof SpeechRecognition | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const SPEAKER_LANG: Record<Speaker, Language> = {
  patient: "es",
  doctor: "en",
};

const TARGET_LANG: Record<Language, Language> = {
  es: "en",
  en: "es",
};

// BCP-47 locale tags for Web Speech API
const RECOGNITION_LOCALE: Record<Language, string> = {
  es: "es-MX",
  en: "en-US",
};

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useSpeechRecognition() {
  const [isSupported] = useState<boolean>(() => !!getSpeechRecognition());
  const [status, setStatus] = useState<AppStatus>("idle");
  const [activeSpeaker, setActiveSpeaker] = useState<Speaker>("patient");
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [interim, setInterim] = useState<InterimTranscript | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  const isListeningRef = useRef(false);
  const activeSpeakerRef = useRef<Speaker>(activeSpeaker);
  const pendingTranslations = useRef<Set<string>>(new Set());

  // Keep ref in sync so event callbacks always see current speaker
  useEffect(() => {
    activeSpeakerRef.current = activeSpeaker;
  }, [activeSpeaker]);

  // ---------------------------------------------------------------------------
  // Recognition lifecycle
  // ---------------------------------------------------------------------------

  const destroyRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  const startRecognition = useCallback(
    (speaker: Speaker) => {
      const SpeechRecognitionCtor = getSpeechRecognition();
      if (!SpeechRecognitionCtor) return;

      destroyRecognition();

      const recognition = new SpeechRecognitionCtor();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = RECOGNITION_LOCALE[SPEAKER_LANG[speaker]];

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const results = event.results;
        for (let i = event.resultIndex; i < results.length; i++) {
          const result = results[i];
          const transcript = result[0].transcript;
          const currentSpeaker = activeSpeakerRef.current;
          const originalLang = SPEAKER_LANG[currentSpeaker];

          if (result.isFinal) {
            setInterim(null);
            if (!transcript.trim()) continue;

            const entryId = makeId();
            const targetLang = TARGET_LANG[originalLang];

            // Optimistic entry while translation runs
            const optimisticEntry: TranscriptEntry = {
              id: entryId,
              speaker: currentSpeaker,
              originalLang,
              originalText: transcript.trim(),
              translatedText: "",
              timestamp: Date.now(),
              isFinal: true,
            };

            setEntries((prev) => [...prev, optimisticEntry]);
            pendingTranslations.current.add(entryId);
            setStatus("translating");

            translateText(transcript.trim(), originalLang, targetLang)
              .then((result) => {
                setEntries((prev) =>
                  prev.map((e) =>
                    e.id === entryId
                      ? { ...e, translatedText: result.translatedText }
                      : e
                  )
                );
              })
              .catch((err: unknown) => {
                const isLimit =
                  err instanceof Error && err.message === "LIMIT_REACHED";
                setEntries((prev) =>
                  prev.map((e) =>
                    e.id === entryId
                      ? {
                          ...e,
                          translatedText: isLimit
                            ? "⚠ Límite diario alcanzado — traducción no disponible"
                            : "⚠ Traducción no disponible",
                        }
                      : e
                  )
                );
              })
              .finally(() => {
                pendingTranslations.current.delete(entryId);
                if (isListeningRef.current) setStatus("listening");
              });
          } else {
            setStatus("processing");
            setInterim({
              speaker: currentSpeaker,
              originalLang,
              text: transcript,
            });
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === "aborted" || event.error === "no-speech") return;

        const messages: Record<string, string> = {
          "not-allowed":
            "Microphone access was denied. Please allow microphone permissions in your browser.",
          "audio-capture":
            "No microphone detected. Please connect a microphone and try again.",
          "network": "Network error during speech recognition. Check your connection.",
          "service-not-allowed":
            "Speech recognition service is not available in this browser.",
        };

        setErrorMessage(messages[event.error] ?? `Speech error: ${event.error}`);
        setStatus("error");
        isListeningRef.current = false;
      };

      recognition.onend = () => {
        // Auto-restart while still in listening mode (browser stops after silence)
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            // ignore if already started
          }
        }
      };

      try {
        recognition.start();
      } catch (err) {
        setErrorMessage("Could not start microphone. Please try again.");
        setStatus("error");
      }
    },
    [destroyRecognition]
  );

  // ---------------------------------------------------------------------------
  // Public controls
  // ---------------------------------------------------------------------------

  const startListening = useCallback(() => {
    setErrorMessage(null);
    setStatus("listening");
    isListeningRef.current = true;
    startRecognition(activeSpeakerRef.current);
  }, [startRecognition]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setStatus("paused");
    setInterim(null);
    destroyRecognition();
  }, [destroyRecognition]);

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  const switchSpeaker = useCallback(
    (speaker: Speaker) => {
      setActiveSpeaker(speaker);
      activeSpeakerRef.current = speaker;

      if (isListeningRef.current) {
        // Restart recognition with new language
        destroyRecognition();
        startRecognition(speaker);
      }
    },
    [destroyRecognition, startRecognition]
  );

  const clearSession = useCallback(() => {
    stopListening();
    setEntries([]);
    setInterim(null);
    setErrorMessage(null);
    setStatus("idle");
  }, [stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      destroyRecognition();
    };
  }, [destroyRecognition]);

  return {
    isSupported,
    status,
    activeSpeaker,
    entries,
    interim,
    errorMessage,
    isListening: isListeningRef.current && status !== "paused",
    toggleListening,
    switchSpeaker,
    clearSession,
  };
}
