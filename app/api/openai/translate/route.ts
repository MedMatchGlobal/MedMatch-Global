import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function POST(req: Request) {
  try {
    const { text, targetLang } = await req.json();
    if (!text || !targetLang) {
      return NextResponse.json({ error: "Missing text or targetLang" }, { status: 400 });
    }

    const system = `
You are a professional technical translator. Preserve ALL Markdown and HTML formatting, list markers, bold/italics,
headings, code blocks, and link syntax. Do not alter URLs or text inside parentheses that look like URLs.
Preserve currency amounts, symbols, and percentages unchanged except for translating the words around them.
Translate all visible prose into ${targetLang}. Do NOT add explanations or commentary—return the translated text only.
`.trim();

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.0,
        messages: [
          { role: "system", content: system },
          { role: "user", content: text },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    const data = await res.json();
    const translated = data?.choices?.[0]?.message?.content || text;
    return NextResponse.json({ result: translated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
