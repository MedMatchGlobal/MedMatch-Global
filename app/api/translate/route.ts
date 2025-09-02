// app/api/translate/route.ts
import { NextRequest, NextResponse } from "next/server";

const langName: Record<string, string> = {
  en: "English",
  it: "Italian",
  fr: "French",
  de: "German",
  es: "Spanish",
  pt: "Portuguese",
  nl: "Dutch",
  af: "Afrikaans",
  ru: "Русский",
  pl: "Polski",
  tr: "Türkçe",
  el: "Ελληνικά",
  sv: "Svenska",
  no: "Norsk",
  da: "Dansk",
  fi: "Suomi",
  cs: "Čeština",
  hu: "Magyar",
  ro: "Română",
  he: "עברית",
  ar: "العربية",
  zh: "中文",
  hi:  "हिन्दी",
  ja: "日本語",
  ko: "한국어",
};

export async function POST(req: NextRequest) {
  try {
    const { text, target } = await req.json();
    if (!text || !target) {
      return NextResponse.json({ error: "Missing text/target" }, { status: 400 });
    }

    // Always use absolute origin so it works on localhost & Vercel
    const { origin } = new URL(req.url);

    const targetName = langName[target] ?? target; // map "it" -> "Italian"
    const prompt =
      `Translate the text to ${targetName}.` +
      ` Preserve meaning, tone and formatting (including line breaks and bullets).` +
      ` Return plain text only.\n\n${text}`;

    const resp = await fetch(`${origin}/api/openai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a precise, context-aware translator for health/medical text." },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!resp.ok) {
      const err = await resp.text();
      return NextResponse.json({ error: `Translation route failed: ${err}` }, { status: 500 });
    }

    const data = await resp.json();
    const translated = data?.content ?? data?.message ?? data?.text ?? "";
    return NextResponse.json({ translated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
