export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export type GeminiGeneration = {
  text: string;
  raw: unknown;
};

export async function generateWithGemini(parts: GeminiPart[], options?: {
  systemInstruction?: string;
  model?: string;
  temperature?: number;
}) : Promise<GeminiGeneration> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on the server");

  const model = options?.model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...(options?.systemInstruction
        ? { systemInstruction: { parts: [{ text: options.systemInstruction }] } }
        : {}),
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: options?.temperature ?? 0.2 },
    }),
    cache: "no-store",
  });

  const raw = await response.json();
  if (!response.ok) {
    throw new Error(`Gemini request failed (${response.status}): ${JSON.stringify(raw)}`);
  }

  const text = raw?.candidates?.[0]?.content?.parts
    ?.filter((part: { text?: string }) => typeof part.text === "string")
    ?.map((part: { text: string }) => part.text)
    ?.join("\n") || "";

  return { text, raw };
}

export function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced || text.trim();
  return JSON.parse(candidate) as T;
}
