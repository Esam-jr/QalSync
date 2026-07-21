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
