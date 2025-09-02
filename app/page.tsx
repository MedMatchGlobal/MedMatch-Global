'use client';

import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useEffect, useMemo, useState } from 'react';

import { LanguageProvider, useLanguage } from './LanguageProvider';
import LanguageButton from './components/LanguageButton';
import SymptomTriage from './components/SymptomTriage';

// ✅ grouped countries by region (Europe, Africa, etc.)
import countriesByRegion from '../data/countries';

type Mode = 'international' | 'condition' | 'generic' | 'triage' | 'leaflet' | 'pets';

const SHOW_ORIGIN_SUMMARY = true;

export default function PageWrapper() {
  return (
    <LanguageProvider>
      <Home />
    </LanguageProvider>
  );
}

function Home() {
  const { lang } = useLanguage();
  const [mounted, setMounted] = useState(false); // prevent hydration mismatch
  useEffect(() => setMounted(true), []);

  const UI = {
    en: {
      btnIntl: 'International Medicine Search',
      btnCond: 'Search by Condition',
      btnGen: 'Search Generic',
      btnTriage: 'Symptoms Triage',
      btnLeaflet: 'Medicine Leaflet',
      btnPets: 'Meds 4 Pets',
      phHome: 'Please select your Home Country',
      phMed: 'Please select/enter medicine name',
      phDose: 'Enter dosage (optional)',
      phTarget: 'Please select the Country to search',
      searchIntl: 'Search International Equivalents',
      searchCond: 'View Informational Guidance',
      searchGen: 'Find Generics',
      searchLeaflet: 'Fetch Medicine Leaflet',
      searchPets: 'Search Pet Medicines',
      noList: (c: string) =>
        `⚠️ No full drug list available for ${c || 'this country'}. Please enter the drug name manually.`,
    },
  } as const;
  const ui = UI.en;

  // ---------------- state ----------------
  const [ukDrugs, setUkDrugs] = useState<string[]>([]);
  const [usDrugs, setUsDrugs] = useState<string[]>([]);

  // NOTE: these now hold **country names** (e.g., "United Kingdom"), not ISO codes
  const [originCode, setOriginCode] = useState('');
  const [targetCode, setTargetCode] = useState('');
  const [selectedDrug, setSelectedDrug] = useState('');
  const [selectedDosage, setSelectedDosage] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [conditionDetails, setConditionDetails] = useState('');
  const [userNotes, setUserNotes] = useState('');

  const [mode, setMode] = useState<Mode>('international');

  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [visits, setVisits] = useState<number | null>(null);
  const [showNoticeOrigin, setShowNoticeOrigin] = useState(false);

  // database-backed countries (by name)
  const DB_COUNTRY_NAMES = ['United Kingdom', 'United States'];

  // ---------------- fetch dropdowns ----------------
  useEffect(() => {
    fetch('/api/drugs/uk')
      .then((r) => r.json())
      .then((d) => setUkDrugs(Array.isArray(d) ? d.map((x: any) => x.name ?? x) : []))
      .catch(() => setUkDrugs([]));
    fetch('/api/drugs/us')
      .then((r) => r.json())
      .then((d) => setUsDrugs(Array.isArray(d) ? d.map((x: any) => x.name ?? x) : []))
      .catch(() => setUsDrugs([]));
  }, []);

  useEffect(() => {
    setShowNoticeOrigin(!!originCode && !DB_COUNTRY_NAMES.includes(originCode));
  }, [originCode]);

  useEffect(() => {
    fetch('https://counterapi.dev/api/hit/medicea.vercel.app/visits')
      .then((res) => res.json())
      .then((d) => setVisits(d.value))
      .catch(() => setVisits(null));
  }, []);

  // ---------------- helpers ----------------
  // map country NAME → short code only for drug list usage
  function nameToShort(codeOrName: string) {
    if (!codeOrName) return '';
    const s = codeOrName.trim().toLowerCase();
    if (s === 'united kingdom' || s === 'uk' || s === 'great britain') return 'GB';
    if (s === 'united states' || s === 'usa' || s === 'us' || s === 'united states of america') return 'US';
    return ''; // other countries have no local drug list
  }

  const getDrugsFor = (countryName: string) => {
    const short = nameToShort(countryName);
    return short === 'GB' ? ukDrugs : short === 'US' ? usDrugs : [];
  };

  // robust reader for different API payload shapes
  function pickMarkdown(x: any): string {
    if (!x) return '';
    if (typeof x === 'string') return x;
    if (typeof x.result === 'string') return x.result;
    if (typeof x.response === 'string') return x.response;
    if (typeof x.text === 'string') return x.text;
    if (typeof x.content === 'string') return x.content;
    const chat =
      x?.choices?.[0]?.message?.content ??
      x?.data?.choices?.[0]?.message?.content ??
      x?.choices?.[0]?.text;
    if (typeof chat === 'string') return chat;
    return '';
  }

  // --- Clean up model markdown that sometimes comes wrapped in code fences or quoted labels
  function stripCodeFences(md: string) {
    // remove leading/trailing ``` blocks
    return md
      .replace(/^```(?:\w+)?\s*\n?/g, '')
      .replace(/\n?```$/g, '')
      .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, '')); // inline safety
  }

  function tidyQuotedBoldLabels(md: string) {
    let out = md;

    // Case A: "**Label**": value  -->  **Label:** value
    out = out.replace(/["“”](\*\*[^*]+?\*\*)["”]\s*:/g, '$1:');

    // Case B: "**Label:**" value  -->  **Label:** value  (strip quotes even if colon is inside bold)
    out = out.replace(/["“”]\s*(\*\*[^*]+?\*\*:)\s*["“”]/g, '$1');

    // Normalize spacing: ** Label ** :  -->  **Label:**
    out = out.replace(/\*\*\s*([^*]+?)\s*\*\*\s*:\s*/g, '**$1:** ');

    // ✅ NEW: normalize italic/quoted labels like "*Produttore:*" → "**Produttore:**"
    out = out.replace(/["“”]\s*\*([^*]+?)\*\s*["“”]\s*:\s*/g, '**$1:** ');
    out = out.replace(/(^|\n)\s*\*([^*]+?)\*\s*:\s*/g, '$1**$2:** ');

    return out;
  }

  // NOTE: removed setGenericNameAsItemTitle() to avoid changing the visual layout of your Generics list

  // ensure each expected field begins with a bullet, so labels never glue together
  function enforceFieldBullets(md: string) {
    if (!md) return md;
    // Labels we expect as separate bullet lines (case-insensitive, with/without bold)
    const labels = [
      'Name of the Generic',
      'Manufacturer',
      'Active Ingredients',
      'Available Formulations',
      'Available Dosages',
      'Legal classification',
      'Legal Classification \\(Rx/OTC\\)',
      'Formulation/Dosage',
      'Estimated Similarity % to original',
      'Therapeutic indications and posology',
      'Side effects',
      'Contraindications and precautions',
      'Interactions with other medications',
      'Price in [^:]+', // "Price in Italy", "Price in United Kingdom", …
      'Reimbursability from National Healthcare System',
      'Notes',
    ];

    let out = md;
    for (const L of labels) {
      const re = new RegExp(
        // start of line; ensure the line does NOT already start with a bullet/number
        String.raw`(^|\n)(\s*)(?![-*]|\d+\.)\s*(\*\*)?\s*(${L})\s*(\*\*)?\s*:\s*`,
        'gi'
      );
      out = out.replace(re, (_m, pre, indent, bOpen, label, bClose) =>
        `${pre}${indent}- ${bOpen || ''}${label}${bClose || ''}: `
      );
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // Preserve critical tokens (links, %, currency) AND our <warn> tags during translation
  function protectContent(md: string) {
    const map: string[] = [];
    const PH = (i: number) => `⟦P${i}⟧`;

    const WARN_OPEN = '⟦WARN_OPEN⟧';
    const WARN_CLOSE = '⟦WARN_CLOSE⟧';

    let text = md.replace(/<warn>/gi, WARN_OPEN).replace(/<\/warn>/gi, WARN_CLOSE);

    const patterns = [
      /\bhttps?:\/\/[^\s)]+/gi,
      /[$€£]\s?\d{1,7}(?:[.,]\d{2})?/g,
      /\b\d{1,3}\s?%\b/g,
      /\(≈\s*[€£$]?\s?\d[^\)]*\)/g,
    ];
    patterns.forEach((re) => {
      text = text.replace(re, (m) => {
        const id = map.push(m) - 1;
        return PH(id);
      });
    });

    return {
      text,
      restore(s: string) {
        let out = s;
        map.forEach((orig, i) => {
          out = out.replace(new RegExp(PH(i), 'g'), orig);
        });
        out = out.replace(new RegExp(WARN_OPEN, 'g'), '<warn>');
        out = out.replace(new RegExp(WARN_CLOSE, 'g'), '</warn>');
        return out;
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Mark warnings (Origin, Generics, Leaflets) BEFORE translation
  // More permissive — supports bold/non-bold labels and bullets/numbering.
  function markWarnSectionsInMarkdown(md: string) {
    function wrapBodyFor(label: string, s: string) {
      const re = new RegExp(
        String.raw`(^|\n)` +
          String.raw`(\s*(?:[-*]|\d+\.)?\s*)` +
          String.raw`(\*\*\s*)?` +
          String.raw`(${label})` +
          String.raw`(\s*\*\*)?` +
          String.raw`\s*:\s*` +
          String.raw`(.+)`,
        'gi'
      );
      return s.replace(
        re,
        (_m, pre, bullet, bOpen, lab, bClose, body) =>
          `${pre}${bullet}${bOpen || ''}${lab}${bClose || ''}: <warn>${(body || '').trim()}</warn>`
      );
    }

    const labels = [
      'Side\\s*effects',
      'Contraindications\\s*and\\s*precautions',
      'Interactions\\s*with\\s*other\\s*medications?',
      'Possible\\s*side\\s*effects',
      'Warnings\\s*for\\s*special\\s*populations(?:\\s*\\(.*?\\))?',
    ];

    let out = md || '';
    for (const L of labels) out = wrapBodyFor(L, out);
    return out;
  }

  // Apply cleanup for generics block (without renaming item titles)
  function tidyGenericsMarkdown(md: string) {
    let out = md || '';
    out = stripCodeFences(out);
    out = tidyQuotedBoldLabels(out);
    out = enforceFieldBullets(out);
    out = markWarnSectionsInMarkdown(out);
    return out.trim();
  }

  // Apply same cleanup for Pets/International equivalents
  function tidyEquivalentsMarkdown(md: string) {
    let out = md || '';
    out = stripCodeFences(out);
    out = tidyQuotedBoldLabels(out);
    out = enforceFieldBullets(out);
    out = markWarnSectionsInMarkdown(out);
    return out.trim();
  }

  // ---- FIX: remove duplicate leaflet headings (robust, line-by-line, multi-language) ----
  function removeDuplicateLeafletHeadings(md: string) {
    if (!md) return md;

    // Common "Patient Information Leaflet" phrases in several languages.
    const phrases = [
      'Patient Information Leaflet',                // EN
      'Foglio Informativo per il Paziente',        // IT
      'Prospecto para el paciente',                // ES
      'Folleto de Información para el Paciente',   // ES alt
      "Notice d'information pour le patient",      // FR
      'Notice pour le patient',                    // FR short
      'Beipackzettel für den Patienten',           // DE
      'Gebrauchsinformation für den Patienten',    // DE alt
      'Folheto Informativo para o Doente',         // PT
      'Folheto Informativo para o Paciente',       // PT alt
    ];

    const isGenericHeading = (s: string) => {
      const t = s.replace(/^[#>\-\*\s]+/, '').replace(/\*\*/g, '').trim().toLowerCase();
      return phrases.some(p => t === p.toLowerCase());
    };

    const isSpecificVariant = (s: string) => {
      const t = s.replace(/^[#>\-\*\s]+/, '').replace(/\*\*/g, '').trim().toLowerCase();
      // phrase followed by a preposition and extra text (e.g., "… per il Paziente di Co-Efferalgan")
      return phrases.some(p => {
        const base = p.toLowerCase();
        if (!t.startsWith(base)) return false;
        const rest = t.slice(base.length).trim();
        return !!rest && /\b(for|per|pour|para|für|di|de|do|da)\b/.test(rest);
      });
    };

    const lines = md.split(/\r?\n/);
    const cleaned: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // If current line is a generic PIL heading and within the next 1–3 non-empty lines
      // we see a specific variant, drop the generic one.
      if (isGenericHeading(line)) {
        // look ahead up to 3 non-empty lines
        let foundSpecific = false;
        let look = 0, j = i + 1;
        while (j < lines.length && look < 5) {
          const candidate = lines[j].trim();
          if (candidate !== '') {
            if (isSpecificVariant(candidate)) {
              foundSpecific = true;
              break;
            }
          }
          look++;
          j++;
        }
        if (foundSpecific) continue; // skip adding this generic line
      }
      cleaned.push(line);
    }
    return cleaned.join('\n');
  }

  // General cleanup for leaflet too (no name-title transform needed)
  function tidyLeafletMarkdown(md: string) {
    let out = md || '';
    out = stripCodeFences(out);
    out = tidyQuotedBoldLabels(out);
    out = removeDuplicateLeafletHeadings(out);
    out = markWarnSectionsInMarkdown(out);
    return out.trim();
  }

  // remove boilerplate like “As an AI…”
  function stripMetaLines(md: string) {
    let out = md.replace(
      /^(?:\s*(?:as an ai[, ]|as an ai i|i (?:am|’m) an ai|i do(?: not|n't) have (?:real[-\s]?time|live) data|i cannot (?:access|provide)|i can't (?:access|provide)).*)$/gim,
      ''
    );
    out = out.replace(/\n{3,}/g, '\n\n').trim();
    return out;
  }

  // ---------- client-side structuring (no prompting, no new facts) ----------
  function structureOriginRaw(raw: string, originCountry: string, drugName: string) {
    const text = (' ' + raw.replace(/\s+/g, ' ').trim() + ' ');

    const getAfter = (re: RegExp, maxLen = 260) => {
      const m = text.match(re);
      if (!m) return '';
      const start = (m.index ?? 0) + m[0].length;
      const rest = text.slice(start);
      const s = rest.match(/.*?[.;](\s|$)/);
      return ((s ? s[0] : rest).trim()).slice(0, maxLen);
    };
    const sentenceOf = (re: RegExp) => {
      const m = text.match(re);
      if (!m) return '';
      const start = (m.index ?? 0);
      const rest = text.slice(start);
      const s = rest.match(/.*?(?:[.!?](?:\s|$)|\n|$)/);
      return (s ? s[0] : rest).trim();
    };

    const fromLabel = (label: string) => {
      const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(
        String.raw`^[\t >]*[-*•]?\s*(?:\*\*)?\s*${esc(label)}\s*(?:\*\*)?\s*:\s*(.+)$`,
        'im'
      );
      const m = raw.match(re);
      return (m?.[1] || '').trim();
    };

    const escDrug = drugName ? drugName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';

    const manufacturer =
      fromLabel('Manufacturer') ||
      getAfter(/\b(?:manufacturer|marketed by|produced by|made by|brand(?:s)?(?: include)?)[\s:]+/i);

    let active =
      fromLabel('Active Ingredients') ||
      getAfter(new RegExp(String.raw`(?:active ingredient[s]?\s*(?:are|:)\s*|${escDrug}\s+(?:contains|is (?:a )?combination of|combines|is composed of)\s*)`, 'i'));

    if (!active) {
      const comp = text.match(
        /\b(?:paracetamol|acetaminophen)\b[^.]{0,80}?\b(\d{2,4})\s*mg\b[^.]{0,120}?\b(codeine(?: phosphate)?)\b[^.]{0,80}?\b(\d{1,3})\s*mg\b/i
      );
      const compRev = text.match(
        /\b(codeine(?: phosphate)?)\b[^.]{0,80}?\b(\d{1,3})\s*mg\b[^.]{0,120}?\b(?:paracetamol|acetaminophen)\b[^.]{0,80}?\b(\d{2,4})\s*mg\b/i
      );
      if (comp) active = `Paracetamol ${comp[1]} mg, ${comp[2]} ${comp[3]} mg`;
      else if (compRev) active = `${compRev[1]} ${compRev[2]} mg, Paracetamol ${compRev[3]} mg`;
      else {
        const found: string[] = [];
        if (/\bparacetamol|acetaminophen\b/i.test(text)) found.push('Paracetamol');
        if (/\bcodeine\b/i.test(text)) found.push('Codeine');
        active = found.join(', ');
      }
    }

    const forms =
      fromLabel('Available Formulations') ||
      getAfter(/\b(?:available|comes|formulations?|forms?)\s*(?:as|in)\s*/i);

    const strengths =
      fromLabel('Available Strengths') ||
      getAfter(/\b(?:available\s+)?strengths?\s*(?:are|:)?\s*/i);

    let legal =
      fromLabel('Legal classification') ||
      sentenceOf(/\b(?:prescription[- ]only|rx\b|over[- ]the[- ]counter|otc|non[- ]prescription|repeatable|non[- ]repeatable)\b/i);

    const mentionsCodeine = /\bcodeine\b/i.test(text);
    if ((!legal || /otc/i.test(legal)) && mentionsCodeine && originCountry === 'Italy') {
      legal = 'Rx';
    }

    const posology =
      fromLabel('Therapeutic indications and posology') ||
      (sentenceOf(/\b(?:indicated for|used for|indication[s]?:|posology|dosage|usual dose|recommended dose)\b/i) +
        ' ' +
        sentenceOf(/\b(?:every\s+\d+\s*(?:to|-)\s*\d+\s*hours|not exceeding|not to exceed|up to\s+\d+\s+tablets)\b/i)).trim();

    const side =
      fromLabel('Side effects') ||
      sentenceOf(/\b(?:side effects?|adverse (?:effects|reactions))[: ]/i) ||
      sentenceOf(/\b(?:nausea|vomiting|dizziness|drowsiness|constipation|rash|itching)\b/i);

    const contra =
      fromLabel('Contraindications and precautions') ||
      sentenceOf(/\b(?:contraindicat(?:ed|ions?)|should not be used|not recommended|avoid in|do not use|pregnancy|breastfeed|hepatic|renal|liver disease)\b/i);

    const interact =
      fromLabel('Interactions with other medications') ||
      sentenceOf(/\b(?:interact(?:ion)?s?\s+with|concomitant use|combined with)\b.*\b(?:antidepressants?|sedatives?|alcohol|opioids?|MAO|anticoagulants?)\b/i);

    const pricing =
      fromLabel(`Price in ${originCountry}`) ||
      fromLabel('Price') ||
      sentenceOf(/\b(?:price|pricing|reimburs(?:e|ability)|cost)\b/i);
    const pricingCleaned = (pricing || '').replace(/^pricing and reimbursability[:\-]?\s*/i, '');

    const notes = fromLabel('Notes');

    const mdLines = [
      `- **Manufacturer:** ${manufacturer || 'n/a'}`,
      `- **Active Ingredients:** ${active || 'n/a'}`,
      `- **Available Formulations:** ${forms || 'n/a'}`,
      `- **Available Dosages:** ${strengths || 'n/a'}`,
      `- **Legal classification:** ${legal || 'n/a'}`,
      `- **Therapeutic indications and posology:** ${posology || 'n/a'}`,
      `- **Side effects:** ${side ? `<warn>${side}</warn>` : 'n/a'}`,
      `- **Contraindications and precautions:** ${contra ? `<warn>${contra}</warn>` : 'n/a'}`,
      `- **Interactions with other medications:** ${interact ? `<warn>${interact}</warn>` : 'n/a'}`,
      `- **Price in ${originCountry}:** ${pricingCleaned || 'n/a'}`,
      `- **Notes:** ${notes || 'n/a'}`,
    ];
    return mdLines.join('\n');
  }

  // agencies for links
  const AGENCIES: Record<string, { name: string; url: string }> = {
    Italy: { name: 'AIFA (Italian Medicines Agency)', url: 'https://www.aifa.gov.it/' },
    'United Kingdom': {
      name: 'MHRA (UK Medicines Regulator)',
      url: 'https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency',
    },
    'United States': { name: 'FDA (Food & Drug Administration)', url: 'https://www.fda.gov/' },
    France: { name: 'ANSM (France Medicines Agency)', url: 'https://ansm.sante.fr/' },
    Germany: { name: 'BfArM (Germany Medicines Agency)', url: 'https://www.bfarm.de/' },
    Spain: { name: 'AEMPS (Spain Medicines Agency)', url: 'https://www.aemps.gob.es/' },
    Portugal: { name: 'INFARMED (Portugal Medicines Agency)', url: 'https://www.infarmed.pt/' },
    Ireland: { name: 'HPRA (Ireland Medicines Regulator)', url: 'https://www.hpra.ie/' },
    Netherlands: { name: 'CBG-MEB (Netherlands Medicines Evaluation Board)', url: 'https://www.cbg-meb.nl/' },
    Switzerland: { name: 'Swissmedic', url: 'https://www.swissmedic.ch/' },
  };
  const agencyLink = (country?: string) => {
    if (!country) return null;
    const a = AGENCIES[country];
    return a ? `[${a.name}](${a.url})` : null;
  };

  // --------- de-bold metrics inside strong ----------
  function normalizeMetrics(html: string) {
    const fix = (s: string) =>
      s
        .replace(/<strong>(\s*\d{1,3}%\s*)<\/strong>/gi, '$1')
        .replace(/<strong>(\s*n\/a(?:\s*\(≈\s*n\/a\))?\s*)<\/strong>/gi, '$1')
        .replace(/<strong>(\s*[€£$][^<)]*)<\/strong>/gi, '$1')
        .replace(/<strong>(\s*\([^<)]*\)\s*)<\/strong>/gi, '$1')
        .replace(/<strong>(\s*\[[^<\]]+\]\s*)<\/strong>/gi, '$1');
    return html.replace(/<li>[\s\S]*?<\/li>/gi, (m) => fix(m));
  }

  // small black summary under origin title
  function escRe(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function captureLabeled(text: string, label: string) {
    const re = new RegExp(`^\\s*-\\s*\\*\\*${escRe(label)}:\\*\\*\\s*([^\\n]+)`, 'im');
    const m = text.match(re);
    return m?.[1]?.trim() || 'n/a';
  }
  function makeOriginSummary(drugName: string, originCountry: string, block: string) {
    const active = captureLabeled(block, 'Active Ingredients');
    const formulation = captureLabeled(block, 'Available Formulations');
    const legal = captureLabeled(block, 'Legal classification');
    const posology = captureLabeled(block, 'Therapeutic indications and posology');
    const bits: string[] = [];
    if (active !== 'n/a') bits.push(`${drugName} contains ${active}`);
    if (formulation !== 'n/a') bits.push(`available as ${formulation.toLowerCase()}`);
    if (legal !== 'n/a') bits.push(`classified as ${legal}`);
    if (posology !== 'n/a') {
      const firstSentence = posology.split(/(?<=\.)\s/)[0];
      if (firstSentence) bits.push(firstSentence.trim());
    }
    const sentence = bits.join('. ') + (bits.length ? '.' : '');
    return sentence ? `<p class="summary">${sentence}</p>` : '';
  }

  // Disable button under specific rules
  const disableSearch =
    loading ||
    (mode === 'international' && !(originCode && selectedDrug && targetCode)) ||
    (mode === 'generic' && !(originCode && selectedDrug)) ||
    (mode === 'leaflet' && !(originCode && selectedDrug)) ||
    (mode === 'condition' && !(selectedCondition && targetCode)) ||
    (mode === 'pets' && !(originCode && selectedDrug && targetCode)) ||
    (mode === 'triage');

  function resetFieldsForMode(m: Mode) {
    setMode(m);
    setResult('');
    setSelectedDrug('');
    setSelectedDosage('');
    setSelectedCondition('');
    setConditionDetails('');
    setUserNotes('');
  }

  // ---------------- search flow ----------------
  const handleSearch = async () => {
    if (mode === 'triage') return;

    setLoading(true);
    setResult('Searching… this may take a few moments…');

    const originCountry = originCode || '';
    const targetCountry = targetCode || '';

    try {
      if (mode === 'condition') {
        const res = await fetch('/api/ai-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query:
              `Educational overview for condition: '${selectedCondition}'. Context: '${conditionDetails}'. ` +
              `Allergies/pathologies: '${userNotes}'. Country focus: ${targetCountry || originCountry}. ` +
              `No diagnosis. Use headings/bullets.`,
            mode,
            originCountry,
            targetCountry,
            selectedDrug,
            selectedDosage,
            lang,
          }),
        });
        const md = pickMarkdown(await res.json());
        setResult(md || 'No result found.');
        setLoading(false);
        return;
      } else if (mode === 'generic') {
        // 1. Fetch origin profile
        const originRes = await fetch('/api/openai/origin-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            drug: selectedDrug,
            drugName: selectedDrug,
            originCountry,
          }),
        });

        if (!originRes.ok) throw new Error((await originRes.text()) || 'Origin profile failed');
        const originPayload = await originRes.json();
        let originMD = stripMetaLines(pickMarkdown(originPayload) || '');

        if (!originMD.trim()) {
          setResult('No origin drug profile was returned. Please try again.');
          setLoading(false);
          return;
        }

        // 2. Structure origin + render
        const originBlock = structureOriginRaw(originMD, originCountry, selectedDrug);
        const originTitle = `Overview of ${selectedDrug || 'this medicine'} in ${originCountry || 'origin country'}`;
        let md = `## ${originTitle}\n\n`;
        if (SHOW_ORIGIN_SUMMARY) {
          md += `${makeOriginSummary(selectedDrug || 'This medicine', originCountry || 'this country', originBlock)}\n\n`;
        }
        md += `${originBlock}\n\n`;

        const aLink = agencyLink(originCountry);
        md += `<p class="fineprint"><strong><em>Please refer to the official website of the National Medicine Agency for ${originCountry}: ${aLink ?? 'the national agency website'}</em></strong></p>\n\n`;

        // 3. Fetch 10 generics using new API
        const genRes = await fetch('/api/openai/generics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originCountry,
            drugName: selectedDrug,
            drugDosage: selectedDosage,
            originMarkdown: originMD,
            lang,
          }),
        });

        const genPayload = genRes.ok ? await genRes.json() : null;
        const genericsMD = pickMarkdown(genPayload?.genericsMarkdown || '');

        const cleanedGenerics = tidyGenericsMarkdown(genericsMD);

        md += `## List of 10 Closest Generic Alternatives\n\n`;
        md += `${cleanedGenerics || '- n/a'}\n\n`;

        md = markWarnSectionsInMarkdown(md);

        if (lang && lang !== 'en') {
          const safe = protectContent(md);
          const tr = await fetch('/api/openai/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: safe.text, targetLang: lang }),
          });
          if (tr.ok) {
            const data = await tr.json();
            md = safe.restore(pickMarkdown(data));
          }
        }

        setResult(md || 'No result found.');
        setLoading(false);
        return;
      } else if (mode === 'leaflet') {
        const originRes = await fetch('/api/openai/origin-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            drug: selectedDrug,
            drugName: selectedDrug,
            originCountry,
          }),
        });

        if (!originRes.ok) throw new Error((await originRes.text()) || 'Origin profile failed');
        const originPayload = await originRes.json();
        let originMD = stripMetaLines(pickMarkdown(originPayload) || '');

        if (!originMD.trim()) {
          setResult('No origin drug profile was returned. Please try again.');
          setLoading(false);
          return;
        }

        const originBlock = structureOriginRaw(originMD, originCountry, selectedDrug);
        const originTitle = `Overview of ${selectedDrug || 'this medicine'} in ${originCountry || 'origin country'}`;
        let md = `## ${originTitle}\n\n`;
        if (SHOW_ORIGIN_SUMMARY) {
          md += `${makeOriginSummary(selectedDrug || 'This medicine', originCountry || 'this country', originBlock)}\n\n`;
        }
        md += `${originBlock}\n\n`;

        const aLink = agencyLink(originCountry);
        md += `<p class="fineprint"><strong><em>Please refer to the official website of the National Medicine Agency for ${originCountry}: ${aLink ?? 'the national agency website'}</em></strong></p>\n\n`;

        const lfRes = await fetch('/api/openai/leaflets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originCountry,
            drugName: selectedDrug,
            lang,
          }),
        });

        const lfPayload = lfRes.ok ? await lfRes.json() : null;
        const leafletMD = pickMarkdown(lfPayload?.leafletMarkdown || '');

        const cleanedLeaflet = tidyLeafletMarkdown(leafletMD);

        md += `## Patient Information Leaflet\n\n`;
        md += `${cleanedLeaflet || '- n/a'}\n\n`;

        md = markWarnSectionsInMarkdown(md);

        if (lang && lang !== 'en') {
          const safe = protectContent(md);
          const tr = await fetch('/api/openai/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: safe.text, targetLang: lang }),
          });
          if (tr.ok) {
            const data = await tr.json();
            md = safe.restore(pickMarkdown(data));
          }
        }

        setResult(md || 'No result found.');
        setLoading(false);
        return;
      }

      // Origin + (International or Pets) equivalents
      const originRes = await fetch('/api/openai/origin-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drug: selectedDrug,
          drugName: selectedDrug,
          originCountry,
        }),
      });
      if (!originRes.ok) throw new Error((await originRes.text()) || 'Origin profile failed');
      const originPayload = await originRes.json();
      let originMD = stripMetaLines(pickMarkdown(originPayload) || '');
      if (!originMD.trim()) {
        setResult('No origin drug profile was returned. Please try again.');
        setLoading(false);
        return;
      }

      const originBlock = structureOriginRaw(originMD, originCountry, selectedDrug);
      const originTitle = `Overview of ${selectedDrug || 'this medicine'} in ${originCountry || 'origin country'}`;
      let md = `## ${originTitle}\n\n`;
      if (SHOW_ORIGIN_SUMMARY) {
        md += `${makeOriginSummary(selectedDrug || 'This medicine', originCountry || 'this country', originBlock)}\n\n`;
      }
      md += `${originBlock}\n\n`;

      const aLink = agencyLink(originCountry);
      md += `<p class="fineprint"><strong><em>Please refer to the official website of the National Medicine Agency for ${originCountry}: ${aLink ?? 'the national agency website'}</em></strong></p>\n\n`;

      if (mode === 'international' || mode === 'pets') {
        const endpoint = mode === 'pets' ? '/api/openai/pets' : '/api/openai/equivalent-search';

        const eqRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originRaw: originMD,
            originCountry,
            targetCountry,
            drug: selectedDrug,
            dosage: selectedDosage,
            lang,
          }),
        });
        const eqPayload = eqRes.ok ? await eqRes.json() : null;
        const rawEq = pickMarkdown(eqPayload);
        const cleanedEq = tidyEquivalentsMarkdown(rawEq);

        const heading =
          mode === 'pets'
            ? `## Overview of Veterinary Medicines Equivalent to ${selectedDrug || 'this medicine'} in ${targetCountry || 'target country'}`
            : `## Overview of Medicines Equivalent to ${selectedDrug || 'this medicine'} in ${targetCountry || 'target country'}`;

        md += `${heading}\n\n`;
        md += `${cleanedEq || '- n/a'}\n\n`;

        const ta = agencyLink(targetCountry);
        if (ta) md += `<p class="fineprint"><strong><em>Please refer to the official website of the National Medicine Agency for ${targetCountry}: ${ta}</em></strong></p>\n\n`;
      }

      md = markWarnSectionsInMarkdown(md);

      if (lang && lang !== 'en') {
        const safe = protectContent(md);
        const tr = await fetch('/api/openai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: safe.text, targetLang: lang }),
        });
        if (tr.ok) {
          const data = await tr.json();
          md = safe.restore(pickMarkdown(data));
        }
      }

      setResult(md || 'No result found.');
    } catch {
      setResult('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // MD → HTML with persistent warning coloring
  const html = useMemo(() => {
    try {
      let parsed = marked.parse(result || '') as string;

      // Convert neutral <warn> tags to styled spans *before* sanitizing
      parsed = parsed.replace(/<warn>([\s\S]*?)<\/warn>/gi, '<span class="warn">$1</span>');

      // Remove any bolding on metrics
      parsed = normalizeMetrics(parsed);

      return DOMPurify.sanitize(parsed);
    } catch {
      return '';
    }
  }, [result]);

  // ---------------- UI ----------------
  const btn = (active: boolean, hue: 'blue' | 'green' | 'red'): React.CSSProperties => {
    const palette = {
      blue: active ? ['#0b74de', '#69a6ff', '#fff'] : ['#e6f0ff', '#f7fbff', '#0b74de'],
      green: active ? ['#0ea34a', '#5fd48b', '#fff'] : ['#e8f8ef', '#f6fffa', '#0e7c3a'],
      red: active ? ['#c61a1a', '#ff7a1a', '#fff'] : ['#ffe9e9', '#fff7f7', '#b30000'],
    } as const;
    const [c1, c2, txt] = palette[hue];
    return {
      padding: '0.5rem 1rem',
      borderRadius: 10,
      border: 'none',
      cursor: 'pointer',
      background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
      color: txt,
    };
  };

  const container: React.CSSProperties = { maxWidth: 980, margin: '0 auto', padding: '2rem 1rem' };
  const panel: React.CSSProperties = { background: 'transparent', borderRadius: 12, border: 'transparent', padding: '1rem' };
  const input: React.CSSProperties = { width: '100%', padding: '0.55rem', borderRadius: 10, border: 'transparent', boxSizing: 'border-box', display: 'block' };
  const select: React.CSSProperties = input;

  // a small inline condition list so Search by Condition is usable without extra files
  const commonConditions = [
    'Migraine', 'Hypertension', 'Type 2 Diabetes', 'Asthma', 'Allergic rhinitis',
    'Gastroesophageal reflux', 'Anxiety disorder', 'Depression', 'Low back pain',
    'Eczema', 'Acne', 'Hypothyroidism', 'COPD', 'Urinary tract infection', 'Otitis media'
  ];

  return (
    <main style={container}>
      <style>{`
.ai-result {
  background:#f6f9ff;
  border:transparent;
  border-radius:14px;
  padding:16px 18px;
  overflow-wrap:anywhere;
  word-break:break-word;
  white-space:normal;
}
/* Keep list spacing conservative to avoid layout shifts */
.ai-result ol { padding-left: 1.4rem; margin-left: 0; }
.ai-result ul { padding-left: 2rem;  margin-left: 0; } /* increased indent for details under each generic */

/* Code fences look like normal text */
.ai-result pre,
.ai-result code {
  background: transparent !important;
  box-shadow: none !important;
  border: 0 !important;
  white-space: pre-wrap;
}

/* Headings */
.ai-result h2 {
  color:#0e3869;
  font-size:1.35rem;
  font-weight:700;
  margin:0 0 8px 0;
}
.ai-result h3 {
  color:#1E73BE;
  margin:14px 0 8px;
  font-weight:700;
}
.ai-result h2::before, .ai-result h3::before { content:none !important; }

/* RED warning text */
.ai-result .warn { color:#b50000; font-weight:400; }

/* Fine print and summary */
.ai-result .fineprint { margin-top:12px; font-size:0.92rem; color:#000; }
.ai-result .fineprint a { color:#000; }
.ai-result .summary { color:#000; margin:6px 0 10px; }

/* === Generics visual tweaks === */
/* 10 generic drug names (robust to whitespace/text nodes) */
.ai-result ol > li > p:first-of-type {
  font-size: 1.15rem;
  color: #0b74de;
  font-weight: 700;
  margin: 2px 0 4px;
}
/* Paragraph labels inside generic details (e.g., Manufacturer, Ingredients) */
.ai-result ol > li ul > li > p:first-of-type > strong:first-child,
.ai-result ol > li ul > li > strong:first-child {
  color: #1E73BE;
  font-weight: 700;
}
/* When the label is emitted as italic instead of bold, style it the same */
.ai-result ol > li ul > li > p:first-of-type > em:first-child {
  color: #1E73BE;
  font-weight: 700;
  font-style: normal;
}

.notice{
  display:flex; align-items:center; gap:8px;
  font-size:0.9rem; color:#6a4a00; background:#fff7e6;
  border:1px solid #ffd28a; padding:8px 10px; border-radius:10px;
}
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <img
          src="/logo.png"
          alt="medicéa"
          style={{ width: '100%', maxWidth: 650, height: 'auto', margin: '0 auto 20px' }}
        />
        <p
          style={{
            fontFamily: "'Caveat','Patrick Hand','Shadows Into Light','Segoe UI',cursive",
            fontSize: '1.3rem',
            lineHeight: 1.45,
            color: '#333',
            margin: '0 0 12px',
          }}
        >
          Inspired by Panacéa, the goddess of the universal cure,{' '}
          <strong>
            <span style={{ color: '#1E73BE' }}>medi</span>
            <span style={{ color: '#008080' }}>céa</span>™
          </strong>{' '}
          is your passport to medicine anywhere in the world — connecting people to life-saving
          treatments without borders is our mission.
        </p>

        {/* render LanguageButton only after mount to avoid hydration mismatch */}
        {mounted && <LanguageButton />}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', margin: '12px 0 8px' }}>
          <button style={btn(mode==='international','blue')} onClick={()=>resetFieldsForMode('international')}>{ui.btnIntl}</button>
          <button style={btn(mode==='condition','blue')} onClick={()=>resetFieldsForMode('condition')}>{ui.btnCond}</button>
          <button style={btn(mode==='generic','blue')} onClick={()=>resetFieldsForMode('generic')}>{ui.btnGen}</button>
          <button style={btn(mode==='leaflet','blue')} onClick={()=>resetFieldsForMode('leaflet')}>{ui.btnLeaflet}</button>
          <button style={btn(mode==='triage','red')} onClick={()=>resetFieldsForMode('triage')}>{ui.btnTriage}</button>
          <button style={btn(mode==='pets','green')} onClick={()=>resetFieldsForMode('pets')}>{ui.btnPets}</button>
        </div>
      </div>

      {/* Form — hidden entirely in triage mode */}
      {mode !== 'triage' && (
        <div style={{ ...panel, display: 'grid', gap: '10px', maxWidth: 640, margin: '0 auto' }}>
          {/* Home Country — NOT shown in Search by Condition */}
          {mode !== 'condition' && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{ui.phHome}</div>
              <select value={originCode} onChange={e => setOriginCode(e.target.value)} style={select}>
                <option value="" disabled>—</option>
                {Object.entries(countriesByRegion).map(([region, countryList]) => (
                  <optgroup key={region} label={region}>
                    {countryList.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}

          {showNoticeOrigin && mode !== 'condition' && (
            <div className="notice">⚠️ {ui.noList(originCode)}</div>
          )}

          {/* Condition inputs only in Search by Condition */}
          {mode === 'condition' && (
            <>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Select a condition</div>
                <input
                  type="text"
                  list="conditions"
                  placeholder="e.g., Migraine"
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  style={input}
                />
                <datalist id="conditions">
                  {commonConditions.map((c, i) => (
                    <option key={i} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Context (optional)</div>
                <textarea
                  placeholder="Add brief context (e.g., severity, duration, age/pregnancy, other relevant notes)"
                  value={conditionDetails}
                  onChange={(e) => setConditionDetails(e.target.value)}
                  style={{ ...input, minHeight: 80 }}
                />
              </div>

              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Allergies / other conditions (optional)</div>
                <textarea
                  placeholder="e.g., penicillin allergy, asthma, chronic kidney disease"
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  style={{ ...input, minHeight: 60 }}
                />
              </div>
            </>
          )}

          {/* Drug fields are NOT shown in condition mode */}
          {mode !== 'condition' && (
            <>
              <div>
                <div style={{ fontWeight:600, marginBottom:4 }}>{ui.phMed}</div>
                {(() => {
                  const countryForList =
                    mode==='international' || mode==='pets' ? originCode :
                    (mode==='generic' || mode==='leaflet') ? originCode : '';
                  const opts = getDrugsFor(countryForList);
                  const short = nameToShort(countryForList);
                  const listId =
                    short === 'GB' ? 'uk-drugs' :
                    short === 'US' ? 'us-drugs' : undefined;
                  return (
                    <>
                      <input
                        type="text"
                        list={listId}
                        placeholder={ui.phMed}
                        value={selectedDrug}
                        onChange={(e)=>setSelectedDrug(e.target.value)}
                        style={input}
                      />
                      {listId && (
                        <datalist id={listId}>
                          {opts.map((name, i) => <option key={i} value={name} />)}
                        </datalist>
                      )}
                    </>
                  );
                })()}
              </div>

              <div>
                <input
                  type="text"
                  placeholder={ui.phDose}
                  value={selectedDosage}
                  onChange={(e)=>setSelectedDosage(e.target.value)}
                  style={input}
                />
              </div>
            </>
          )}

          {(mode === 'international' || mode === 'condition' || mode === 'pets') && (
            <div>
              <div style={{ fontWeight:600, marginBottom:4 }}>{ui.phTarget}</div>
              <select value={targetCode} onChange={e=>setTargetCode(e.target.value)} style={select}>
                <option value="" disabled>—</option>
                {Object.entries(countriesByRegion).map(([region, countryList]) => (
                  <optgroup key={region} label={region}>
                    {countryList.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleSearch}
            disabled={disableSearch}
            style={{ padding:'0.8rem', background:'linear-gradient(135deg, #0b74de 0%, #69a6ff 100%)', color:'#fff', border:'none', borderRadius:10, cursor:'pointer' }}
          >
            {loading ? '…' :
              mode==='international' ? ui.searchIntl :
              mode==='condition' ? ui.searchCond :
              mode==='generic' ? ui.searchGen :
              mode==='leaflet' ? ui.searchLeaflet :
              ui.searchPets}
          </button>
        </div>
      )}

      {/* Results */}
      {mode !== 'triage' && (
        <div style={{ marginTop:12 }}>
          <article
            className="ai-result"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      )}

      {/* Triage */}
      {mode === 'triage' && (
        <div style={{ marginTop: 16 }}>
          <SymptomTriage />
        </div>
      )}

      {/* Disclaimer (full) */}
      <div style={{ fontSize: '0.85rem', color: '#333', marginTop: '2rem' }}>
        <p style={{ textAlign: 'justify' }}>
          <strong style={{ color: '#cc0000', textDecoration: 'underline' }}>DISCLAIMER</strong>
        </p>

        <p style={{ textAlign: 'justify' }}>
          <strong>
            <span style={{ color: '#1E73BE' }}>medi</span>
            <span style={{ color: '#008080' }}>céa</span>™ is a publicly accessible,
            AI-assisted informational platform
          </strong>{' '}
          that facilitates cross-referencing of medication names and health conditions across
          countries. It also offers an <strong>AI-powered Symptom Triage Assistant</strong> that
          generates <u>purely educational outputs</u> based on public data. All content is for{' '}
          <strong>informational purposes only</strong>.
        </p>

        <p style={{ textAlign: 'justify' }}>
          <strong>
            <span style={{ color: '#1E73BE' }}>medi</span>
            <span style={{ color: '#008080' }}>céa</span>™ is not a medical device and does not
            provide medical advice, diagnosis, or treatment.
          </strong>{' '}
          The symptom triage assistant is an AI experiment and{' '}
          <strong>must not be used to guide health decisions or emergencies</strong>. Responses are
          generated from large language models and are not reviewed by doctors or qualified healthcare
          professionals.
        </p>

        <p style={{ textAlign: 'justify' }}>
          Do not rely on this for any clinical, pharmaceutical, or legal decisions. By using this
          platform, you accept that{' '}
          <strong>
            no liability is assumed by <span style={{ color: '#1E73BE' }}>medi</span>
            <span style={{ color: '#008080' }}>céa</span>™ or its creators
          </strong>
          .
        </p>

        <p style={{ textAlign: 'justify' }}>
          <strong>
            <span style={{ color: '#1E73BE' }}>medi</span>
            <span style={{ color: '#008080' }}>céa</span>™ does not collect personal medical data
          </strong>{' '}
          and does not tailor results to individual health histories. By using this service, you
          acknowledge that{' '}
          <strong>
            no information provided constitutes medical, legal, or pharmaceutical advice
          </strong>
          , and that{' '}
          <strong>
            <span style={{ color: '#1E73BE' }}>medi</span>
            <span style={{ color: '#008080' }}>céa</span>™ and its developers assume no liability
            for actions taken based on its content
          </strong>
          .
        </p>
      </div>

      {/* Footer / visits */}
      <div style={{ textAlign:'center', margin:'20px 0', color:'#6b7280', fontSize:'0.85rem' }}>
        {visits !== null && <div>Visits: {visits.toLocaleString()}</div>}
        <div style={{ marginTop:6 }}>© {new Date().getFullYear()} <strong>
            <span style={{ color: '#1E73BE' }}>medi</span><span style={{ color: '#008080' }}>céa</span>™ does not collect personal medical data</strong> by GES Consultancy Ltd. All rights reserved.</div>
        <div><a href="/terms" style={{ color:'#0b74de' }}>Terms & Conditions</a></div>
      </div>

      {/* hidden datalists for GB/US */}
      <datalist id="uk-drugs">{ukDrugs.map((n,i)=><option key={i} value={n} />)}</datalist>
      <datalist id="us-drugs">{usDrugs.map((n,i)=><option key={i} value={n} />)}</datalist>
    </main>
  );
}
