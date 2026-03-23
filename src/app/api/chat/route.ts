// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";

const GROQ_KEY = process.env.GROQ_API_KEY ?? ""; // ← KHÔNG có NEXT_PUBLIC_

export async function POST(req: NextRequest) {
  if (!GROQ_KEY) {
    return NextResponse.json(
      { error: "Missing GROQ_API_KEY" },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();

    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1000,
          messages: body.messages,
        }),
      },
    );

    if (!groqRes.ok) {
      const err = await groqRes.text();
      return NextResponse.json({ error: err }, { status: groqRes.status });
    }

    const data = await groqRes.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
