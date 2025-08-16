// app/api/chat/route.js
import { NextResponse } from "next/server";

// 動作確認用：GETで /api/chat を叩くと { ok: true } を返す
export async function GET() {
  return NextResponse.json({ ok: true });
}

// 本処理：POSTで { text: "..." } を受け取り、エコーで返す
export async function POST(req) {
  try {
    let payload = {};
    try {
      payload = await req.json(); // JSON じゃない場合は下の catch に飛ぶ
    } catch {
      return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
    }

    const { text } = payload || {};
    if (typeof text !== "string") {
      return NextResponse.json({ error: "Missing 'text'" }, { status: 400 });
    }

    // まずは配線確認のためエコーだけ返す
    return NextResponse.json({ reply: `エコー: ${text}` });
  } catch (err) {
    console.error("[/api/chat] error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
