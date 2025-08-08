import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { originCountry, targetCountry, drugName, dosage } = await req.json();

  const prompt = `
A person living in ${originCountry} is looking for the equivalent name of the drug ${drugName} at a dosage of ${dosage} in ${targetCountry}.
Please provide a comprehensive overview of the drug’s typical naming variations, classification, use cases, potential side effects, and any known regulatory differences between the two countries.
Also provide a list of available drug options in ${targetCountry}, including branded and generic drugs with a brief overview of the various prices both in local currency and in the currency of ${originCountry}.
Provide a summary of no more than 200 words that is purely language-based, informative, and publicly available.
Label each section clearly.
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a multilingual medical drug comparison assistant." },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText || 'OpenAI request failed' }, { status: 500 });
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || "No result found.";

    return NextResponse.json({ message });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unexpected error" }, { status: 500 });
  }
}
