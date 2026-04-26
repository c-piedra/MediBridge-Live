import type { Language, TranslationResult } from "@/types/transcript";

// ---------------------------------------------------------------------------
// Translation Service
// ---------------------------------------------------------------------------
//
// PROVIDER PRIORITY (first configured wins):
//
//  1. Google Cloud Translation  ← RECOMENDADO para uso profesional
//     Free tier: 500,000 caracteres/mes (~8 hrs diarias sin costo)
//     Setup: https://cloud.google.com/translate/docs/setup
//     Costo: $0/mes para uso normal, $20/1M chars si se excede
//
//  2. DeepL API
//     Free tier: 500,000 caracteres/mes
//     Setup: https://www.deepl.com/pro-api
//
//  3. MyMemory (fallback gratuito, 1,000 req/día sin key)
//     Solo para pruebas — no suficiente para llamadas de 8 horas
//
// CONFIGURACIÓN:
//   Crea un archivo .env.local en la raíz del proyecto con:
//
//   NEXT_PUBLIC_GOOGLE_TRANSLATE_KEY=AIzaSy...
//   o
//   NEXT_PUBLIC_DEEPL_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx
//
// ---------------------------------------------------------------------------

// ── Usage tracking (session only, no persistence) ───────────────────────────

let _charCount = 0;
let _requestCount = 0;
let _limitReached = false;
let _activeProvider: "google" | "deepl" | "mymemory" = "mymemory";

const _listeners = new Set<() => void>();

function notify() {
  _listeners.forEach((fn) => fn());
}

export function subscribeToUsage(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

export function getUsageStats() {
  return {
    charCount: _charCount,
    requestCount: _requestCount,
    limitReached: _limitReached,
    provider: _activeProvider,
  };
}

export function isLimitReached(): boolean {
  return _limitReached;
}

// Thresholds only relevant for MyMemory fallback
export const MYMEMORY_LIMIT = 1000;
export const MYMEMORY_WARN = 800;
export const MYMEMORY_CRIT = 950;

export type UsageLevel = "ok" | "warning" | "critical" | "exceeded";

export function getUsageLevel(): UsageLevel {
  if (_activeProvider !== "mymemory") return "ok"; // paid APIs don't have tight limits
  if (_limitReached || _requestCount >= MYMEMORY_LIMIT) return "exceeded";
  if (_requestCount >= MYMEMORY_CRIT) return "critical";
  if (_requestCount >= MYMEMORY_WARN) return "warning";
  return "ok";
}

// ── 1. Google Cloud Translation ─────────────────────────────────────────────
// Free tier: 500,000 chars/month (~$0 for 8-hour daily medical calls)
// Get key: https://cloud.google.com/translate/docs/setup

async function googleTranslate(
  text: string,
  sourceLang: Language,
  targetLang: Language
): Promise<TranslationResult> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_KEY;
  if (!apiKey) throw new Error("NO_KEY");

  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: "text",
      }),
    }
  );

  if (res.status === 403 || res.status === 429) {
    _limitReached = true;
    notify();
    throw new Error("LIMIT_REACHED");
  }
  if (!res.ok) throw new Error(`Google error: ${res.status}`);

  const data = (await res.json()) as {
    data: { translations: Array<{ translatedText: string }> };
  };

  _charCount += text.length;
  _requestCount++;
  notify();

  return { translatedText: data.data.translations[0].translatedText };
}

// ── 2. DeepL API ─────────────────────────────────────────────────────────────
// Free tier: 500,000 chars/month
// Get key: https://www.deepl.com/pro-api (free account)

async function deeplTranslate(
  text: string,
  sourceLang: Language,
  targetLang: Language
): Promise<TranslationResult> {
  const apiKey = process.env.NEXT_PUBLIC_DEEPL_KEY;
  if (!apiKey) throw new Error("NO_KEY");

  // DeepL uses different language codes
  const targetCode = targetLang === "en" ? "EN-US" : "ES";
  const sourceCode = sourceLang.toUpperCase();

  const res = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: [text],
      source_lang: sourceCode,
      target_lang: targetCode,
    }),
  });

  if (res.status === 456 || res.status === 429) {
    _limitReached = true;
    notify();
    throw new Error("LIMIT_REACHED");
  }
  if (!res.ok) throw new Error(`DeepL error: ${res.status}`);

  const data = (await res.json()) as {
    translations: Array<{ text: string }>;
  };

  _charCount += text.length;
  _requestCount++;
  notify();

  return { translatedText: data.translations[0].text };
}

// ── 3. MyMemory fallback ─────────────────────────────────────────────────────
// 1,000 req/day free (no key). Only for testing — not for production.

const MYMEMORY_LIMIT_MSG =
  "MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY";

async function myMemoryTranslate(
  text: string,
  sourceLang: Language,
  targetLang: Language
): Promise<TranslationResult> {
  const params = new URLSearchParams({
    q: text,
    langpair: `${sourceLang}|${targetLang}`,
  });

  const res = await fetch(
    `https://api.mymemory.translated.net/get?${params.toString()}`
  );

  if (!res.ok) throw new Error(`MyMemory HTTP error: ${res.status}`);

  const data = (await res.json()) as {
    responseStatus: number;
    responseData: { translatedText: string };
  };

  _charCount += text.length;
  _requestCount++;
  notify();

  if (
    data.responseData.translatedText.includes(MYMEMORY_LIMIT_MSG) ||
    data.responseStatus === 429
  ) {
    _limitReached = true;
    notify();
    throw new Error("LIMIT_REACHED");
  }

  if (data.responseStatus !== 200 && data.responseStatus !== 206) {
    throw new Error(`MyMemory status ${data.responseStatus}`);
  }

  return { translatedText: data.responseData.translatedText };
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function translateText(
  text: string,
  sourceLang: Language,
  targetLang: Language
): Promise<TranslationResult> {
  if (!text.trim()) return { translatedText: "" };
  if (_limitReached) throw new Error("LIMIT_REACHED");

  // Try Google first if key is set
  if (process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_KEY) {
    _activeProvider = "google";
    return await googleTranslate(text, sourceLang, targetLang);
  }

  // Try DeepL if key is set
  if (process.env.NEXT_PUBLIC_DEEPL_KEY) {
    _activeProvider = "deepl";
    return await deeplTranslate(text, sourceLang, targetLang);
  }

  // Fallback to MyMemory (testing only)
  _activeProvider = "mymemory";
  return await myMemoryTranslate(text, sourceLang, targetLang);
}
