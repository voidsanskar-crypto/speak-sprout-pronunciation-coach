import { toDateKey } from "./progress";

const groups = [
  {
    pairs: [
      [
        ["sheep", "ʃiːp"],
        ["ship", "ʃɪp"],
      ],
      [
        ["seat", "siːt"],
        ["sit", "sɪt"],
      ],
    ],
    tip: "Keep your tongue high and forward for /iː/. Lower it slightly and relax for /ɪ/.",
  },
  {
    pairs: [
      [
        ["bat", "bæt"],
        ["bet", "bɛt"],
      ],
      [
        ["pan", "pæn"],
        ["pen", "pɛn"],
      ],
    ],
    tip: "Open your jaw wider for /æ/. Keep your tongue forward and lift your jaw slightly for /ɛ/.",
  },
  {
    pairs: [
      [
        ["think", "θɪŋk"],
        ["sink", "sɪŋk"],
      ],
      [
        ["thick", "θɪk"],
        ["sick", "sɪk"],
      ],
    ],
    tip: "For /θ/, let air pass over your tongue tip between your teeth. For /s/, keep the tip behind your teeth.",
  },
  {
    pairs: [
      [
        ["right", "ɹaɪt"],
        ["light", "laɪt"],
      ],
      [
        ["road", "ɹoʊd"],
        ["load", "loʊd"],
      ],
    ],
    tip: "Keep your tongue from touching for /ɹ/. Touch the ridge behind your upper teeth for /l/.",
  },
  {
    pairs: [
      [
        ["berry", "bɛɹi"],
        ["very", "vɛɹi"],
      ],
      [
        ["boat", "boʊt"],
        ["vote", "voʊt"],
      ],
    ],
    tip: "Close both lips for /b/. For /v/, let air pass between your upper teeth and lower lip while you use your voice.",
  },
  {
    pairs: [
      [
        ["vest", "vɛst"],
        ["west", "wɛst"],
      ],
      [
        ["vine", "vaɪn"],
        ["wine", "waɪn"],
      ],
    ],
    tip: "For /v/, bring your upper teeth lightly to your lower lip. For /w/, round both lips.",
  },
  {
    pairs: [
      [
        ["fan", "fæn"],
        ["van", "væn"],
      ],
      [
        ["safe", "seɪf"],
        ["save", "seɪv"],
      ],
    ],
    tip: "Use the same teeth-on-lip position. Let air pass quietly for /f/ and add voice for /v/.",
  },
  {
    pairs: [
      [
        ["sip", "sɪp"],
        ["ship", "ʃɪp"],
      ],
      [
        ["see", "siː"],
        ["she", "ʃiː"],
      ],
    ],
    tip: "Make /s/ with your tongue just behind your front teeth. For /ʃ/, move the tongue slightly back and round your lips.",
  },
  {
    pairs: [
      [
        ["thin", "θɪn"],
        ["tin", "tɪn"],
      ],
      [
        ["thank", "θæŋk"],
        ["tank", "tæŋk"],
      ],
    ],
    tip: "Let air flow past your tongue tip for /θ/. For /t/, briefly block it behind your upper teeth, then release.",
  },
  {
    pairs: [
      [
        ["coat", "koʊt"],
        ["goat", "ɡoʊt"],
      ],
      [
        ["cold", "koʊld"],
        ["gold", "ɡoʊld"],
      ],
    ],
    tip: "Lift the back of your tongue toward the soft palate. Release without voice for /k/ and add voicing for /ɡ/.",
  },
  {
    pairs: [
      [
        ["cap", "kæp"],
        ["cab", "kæb"],
      ],
      [
        ["pack", "pæk"],
        ["back", "bæk"],
      ],
    ],
    tip: "Close both lips. Let a little air escape on /p/ and add voice on /b/.",
  },
  {
    pairs: [
      [
        ["pull", "pʊl"],
        ["pool", "puːl"],
      ],
      [
        ["full", "fʊl"],
        ["fool", "fuːl"],
      ],
    ],
    tip: "Round your lips for both vowels. Lift the back of your tongue higher for /uː/ and relax it for /ʊ/.",
  },
  {
    pairs: [
      [
        ["cap", "kæp"],
        ["cup", "kʌp"],
      ],
      [
        ["bag", "bæɡ"],
        ["bug", "bʌɡ"],
      ],
    ],
    tip: "Open your jaw with your tongue low and forward for /æ/. Move it toward the middle for /ʌ/.",
  },
  {
    pairs: [
      [
        ["set", "sɛt"],
        ["sit", "sɪt"],
      ],
      [
        ["bed", "bɛd"],
        ["bid", "bɪd"],
      ],
    ],
    tip: "Raise the front of your tongue higher for /ɪ/. Drop it slightly and open your jaw for /ɛ/.",
  },
  {
    pairs: [
      [
        ["sip", "sɪp"],
        ["zip", "zɪp"],
      ],
      [
        ["bus", "bʌs"],
        ["buzz", "bʌz"],
      ],
    ],
    tip: "Keep your tongue behind your front teeth. Let the air hiss for /s/ and add a buzz for /z/.",
  },
  {
    pairs: [
      [
        ["shop", "ʃɑp"],
        ["chop", "tʃɑp"],
      ],
      [
        ["shin", "ʃɪn"],
        ["chin", "tʃɪn"],
      ],
    ],
    tip: "Keep air flowing for /ʃ/. For /tʃ/, block the air briefly before releasing it into the hiss.",
  },
  {
    pairs: [
      [
        ["tie", "taɪ"],
        ["die", "daɪ"],
      ],
      [
        ["town", "taʊn"],
        ["down", "daʊn"],
      ],
    ],
    tip: "Touch the ridge behind your upper teeth for both. Release with air for /t/ and with voicing for /d/.",
  },
  {
    pairs: [
      [
        ["sin", "sɪn"],
        ["sing", "sɪŋ"],
      ],
      [
        ["ran", "ɹæn"],
        ["rang", "ɹæŋ"],
      ],
    ],
    tip: "Let sound out through your nose. Use the tip of your tongue for /n/ and the back of your tongue for /ŋ/.",
  },
  {
    pairs: [
      [
        ["late", "leɪt"],
        ["let", "lɛt"],
      ],
      [
        ["bait", "beɪt"],
        ["bet", "bɛt"],
      ],
    ],
    tip: "Glide the front of your tongue upward for /eɪ/. Keep the vowel steady and a little lower for /ɛ/.",
  },
  {
    pairs: [
      [
        ["boil", "bɔɪl"],
        ["bowl", "boʊl"],
      ],
      [
        ["toy", "tɔɪ"],
        ["toe", "toʊ"],
      ],
    ],
    tip: "For /ɔɪ/, round your lips first, then lift the front of your tongue. For /oʊ/, keep the tongue farther back as your lips round.",
  },
] as const;

