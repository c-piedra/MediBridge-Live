import type { Language, TranslationResult } from "@/types/transcript";

// ---------------------------------------------------------------------------
// Translation Service
// ---------------------------------------------------------------------------
// Primary: MyMemory API — free, no API key required, 1,000 req/day
//          (register a free email at mymemory.translated.net for 10,000/day)
//
// To switch to a premium provider, implement one of the adapters below
// and replace the call in translateText():
//   - Google Cloud Translation  →  googleTranslate()
//   - DeepL API                 →  deeplTranslate()
//   - Azure Translator          →  azureTranslate()
//   - OpenAI API (gpt-4o)       →  openaiTranslate()
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// MyMemory — primary free adapter
// ---------------------------------------------------------------------------

async function myMemoryTranslate(
  text: string,
  sourceLang: Language,
  targetLang: Language
): Promise<TranslationResult> {
  const langPair = `${sourceLang}|${targetLang}`;
  const params = new URLSearchParams({ q: text, langpair: langPair });

  // Optional: add your registered email to raise the daily limit to 10k
  // params.set("de", "your@email.com");

  const res = await fetch(
    `https://api.mymemory.translated.net/get?${params.toString()}`
  );

  if (!res.ok) throw new Error(`MyMemory error: ${res.status}`);

  const data = (await res.json()) as {
    responseStatus: number;
    responseData: { translatedText: string };
    matches?: Array<{ translation: string; quality: string }>;
  };

  if (data.responseStatus !== 200 && data.responseStatus !== 206) {
    throw new Error(`MyMemory returned status ${data.responseStatus}`);
  }

  return { translatedText: data.responseData.translatedText };
}

// ---------------------------------------------------------------------------
// Google Cloud Translation adapter (uncomment and configure to use)
// ---------------------------------------------------------------------------
// async function googleTranslate(
//   text: string,
//   targetLang: Language
// ): Promise<TranslationResult> {
//   const apiKey = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY;
//   const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
//   const res = await fetch(url, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ q: text, target: targetLang, format: "text" }),
//   });
//   if (!res.ok) throw new Error(`Google Translate error: ${res.status}`);
//   const data = await res.json();
//   return { translatedText: data.data.translations[0].translatedText };
// }

// ---------------------------------------------------------------------------
// DeepL adapter (uncomment and configure to use)
// ---------------------------------------------------------------------------
// async function deeplTranslate(
//   text: string,
//   targetLang: Language
// ): Promise<TranslationResult> {
//   const apiKey = process.env.NEXT_PUBLIC_DEEPL_API_KEY;
//   const targetCode = targetLang === "en" ? "EN-US" : "ES";
//   const res = await fetch("https://api-free.deepl.com/v2/translate", {
//     method: "POST",
//     headers: {
//       Authorization: `DeepL-Auth-Key ${apiKey}`,
//       "Content-Type": "application/x-www-form-urlencoded",
//     },
//     body: new URLSearchParams({ text, target_lang: targetCode }),
//   });
//   if (!res.ok) throw new Error(`DeepL error: ${res.status}`);
//   const data = await res.json();
//   return { translatedText: data.translations[0].text };
// }

// ---------------------------------------------------------------------------
// OpenAI adapter (uncomment and configure to use)
// ---------------------------------------------------------------------------
// async function openaiTranslate(
//   text: string,
//   targetLang: Language
// ): Promise<TranslationResult> {
//   const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
//   const langName = targetLang === "en" ? "English" : "Spanish";
//   const res = await fetch("https://api.openai.com/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${apiKey}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       model: "gpt-4o",
//       messages: [
//         {
//           role: "system",
//           content: `You are a medical interpreter. Translate the following text to ${langName}. Return only the translated text, no explanations.`,
//         },
//         { role: "user", content: text },
//       ],
//       temperature: 0.1,
//     }),
//   });
//   if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
//   const data = await res.json();
//   return { translatedText: data.choices[0].message.content.trim() };
// }

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function translateText(
  text: string,
  sourceLang: Language,
  targetLang: Language
): Promise<TranslationResult> {
  if (!text.trim()) return { translatedText: "" };

  // 🔌 To use a different provider, swap myMemoryTranslate with another adapter
  return await myMemoryTranslate(text, sourceLang, targetLang);
}
