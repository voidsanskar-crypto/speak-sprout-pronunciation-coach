import { useQuery } from "@tanstack/react-query";
import type { Phrase } from "@/lib/phrases";
import { translatePhrases } from "@/lib/ai/translate.functions";

const cacheKey = (lang: string) => `speakup:tr:${lang.toLowerCase()}`;

function readCache(lang: string): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(cacheKey(lang));
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeCache(lang: string, add: Record<string, string>) {
  try {
    window.localStorage.setItem(cacheKey(lang), JSON.stringify({ ...readCache(lang), ...add }));
  } catch {
    /* ignore */
  }
}

/** Translation of one phrase in the chosen language, fetched on demand and kept on the device. */
export function usePhraseTranslation(phrase: Phrase, language: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["translation", language?.toLowerCase(), phrase.id],
    enabled: !!language && enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    queryFn: async () => {
      const lang = language!;
      const cached = readCache(lang)[phrase.id];
      if (cached) return cached;
      const res = await translatePhrases({ data: { language: lang, phrases: [{ id: phrase.id, text: phrase.text }] } });
      if (!res.ok) throw new Error(res.error);
      writeCache(lang, res.translations);
      return res.translations[phrase.id] ?? "";
    },
  });
}
