import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/speakup/MobileShell";
import { Button } from "@/components/ui/button";

const KEY="speakup:profile:v1";
type Profile={name:string;email:string};
export const Route=createFileRoute("/login")({component:Login});
function Login(){
 const navigate=useNavigate();
 const [name,setName]=useState("");const [email,setEmail]=useState("");const [profile,setProfile]=useState<Profile|null>(null);const [saved,setSaved]=useState(false);
 useEffect(()=>{try{const value=localStorage.getItem(KEY);if(value){const parsed=JSON.parse(value) as Profile;if(parsed.name&&parsed.email){void navigate({to:"/",replace:true});return}localStorage.removeItem(KEY)}}catch{/* ignore invalid local profile */}},[navigate]);
 const submit=(e:React.FormEvent)=>{e.preventDefault();if(!name.trim()||!email.trim())return;const next={name:name.trim(),email:email.trim()};localStorage.setItem(KEY,JSON.stringify(next));setProfile(next);setSaved(true);void navigate({to:"/",replace:true})};
 return <MobileShell nav={false}><Button asChild variant="soft" size="icon-lg" aria-label="Back"><Link to="/"><ArrowLeft/></Link></Button><div className="mt-8 rounded-[2rem] bg-card p-6 shadow-card"><div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary-soft text-primary"><UserRound className="size-8"/></div><h1 className="mt-4 text-center font-display text-3xl font-bold">Your SpeakUp profile</h1><p className="mt-2 text-center text-sm text-muted-foreground">Keep a name with this browser profile and make practice feel personal.</p>{profile&&<div className="mt-5 rounded-2xl bg-secondary p-4 text-center"><b>{profile.name}</b><p className="text-sm text-muted-foreground">{profile.email}</p></div>}<form className="mt-5 space-y-3" onSubmit={submit}><label className="block text-sm font-bold">Name<input className="mt-1 w-full rounded-2xl border bg-background px-4 py-3" autoComplete="name" required value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label><label className="block text-sm font-bold">Email<input className="mt-1 w-full rounded-2xl border bg-background px-4 py-3" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><Button type="submit" variant="hero" size="xl" className="w-full">{profile?"Update profile":"Create local profile"}</Button>{saved&&<p className="text-center text-sm font-bold text-success">Profile saved in this browser.</p>}</form><p className="mt-5 text-xs leading-relaxed text-muted-foreground">This is a local profile, not secure account authentication. Progress and profile stay on this device. Cross-device sign-in will need an authentication provider.</p></div></MobileShell>
}
