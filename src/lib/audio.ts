/** Convert a recorded browser clip to mono 16 kHz PCM WAV for Azure Speech. */
export async function recordingUrlToWavBase64(url:string):Promise<string>{
 const blob=await fetch(url).then(r=>{if(!r.ok)throw new Error("Could not read the recording.");return r.blob()});
 const Context=window.AudioContext??(window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext;
 const context=new Context();
 try{
  const decoded=await context.decodeAudioData(await blob.arrayBuffer());
  const targetRate=16000;const targetLength=Math.ceil(decoded.duration*targetRate);const mono=new Float32Array(targetLength);
  for(let i=0;i<targetLength;i++){
   const sourceIndex=i*decoded.sampleRate/targetRate;const left=Math.floor(sourceIndex);const mix=sourceIndex-left;
   let sample=0;for(let channel=0;channel<decoded.numberOfChannels;channel++){const data=decoded.getChannelData(channel);const a=data[Math.min(left,data.length-1)]??0;const b=data[Math.min(left+1,data.length-1)]??a;sample+=(a+(b-a)*mix)/decoded.numberOfChannels}mono[i]=sample;
  }
  const buffer=new ArrayBuffer(44+mono.length*2);const view=new DataView(buffer);const write=(offset:number,text:string)=>{for(let i=0;i<text.length;i++)view.setUint8(offset+i,text.charCodeAt(i))};
  write(0,"RIFF");view.setUint32(4,36+mono.length*2,true);write(8,"WAVE");write(12,"fmt ");view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,targetRate,true);view.setUint32(28,targetRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);write(36,"data");view.setUint32(40,mono.length*2,true);
  for(let i=0;i<mono.length;i++){const sample=Math.max(-1,Math.min(1,mono[i]??0));view.setInt16(44+i*2,sample<0?sample*0x8000:sample*0x7fff,true)}
  let binary="";const bytes=new Uint8Array(buffer);const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));return btoa(binary);
 }finally{await context.close()}
}
