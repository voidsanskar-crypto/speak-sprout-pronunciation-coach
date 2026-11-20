import { useEffect, useState } from "react";

type Dictionary = typeof import("@/lib/phoneme-review");

export function usePronunciationDictionary(enabled: boolean) {
  const [dictionary, setDictionary] = useState<Dictionary | null>();

  useEffect(() => {
    if (!enabled || dictionary !== undefined) return;
    let active = true;
    void import("@/lib/phoneme-review").then(
      (module) => {
        if (active) setDictionary(module);
      },
      () => {
        if (active) setDictionary(null);
      },
    );
    return () => {
      active = false;
    };
  }, [enabled, dictionary]);

  return dictionary;
}
