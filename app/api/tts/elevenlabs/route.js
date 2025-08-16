// app/api/tts/elevenlabs/route.js
import { NextResponse } from "next/server";

export async function POST(req){
  try{
    const { text, voiceId = "21m00Tcm4TlvDq8ikWAM" } = await req.json();
    if(!text) return new NextResponse("Missing text", { status:400 });
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if(!apiKey) return new NextResponse("Missing ELEVENLABS_API_KEY", { status:400 });

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method:"POST",
      headers:{
        "xi-api-key": apiKey,
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        text,
        voice_settings: { stability: 0.4, similarity_boost: 0.7, style: 0.35, use_speaker_boost: true }
      })
    });
    if(!res.ok){
      const t = await res.text();
      return new NextResponse(t, { status: res.status });
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return new NextResponse(buf, {
      status:200,
      headers: { "Content-Type":"audio/mpeg", "Cache-Control":"no-store" }
    });
  }catch(e){
    console.error("[/api/tts/elevenlabs] error:", e);
    return new NextResponse("Server Error", { status:500 });
  }
}
