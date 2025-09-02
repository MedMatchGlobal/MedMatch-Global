import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { originCountry, drugName, drugDosage, lang } = await req.json();

    if (!originCountry || !drugName) {
      return NextResponse.json({ error: 'originCountry and drugName are required' }, { status: 400 });
    }

    // 1) Fetch trusted origin profile
    const origin = new URL(req.url);
    const base = `${origin.protocol}//${origin.host}`;
    const profileRes = await fetch(`${base}/api/openai/origin-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originCountry, drug: drugName, drugName }),
      cache: 'no-store',
    });

    if (!profileRes.ok) {
      const t = await profileRes.text();
      return NextResponse.json({ error: `origin-profile failed: ${t}` }, { status: 500 });
    }

    const profilePayload = await profileRes.json();
    const originMarkdown =
      typeof profilePayload === 'string'
        ? profilePayload
        : profilePayload.result || profilePayload.response || profilePayload.text || profilePayload.content || '';

    const prompt = `
You are a pharmacology expert.

Using ONLY the following trusted origin drug profile for **${drugName}** in **${originCountry}**, list the **10 closest generic alternatives** available in the same country.

Return **markdown** with a numbered list (1–10). For each generic, include these fields as bold labels:

1. **Name of the Generic**
2. **Manufacturer**
3. **Active Ingredients**
4. **Available Formulations**
5. **Available Dosages**
6. **Legal classification**
7. **Therapeutic indications and posology**
8. **Side effects**
9. **Contraindications and precautions**
10. **Interactions with other medications**
11. **Price in ${originCountry}:**
12. **Notes**

If any field is unknown, write "n/a". Do not repeat the origin profile. Be concise and factual. Always include "**Price in ${originCountry}:**" for every generic item; use local currency. If price is unknown, write "n/a". Do not omit this field.


--- BEGIN ORIGIN PROFILE ---
${originMarkdown}
--- END ORIGIN PROFILE ---
`;

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: 'You are a precise, concise medical assistant. Never invent facts not derivable from the context.' },
        { role: 'user', content: prompt }
      ],
    });

    const genericsMarkdown = completion.choices[0]?.message?.content?.trim() || '';

    return NextResponse.json({ genericsMarkdown });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
