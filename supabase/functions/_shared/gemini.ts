// Direct Google Gemini API helper (NOT Lovable AI gateway).
export class GeminiError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message || code);
    this.code = code;
    this.name = 'GeminiError';
  }
}

const DEFAULT_MODEL = 'gemini-2.0-flash';

export interface GeminiJsonRequest {
  prompt: string;
  responseSchema: Record<string, unknown>;
  model?: string;
  temperature?: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateJson<T = any>(req: GeminiJsonRequest): Promise<T> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new GeminiError('GEMINI_API_KEY_MISSING', 'GEMINI_API_KEY não configurada');
  }

  const model = req.model || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: req.prompt }] }],
    generationConfig: {
      temperature: req.temperature ?? 0.4,
      responseMimeType: 'application/json',
      responseSchema: req.responseSchema,
    },
  };

  const maxRetries = 3;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`Gemini HTTP ${res.status}: ${await res.text()}`);
        if (attempt < maxRetries) {
          await sleep(500 * Math.pow(2, attempt));
          continue;
        }
        throw lastError;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Gemini HTTP ${res.status}: ${text}`);
      }

      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Gemini: resposta vazia');
      }
      return JSON.parse(text) as T;
    } catch (err) {
      lastError = err;
      if (attempt >= maxRetries) break;
      await sleep(500 * Math.pow(2, attempt));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Erro desconhecido no Gemini');
}