const catalog = [0, 1].flatMap((index) =>
  groups.map(({ pairs, tip }) => ({ pair: pairs[index]!, tip })),
);

export const DAILY_PAIR_COUNT = 8;
export const MINIMAL_PAIR_COUNT = catalog.length;

export function dailyPairOffset(date: Date) {
  const day = Math.floor(Date.parse(toDateKey(date)) / 86_400_000);
  const dailySets = MINIMAL_PAIR_COUNT / DAILY_PAIR_COUNT;
  return (((day % dailySets) + dailySets) % dailySets) * DAILY_PAIR_COUNT;
}

export function buildMinimalPairRounds(offset: number, count: number, random = Math.random) {
  const selected = Array.from(
    { length: Math.min(count, MINIMAL_PAIR_COUNT) },
    (_, index) => catalog[(offset + index) % MINIMAL_PAIR_COUNT]!,
  );
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [selected[i], selected[j]] = [selected[j]!, selected[i]!];
  }

  return selected.map(({ pair: [[left, leftIpa], [right, rightIpa]], tip }) => {
    const options: readonly [string, string] = random() < 0.5 ? [left, right] : [right, left];
    return {
      options,
      target: random() < 0.5 ? left : right,
      ipa: { [left]: leftIpa, [right]: rightIpa },
      tip,
    };
  });
}
