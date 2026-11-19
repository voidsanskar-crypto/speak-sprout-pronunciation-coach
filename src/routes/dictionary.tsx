import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Search, Volume2, Check } from "lucide-react";
import { useMemo, useState } from "react";
import { MobileShell } from "@/components/speakup/MobileShell";
import { Button } from "@/components/ui/button";
import { SpeechPrompt } from "@/components/speakup/SpeechPrompt";
import { approximateIpa } from "@/lib/assessment";
import { PHRASES } from "@/lib/phrases";
import { speak } from "@/lib/speech";

export const Route = createFileRoute("/dictionary")({ component: Dictionary });

function Dictionary() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const words = useMemo(() => [...new Set(PHRASES.flatMap((p) => p.text.toLowerCase().match(/[a-z']+/g) ?? []))].sort(), []);
  const normalized=query.trim().toLowerCase().replace(/[^a-z'-]/g,"");
  const results = normalized ? words.filter((word) => word.includes(normalized)).slice(0, 24) : [];
  const selectWord=(word:string)=>{const clean=word.trim().toLowerCase().replace(/[^a-z'-]/g,"");if(clean){setSelected(clean);setQuery(clean)}};
  return <MobileShell nav={false}>
    <Button asChild variant="soft" size="icon-lg" aria-label="Back"><Link to="/"><ArrowLeft /></Link></Button>
    <h1 className="mt-5 font-display text-3xl font-bold">Pronunciation dictionary</h1>
    <p className="mb-4 mt-2 text-sm text-muted-foreground">Look up any English word, hear it, then record yourself. Sound hints are approximate spelling guides, not dictionary-verified IPA.</p>
    <form onSubmit={e=>{e.preventDefault();selectWord(query)}} className="flex items-center gap-2 rounded-2xl bg-card p-3 shadow-card"><Search className="size-5 text-muted-foreground"/><input aria-label="Search any English word" className="w-full bg-transparent outline-none" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Type any English word…"/><Button type="submit" variant="soft" size="icon" aria-label="Look up word"><Check/></Button></form>
    {results.length>0 && <div className="mt-3 flex flex-wrap gap-2">{results.map(word=><Button key={word} variant="chip" size="pill" onClick={()=>{setSelected(word);setQuery(word)}}>{word}</Button>)}</div>}
    {selected && <section className="mt-5 rounded-[2rem] bg-card p-5 shadow-card"><div className="flex items-center justify-between"><h2 className="font-display text-3xl font-bold">{selected}</h2><Button variant="mint" size="icon" aria-label="Hear word" onClick={()=>speak(selected)}><Volume2/></Button></div><p className="mt-1 font-display text-xl text-muted-foreground">/{approximateIpa(selected)}/</p><SpeechPrompt key={selected} text={selected} /></section>}
    {query.trim()&&!results.includes(normalized)&&<Button className="mt-3" variant="chip" size="pill" onClick={()=>selectWord(query)}>Look up “{query.trim()}”</Button>}
  </MobileShell>;
}
