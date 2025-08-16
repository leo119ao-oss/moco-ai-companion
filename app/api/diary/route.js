// app/api/diary/route.js
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { DIARY_PROMPT } from "../../lib/prompt";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const date = body?.date || new Date().toISOString().slice(0,10);
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const text = `今日の出来事：${(messages.at(-1)?.text || "").slice(0, 30)}\n自分をねぎらう：よくやったね。`;
      return NextResponse.json({ date, diary: text }, { headers:{ "Cache-Control":"no-store" } });
    }
    const client = new OpenAI({ apiKey });
    const res = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: DIARY_PROMPT },
        { role: "user", content: JSON.stringify(messages) }
      ],
      temperature: 0.5
    });
    const diary = res?.choices?.[0]?.message?.content?.trim() || "";
    return NextResponse.json({ date, diary }, { headers:{ "Cache-Control":"no-store" } });
  } catch (e) {
    return NextResponse.json({ error: "Server Error" }, { status: 500, headers:{ "Cache-Control":"no-store" } });
  }
}
