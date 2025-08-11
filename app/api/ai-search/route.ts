// app/api/ai-search/route.ts
import { NextResponse } from "next/server";

type LangCode = "en" | "it" | "fr" | "de" | "es" | "pt";

type Body = {
  query: string;                 // you still pass a helpful user query; we’ll reinforce structure here
  mode: "international" | "generic" | "condition" | "leaflet" | "pets";
  originCountry: string;
  targetCountry: string;
  selectedDrug: string;
  selectedDosage: string;
  selectedCondition: string;
  conditionDetails: string;
  userNotes: string;
  lang: LangCode;
  debug?: boolean;
};

const TARGET_LANG_NAME: Record<LangCode, string> = {
  en: "English",
  it: "Italian",
  fr: "French",
  de: "German",
  es: "Spanish",
  pt: "Portuguese",
};

function baseRules(targetLang: string) {
  return [
    `You are a precise medical information assistant.`,
    `RULES:`,
    `- Output must be purely informational; do not provide medical advice or diagnosis.`,
    `- Do NOT start with apologies, meta comments, or “Here is…”.`,
    `- If information is missing, proceed and list assumptions at the end under **Assumptions**.`,
    `- Write **everything** in ${targetLang}.`,
    `- Translate all section headings and labels into ${targetLang}.`,
  ].join("\n");
}

function sysInternational(targetLang: string, targetCountry: string) {
  return [
    baseRules(targetLang),
    ``,
    `SECTIONS (use these headings translated to ${targetLang}):`,
    `1) ## Equivalent Medicines in ${targetCountry}`,
    `   For each item, output exactly one compact line in this shape:`,
    `   {index}) **{name}** — {equivalence}% • {localPrice} (≈ {homeConvertedPrice})`,
    `   Example: 1) **Paracetamol** — 100% • £3.50 (≈ €4.06)`,
    ``,
    `2) ## Drug Overview`,
    `   **Naming Variations:** text`,
    `   **Classification:** text`,
    `   **Use Cases:** text`,
    `   **Side Effects:** text`,
    `   **Regulatory Differences:** text`,
    ``,
    `3) ## Summary`,
    `   A concise paragraph (no prefaces like “In summary”).`,
    ``,
    `4) ## Assumptions (if any)`,
    `   - Bullet list of assumptions only if you had to make them.`,
    ``,
    `5) ## Disclaimer`,
    `   One sentence only: "This content is informational only and does not constitute medical advice, diagnosis, or a treatment plan. Always consult a qualified healthcare professional."`,
  ].join("\n");
}

function sysGeneric(targetLang: string, targetCountry: string) {
  return [
    baseRules(targetLang),
    ``,
    `TASK: List the top 10 fully equivalent generic medicines sold in ${targetCountry}.`,
    ``,
    `SECTIONS (use these headings translated to ${targetLang}):`,
    `1) ## Generic Equivalents in ${targetCountry}`,
    `   Output exactly ten items, each on one compact line:`,
    `   {index}) **{name}** — {equivalence}% • {localPrice} (≈ {homeConvertedPrice})`,
    ``,
    `2) ## Notes on Equivalence`,
    `   Short bullets clarifying typical differences (active ingredient vs excipients).`,
    ``,
    `3) ## Availability Caveats`,
    `   Brief bullets about availability variance and market names.`,
    ``,
    `4) ## Assumptions (if any)`,
    `   Bullets only if assumptions were necessary.`,
    ``,
    `5) ## Disclaimer`,
    `   One sentence only: "This content is informational only and does not constitute medical advice, diagnosis, or a treatment plan. Always consult a qualified healthcare professional."`,
  ].join("\n");
}

function sysCondition(targetLang: string) {
  return [
    baseRules(targetLang),
    ``,
    `SECTIONS (use these headings translated to ${targetLang}):`,
    `1) ## Overview`,
    `   Plain-language summary of the condition.`,
    ``,
    `2) ## Common Symptoms`,
    `   Bulleted list; concise.`,
    ``,
    `3) ## Typical Causes`,
    `   Bulleted high-level causes.`,
    ``,
    `4) ## Non-Drug Management`,
    `   Bulleted: hydration, rest, lifestyle, supportive measures (no directives).`,
    ``,
    `5) ## Common Drug Classes Used Globally`,
    `   Bulleted by class with non-specific examples; avoid dosing or local prescribing rules.`,
    ``,
    `6) ## Red Flags (Seek Urgent Care)`,
    `   Bulleted, generic, non-triage-specific.`,
    ``,
    `7) ## Summary`,
    `   Short paragraph; no prefaces.`,
    ``,
    `8) ## Assumptions (if any)`,
    `   Bulleted assumptions only if you had to make them.`,
    ``,
    `9) ## Disclaimer`,
    `   One sentence only: "This content is informational only and does not constitute medical advice, diagnosis, or a treatment plan. Always consult a qualified healthcare professional."`,
  ].join("\n");
}

