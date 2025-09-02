// FILE: app/api/openai/origin-profile/route.ts
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';


const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


export async function POST(req: Request) {
const { drug: name, originCountry } = await req.json();
if (!name || !originCountry) return NextResponse.json({ error: 'Missing input' }, { status: 400 });


const prompt = `Tell me everything you know about the medicine '${name}' in ${originCountry}.
Include:
- Active ingredients with available strengths, available dosages and available formulations (e.g. 500 mg Paracetamol, tablets, effervescent tablets etc.)
- Drug class (e.g. analgesic, antipyretic)
- Legal classification (Rx/OTC, repeatable or not)
- Therapeutic indications and posology
- Contraindications and precautions (age, conditions, pregnancy, allergy)
- Side effects
- Interactions with any other medications and/or active principles contained in other medications
- Price in ${originCountry}:
- (Use local currency. If exact price is unknown, return a typical retail range or write "n/a". Do not invent data.)
- Manufacturer or brands


Return only factual and known information in english language and try to refer as much as possible to the official website of the National Medicine Agency in ${originCountry}.`;


const system =
'You are a cautious pharmacist. Do not invent facts. For “Price in ${originCountry}:” give a typical consumer retail price or a small range in local currency if the exact figure is unknown. If nothing reasonable is known, write “n/a”. For all other unknown fields, write "Not available". Never include meta disclaimers like "As an AI".';

const completion = await openai.chat.completions.create({
model: 'gpt-4',
messages: [
{ role: 'system', content: system },
{ role: 'user', content: prompt },
],
temperature: 0.2,
});


return NextResponse.json({ result: completion.choices[0].message.content });
}