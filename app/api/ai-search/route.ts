// app/api/ai-search/route.ts
import { NextResponse } from "next/server";

type LangCode = "en" | "it" | "fr" | "de" | "es" | "pt";

type Body = {
  query: string;
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

// Country display names (extend as needed)
function countryDisplay(lang: LangCode, name: string): string {
  const map: Record<LangCode, Record<string, string>> = {
    it: {
      Italy: "Italia",
      "United Kingdom": "Regno Unito",
      "United States": "Stati Uniti",
      France: "Francia",
      Germany: "Germania",
      Spain: "Spagna",
      Portugal: "Portogallo",
    },
    fr: {
      Italy: "Italie",
      "United Kingdom": "Royaume-Uni",
      "United States": "États-Unis",
      France: "France",
      Germany: "Allemagne",
      Spain: "Espagne",
      Portugal: "Portugal",
    },
    de: {
      Italy: "Italien",
      "United Kingdom": "Vereinigtes Königreich",
      "United States": "Vereinigte Staaten",
      France: "Frankreich",
      Germany: "Deutschland",
      Spain: "Spanien",
      Portugal: "Portugal",
    },
    es: {
      Italy: "Italia",
      "United Kingdom": "Reino Unido",
      "United States": "Estados Unidos",
      France: "Francia",
      Germany: "Alemania",
      Spain: "España",
      Portugal: "Portugal",
    },
    pt: {
      Italy: "Itália",
      "United Kingdom": "Reino Unido",
      "United States": "Estados Unidos",
      France: "França",
      Germany: "Alemanha",
      Spain: "Espanha",
      Portugal: "Portugal",
    },
    en: {},
  };
  return map[lang]?.[name] ?? name;
}

// Localized strings used inside the model output
function L(lang: LangCode) {
  switch (lang) {
    case "it":
      return {
        hEquivalents: (c: string) => `Medicinali equivalenti in ${countryDisplay("it", c)}`,
        hGenericEquivalents: (c: string) => `Equivalenti generici in ${countryDisplay("it", c)}`,
        hRxStatus: (c: string) => `Stato di prescrizione in ${countryDisplay("it", c)}`,
        hOverview: "Panoramica del farmaco",
        hOriginComp: "Composizione ed eccipienti (Origine)",
        hPerComp: "Composizione ed eccipienti (per equivalente)",
        hWhyNot100: "Perché non al 100% compatibile (per equivalente)",
        hInteract: "Interazioni e avvertenze",
        hSpecial: "Popolazioni speciali e controindicazioni",
        hNotesEquiv: "Note sull’equivalenza",
        hAvail: "Avvertenze sulla disponibilità",
        hVetNotes: "Note veterinarie",
        hSummary: "Sintesi",
        hDisclaimer: "Avvertenza",
        hValidationFailed: "Validazione fallita",
        hCloseMatches: "Possibili corrispondenze",
        lblAI: "Principio/i attivo/i",
        lblForm: "Formulazione",
        lblExc: "Eccipienti",
        lblNaming: "Variazioni di nome",
        lblClass: "Classificazione",
        lblUseCases: "Indicazioni d’uso",
        lblSideEffects: "Effetti indesiderati",
        lblRegs: "Differenze regolatorie",
        wordOTC: "da banco",
        wordRx: "con ricetta",
        phraseNotListed: "Non disponibile pubblicamente.",
        disclaimerText:
          "Questo contenuto è solo informativo e non costituisce consulenza medica, diagnosi o un piano terapeutico. Rivolgiti sempre a un professionista sanitario qualificato.",
      };
    case "fr":
      return {
        hEquivalents: (c: string) => `Médicaments équivalents en ${countryDisplay("fr", c)}`,
        hGenericEquivalents: (c: string) =>
          `Génériques équivalents en ${countryDisplay("fr", c)}`,
        hRxStatus: (c: string) => `Statut de prescription en ${countryDisplay("fr", c)}`,
        hOverview: "Aperçu du médicament",
        hOriginComp: "Composition et excipients (Origine)",
        hPerComp: "Composition et excipients (par équivalent)",
        hWhyNot100: "Pourquoi pas 100 % compatible (par équivalent)",
        hInteract: "Interactions et avertissements",
        hSpecial: "Populations particulières et contre-indications",
        hNotesEquiv: "Notes sur l’équivalence",
        hAvail: "Avertissements sur la disponibilité",
        hVetNotes: "Notes vétérinaires",
        hSummary: "Résumé",
        hDisclaimer: "Avertissement",
        hValidationFailed: "Échec de la validation",
        hCloseMatches: "Correspondances possibles",
        lblAI: "Substance(s) active(s)",
        lblForm: "Formulation",
        lblExc: "Excipients",
        lblNaming: "Variations de dénomination",
        lblClass: "Classification",
        lblUseCases: "Indications",
        lblSideEffects: "Effets indésirables",
        lblRegs: "Différences réglementaires",
        wordOTC: "sans ordonnance",
        wordRx: "sur ordonnance",
        phraseNotListed: "Non publié publiquement.",
        disclaimerText:
          "Ce contenu est informatif et ne constitue pas un avis médical, un diagnostic ou un plan de traitement. Consultez toujours un professionnel de santé qualifié.",
      };
    case "de":
      return {
        hEquivalents: (c: string) => `Gleichwertige Arzneimittel in ${countryDisplay("de", c)}`,
        hGenericEquivalents: (c: string) =>
          `Generische Äquivalente in ${countryDisplay("de", c)}`,
        hRxStatus: (c: string) => `Verschreibungsstatus in ${countryDisplay("de", c)}`,
        hOverview: "Arzneimittelübersicht",
        hOriginComp: "Zusammensetzung & Hilfsstoffe (Herkunft)",
        hPerComp: "Zusammensetzung & Hilfsstoffe (je Äquivalent)",
        hWhyNot100: "Warum nicht 100 % kompatibel (je Äquivalent)",
        hInteract: "Wechselwirkungen & Warnhinweise",
        hSpecial: "Besondere Patientengruppen & Kontraindikationen",
        hNotesEquiv: "Hinweise zur Äquivalenz",
        hAvail: "Hinweise zur Verfügbarkeit",
        hVetNotes: "Veterinärhinweise",
        hSummary: "Zusammenfassung",
        hDisclaimer: "Haftungsausschluss",
        hValidationFailed: "Validierung fehlgeschlagen",
        hCloseMatches: "Nahe Übereinstimmungen",
        lblAI: "Wirkstoff(e)",
        lblForm: "Darreichungsform",
        lblExc: "Hilfsstoffe",
        lblNaming: "Namensvarianten",
        lblClass: "Klassifikation",
        lblUseCases: "Anwendungsgebiete",
        lblSideEffects: "Nebenwirkungen",
        lblRegs: "Regulatorische Unterschiede",
        wordOTC: "rezeptfrei",
        wordRx: "verschreibungspflichtig",
        phraseNotListed: "Nicht öffentlich aufgeführt.",
        disclaimerText:
          "Dieser Inhalt dient nur zu Informationszwecken und stellt keine medizinische Beratung, Diagnose oder Therapie dar. Wenden Sie sich stets an medizinisches Fachpersonal.",
      };
    case "es":
      return {
        hEquivalents: (c: string) => `Medicamentos equivalentes en ${countryDisplay("es", c)}`,
        hGenericEquivalents: (c: string) =>
          `Genéricos equivalentes en ${countryDisplay("es", c)}`,
        hRxStatus: (c: string) => `Estado de prescripción en ${countryDisplay("es", c)}`,
        hOverview: "Información del medicamento",
        hOriginComp: "Composición y excipientes (Origen)",
        hPerComp: "Composición y excipientes (por equivalente)",
        hWhyNot100: "Por qué no es 100 % compatible (por equivalente)",
        hInteract: "Interacciones y advertencias",
        hSpecial: "Poblaciones especiales y contraindicaciones",
        hNotesEquiv: "Notas sobre la equivalencia",
        hAvail: "Advertencias sobre disponibilidad",
        hVetNotes: "Notas veterinarias",
        hSummary: "Resumen",
        hDisclaimer: "Aviso",
        hValidationFailed: "Validación fallida",
        hCloseMatches: "Coincidencias cercanas",
        lblAI: "Ingrediente(s) activo(s)",
        lblForm: "Formulación",
        lblExc: "Excipientes",
        lblNaming: "Variaciones de nombre",
        lblClass: "Clasificación",
        lblUseCases: "Indicaciones",
        lblSideEffects: "Efectos adversos",
        lblRegs: "Diferencias regulatorias",
        wordOTC: "sin receta",
        wordRx: "con receta",
        phraseNotListed: "No publicado públicamente.",
        disclaimerText:
          "Este contenido es informativo y no constituye consejo médico, diagnóstico ni plan de tratamiento. Consulte siempre a un profesional sanitario cualificado.",
      };
    case "pt":
      return {
        hEquivalents: (c: string) => `Medicamentos equivalentes em ${countryDisplay("pt", c)}`,
        hGenericEquivalents: (c: string) =>
          `Genéricos equivalentes em ${countryDisplay("pt", c)}`,
        hRxStatus: (c: string) => `Status de prescrição em ${countryDisplay("pt", c)}`,
        hOverview: "Visão geral do medicamento",
        hOriginComp: "Composição e excipientes (Origem)",
        hPerComp: "Composição e excipientes (por equivalente)",
        hWhyNot100: "Por que não é 100% compatível (por equivalente)",
        hInteract: "Interações e avisos",
        hSpecial: "Populações especiais e contraindicações",
        hNotesEquiv: "Notas sobre equivalência",
        hAvail: "Observações de disponibilidade",
        hVetNotes: "Notas veterinárias",
        hSummary: "Resumo",
        hDisclaimer: "Aviso",
        hValidationFailed: "Falha na validação",
        hCloseMatches: "Correspondências próximas",
        lblAI: "Princípio(s) ativo(s)",
        lblForm: "Formulação",
        lblExc: "Excipientes",
        lblNaming: "Variações de nome",
        lblClass: "Classificação",
        lblUseCases: "Indicações",
        lblSideEffects: "Efeitos adversos",
        lblRegs: "Diferenças regulatórias",
        wordOTC: "sem receita",
        wordRx: "com receita",
        phraseNotListed: "Não divulgado publicamente.",
        disclaimerText:
          "Este conteúdo é informativo e não constitui aconselhamento médico, diagnóstico ou plano terapêutico. Procure sempre um profissional de saúde qualificado.",
      };
    default:
      return {
        hEquivalents: (c: string) => `Equivalent Medicines in ${countryDisplay("en", c)}`,
        hGenericEquivalents: (c: string) => `Generic Equivalents in ${countryDisplay("en", c)}`,
        hRxStatus: (c: string) => `Prescription Status in ${countryDisplay("en", c)}`,
        hOverview: "Drug Overview",
        hOriginComp: "Exact Composition & Excipients (Origin)",
        hPerComp: "Composition & Excipients (per equivalent)",
        hWhyNot100: "Why Not 100% Compatible (per equivalent)",
        hInteract: "Interactions & Warnings",
        hSpecial: "Special Populations & Contraindications",
        hNotesEquiv: "Notes on Equivalence",
        hAvail: "Availability Caveats",
        hVetNotes: "Veterinary Notes",
        hSummary: "Summary",
        hDisclaimer: "Disclaimer",
        hValidationFailed: "Validation Failed",
        hCloseMatches: "Close Matches",
        lblAI: "Active ingredient(s)",
        lblForm: "Formulation",
        lblExc: "Excipients",
        lblNaming: "Naming Variations",
        lblClass: "Classification",
        lblUseCases: "Use Cases",
        lblSideEffects: "Side Effects",
        lblRegs: "Regulatory Differences",
        wordOTC: "OTC",
        wordRx: "Rx",
        phraseNotListed: "Not publicly listed.",
        disclaimerText:
          "This content is informational only and does not constitute medical advice, diagnosis, or a treatment plan. Always consult a qualified healthcare professional.",
      };
  }
}

// Normalize brand names (handles accents/hyphens)
function normalizeDrugNameForPrompt(name: string) {
  return (name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// GLOBAL RULES (permissive validation; exact order; localized prose; combo-brand fidelity)
function baseRules(lang: LangCode) {
  const t = L(lang);
  const targetLang = TARGET_LANG_NAME[lang] ?? "English";
  return [
    `You are a precise medical information assistant. Write everything in ${targetLang}.`,
    `Use EXACTLY these section headings and labels (do not invent new ones):`,
    `"${t.hOverview}", "${t.hOriginComp}", "${t.hPerComp}", "${t.hWhyNot100}", "${t.hInteract}", "${t.hSpecial}", "${t.hSummary}", "${t.hDisclaimer}", "${t.hValidationFailed}", "${t.hCloseMatches}" and "${t.hNotesEquiv}" (if present).`,
    `Use the exact sub-labels: "${t.lblNaming}", "${t.lblClass}", "${t.lblUseCases}", "${t.lblSideEffects}", "${t.lblRegs}", "${t.lblAI}", "${t.lblForm}", "${t.lblExc}".`,

    ``,
    `VALIDATION — PERMISSIVE & ALGORITHMIC:`,
    `- Normalize the input (lowercase, strip diacritics, remove punctuation).`,
    `- If you can plausibly map the name to any real medicine/INN/brand OR you produce any close matches, **proceed** with the best mapping — do NOT output "${t.hValidationFailed}".`,
    `- Only output "${t.hValidationFailed}" when BOTH are true: (a) the string is obvious junk (profanity, random characters, everyday objects), AND (b) you cannot produce any plausible close matches.`,
    `- If "${t.hCloseMatches}" would include the original term verbatim or with minor punctuation/hyphenation differences, treat it as **valid** and proceed.`,
    `Examples:`,
    `  • "co-efferalgan", "co efferalgan", "coefferalgan" → treat as **valid** (combination brand).`,
    `  • "asdfqwe123" or "table" (no close matches) → "${t.hValidationFailed}".`,

    ``,
    `BRAND VARIANT FIDELITY:`,
    `- Do NOT drop tokens that change composition: "co", "plus", "duo", "max", "codeine", "with codeine", "caffeine", "flu", "day", "night", etc.`,
    `- If the entered name implies a combination (e.g., "Co-Efferalgan"), treat it as a combination brand, not the parent mono-ingredient.`,

    ``,
    `FORMAT GUARANTEES (do not break):`,
    `- If not failed, ALWAYS start with Section 1 (equivalents list) and keep all sections in the exact order shown. Do not reorder or skip sections.`,
    `- For the list lines in Section 1, end each item with a tag "[OTC]" or "[Rx]" (tokens only here). If price is unknown, write "n/a" but keep the structure.`,

    ``,
    `COMPOSITION & EXCIPIENTS POLICY:`,
    `- For the origin product, list **all active ingredient(s) WITH STRENGTHS** (e.g., "Paracetamol 500 mg + Codeine phosphate 30 mg").`,
    `- For each equivalent, also list active(s) WITH STRENGTHS when known.`,
    `- If exact excipients/strengths cannot be confirmed, write exactly: "${t.phraseNotListed}" (do not guess).`,

    ``,
    `CONSISTENCY / QA CHECK:`,
    `- If the origin has >1 active, the **Summary** must name them all.`,
    `- If any proposed equivalent lacks one of the actives or includes extras, call this out under "${t.hWhyNot100}".`,

    ``,
    `PRESCRIPTION WORDING:`,
    `- In prose sections (like the "${t.hRxStatus("{country}")}" section), use localized words — "${t.wordOTC}" or "${t.wordRx}" — not the English acronym "OTC".`,
    `- Keep "[OTC]" / "[Rx]" tokens ONLY in the compact list lines from Section 1 (the UI converts them to localized pills).`,

    ``,
    `DISCLAIMER POLICY:`,
    `- End with "${t.hDisclaimer}" containing ONLY: "${t.disclaimerText}"`,

    ``,
    `WARNINGS FORMAT:`,
    `- Red warnings must be wrapped in <span class="warn">…</span> and be ≤30 words.`,
  ].join("\n");
}

// MODE PROMPTS
function sysInternational(lang: LangCode, targetCountry: string, originCountry?: string) {
  const t = L(lang);
  const dTarget = countryDisplay(lang, targetCountry);
  const dOrigin = originCountry ? countryDisplay(lang, originCountry) : "Home Country";
  return [
    baseRules(lang),

    ``,
    `SECTIONS (ONLY IF NOT FAILED):`,
    `1) ## ${t.hEquivalents(dTarget)}`,
    `   Output 5 items, one compact line each:`,
    `   {index}) **{name}** — {equivalence}% • {localPriceOrN/A} (≈ {homeConvertedPriceOrN/A}) • [OTC/Rx]`,

    ``,
    `2) ## ${t.hRxStatus(dOrigin)}`,
    `   State whether the provided reference medicine is ${t.wordOTC} or ${t.wordRx} in ${dOrigin}.`,

    ``,
    `3) ## ${t.hOverview}`,
    `   **${t.lblNaming}:** text`,
    `   **${t.lblClass}:** text`,
    `   **${t.lblUseCases}:** text`,
    `   **${t.lblSideEffects}:** text`,
    `   **${t.lblRegs}:** text`,
    `   **${t.hOriginComp}:**`,
    `   - **${t.lblAI} (with strengths):** …`,
    `   - **${t.lblForm}:** …`,
    `   - **${t.lblExc}:** … (or "${t.phraseNotListed}")`,

    ``,
    `4) ## ${t.hPerComp}`,
    `   For each of the 5 equivalents above (match indices):`,
    `   - {index}) **{name}**`,
    `     • **${t.lblAI} (with strengths):** …`,
    `     • **${t.lblForm}:** …`,
    `     • **${t.lblExc}:** … (or "${t.phraseNotListed}")`,

    ``,
    `5) ## ${t.hWhyNot100}`,
    `   One concise bullet per item with index + name and the concrete reason(s) for <100%.`,

    ``,
    `6) ## ${t.hInteract}`,
    `   For each equivalent, list important interaction risks. Add ≤30-word alerts in <span class="warn">…</span> if needed.`,

    ``,
    `7) ## ${t.hSpecial}`,
    `   For each equivalent, note risks (pregnancy, breastfeeding, pediatrics, geriatrics, hepatic/renal).`,

    ``,
    `8) ## ${t.hSummary}`,
    `   - Begin by restating the origin active(s) with strengths (e.g., "Paracetamol 500 mg + Codeine phosphate 30 mg").`,

    ``,
    `9) ## ${t.hDisclaimer}`,

    ``,
    `IF VALIDATION FAILS, OUTPUT ONLY:`,
    `- ## ${t.hValidationFailed}`,
    `- ## ${t.hCloseMatches} — up to 5 names`,
    `- ## ${t.hDisclaimer}`,
  ].join("\n");
}

function sysGeneric(lang: LangCode, targetCountry: string, _originCountry?: string) {
  const t = L(lang);
  const dTarget = countryDisplay(lang, targetCountry);
  const dOrigin = countryDisplay(lang, targetCountry); // Use target for Rx status in generic flow
  return [
    baseRules(lang),

    ``,
    `SECTIONS (ONLY IF NOT FAILED):`,
    `1) ## ${t.hGenericEquivalents(dTarget)}`,
    `   Exactly 10 items, one line each: {index}) **{name}** — {equivalence}% • {localPriceOrN/A} (≈ {homeConvertedPriceOrN/A}) • [OTC/Rx]`,

    ``,
    `2) ## ${t.hRxStatus(dOrigin)}`,
    `   State whether the provided reference medicine is ${t.wordOTC} or ${t.wordRx} in ${dOrigin}.`,

    ``,
    `3) ## ${t.hNotesEquiv}`,

    ``,
    `4) ## ${t.hPerComp}`,
    `   For each of the 10 items:`,
    `   - {index}) **{name}**`,
    `     • **${t.lblAI} (with strengths):** …`,
    `     • **${t.lblForm}:** …`,
    `     • **${t.lblExc}:** … (or "${t.phraseNotListed}")`,

    ``,
    `5) ## ${t.hWhyNot100}`,
    `6) ## ${t.hInteract}`,
    `7) ## ${t.hSpecial}`,
    `8) ## ${t.hAvail}`,
    `9) ## ${t.hSummary}`,
    `   - Begin by restating the origin active(s) with strengths (e.g., "Paracetamol 500 mg + Codeine phosphate 30 mg").`,
    `10) ## ${t.hDisclaimer}`,

    ``,
    `IF VALIDATION FAILS, OUTPUT ONLY:`,
    `- ## ${t.hValidationFailed}`,
    `- ## ${t.hCloseMatches}`,
    `- ## ${t.hDisclaimer}`,
  ].join("\n");
}

function sysCondition(lang: LangCode) {
  const t = L(lang);
  return [
    baseRules(lang),

    ``,
    `SECTIONS (validation not applied to condition mode):`,
    `1) ## ${t.hOverview}`,
    `2) ## Common Symptoms`,
    `3) ## Typical Causes`,
    `4) ## Non-Drug Management`,
    `5) ## Common Drug Classes Used Globally`,
    `6) ## Red Flags (Seek Urgent Care)`,
    `7) ## ${t.hSummary}`,
    `8) ## ${t.hDisclaimer}`,
  ].join("\n");
}

function sysLeaflet(lang: LangCode) {
  const t = L(lang);
  return [
    baseRules(lang),

    ``,
    `SECTIONS (ONLY IF NOT FAILED):`,
    `1) ## What it is and uses`,
    `2) ## Before you take it`,
    `3) ## How to take it`,
    `4) ## Possible side effects`,
    `5) ## Storage`,
    `6) ## Pack contents`,
    `   - **${t.lblAI} (exact):** …`,
    `   - **${t.lblExc} (exact):** … (or "${t.phraseNotListed}")`,
    `   - **Description of the medicine:** …`,
    `7) ## ${t.hDisclaimer}`,

    ``,
    `IF VALIDATION FAILS, OUTPUT ONLY:`,
    `- ## ${t.hValidationFailed}`,
    `- ## ${t.hCloseMatches}`,
    `- ## ${t.hDisclaimer}`,
  ].join("\n");
}

function sysPets(lang: LangCode, targetCountry: string) {
  const t = L(lang);
  const dTarget = countryDisplay(lang, targetCountry);
  return [
    baseRules(lang),

    ``,
    `SECTIONS (ONLY IF NOT FAILED):`,
    `1) ## ${t.hEquivalents(dTarget)}`,
    `   {index}) **{name}** — {equivalence}% • {localPriceOrN/A} (≈ {homeConvertedPriceOrN/A}) • [OTC/Rx]`,

    ``,
    `2) ## ${t.hVetNotes}`,

    ``,
    `3) ## ${t.hPerComp}`,
    `   - {index}) **{name}**`,
    `     • **${t.lblAI} (with strengths):** …`,
    `     • **${t.lblForm}:** …`,
    `     • **${t.lblExc}:** … (or "${t.phraseNotListed}")`,

    ``,
    `4) ## ${t.hWhyNot100}`,
    `5) ## ${t.hInteract}`,
    `6) ## ${t.hSpecial}`,
    `7) ## ${t.hSummary}`,
    `8) ## ${t.hDisclaimer}`,

    ``,
    `IF VALIDATION FAILS, OUTPUT ONLY:`,
    `- ## ${t.hValidationFailed}`,
    `- ## ${t.hCloseMatches}`,
    `- ## ${t.hDisclaimer}`,
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

    const systemMessage =
      mode === "generic"
        ? sysGeneric(lang, targetCountry, originCountry)
        : mode === "condition"
        ? sysCondition(lang)
        : mode === "leaflet"
        ? sysLeaflet(lang)
        : mode === "pets"
        ? sysPets(lang, targetCountry)
        : sysInternational(lang, targetCountry, originCountry);

    const normalized = normalizeDrugNameForPrompt(selectedDrug);

    // Simple hint to push model toward combination brands when the name suggests it
    const comboHint = /\b(co|codeine|with codeine|plus|duo|max|flu|day|night)\b/i.test(
      (selectedDrug || "").replace(/[-_]/g, " ")
    );

    const userMessage = [
      `MODE: ${mode}`,
      `CONTEXT:`,
      `- originCountry: "${originCountry}"`,
      `- targetCountry: "${targetCountry}"`,
      `- selectedDrug: "${selectedDrug}"`,
      `- selectedDrugNormalized: "${normalized}"`,
      `- selectedDosage: "${selectedDosage}"`,
      `- selectedCondition: "${selectedCondition}"`,
      `- conditionDetails: "${conditionDetails}"`,
      `- userNotes: "${userNotes}"`,
      `- hints: likelyCombinationBrand=${comboHint ? "true" : "false"}`,
      ``,
      `REQUEST (follow the structure exactly; obey the PERMISSIVE VALIDATION, BRAND VARIANT FIDELITY, FORMAT GUARANTEES, COMPOSITION policy, QA CHECK, and DISCLAIMER policy):`,
      query,
    ].join("\n");

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
