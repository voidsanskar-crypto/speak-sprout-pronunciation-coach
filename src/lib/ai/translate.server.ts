import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "./run-id";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

const schema = z.object({
  translations: z.array(z.object({ id: z.string(), text: z.string() })),
});

export type TranslateResult =
  | { ok: true; translations: Record<string, string> }
  | { ok: false; error: string };

function statusOf(error: unknown): number | undefined {
  const e = error as { statusCode?: number; status?: number; cause?: { statusCode?: number } };
  return e?.statusCode ?? e?.status ?? e?.cause?.statusCode;
}

export async function translatePhrasesServer(
  language: string,
  phrases: { id: string; text: string }[],
): Promise<TranslateResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { ok: false, error: "Translations aren't set up yet." };

  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  try {
    const result = streamText({
      model: provider.responses(MODEL),
      instructions:
        "You translate short English phrases for language learners. Translate each phrase naturally and accurately into the requested target language, using that language's native script. Keep names unchanged. Return one translation per input id, using the same ids.",
      messages: [
        {
          role: "user",
          content: `Target language: ${language}\n\nPhrases (id: text):\n${phrases.map((p) => `${p.id}: ${p.text}`).join("\n")}`,
        },
      ],
      output: Output.object({ schema }),
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    // Drain the stream server-side, then read the final object.
    for await (const _ of result.textStream) {
      void _;
    }
    const output = await result.output;
    const translations: Record<string, string> = {};
    const valid = new Set(phrases.map((p) => p.id));
    for (const t of output.translations) {
      if (valid.has(t.id) && t.text.trim()) translations[t.id] = t.text.trim();
    }
    if (Object.keys(translations).length === 0) {
      return { ok: false, error: "No translation came back. Please try again later." };
    }
    return { ok: true, translations };
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      return { ok: false, error: "The translation came back incomplete. Please try again later." };
    }
    const status = statusOf(error);
    console.error("translate failed", status, error);
    if (status === 429) return { ok: false, error: "Too many translation requests right now. Please wait a moment and try again." };
    if (status === 402) return { ok: false, error: "AI credits have run out, so translations are paused for now." };
    if (status === 403) return { ok: false, error: "Translation isn't available right now." };
    return { ok: false, error: "Translation failed. Please try again later." };
  }
}