function sysLeaflet(targetLang: string) {
  return [
    baseRules(targetLang),
    ``,
    `If an official leaflet is not publicly available, summarize from reliable public information.`,
    ``,
    `SECTIONS (use these headings translated to ${targetLang}):`,
    `1) ## What it is and uses`,
    ``,
    `2) ## Before you take it`,
    `   - Do not take (contraindications)`,
    `   - Warnings and precautions`,
    `   - Other medicines & interactions`,
    `   - Pregnancy/breastfeeding/fertility`,
    `   - Driving & machines`,
    `   - Important info about ingredients`,
    ``,
    `3) ## How to take it`,
    `   - General instructions (no dosing advice specific to age/weight)`,
    `   - Missed dose / overdose (generic guidance)`,
    `   - Duration (generic)`,
    ``,
    `4) ## Possible side effects`,
    `   - Frequency categories (very common → very rare)`,
    `   - Signs of serious reactions`,
    ``,
    `5) ## Storage`,
    `   - Conditions, expiry, keep out of reach`,
    ``,
    `6) ## Pack contents`,
    `   - Active/inactive ingredients (if known), description`,
    ``,
    `7) ## Disclaimer`,
    `   One sentence only: "This content is informational only and does not constitute medical advice, diagnosis, or a treatment plan. Always consult a qualified healthcare professional."`,
  ].join("\n");
}

function sysPets(targetLang: string, targetCountry: string) {
  return [
    baseRules(targetLang),
    ``,
    `TASK: Veterinary-only equivalents (no human-only products).`,
    ``,
    `SECTIONS (use these headings translated to ${targetLang}):`,
    `1) ## Veterinary Equivalents in ${targetCountry}`,
    `   List top 5 items, one compact line each:`,
    `   {index}) **{name}** — {equivalence}% • {localPrice} (≈ {homeConvertedPrice})`,
    ``,
    `2) ## Veterinary Notes`,
    `   Species applicability and common cautions; no dosing guidance.`,
    ``,
    `3) ## Assumptions (if any)`,
    `   Bulleted assumptions only if necessary.`,
    ``,
    `4) ## Disclaimer`,
    `   One sentence only: "Informational only; animal use requires evaluation by a licensed veterinarian."`,
  ].join("\n");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const {
      query,
      mode,
      originCountry,
      targetCountry,
      selectedDrug,
      selectedDosage,
      selectedCondition,
      conditionDetails,
      userNotes,
      lang,
      debug,
    } = body;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ result: "Missing OpenAI API key" }, { status: 500 });
    }

    const targetLang = TARGET_LANG_NAME[lang] ?? "English";

    // Pick a system message per mode
    const systemMessage =
      mode === "generic"
        ? sysGeneric(targetLang, targetCountry)
        : mode === "condition"
        ? sysCondition(targetLang)
        : mode === "leaflet"
        ? sysLeaflet(targetLang)
        : mode === "pets"
        ? sysPets(targetLang, targetCountry)
        : sysInternational(targetLang, targetCountry);

    // Context/user message (we include your helpful query too)
    const userMessage = [
      `MODE: ${mode}`,
      `CONTEXT:`,
      `- originCountry: "${originCountry}"`,
      `- targetCountry: "${targetCountry}"`,
      `- selectedDrug: "${selectedDrug}"`,
      `- selectedDosage: "${selectedDosage}"`,
      `- selectedCondition: "${selectedCondition}"`,
      `- conditionDetails: "${conditionDetails}"`,
      `- userNotes: "${userNotes}"`,
      ``,
      `REQUEST (follow the structure and compact line format exactly):`,
      query,
    ].join("\n");

    // OpenAI call
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!openaiResponse.ok) {
      const text = await openaiResponse.text();
      console.error("OpenAI error:", text);
      return NextResponse.json({ result: "Error from OpenAI." }, { status: 502 });
    }

    const json = await openaiResponse.json();
    const result: string =
      json?.choices?.[0]?.message?.content?.trim() || "No result found.";

    return NextResponse.json(
      debug ? { result, _debug: { system: systemMessage, user: userMessage } } : { result }
    );
  } catch (err) {
    console.error("ai-search route error:", err);
    return NextResponse.json({ result: "An unexpected error occurred." }, { status: 500 });
  }
}
