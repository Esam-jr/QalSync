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
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const response = result.response;
  const translated = response.text().trim();

  return translated;
}
