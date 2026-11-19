import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, AudioLines, Search, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/speakup/MobileShell";
import { Button } from "@/components/ui/button";
import { SpeechPrompt } from "@/components/speakup/SpeechPrompt";

type Phonetic={text?:string;audio?:string};
type Meaning={partOfSpeech:string;definitions:{definition:string;example?:string}[]};
type Entry={word:string;phonetic?:string;phonetics:Phonetic[];meanings:Meaning[]};
export const Route = createFileRoute("/dictionary")({ component: Dictionary });

function Dictionary() {
 const [query,setQuery]=useState("");const [selected,setSelected]=useState("");const [entry,setEntry]=useState<Entry|null>(null);const [loading,setLoading]=useState(false);const [error,setError]=useState("");
 useEffect(()=>{if(!selected)return;let cancelled=false;setLoading(true);setEntry(null);setError("");fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(selected)}`).then(async response=>{if(!response.ok)throw new Error(response.status===404?"No dictionary entry found for that word.":"Dictionary lookup is temporarily unavailable.");return await response.json() as Entry[]}).then(data=>{if(!cancelled){const first=data[0];if(first)setEntry(first);else setError("No dictionary entry found for that word.")}}).catch(e=>{if(!cancelled)setError(e instanceof Error?e.message:"Dictionary lookup failed.")}).finally(()=>{if(!cancelled)setLoading(false)});return()=>{cancelled=true}},[selected]);
 const lookup=(word:string)=>{const clean=word.trim().toLowerCase().replace(/[^a-z'-]/g,"");if(clean){setSelected(clean);setQuery(clean)}};
 const phonetics=entry?.phonetics.filter(p=>p.text||p.audio)||[];const pronunciation=entry?.phonetic||phonetics.find(p=>p.text)?.text;
 return <MobileShell nav={false}><Button asChild variant="soft" size="icon-lg" aria-label="Back"><Link to="/"><ArrowLeft/></Link></Button><h1 className="mt-5 font-display text-3xl font-bold">Pronunciation dictionary</h1><p className="mb-4 mt-2 text-sm text-muted-foreground">Look up an English word for dictionary phonetics and recorded pronunciation, then practice saying it.</p>
 <form onSubmit={e=>{e.preventDefault();lookup(query)}} className="flex items-center gap-2 rounded-2xl bg-card p-3 shadow-card"><Search className="size-5 text-muted-foreground"/><input aria-label="Search any English word" className="w-full bg-transparent outline-none" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Type an English word…"/><Button type="submit" variant="soft" size="icon" aria-label="Look up word"><Search/></Button></form>
 {loading&&<p className="mt-4 animate-pulse text-sm font-semibold text-muted-foreground">Looking up {selected}…</p>}{error&&<p role="status" className="mt-4 rounded-2xl bg-warning-soft p-4 text-sm font-semibold">{error}</p>}
 {entry&&<section className="mt-5 rounded-[2rem] bg-card p-5 shadow-card"><div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-3xl font-bold">{entry.word}</h2>{pronunciation&&<p className="mt-1 font-display text-xl text-muted-foreground">{pronunciation}</p>}</div><Button variant="mint" size="icon" aria-label="Play dictionary pronunciation" disabled={!phonetics.some(p=>p.audio)} onClick={()=>{const audio=phonetics.find(p=>p.audio)?.audio;if(audio)void new Audio(audio.startsWith("//")?`https:${audio}`:audio).play()}}><AudioLines/></Button></div>
 {phonetics.some(p=>p.audio)&&<p className="mt-2 text-xs text-muted-foreground">Pronunciation audio from the dictionary source.</p>}{!pronunciation&&!phonetics.some(p=>p.audio)&&<p className="mt-2 text-sm text-muted-foreground">This entry has no recorded phonetic spelling or audio.</p>}
 <div className="mt-4 space-y-3">{entry.meanings.slice(0,3).map((meaning,i)=><div key={`${meaning.partOfSpeech}-${i}`} className="rounded-2xl bg-secondary p-4"><p className="text-xs font-extrabold uppercase tracking-wide">{meaning.partOfSpeech}</p>{meaning.definitions.slice(0,2).map((def,j)=><div key={j} className="mt-2"><p className="text-sm">{def.definition}</p>{def.example&&<p className="mt-1 text-xs italic text-muted-foreground">“{def.example}”</p>}</div>)}</div>)}</div>
 <div className="mt-4"><p className="mb-2 text-xs font-bold text-muted-foreground">Now say the word and compare with the recorded example.</p><SpeechPrompt key={entry.word} text={entry.word}/></div></section>}
 <p className="mt-5 text-xs leading-relaxed text-muted-foreground">Dictionary data is supplied by Free Dictionary API (Wiktionary-derived). Entries may include different regional pronunciations; use the listed transcription and audio when provided. The practice score checks recognized words, not acoustic phoneme quality.</p>
 </MobileShell>;
}
