// app/api/tts/route.js
import { NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * POST /api/tts
 * body: { text: string, provider?: 'openai'|'elevenlabs'|'auto', voice?: string }
 * voice examples:
 *   openai: 'alloy'|'verse'|'aria'|'sage' など（存在しない値でもAPI側でfallback）
 *   elevenlabs: 'rachel'|'adam'|'bella'|'antoni'（→Voice IDへマップ）
 */
export async function POST(req){
  try{
    const { text, provider = 'openai', voice = 'alloy' } = await req.json();
    if(!text) return new NextResponse("Missing text", { status:400 });

    // ElevenLabs voice id map（よく使われるプリセット）
    const elevenMap = {
      rachel: "21m00Tcm4TlvDq8ikWAM",
      adam: "pNInz6obpgDQGcFmaJgB",
      bella: "EXAVITQu4vr4xnSDxMaL",
      antoni: "ErXwobaYiN019PkySvjV",
      ellie: "MF3mGyEYCl7XYWbV9V6O"
    };
    const elevenVoiceId = elevenMap[(voice||"").toLowerCase()] || elevenMap["rachel"];

    const tryEleven = async () => {
      const key = process.env.ELEVENLABS_API_KEY;
      if(!key) throw new Error("no-eleven-key");
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenVoiceId}`, {
        method:"POST",
        headers:{ "xi-api-key": key, "Content-Type":"application/json" },
        body: JSON.stringify({
          text,
          voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true }
        })
      });
      if(!res.ok){ const t = await res.text(); throw new Error(`eleven-failed:${res.status}:${t.slice(0,160)}`); }
      return Buffer.from(await res.arrayBuffer());
    };

    const tryOpenAI = async () => {
      const key = process.env.OPENAI_API_KEY;
      if(!key) throw new Error("no-openai-key");
      const openai = new OpenAI({ apiKey: key });
      const r = await openai.audio.speech.create({
        model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
        voice: voice || "alloy",
        input: text,
        format: "mp3"
      });
      return Buffer.from(await r.arrayBuffer());
    };

    let buf;
    if(provider === 'elevenlabs'){
      buf = await tryEleven();
    } else if (provider === 'openai'){
      buf = await tryOpenAI();
    } else { // auto
      try { buf = await tryEleven(); } catch { buf = await tryOpenAI(); }
    }

    return new NextResponse(buf, { status:200, headers:{ "Content-Type":"audio/mpeg", "Cache-Control":"no-store" }});
  }catch(e){
    console.error("[/api/tts] error:", e);
    return new NextResponse("Server Error", { status:500 });
  }
}
