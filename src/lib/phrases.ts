import type { TopicId } from "./topics";

export interface Phrase {
  id: string;
  topic: TopicId;
  text: string;
  /** IPA, one space-separated token per word in `text`. */
  ipa: string;
}

type Seed = [text: string, ipa: string];

const travel: Seed[] = [
  ["Where is the train station?", "wɛr ɪz ðə treɪn ˈsteɪʃən"],
  ["I would like a window seat.", "aɪ wʊd laɪk ə ˈwɪndoʊ sit"],
  ["How much does this ticket cost?", "haʊ mʌtʃ dʌz ðɪs ˈtɪkɪt kɔst"],
  ["Could you call a taxi for me?", "kʊd ju kɔl ə ˈtæksi fɔr mi"],
  ["My flight leaves early tomorrow morning.", "maɪ flaɪt livz ˈɝli təˈmɑroʊ ˈmɔrnɪŋ"],
  ["Is breakfast included with the room?", "ɪz ˈbrɛkfəst ɪnˈkludɪd wɪθ ðə rum"],
  ["I have a reservation for two nights.", "aɪ hæv ə ˌrɛzərˈveɪʃən fɔr tu naɪts"],
  ["Where can I find the baggage claim?", "wɛr kæn aɪ faɪnd ðə ˈbæɡɪdʒ kleɪm"],
  ["Excuse me, which way is the museum?", "ɪkˈskjuz mi wɪtʃ weɪ ɪz ðə mjuˈziəm"],
  ["Can I pay with a credit card?", "kæn aɪ peɪ wɪθ ə ˈkrɛdɪt kɑrd"],
  ["Please take me to this address.", "pliz teɪk mi tu ðɪs ˈædrɛs"],
];

const interview: Seed[] = [
  ["Tell me a little about yourself.", "tɛl mi ə ˈlɪtəl əˈbaʊt jɔrˈsɛlf"],
  ["I am passionate about solving problems.", "aɪ æm ˈpæʃənət əˈbaʊt ˈsɑlvɪŋ ˈprɑbləmz"],
  ["My greatest strength is communication.", "maɪ ˈɡreɪtəst strɛŋθ ɪz kəˌmjunɪˈkeɪʃən"],
  ["I work well under pressure.", "aɪ wɝk wɛl ˈʌndər ˈprɛʃər"],
  ["I led a team of five engineers.", "aɪ lɛd ə tim əv faɪv ˌɛndʒɪˈnɪrz"],
  ["Where do you see yourself in five years?", "wɛr du ju si jɔrˈsɛlf ɪn faɪv jɪrz"],
  ["I am a quick learner and very reliable.", "aɪ æm ə kwɪk ˈlɝnər ənd ˈvɛri rɪˈlaɪəbəl"],
  ["Thank you for this opportunity.", "θæŋk ju fɔr ðɪs ˌɑpərˈtunəti"],
  ["What does a typical day look like?", "wʌt dʌz ə ˈtɪpɪkəl deɪ lʊk laɪk"],
  ["I would love to join your company.", "aɪ wʊd lʌv tu dʒɔɪn jɔr ˈkʌmpəni"],
  ["Do you have any questions for us?", "du ju hæv ˈɛni ˈkwɛstʃənz fɔr ʌs"],
];

const smalltalk: Seed[] = [
  ["How was your weekend?", "haʊ wʌz jɔr ˈwikˌɛnd"],
  ["The weather is lovely today.", "ðə ˈwɛðər ɪz ˈlʌvli təˈdeɪ"],
  ["Nice to meet you.", "naɪs tu mit ju"],
  ["What do you do for fun?", "wʌt du ju du fɔr fʌn"],
  ["Have you seen any good movies lately?", "hæv ju sin ˈɛni ɡʊd ˈmuviz ˈleɪtli"],
  ["I really love this coffee shop.", "aɪ ˈrɪli lʌv ðɪs ˈkɔfi ʃɑp"],
  ["Where are you from originally?", "wɛr ɑr ju frʌm əˈrɪdʒənəli"],
  ["It was great talking to you.", "ɪt wʌz ɡreɪt ˈtɔkɪŋ tu ju"],
  ["Are you doing anything this evening?", "ɑr ju ˈduɪŋ ˈɛniˌθɪŋ ðɪs ˈivnɪŋ"],
  ["Let's grab lunch sometime.", "lɛts ɡræb lʌntʃ ˈsʌmˌtaɪm"],
  ["See you later, take care!", "si ju ˈleɪtər teɪk kɛr"],
];

const sounds: Seed[] = [
  ["Both brothers thought about the theater.", "boʊθ ˈbrʌðərz θɔt əˈbaʊt ðə ˈθiətər"],
  ["The weather this Thursday is rather cold.", "ðə ˈwɛðər ðɪs ˈθɝzdeɪ ɪz ˈræðər koʊld"],
  ["Thank you for thinking of me.", "θæŋk ju fɔr ˈθɪŋkɪŋ əv mi"],
  ["The red lorry rolled along the road.", "ðə rɛd ˈlɔri roʊld əˈlɔŋ ðə roʊd"],
  ["Laura likes to read really long novels.", "ˈlɔrə laɪks tu rid ˈrɪli lɔŋ ˈnɑvəlz"],
  ["Please collect the correct receipt.", "pliz kəˈlɛkt ðə kəˈrɛkt rɪˈsit"],
  ["Larry loves rice and lemon.", "ˈlæri lʌvz raɪs ənd ˈlɛmən"],
  ["We visited a village in the valley.", "wi ˈvɪzɪtɪd ə ˈvɪlɪdʒ ɪn ðə ˈvæli"],
  ["Victor wants a very warm vest.", "ˈvɪktər wɑnts ə ˈvɛri wɔrm vɛst"],
  ["We will wait while the van drives away.", "wi wɪl weɪt waɪl ðə væn draɪvz əˈweɪ"],
  ["Wendy's voice is wonderfully vivid.", "ˈwɛndiz vɔɪs ɪz ˈwʌndərfəli ˈvɪvɪd"],
  ["Vanessa wears velvet on Wednesdays.", "vəˈnɛsə wɛrz ˈvɛlvət ɑn ˈwɛnzdeɪz"],
];

function build(topic: TopicId, seeds: Seed[]): Phrase[] {
  return seeds.map(([text, ipa], i) => ({ id: `${topic}-${i + 1}`, topic, text, ipa }));
}

export const PHRASES: Phrase[] = [
  ...build("travel", travel),
  ...build("interview", interview),
  ...build("smalltalk", smalltalk),
  ...build("sounds", sounds),
];

export const PHRASE_BY_ID: Record<string, Phrase> = Object.fromEntries(
  PHRASES.map((p) => [p.id, p]),
);

export function phrasesForTopic(topic: TopicId): Phrase[] {
  return PHRASES.filter((p) => p.topic === topic);
}

/** Words as displayed (punctuation kept). */
export function displayWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

export function ipaWords(phrase: Phrase): string[] {
  return phrase.ipa.split(/\s+/).filter(Boolean);
}
