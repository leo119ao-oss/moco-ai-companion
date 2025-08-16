import { NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * Health check
 */
export async function GET() {
  return NextResponse.json({ ok: true });
}

/**
 * Chat endpoint
 * Accepts: { text: string }
 * Returns: { reply: string }
 */
export async function POST(req) {
  try {
    const { text } = await req.json().catch(() => ({}));
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing 'text'" }, { status: 400 });
    }

    // If no API key is set, gracefully fall back to echo so it "just works".
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: `（デモ応答）エコー: ${text}` });
    }

    const client = new OpenAI({ apiKey });

    try {
      const res = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: "あなたは優しくフレンドリーなアシスタントです。50文字程度の簡潔な日本語で答えてください。" },
          { role: "user", content: text }
        ],
        temperature: 0.7
      });

      const reply = res?.choices?.[0]?.message?.content || "";
      if (!reply) {
        // If something odd happened, degrade gracefully.
        return NextResponse.json({ reply: `（エコー）${text}` });
      }
      return NextResponse.json({ reply });
    } catch (innerErr) {
      console.error("[/api/chat] openai error:", innerErr);
      // Fall back instead of 500 so the app keeps working.
      return NextResponse.json({ reply: `（一時的なエラーのためエコー）${text}` });
    }
  } catch (err) {
    console.error("[/api/chat] fatal error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
