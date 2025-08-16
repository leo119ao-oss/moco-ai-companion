// app/api/diary/route.js
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { DIARY_PROMPT } from "../../lib/prompt";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const simple = `# きょうのよかったこと日記\n- たくさん話した：${messages.length}メッセージ\n- 印象に残ったこと：${(messages.at(-1)?.text || "").slice(0, 40)}\n- 自分を労うひとこと：よくがんばったね。`;
      return NextResponse.json({ diary: simple });
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
    const diary = res?.choices?.[0]?.message?.content?.trim() || "（日記を作れなかった…）";
    return NextResponse.json({ diary });
  } catch (e) {
    console.error("[/api/diary] error:", e);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
