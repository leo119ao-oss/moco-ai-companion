// app/api/tts/route.js
import { NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * POST /api/tts
 * body: { text: string, provider?: 'auto'|'elevenlabs'|'openai', voice?: string }
 * - provider 'auto'（既定）：ElevenLabs → 失敗なら OpenAI にフォールバック
 * - 明示的に 'elevenlabs' or 'openai' も可
 * 返却: audio/mpeg
 */
export async function POST(req){
  try{
    const { text, provider = 'auto', voice = 'alloy' } = await req.json();
    if(!text) return new NextResponse("Missing text", { status:400 });

    const tryEleven = async () => {
      const key = process.env.ELEVENLABS_API_KEY;
      if(!key) throw new Error("no-eleven-key");
      const defaultVoiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel (汎用)
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${defaultVoiceId}`, {
        method:"POST",
        headers:{
          "xi-api-key": key,
          "Content-Type":"application/json"
        },
        body: JSON.stringify({
          text,
          voice_settings: { stability: 0.4, similarity_boost: 0.7, style: 0.35, use_speaker_boost: true }
        })
      });
      if(!res.ok){
        const t = await res.text();
        throw new Error(`eleven-failed:${res.status}:${t.slice(0,200)}`);
      }
      const buf = Buffer.from(await res.arrayBuffer());
      return buf;
    };

    const tryOpenAI = async () => {
      const key = process.env.OPENAI_API_KEY;
      if(!key) throw new Error("no-openai-key");
      const openai = new OpenAI({ apiKey: key });
      const r = await openai.audio.speech.create({
        model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
        voice,
        input: text,
        format: "mp3"
      });
      const buf = Buffer.from(await r.arrayBuffer());
      return buf;
    };

    let buf;
    if(provider === 'elevenlabs'){
      buf = await tryEleven();
    } else if (provider === 'openai'){
      buf = await tryOpenAI();
    } else {
      try {
        buf = await tryEleven();
      } catch (e) {
        console.warn("[/api/tts] elevenlabs failed, fallback to OpenAI:", e?.message || e);
        buf = await tryOpenAI();
      }
    }

    return new NextResponse(buf, {
      status: 200,
      headers: { "Content-Type":"audio/mpeg", "Cache-Control":"no-store" }
    });
  }catch(e){
    console.error("[/api/tts] error:", e);
    return new NextResponse("Server Error", { status:500 });
  }
}
