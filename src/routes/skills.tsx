import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, MessageCircle, Mic2, Target } from "lucide-react";
import { MobileShell } from "@/components/speakup/MobileShell";
import { Button } from "@/components/ui/button";
import { SOUND_IDS, SOUNDS } from "@/lib/sounds";
import { PHRASES } from "@/lib/phrases";
import { useProgress } from "@/hooks/use-progress";
import { weakestSounds } from "@/lib/progress";

export const Route = createFileRoute("/skills")({ component: Skills });
function Skills(){
 const progress=useProgress(); const weak=weakestSounds(progress,1); const attempted=new Set(progress.attempts.map(a=>a.phraseId));
 const practiced=attempted.size; const pct=PHRASES.length?Math.round(practiced/PHRASES.length*100):0;
 return <MobileShell nav={false}><Button asChild variant="soft" size="icon-lg" aria-label="Back"><Link to="/"><ArrowLeft/></Link></Button><h1 className="mt-5 font-display text-3xl font-bold">Skills practice</h1><p className="mt-2 text-sm text-muted-foreground">Build pronunciation, listening, fluency, and conversation habits with a plan that responds to your practice.</p>
 <div className="mt-5 rounded-[2rem] bg-card p-5 shadow-card"><div className="flex justify-between"><span className="font-bold">Curriculum progress</span><span className="font-extrabold text-primary">{practiced}/{PHRASES.length}</span></div><div className="mt-3 h-3 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{width:`${pct}%`}}/></div><p className="mt-2 text-xs text-muted-foreground">Complete more phrases to unlock and revisit harder material.</p></div>
 <div className="mt-5 grid gap-3">{[{icon:<Mic2/>,title:"Pronunciation",desc:"Target sounds and guided phrase drills",to:"/practice" as const},{icon:<MessageCircle/>,title:"Conversation",desc:"Practice real situations and roleplay",to:"/dialogue" as const},{icon:<BookOpen/>,title:"Vocabulary",desc:"Search and practice words",to:"/dictionary" as const},{icon:<Target/>,title:"Level check",desc:"Refresh your personalized starting plan",to:"/assessment" as const}].map(item=><Link key={item.title} to={item.to} className="flex items-center gap-4 rounded-3xl bg-card p-4 shadow-card"><span className="rounded-2xl bg-primary-soft p-3 text-primary">{item.icon}</span><span className="flex-1"><b className="block">{item.title}</b><small className="text-muted-foreground">{item.desc}</small></span><span>›</span></Link>)}</div>
 <h2 className="mb-3 mt-7 font-display text-xl font-bold">Sound goals</h2><div className="space-y-2">{SOUND_IDS.map(id=>{const stat=weak.find(s=>s.id===id);return <div key={id} className="flex items-center gap-3 rounded-2xl bg-card p-3"><b className="w-12 text-center font-display text-xl">{SOUNDS[id].label}</b><span className="flex-1 text-sm text-muted-foreground">{SOUNDS[id].ipa} · {SOUNDS[id].example}</span><span className="font-bold">{stat?`${stat.average}%`:"New"}</span><Button asChild variant="soft" size="sm"><Link to="/practice" search={{sound:id}}>Practice</Link></Button></div>})}</div></MobileShell>
}
