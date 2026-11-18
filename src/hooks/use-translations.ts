import { useQuery } from "@tanstack/react-query";
import { PHRASES } from "@/lib/phrases";
import { translatePhrases } from "@/lib/ai/translate.functions";

const cacheKey = (lang: string) => `speakup:tr:${lang.toLowerCase()}`;

function readCache(lang: string): Record<string, string> | null {
  try {
    const raw = window.localStorage.getItem(cacheKey(lang));
    return raw ? (JSON.parse(raw) as Record<string, string>) : null;
  } catch {
    return null;
  }
}

/** Translations for all phrases in the chosen language, fetched once and kept on the device. */
export function useTranslations(language: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["translations", language?.toLowerCase()],
    enabled: !!language && enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    queryFn: async () => {
      const lang = language!;
      const cached = readCache(lang);
      if (cached && Object.keys(cached).length >= PHRASES.length * 0.9) return cached;
      const res = await translatePhrases({
        data: { language: lang, phrases: PHRASES.map((p) => ({ id: p.id, text: p.text })) },
      });
      if (!res.ok) throw new Error(res.error);
      try {
        window.localStorage.setItem(cacheKey(lang), JSON.stringify(res.translations));
      } catch {
        /* ignore */
      }
      return res.translations;
    },
  });
}
