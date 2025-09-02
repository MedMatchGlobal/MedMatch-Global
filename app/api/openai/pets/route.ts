// FILE: app/api/openai/pets/route.ts
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const {
      originRaw = '',
      originCountry = '',
      targetCountry = '',
      drug = '',
      dosage = '',
      lang = 'en',
    } = await req.json();

    if (!drug || !originCountry || !targetCountry) {
      return NextResponse.json({ error: 'Missing input' }, { status: 400 });
    }

    // System & prompt mirror the equivalent-search flow but constrain to licensed veterinary products.
    const system =
      [
        'You are a careful veterinary pharmacology assistant.',
        'Your job is to find **licensed veterinary medicines** in the target country that are therapeutically equivalent',
        'or closest alternatives to the origin human/veterinary product. Prefer same active(s), similar strength/form.',
        'If only human medicines exist, say so clearly and provide vet-appropriate guidance with cautions.',
        'Never invent approvals or brand names. If unsure, say you are unsure.',
        'Output must be concise, factual, and safe. No extra prefaces. Markdown only.',
        'Sort the proposed equivalence on the basis of their similarity level, first the most similar and last the least similar',
      ].join(' ');

    const prompt = `
We are mapping a medicine to **veterinary** equivalents.

CONTEXT — Origin product (human or vet, for anchoring only):
---
${originRaw || '(no origin summary provided)'}
---

TASK


2) Find **licensed veterinary** products **available in ${targetCountry}** that are equivalent or close alternatives.
   - Prefer same **active ingredients** and **dosage/form** where possible.
   - Focus on common companion species (dogs/cats) unless species is obvious from context; otherwise indicate species.
   - If only human products exist in ${targetCountry}, **say so explicitly** and list them with strong cautions
     and species notes; still try to provide **closest licensed veterinary alternatives**.


- After that, add:
  

- Provide a **numbered list** (up to 10) of **licensed veterinary** products in ${targetCountry}.
  For each item, use the following fields (same exact labels so the frontend styling works):
  1. **Name:** <brand or generic vet product name>
     - **Active Ingredients:** <actives + strengths if known>
     - **Formulation/Dosage:** <tablet/ml/etc + strengths>
     - **Legal Classification (Rx/OTC):** <classification in ${targetCountry}>
     - **Manufacturer:** <if known, else "Various">
     - **Estimated Similarity % to original:** <number% or "n/a">
     - **Therapeutic indications and posology:** <brief species-specific use + typical dosing (concise)>
     - **Side effects:** <concise>
     - **Contraindications and precautions:** <concise>
     - **Interactions with other medications:** <concise>
     - **Price in ${targetCountry}:** <if known, else "n/a">
     - **Reimbursability from National Healthcare System:** <Yes/No if applicable, else "n/a">
     - **Notes on any differences:** <important differences vs origin>

RULES
- **Licensed veterinary products come first.** If you must mention human-only products, clearly mark them as such
  and include strong cautions regarding veterinary use (e.g., dosing, toxicity, legality).
- Do not include products that are not reasonably likely to exist in ${targetCountry}.
- Keep output succinct and structured. Avoid speculation. If unknown, write "n/a".
- All headings and labels must be exactly as specified so the UI can style them.

Now produce the Markdown response.
`.trim();

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    });

    const text =
      completion.choices?.[0]?.message?.content?.trim() || 'No result found.';
    return NextResponse.json({ result: text });
  } catch (err: any) {
    console.error('Pets API error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
