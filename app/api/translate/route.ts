import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest){
  try{
    const {text, target} = await req.json();
    if(!text || !target) return NextResponse.json({error:"Missing text/target"}, {status:400});

    // Send to your existing /api/openai so no key is exposed client-side
    const prompt = `Translate to ${target}. Preserve meaning, tone and formatting. Return plain text only.\n\n${text}`;
    const resp = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/openai`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a precise, context-aware translator for health/medical text." },
          { role: "user", content: prompt }
        ]
      })
    });
    if(!resp.ok){ return NextResponse.json({error:`OpenAI route failed`}, {status:500}); }
    const data = await resp.json();
    const translated = data?.content ?? data?.message ?? data?.text ?? "";
    return NextResponse.json({translated});
  }catch(e:any){
    return NextResponse.json({error: e?.message ?? "Unknown error"}, {status:500});
  }
}
