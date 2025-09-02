import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { originCountry, drugName, lang } = await req.json();

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
You are a pharmacist. Using ONLY the origin drug profile below, write a clear **Patient Information Leaflet** for **${drugName}** in **${originCountry}**.

Return **markdown** with these sections (bold headings):
- **What this medicine is and what it is used for:**
- **Before you take/use this medicine:** (include contraindications, precautions, allergies)
- **How to take/use this medicine:** (posology, maximum dose, missed dose)
- **Possible side effects:**
- **Interactions with other medications:**
- **Warnings for special populations:** (children, elderly, pregnancy, breastfeeding, hepatic/renal impairment)
- **Eating, drinking, and lifestyle:** (alcohol, driving, activities)
- **Storage:**
- **Manufacturer and marketing authorisation holder:**
- **Other information/Notes:**

If a section is unknown, write "n/a". Keep language easy to understand and do not invent facts outside the profile.

--- BEGIN ORIGIN PROFILE ---
${originMarkdown}
--- END ORIGIN PROFILE ---
`;

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: 'You write safe, accurate patient leaflets. Never invent facts not provided.' },
        { role: 'user', content: prompt }
      ],
    });

    const leafletMarkdown = completion.choices[0]?.message?.content?.trim() || '';

    return NextResponse.json({ leafletMarkdown });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
