import type { Language, TranslationResult } from "@/types/transcript";

// ---------------------------------------------------------------------------
// Translation Service — MyMemory free tier
// Free limit: 1,000 req/day (no key) · 10,000 req/day (free email registered)
// Docs: https://mymemory.translated.net/doc/spec.php
// ---------------------------------------------------------------------------

// ── In-memory usage tracker (cleared on page refresh, never persisted) ──────
let _requestCount = 0;
let _limitReached = false;

const _listeners = new Set<() => void>();

function notifyListeners() {
  _listeners.forEach((fn) => fn());
}

/** Subscribe to usage changes. Returns unsubscribe function. */
export function subscribeToUsage(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

export function getUsageCount(): number {
  return _requestCount;
}

export function isLimitReached(): boolean {
  return _limitReached;
}

/** Thresholds for the free daily limit */
export const USAGE_LIMIT = 1000;
export const USAGE_WARN  = 800;  // 80% — show yellow warning
export const USAGE_CRIT  = 950;  // 95% — show orange critical

export type UsageLevel = "ok" | "warning" | "critical" | "exceeded";

export function getUsageLevel(): UsageLevel {
  if (_limitReached || _requestCount >= USAGE_LIMIT) return "exceeded";
  if (_requestCount >= USAGE_CRIT)                   return "critical";
  if (_requestCount >= USAGE_WARN)                   return "warning";
  return "ok";
}

// ── MyMemory adapter ─────────────────────────────────────────────────────────

/** MyMemory response when the daily free limit is hit */
const MYMEMORY_LIMIT_MSG = "MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY";

async function myMemoryTranslate(
  text: string,
  sourceLang: Language,
  targetLang: Language
): Promise<TranslationResult> {
  const params = new URLSearchParams({
    q: text,
    langpair: `${sourceLang}|${targetLang}`,
  });

  // Optional: add your free registered email to raise the limit to 10k/day
  // params.set("de", "your@email.com");

  const res = await fetch(
    `https://api.mymemory.translated.net/get?${params.toString()}`
  );

  if (!res.ok) throw new Error(`MyMemory HTTP error: ${res.status}`);

  const data = (await res.json()) as {
    responseStatus: number;
    responseData: { translatedText: string };
  };

  // Increment counter and notify UI on every successful API call
  _requestCount++;
  notifyListeners();

  // Detect limit-reached message inside the response body
  if (
    data.responseData.translatedText.includes(MYMEMORY_LIMIT_MSG) ||
    data.responseStatus === 429
  ) {
    _limitReached = true;
    notifyListeners();
    throw new Error("LIMIT_REACHED");
  }

  if (data.responseStatus !== 200 && data.responseStatus !== 206) {
    throw new Error(`MyMemory status ${data.responseStatus}`);
  }

  return { translatedText: data.responseData.translatedText };
}

// ── Google Cloud Translation (swap in when ready) ────────────────────────────
// async function googleTranslate(text, sourceLang, targetLang) { ... }

// ── DeepL (swap in when ready) ───────────────────────────────────────────────
// async function deeplTranslate(text, sourceLang, targetLang) { ... }

// ── OpenAI (swap in when ready) ──────────────────────────────────────────────
// async function openaiTranslate(text, sourceLang, targetLang) { ... }

// ── Public API ───────────────────────────────────────────────────────────────

export async function translateText(
  text: string,
  sourceLang: Language,
  targetLang: Language
): Promise<TranslationResult> {
  if (!text.trim()) return { translatedText: "" };
  if (_limitReached)  throw new Error("LIMIT_REACHED");

  return await myMemoryTranslate(text, sourceLang, targetLang);
}
