import { NextResponse } from "next/server";
import OpenAI from "openai";
import { DIARY_PROMPT } from "../../lib/prompt";
export async function POST(req){
  try{
    const body = await req.json().catch(()=>({}));
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const apiKey = process.env.OPENAI_API_KEY;
    if(!apiKey) return NextResponse.json({ diary: "今日のハイライト…", date: new Date().toISOString().slice(0,10) });
    const client = new OpenAI({ apiKey });
    const res = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role:"system", content: DIARY_PROMPT }, { role:"user", content: JSON.stringify(messages) }],
      temperature: 0.4
    });
    const diary = res?.choices?.[0]?.message?.content?.trim() || "";
    return NextResponse.json({ diary, date: new Date().toISOString().slice(0,10) });
  }catch(e){ return NextResponse.json({ error:"Server Error" }, { status:500 }); }
}
