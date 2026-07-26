import { GoogleGenerativeAI } from "@google/generative-ai";

const LANGUAGE_NAMES: Record<string, string> = {
  am: "Amharic (አማርኛ)",
  om: "Afaan Oromo",
};

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("Missing GEMINI_API_KEY environment variable");
    }
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

/**
 * Candidate models to try in order. If one hits quota (429), 404, or capacity issues (503), fall back to the next.
 */
const DEFAULT_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-flash-latest",
];

/**
 * Translate text into the target locale using Gemini.
 * The prompt is tuned for natural, contemporary phrasing in
 * low-resource languages like Amharic and Afaan Oromo.
 */
export async function translateText(
  text: string,
  locale: string
): Promise<string> {
  const languageName = LANGUAGE_NAMES[locale] ?? locale;

  const prompt = `You are a professional translator specializing in ${languageName}.

Translate the following text into ${languageName}.

Guidelines:
- Use natural, contemporary phrasing that a native speaker would use in everyday conversation.
- Do NOT translate overly literally or word-for-word. Adapt idioms and expressions to sound natural in ${languageName}.
- Preserve the original tone (formal, informal, technical, etc.).
- If the text contains technical terms or brand names, keep them in their original form.
- Return ONLY the translated text — no explanations, notes, or alternatives.

Text to translate:
${text}`;

  const ai = getGenAI();

  // Deduplicate candidate models
  const configuredModel = process.env.GEMINI_MODEL;
  const modelsToTry = Array.from(
    new Set([configuredModel, ...DEFAULT_MODELS].filter(Boolean) as string[])
  );

  let lastError: unknown = null;

  for (const modelName of modelsToTry) {
    try {
      const model = ai.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = result.response;
      const translated = response.text().trim();
      if (translated) {
        return translated;
      }
    } catch (err: unknown) {
      lastError = err;
      const errStr = String(err).toLowerCase();
      // If 429 / quota error, 404 / model not found, or 503 / capacity issues, fall back to next model
      if (
        errStr.includes("429") ||
        errStr.includes("503") ||
        errStr.includes("quota exceeded") ||
        errStr.includes("not found") ||
        errStr.includes("404") ||
        errStr.includes("limit: 0") ||
        errStr.includes("overloaded") ||
        errStr.includes("capacity") ||
        errStr.includes("unavailable")
      ) {
        console.warn(
          `[QalSync] Gemini model '${modelName}' unavailable (${errStr.slice(0, 80)}...). Trying next model...`
        );
        continue;
      }
      // For other non-rate-limit errors, rethrow immediately
      throw err;
    }
  }

  throw lastError ?? new Error("All Gemini model translation attempts failed.");
}

/**
 * Translate a batch of texts into the target locale using Gemini.
 * Returns a key-value record mapping each original source text to its translated string.
 */
export async function translateBatchText(
  texts: string[],
  locale: string
): Promise<Record<string, string>> {
  if (texts.length === 0) return {};
  if (texts.length === 1) {
    const singleTranslation = await translateText(texts[0], locale);
    return { [texts[0]]: singleTranslation };
  }

  const languageName = LANGUAGE_NAMES[locale] ?? locale;

  const prompt = `You are a professional translator specializing in ${languageName}.

Translate each of the following texts into ${languageName}.

Guidelines:
- Use natural, contemporary phrasing that a native speaker would use in everyday conversation.
- Do NOT translate overly literally or word-for-word. Adapt idioms and expressions to sound natural in ${languageName}.
- Preserve the original tone (formal, informal, technical, etc.).
- If a text contains technical terms or brand names, keep them in their original form.
- Return ONLY a valid JSON object where each key is the exact original source text and the value is its translation in ${languageName}.
- Do NOT include any commentary, explanations, or markdown fences outside the JSON.

Texts to translate:
${JSON.stringify(texts, null, 2)}`;

  const ai = getGenAI();
  const configuredModel = process.env.GEMINI_MODEL;
  const modelsToTry = Array.from(
    new Set([configuredModel, ...DEFAULT_MODELS].filter(Boolean) as string[])
  );

  let lastError: unknown = null;

  for (const modelName of modelsToTry) {
    try {
      const model = ai.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" },
      });
      const result = await model.generateContent(prompt);
      const response = result.response;
      const responseText = response.text().trim();

      const cleanedText = responseText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const parsed = JSON.parse(cleanedText) as Record<string, string>;

      const resultRecord: Record<string, string> = {};
      for (const text of texts) {
        resultRecord[text] = parsed[text] ?? parsed[text.trim()] ?? text;
      }
      return resultRecord;
    } catch (err: unknown) {
      lastError = err;
      const errStr = String(err).toLowerCase();
      if (
        errStr.includes("429") ||
        errStr.includes("503") ||
        errStr.includes("quota exceeded") ||
        errStr.includes("not found") ||
        errStr.includes("404") ||
        errStr.includes("limit: 0") ||
        errStr.includes("overloaded") ||
        errStr.includes("capacity") ||
        errStr.includes("unavailable")
      ) {
        console.warn(
          `[QalSync] Gemini batch model '${modelName}' unavailable (${errStr.slice(0, 80)}...). Trying next model...`
        );
        continue;
      }
      break;
    }
  }

  // Fallback: translate individually if batch JSON model call failed
  console.warn(
    "[QalSync] Gemini batch translation failed or returned invalid JSON. Falling back to individual requests..."
  );
  const fallbackRecord: Record<string, string> = {};
  for (const text of texts) {
    fallbackRecord[text] = await translateText(text, locale);
  }
  return fallbackRecord;
}

