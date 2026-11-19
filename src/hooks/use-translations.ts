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

type TranslationSource = Pick<Phrase, "id" | "text">;

function useTranslationQuery<T>(
  phrases: readonly TranslationSource[],
  language: string | null,
  enabled: boolean,
  select: (translations: Record<string, string>) => T,
) {
  return useQuery({
    queryKey: ["translation", language?.toLowerCase(), ...phrases.map((phrase) => phrase.id)],
    enabled: !!language && enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    select,
    queryFn: async () => {
      const lang = language!;
      const cached = readCache(lang);
      const pending = phrases.filter((phrase) => !cached[phrase.id]);
      if (!pending.length) return cached;
      const res = await translatePhrases({ data: { language: lang, phrases: pending } });
      if (!res.ok) throw new Error(res.error);
      writeCache(lang, res.translations);
      return { ...cached, ...res.translations };
    },
  });
}

export function usePhraseTranslation(
  phrase: TranslationSource,
  language: string | null,
  enabled: boolean,
) {
  return useTranslationQuery(
    [phrase],
    language,
    enabled,
    (translations) => translations[phrase.id] ?? "",
  );
}

export function useTextTranslations(phrases: readonly TranslationSource[], language: string) {
  return useTranslationQuery(phrases, language, true, (translations) => translations);
}
