// app/api/track/route.js
import { NextResponse } from "next/server";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  console.log("[track]", JSON.stringify(body));
  return NextResponse.json({ ok: true });
}
