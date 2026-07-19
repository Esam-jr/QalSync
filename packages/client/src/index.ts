export interface TranslateOptions {
  /** Base URL of the QalSync backend deployment, e.g. "https://my-app.vercel.app" */
  apiUrl: string;
  /** Project identifier — lets multiple sites share one QalSync backend */
  projectId: string;
}

export interface TranslateResponse {
  translation: string;
  reviewed: boolean;
  id: string;
}

/**
 * Translate a string into the target locale via the QalSync API.
 *
 * @param text - The source text to translate.
 * @param locale - Target locale code, e.g. "am" (Amharic) or "om" (Afaan Oromo).
 * @param options - API URL and project ID.
 * @returns The translated string.
 *
 * @example
 * ```ts
 * import { translate } from "@qalsync/client";
 *
 * const result = await translate("Hello", "am", {
 *   apiUrl: "http://localhost:3000",
 *   projectId: "my-project",
 * });
 * console.log(result); // "ሰላም"
 * ```
 */
export async function translate(
  text: string,
  locale: string,
  options: TranslateOptions
): Promise<string> {
  const { apiUrl, projectId } = options;
  const url = `${apiUrl.replace(/\/+$/, "")}/api/translate`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, locale, projectId }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      `QalSync translation failed (${res.status}): ${
        (body as Record<string, string>).error ?? res.statusText
      }`
    );
  }

  const data: TranslateResponse = await res.json();
  return data.translation;
}

/**
 * Extended version that also returns review status and row ID.
 */
export async function translateWithMeta(
  text: string,
  locale: string,
  options: TranslateOptions
): Promise<TranslateResponse> {
  const { apiUrl, projectId } = options;
  const url = `${apiUrl.replace(/\/+$/, "")}/api/translate`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, locale, projectId }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      `QalSync translation failed (${res.status}): ${
        (body as Record<string, string>).error ?? res.statusText
      }`
    );
  }

  return res.json();
}
