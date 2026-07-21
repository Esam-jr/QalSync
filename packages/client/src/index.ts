const DEFAULT_TIMEOUT_MS = 30_000;

export interface TranslateOptions {
  apiUrl: string;
  projectId: string;
  timeoutMs?: number;
}

function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

export interface TranslateResponse {
  translation: string;
  reviewed: boolean;
  id: string;
}


export async function translate(
  text: string,
  locale: string,
  options: TranslateOptions
): Promise<string> {
  const { apiUrl, projectId, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const url = `${apiUrl.replace(/\/+$/, "")}/api/translate`;

  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, locale, projectId }),
    },
    timeoutMs
  );

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

export async function translateWithMeta(
  text: string,
  locale: string,
  options: TranslateOptions
): Promise<TranslateResponse> {
  const { apiUrl, projectId, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const url = `${apiUrl.replace(/\/+$/, "")}/api/translate`;

  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, locale, projectId }),
    },
    timeoutMs
  );

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
