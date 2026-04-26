export type Language = "es" | "en";

export type Speaker = "patient" | "doctor";

export type AppStatus =
  | "idle"
  | "listening"
  | "processing"
  | "translating"
  | "paused"
  | "error";

export interface TranscriptEntry {
  id: string;
  speaker: Speaker;
  originalLang: Language;
  originalText: string;
  translatedText: string;
  timestamp: number;
  isFinal: boolean;
}

export interface InterimTranscript {
  speaker: Speaker;
  originalLang: Language;
  text: string;
}

export interface SpeechRecognitionState {
  status: AppStatus;
  activeSpeaker: Speaker;
  entries: TranscriptEntry[];
  interim: InterimTranscript | null;
  errorMessage: string | null;
  isSupported: boolean;
}

export interface TranslationResult {
  translatedText: string;
  detectedLanguage?: Language;
}

// Web Speech API type extensions (not fully typed in lib.dom.d.ts)
export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}
