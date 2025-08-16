// app/api/chat/route.js

// POST: チャットリクエストを受け取る
export async function POST(req) {
  try {
    const { text } = await req.json().catch(() => ({}));
    if (!text) {
      return new Response("Missing text", { status: 400 });
    }

    // とりあえずエコーで返す（OpenAI呼び出しは後で）
    return Response.json({ reply: `エコー: ${text}` });
  } catch (e) {
    console.error(e);
    return new Response("Server Error", { status: 500 });
  }
}

// GET: 動作確認用エンドポイント
export async function GET() {
  return Response.json({ ok: true });
}
