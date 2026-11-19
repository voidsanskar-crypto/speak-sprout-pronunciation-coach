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

const pronunciationSchema=z.object({
 referenceText:z.string().trim().min(1).max(300),
 audioBase64:z.string().min(1).max(3_000_000),
});
export type PronunciationAssessment={
 pronunciationScore:number|null;accuracyScore:number|null;fluencyScore:number|null;prosodyScore:number|null;completenessScore:number|null;
 words:{word:string;accuracy:number|null;errorType:string|null;phonemes:{phoneme:string;accuracy:number|null;likelySound:string|null}[]}[];
};

export const azurePronunciationAssessment=createServerFn({method:"POST"})
 .inputValidator((data:unknown)=>pronunciationSchema.parse(data))
 .handler(async({data})=>{
   const key=process.env["AZURE_SPEECH_KEY"];const region=process.env["AZURE_SPEECH_REGION"]?.trim();
   if(!key||!region)return {ok:false as const,kind:"unconfigured" as const,error:"Acoustic phoneme scoring is not configured. Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in Vercel."};
   if(!/^[a-z0-9-]+$/i.test(region))return {ok:false as const,kind:"unconfigured" as const,error:"Azure Speech region must be the region name for your Speech resource."};
   try{
    const assessmentConfig={ReferenceText:data.referenceText,GradingSystem:"HundredMark",Granularity:"Phoneme",Dimension:"Comprehensive",EnableMiscue:true,PhonemeAlphabet:"IPA",NBestPhonemeCount:3};
    const assessmentHeader=Buffer.from(JSON.stringify(assessmentConfig),"utf8").toString("base64");
    const response=await fetch(`https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`,{
      method:"POST",headers:{"Ocp-Apim-Subscription-Key":key,"Pronunciation-Assessment":assessmentHeader,"Content-Type":"audio/wav; codecs=audio/pcm; samplerate=16000","Accept":"application/json"},body:Buffer.from(data.audioBase64,"base64"),
    });
    if(!response.ok){const message=await response.text().catch(()=>"");console.error("Azure pronunciation request failed",response.status,message.slice(0,400));return {ok:false as const,kind:"provider" as const,error:response.status===401||response.status===403?"Azure rejected the Speech key or region. Check Vercel environment variables.":`Azure pronunciation assessment failed (${response.status}).`}}
    const payload=await response.json() as {
      RecognitionStatus?:string;
      NBest?:Array<{
        PronunciationAssessment?:Record<string,number>;
        Words?:Array<{
          Word?:string;
          PronunciationAssessment?:{AccuracyScore?:number;ErrorType?:string};
          Phonemes?:Array<{
            Phoneme?:string;
            PronunciationAssessment?:{AccuracyScore?:number;NBestPhonemes?:Array<{Phoneme?:string;Score?:number}>};
          }>;
        }>;
      }>;
    };
    const best=payload.NBest?.[0];const scores=best?.PronunciationAssessment;
    if(!best||!scores)return {ok:false as const,kind:"provider" as const,error:"Azure returned no pronunciation assessment for this recording."};
    const value=(name:string)=>typeof scores[name]==="number"?Math.round(scores[name]!):null;
    return {ok:true as const,assessment:{pronunciationScore:value("PronScore"),accuracyScore:value("AccuracyScore"),fluencyScore:value("FluencyScore"),prosodyScore:value("ProsodyScore"),completenessScore:value("CompletenessScore"),words:(best.Words??[]).map(word=>({word:word.Word??"",accuracy:typeof word.PronunciationAssessment?.AccuracyScore==="number"?Math.round(word.PronunciationAssessment.AccuracyScore):null,errorType:word.PronunciationAssessment?.ErrorType??null,phonemes:(word.Phonemes??[]).map(p=>({phoneme:p.Phoneme??"",accuracy:typeof p.PronunciationAssessment?.AccuracyScore==="number"?Math.round(p.PronunciationAssessment.AccuracyScore):null,likelySound:p.PronunciationAssessment?.NBestPhonemes?.[0]?.Phoneme??null}))}))}};
   }catch(error){console.error("Azure pronunciation assessment error",error);return {ok:false as const,kind:"provider" as const,error:"Could not reach Azure Speech. Check the region and try again."}}
 });
