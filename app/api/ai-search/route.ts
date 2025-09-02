import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const body = await req.json();

  // New path for Search by Condition
  if (body?.mode === 'condition' && typeof body?.query === 'string') {
    const prompt = `
Return a **concise, educational overview** for the following condition and context.
- Condition: ${body.selectedCondition || 'n/a'}
- Query: ${body.query}
- Intended country focus: ${body.targetCountry || body.originCountry || 'n/a'}

Write clean Markdown with clear headings (no code fences). Use short paragraphs and bullets.
Include: key symptoms, red flags/seek-care-now guidance, typical first-line and second-line treatments,
non-drug measures, and cautions (pregnancy, age, renal/hepatic impairment, allergies).
Do **not** diagnose; this is informational only.
    `.trim();

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    const content =
      resp.choices?.[0]?.message?.content || 'No guidance available.';
    return NextResponse.json({ result: content });
  }

  // Backward-compatible legacy path (drug equivalence short answer)
  const { drug, dosage, country } = body || {};
  const legacyPrompt = `You are a pharmacist. The user is looking for the international equivalent of a medication.
Original drug: ${drug ?? 'n/a'}, Dosage: ${dosage ?? 'n/a'}.
What is the equivalent medication in ${country ?? 'the target country'}? Provide a short summary.`;

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: legacyPrompt }],
    temperature: 0.2,
  });

  const summary = resp.choices?.[0]?.message?.content || 'No match found.';
  return NextResponse.json({ result: summary });
}
