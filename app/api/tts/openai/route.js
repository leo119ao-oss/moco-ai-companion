// app/api/tts/openai/route.js
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req){
  try{
    const { text, voice = "alloy" } = await req.json();
    if(!text) return new NextResponse("Missing text", { status:400 });
    const apiKey = process.env.OPENAI_API_KEY;
    if(!apiKey) return new NextResponse("Missing OPENAI_API_KEY", { status:400 });

    const openai = new OpenAI({ apiKey });
    const r = await openai.audio.speech.create({
      model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
      voice,
      input: text,
      format: "mp3"
    });
    const buf = Buffer.from(await r.arrayBuffer());
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      }
    });
  }catch(e){
    console.error("[/api/tts/openai] error:", e);
    return new NextResponse("Server Error", { status:500 });
  }
}
