import type { TopicId } from "./topics";
import type { Difficulty } from "./topics";
import { approximateIpa } from "./assessment";

export interface Phrase {
  id: string;
  topic: TopicId;
  text: string;
  /** IPA, one space-separated token per word in `text`. */
  ipa: string;
  difficulty: Difficulty;
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

function build(topic: TopicId, seeds: Seed[], difficulty: Difficulty = "Beginner"): Phrase[] {
  return seeds.map(([text, ipa], i) => ({ id: difficulty === "Beginner" ? `${topic}-${i + 1}` : `${topic}-${difficulty.toLowerCase()}-${i + 1}`, topic, text, ipa, difficulty }));
}

// Tiered curriculum keeps learners progressing beyond the introductory seed set.
const intermediate: Record<TopicId, string[]> = {
  travel: ["Although our connecting flight was delayed, the airline arranged overnight accommodation.", "Could you recommend a neighborhood with reliable public transportation?", "I need to change my reservation because my itinerary has shifted.", "The customs officer asked whether I had anything to declare.", "Would it be possible to store our luggage until the room is ready?", "We missed the transfer, so we are looking for an alternative route.", "Please confirm whether the fare includes checked baggage.", "The weather may affect our departure time, so check the airline updates."],
  interview: ["I coordinated a cross-functional project that reduced onboarding time by twenty percent.", "When priorities changed, I clarified expectations and reorganized the team's workload.", "One challenge I faced was translating technical requirements for nontechnical partners.", "I would describe my management style as collaborative, with clear accountability.", "Could you explain how success is measured during the first six months?", "I learned to treat constructive feedback as a practical tool for improvement.", "My experience aligns with this role because I have led similar initiatives.", "I am interested in the position because it combines research and customer impact."],
  smalltalk: ["I have been trying to spend more time outdoors whenever the weather cooperates.", "What initially drew you to this neighborhood, and has it changed over time?", "I recently started learning to cook dishes from a region I visited last year.", "That sounds fascinating; what was the most unexpected part of the experience?", "I usually prefer smaller gatherings where everyone has time to talk.", "Have you read anything recently that you would recommend to a friend?", "It was a pleasure catching up, and I hope we can do this again soon.", "I have been balancing a busy schedule with a few new personal projects."],
  sounds: ["Those three thoughtful authors thoroughly revised their introductions.", "Rural libraries rarely receive regular deliveries during severe weather.", "The valuable review revealed several very avoidable errors.", "She usually measures the azure fabric before choosing a design.", "We discussed whether the sixth version was genuinely worthwhile.", "The visiting physician emphasized consistent breathing and hydration.", "Lily's early research influenced the direction of our proposal.", "Their shared vision gradually developed into a practical solution."],
};
const advanced: Record<TopicId, string[]> = {
  travel: ["Given the rail disruption, we would appreciate guidance on the most dependable onward connection.", "If the reservation cannot be amended, could you outline the cancellation terms and applicable fees?", "Despite the conflicting announcements, the station staff eventually clarified our platform assignment.", "We have a tight connection, so please let us know whether our checked bags will be transferred automatically.", "Could you arrange an accessible vehicle and confirm the pickup point outside the arrivals terminal?", "Had we known about the engineering work, we would have booked a different route.", "The hotel acknowledged the overbooking and offered to cover transportation to a nearby property.", "Before we proceed, I would like to verify the exchange rate and any additional transaction charges."],
  interview: ["I establish measurable milestones early, then revisit them as new evidence changes the project's scope.", "Rather than optimize a single metric, I worked with stakeholders to understand the underlying customer problem.", "The decision was unpopular initially, but transparent communication helped the team understand its rationale.", "I would approach the first ninety days by listening carefully, mapping dependencies, and identifying quick wins.", "When an experiment failed, we documented the assumptions and used the results to refine our next iteration.", "I am comfortable presenting uncertainty honestly while still recommending a clear course of action.", "The most consequential improvement came from automating a repetitive process without sacrificing quality.", "How does the organization balance long-term strategy with rapidly changing customer needs?"],
  smalltalk: ["I appreciate how the city preserves its historic character while continuing to welcome new communities.", "The conversation reminded me that people can interpret the same experience in remarkably different ways.", "I had assumed the exhibit would be formal, but the interactive presentation made it unexpectedly engaging.", "Although I rarely follow celebrity news, I enjoy hearing how creative projects come together behind the scenes.", "It is interesting how a small change in routine can influence the way you experience an entire week.", "I agree with part of your point, though I wonder whether the broader context changes the conclusion.", "We should compare notes after the event; I suspect we noticed different details.", "What has been the most rewarding thing you have learned since moving here?"],
  sounds: ["The researchers distinguished the theoretical framework from the evidence gathered in the field.", "Though the initial figures were encouraging, the longitudinal analysis revealed substantial variation.", "Rarely have we encountered such a thorough explanation of the underlying methodology.", "The seventh proposal thoughtfully addresses both accessibility and environmental sustainability.", "Their interpretation was plausible, yet the available measurements did not conclusively support it.", "Regular rehearsal improves rhythm, but deliberate pauses make complex ideas easier to understand.", "The revised resolution acknowledges the risk without overstating what the results demonstrate.", "Throughout the discussion, she articulated a nuanced view of cultural and professional identity."],
};
function generated(topic: TopicId, lines: string[], difficulty: Difficulty): Phrase[] {
  return lines.map((text, i) => ({ id: `${topic}-${difficulty.toLowerCase()}-${i + 1}`, topic, text, ipa: text.split(/\s+/).map((word) => approximateIpa(word)).join(" "), difficulty }));
}

export const PHRASES: Phrase[] = [
  ...build("travel", travel),
  ...build("interview", interview),
  ...build("smalltalk", smalltalk),
  ...build("sounds", sounds),
  ...Object.entries(intermediate).flatMap(([topic, lines]) => generated(topic as TopicId, lines, "Intermediate")),
  ...Object.entries(advanced).flatMap(([topic, lines]) => generated(topic as TopicId, lines, "Advanced")),
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
