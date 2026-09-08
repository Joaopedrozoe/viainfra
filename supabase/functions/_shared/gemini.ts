// Provedor de IA da Vivi.
// Ordem: GEMINI_API_KEY (Google direto, gratuito) se configurada; senão Lovable AI Gateway (LOVABLE_API_KEY).
export class GeminiError extends Error {
  code: string;
  status?: number;
  constructor(code: string, message?: string, status?: number) {
    super(message || code);
    this.code = code;
    this.status = status;
    this.name = 'GeminiError';
  }
}

const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';
const LOVABLE_MODEL = 'openai/gpt-6-astra';
const LOVABLE_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

export interface GeminiJsonRequest {
  prompt: string;
  responseSchema: Record<string, unknown>;
  model?: string;
  temperature?: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonLoose<T>(text: string): T {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  return JSON.parse(trimmed) as T;
}

export async function generateJson<T = any>(req: GeminiJsonRequest): Promise<T> {
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');

  if (!geminiKey && !lovableKey) {
    throw new GeminiError('GEMINI_API_KEY_MISSING', 'Nenhuma chave de IA configurada (GEMINI_API_KEY ou LOVABLE_API_KEY)');
  }

  const useGemini = !!geminiKey;
  const url = useGemini
    ? `https://generativelanguage.googleapis.com/v1beta/models/${req.model || DEFAULT_GEMINI_MODEL}:generateContent?key=${geminiKey}`
    : LOVABLE_URL;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!useGemini) headers['Lovable-API-Key'] = lovableKey!;

  const body = useGemini
    ? {
        contents: [{ role: 'user', parts: [{ text: req.prompt }] }],
        generationConfig: {
          temperature: req.temperature ?? 0.4,
          responseMimeType: 'application/json',
          responseSchema: req.responseSchema,
        },
      }
    : {
        model: LOVABLE_MODEL,
        reasoning_effort: 'low',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Responda SOMENTE com um objeto JSON válido, sem markdown, seguindo exatamente este JSON Schema:\n' +
              JSON.stringify(req.responseSchema),
          },
          { role: 'user', content: req.prompt },
        ],
      };

  const maxRetries = 3;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });

      if (res.status === 429 || res.status >= 500) {
        const retryAfter = Number(res.headers.get('Retry-After'));
        lastError = new GeminiError('AI_RETRYABLE', `IA HTTP ${res.status}: ${await res.text()}`, res.status);
        if (attempt < maxRetries) {
          await sleep(retryAfter > 0 ? retryAfter * 1000 : 500 * Math.pow(2, attempt));
          continue;
        }
        throw lastError;
      }

      if (!res.ok) {
        const text = await res.text();
        // 400/401/402/403 são terminais — não repetir
        const code = res.status === 402 ? 'AI_PAYMENT_REQUIRED' : res.status === 403 ? 'AI_FORBIDDEN' : 'AI_BAD_REQUEST';
        throw new GeminiError(code, `IA HTTP ${res.status}: ${text}`, res.status);
      }

      const json = await res.json();
      const text = useGemini
        ? json?.candidates?.[0]?.content?.parts?.[0]?.text
        : json?.choices?.[0]?.message?.content;
      if (!text) throw new Error('IA: resposta vazia');
      return parseJsonLoose<T>(text);
    } catch (err) {
      lastError = err;
      if (err instanceof GeminiError && err.code !== 'AI_RETRYABLE') throw err;
      if (attempt >= maxRetries) break;
      await sleep(500 * Math.pow(2, attempt));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Erro desconhecido na IA');
}
