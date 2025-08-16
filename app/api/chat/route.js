// app/api/chat/route.js
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "../../lib/prompt";

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const history = Array.isArray(body?.messages) ? body.messages : [];
    const apiKey = process.env.OPENAI_API_KEY;

    // graceful fallback when no key
    if (!apiKey) {
      const last = history.at(-1)?.text ?? "";
      return NextResponse.json({ reply: `（デモ応答）エコー: ${last}` });
    }

    const client = new OpenAI({ apiKey });
    const res = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history.map(m => ({ role: m.role, content: m.text })),
      ],
      temperature: 0.6,
    });

    const reply = res?.choices?.[0]?.message?.content?.trim() || "（うまく返せなかった…）";
    return NextResponse.json({ reply });
  } catch (e) {
    console.error("[/api/chat] error:", e);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
