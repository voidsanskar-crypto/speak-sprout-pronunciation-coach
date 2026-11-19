import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema=z.object({
 scenario:z.string().trim().min(3).max(300),
 role:z.string().trim().min(2).max(80),
 history:z.array(z.object({role:z.enum(["user","assistant"]),content:z.string().trim().min(1).max(1200)})).max(20),
});

export const groqRoleplay=createServerFn({method:"POST"})
 .inputValidator((data:unknown)=>schema.parse(data))
 .handler(async({data})=>{
   const apiKey=process.env["GROQ_API_KEY"];
   if(!apiKey)return {ok:false as const,error:"AI roleplay is not configured yet. Add GROQ_API_KEY in Vercel project settings and redeploy."};
   try{
    const response=await fetch("https://api.groq.com/openai/v1/chat/completions",{
     method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},
     body:JSON.stringify({model:"openai/gpt-oss-20b",temperature:0.7,max_tokens:350,messages:[
      {role:"system",content:`You are a friendly English speaking roleplay partner. Scenario: ${data.scenario}. You are playing: ${data.role}. Keep each reply natural and concise (one or two sentences), stay in character, and ask one relevant follow-up question. Do not pretend to measure pronunciation from text. Gently model a natural phrase only when useful.`},
      ...data.history,
     ]}),
    });
    if(!response.ok){if(response.status===429)return {ok:false as const,error:"Groq's current free-tier limit was reached. Try again later."};return {ok:false as const,error:`Groq request failed (${response.status}). Check the Vercel key and model access.`}}
    const json=await response.json() as {choices?:{message?:{content?:string}}[]};
    const reply=json.choices?.[0]?.message?.content?.trim();
    return reply?{ok:true as const,reply}:{ok:false as const,error:"The AI returned an empty reply. Please try again."};
   }catch(error){console.error("Groq roleplay request failed",error);return {ok:false as const,error:"Could not reach the conversation coach. Please try again."}}
 });

export const groqReview=createServerFn({method:"POST"})
 .inputValidator((data:unknown)=>schema.parse(data))
 .handler(async({data})=>{
   const apiKey=process.env["GROQ_API_KEY"];
   if(!apiKey)return {ok:false as const,error:"AI feedback is not configured yet."};
   try{
    const response=await fetch("https://api.groq.com/openai/v1/chat/completions",{
     method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},
     body:JSON.stringify({model:"openai/gpt-oss-20b",temperature:0.2,max_tokens:500,messages:[
      {role:"system",content:"You are a supportive English conversation tutor. Review only the supplied text transcript. Return valid JSON with keys: overall (one short paragraph), strengths (array of 2 concise strings), languageTip (one specific grammar or vocabulary correction grounded in the transcript, or say no correction needed), taskProgress (one sentence about the scenario goal). Do not claim to score phoneme accuracy, pronunciation, intonation, accent, or speaking pace because this input contains text only. Be encouraging and concrete."},
      {role:"user",content:`Scenario: ${data.scenario}\nRole: ${data.role}\nConversation transcript:\n${data.history.map(t=>`${t.role}: ${t.content}`).join("\n")}`},
     ]}),
    });
    if(!response.ok)return {ok:false as const,error:response.status===429?"Groq's free-tier limit was reached. Try again later.":`Groq feedback request failed (${response.status}).`};
    const json=await response.json() as {choices?:{message?:{content?:string}}[]};const content=json.choices?.[0]?.message?.content?.trim();
    if(!content)return {ok:false as const,error:"The AI returned no feedback."};
    const parsed=JSON.parse(content) as {overall:string;strengths:string[];languageTip:string;taskProgress:string};
    return {ok:true as const,feedback:{overall:parsed.overall,strengths:parsed.strengths.slice(0,3),languageTip:parsed.languageTip,taskProgress:parsed.taskProgress}};
   }catch(error){console.error("Groq roleplay review failed",error);return {ok:false as const,error:"Could not create feedback from this conversation. Please try again."}}
 });
