const { z } = require('zod');
const env = require('../config/env');
const logger = require('../config/logger');

const SYSTEM_PROMPT = `You are a technical portfolio writer. Convert the developer's raw idea into a portfolio entry.
Return ONLY a JSON object with exactly these keys:
- "title": catchy, under 80 chars
- "description": SEO-optimized, 120-160 chars, plain text
- "writeup": Markdown, 400-800 words, using these ## sections: Overview, Architecture, Key Features, Challenges & Solutions, Outcome
- "tags": array of 3-8 short technology/concept strings
- "imagePrompt": one paragraph describing a dark-mode, neon-accented abstract tech illustration for this project. No text, letters, logos, or UI screenshots in the image.
Rules: use only facts present in the idea. Do not invent metrics, clients, users, or URLs. Where detail is missing, describe plausible architecture in general terms without claiming specifics.`;

const outputSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(20).max(200),
  writeup: z.string().min(200),
  tags: z.array(z.string().min(1).max(30)).min(1).max(10),
  imagePrompt: z.string().min(10).max(1000),
});

class AIServiceError extends Error {
  constructor(message, status = 502, code = 'AI_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function fromStatus(s, body = '') {
  if (s === 401 || s === 403) return new AIServiceError('AI provider rejected the API key.', 502, 'AI_AUTH');
  if (s === 429) return new AIServiceError('AI provider rate limit or quota hit. Try again shortly.', 429, 'AI_RATE_LIMIT');
  if (s === 400 && /api key|API_KEY/i.test(body)) return new AIServiceError('AI provider rejected the API key.', 502, 'AI_AUTH');
  if (s === 400 && /content_policy|safety/i.test(body))
    return new AIServiceError('Request blocked by provider content policy.', 422, 'AI_POLICY');
  return new AIServiceError('AI provider call failed.', 502, 'AI_UPSTREAM');
}

function mapProviderError(err) {
  if (err instanceof AIServiceError) return err;
  if (err?.name === 'TimeoutError' || err?.name === 'APIConnectionTimeoutError')
    return new AIServiceError('AI provider timed out.', 504, 'AI_TIMEOUT');
  return fromStatus(err?.status, err?.message || '');
}

async function geminiText(idea) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: idea }] }],
      generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw fromStatus(res.status, await res.text().catch(() => ''));
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
}

let openaiClient;
function openai() {
  if (!openaiClient) {
    const OpenAI = require('openai');
    openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY, timeout: 90_000, maxRetries: 2 });
  }
  return openaiClient;
}

async function openaiText(idea) {
  const res = await openai().chat.completions.create({
    model: env.OPENAI_TEXT_MODEL,
    temperature: 0.7,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: idea },
    ],
  });
  return res.choices?.[0]?.message?.content || '';
}

const textProvider = () => (env.AI_PROVIDER === 'openai' ? openaiText : geminiText);

/** Idea -> validated project JSON. One retry if the model returns malformed JSON. */
async function generateProjectJson(idea) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const raw = (await textProvider()(idea)).replace(/^```json\s*|```\s*$/g, '').trim();
      if (!raw) throw new SyntaxError('empty completion');
      return outputSchema.parse(JSON.parse(raw));
    } catch (err) {
      const retryable = err instanceof SyntaxError || err instanceof z.ZodError;
      logger.warn({ event: 'ai_json_invalid', attempt, retryable, msg: err.message });
      if (!retryable) throw mapProviderError(err);
    }
  }
  throw new AIServiceError('AI returned malformed output twice.', 502, 'AI_BAD_JSON');
}

/** Image prompt -> PNG Buffer. Only called when IMAGE_PROVIDER=openai. */
async function generateImageBuffer(prompt) {
  try {
    const res = await openai().images.generate({
      model: env.OPENAI_IMAGE_MODEL,
      prompt,
      size: '1792x1024',
      n: 1,
      response_format: 'b64_json',
    });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new AIServiceError('Image provider returned no data.', 502, 'AI_IMAGE_EMPTY');
    return Buffer.from(b64, 'base64');
  } catch (err) {
    throw mapProviderError(err);
  }
}

module.exports = { generateProjectJson, generateImageBuffer, AIServiceError };
