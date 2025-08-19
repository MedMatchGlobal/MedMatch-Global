// app/page.tsx
'use client';

import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useEffect, useMemo, useState } from 'react';

import { LanguageProvider, useLanguage } from './LanguageProvider';
import { DrugComboBox } from './components/DrugComboBox';
import LanguageButton from './components/LanguageButton';
import SymptomTriage from './components/SymptomTriage';
import { groupedConditions } from './constants/conditions';
import { translateClient } from './lib/translateClient';

type Mode = 'international' | 'condition' | 'generic' | 'triage' | 'leaflet' | 'pets';
type CountryOpt = { code: string; name: string };

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
    rx: 'Rx',
    otc: 'OTC',
  },
  it: {
    btnIntl: 'Ricerca internazionale',
    btnCond: 'Cerca per condizione',
    btnGen: 'Cerca generici',
    btnTriage: 'Valutazione sintomi',
    btnLeaflet: 'Foglio illustrativo',
    btnPets: 'Farmaci per animali',
    phHome: 'Seleziona il tuo Paese di residenza',
    phMed: 'Seleziona/inserisci il nome del medicinale',
    phDose: 'Inserisci dosaggio (opzionale)',
    phTarget: 'Seleziona il Paese di destinazione',
    searchIntl: 'Cerca equivalenti internazionali',
    searchCond: 'Visualizza guida informativa',
    searchGen: 'Trova generici',
    searchLeaflet: 'Recupera foglio illustrativo',
    searchPets: 'Cerca farmaci veterinari',
    noList: (c: string) =>
      `⚠️ Nessun elenco completo per ${c || 'questo Paese'}. Inserisci manualmente il nome del farmaco.`,
    rx: 'Su Ricetta',
    otc: 'Da Banco',
  },
  fr: {
    btnIntl: 'Recherche internationale',
    btnCond: 'Rechercher par affection',
    btnGen: 'Recherche des génériques',
    btnTriage: 'Évaluation des symptômes',
    btnLeaflet: 'Notice du médicament',
    btnPets: 'Médicaments vétérinaires',
    phHome: "Sélectionnez votre pays d’origine",
    phMed: 'Sélectionnez/saisissez le nom du médicament',
    phDose: 'Saisir posologie (facultatif)',
    phTarget: 'Sélectionnez le pays de recherche',
    searchIntl: 'Rechercher des équivalents internationaux',
    searchCond: 'Afficher les informations',
    searchGen: 'Trouver des génériques',
    searchLeaflet: 'Afficher la notice',
    searchPets: 'Rechercher médicaments vétérinaires',
    noList: (c: string) =>
      `⚠️ Pas de liste complète pour ${c || 'ce pays'}. Saisissez le nom du médicament manuellement.`,
    rx: 'Sur ordonnance',
    otc: 'Sans ordonnance',
  },
  de: {
    btnIntl: 'Internationale Arzneisuche',
    btnCond: 'Suche nach Erkrankung',
    btnGen: 'Generika suchen',
    btnTriage: 'Symptombewertung',
    btnLeaflet: 'Packungsbeilage',
    btnPets: 'Tiermedikamente',
    phHome: 'Bitte wählen Sie Ihr Heimatland',
    phMed: 'Arzneimittelnamen wählen/eingeben',
    phDose: 'Dosierung eingeben (optional)',
    phTarget: 'Zielland auswählen',
    searchIntl: 'Äquivalente suchen',
    searchCond: 'Informationen anzeigen',
    searchGen: 'Generika finden',
    searchLeaflet: 'Packungsbeilage abrufen',
    searchPets: 'Tiermedikamente suchen',
    noList: (c: string) =>
      `⚠️ Keine vollständige Liste für ${c || 'dieses Land'}. Arzneiname bitte manuell eingeben.`,
    rx: 'Verschreibungspflichtig',
    otc: 'Ohne Rezept',
  },
  es: {
    btnIntl: 'Búsqueda internacional',
    btnCond: 'Buscar por condición',
    btnGen: 'Buscar genéricos',
    btnTriage: 'Evaluación de síntomas',
    btnLeaflet: 'Prospecto del medicamento',
    btnPets: 'Medicamentos para mascotas',
    phHome: 'Seleccione su país de origen',
    phMed: 'Seleccione/escriba el nombre del medicamento',
    phDose: 'Introduzca la dosis (opcional)',
    phTarget: 'Seleccione el país de destino',
    searchIntl: 'Buscar equivalentes internacionales',
    searchCond: 'Ver guía informativa',
    searchGen: 'Encontrar genéricos',
    searchLeaflet: 'Obtener prospecto',
    searchPets: 'Buscar medicamentos para mascotas',
    noList: (c: string) =>
      `⚠️ No hay lista completa para ${c || 'este país'}. Escriba el nombre del medicamento manualmente.`,
    rx: 'Con receta',
    otc: 'Sin receta',
  },
  pt: {
    btnIntl: 'Pesquisa internacional',
    btnCond: 'Pesquisar por condição',
    btnGen: 'Pesquisar genéricos',
    btnTriage: 'Avaliação de sintomas',
    btnLeaflet: 'Folheto do medicamento',
    btnPets: 'Medicamentos veterinários',
    phHome: 'Selecione o seu país de origem',
    phMed: 'Selecione/digite o nome do medicamento',
    phDose: 'Informe a dosagem (opcional)',
    phTarget: 'Selecione o país de destino',
    searchIntl: 'Pesquisar equivalentes internacionais',
    searchCond: 'Ver guia informativa',
    searchGen: 'Encontrar genéricos',
    searchLeaflet: 'Obter folheto',
    searchPets: 'Pesquisar medicamentos veterinários',
    noList: (c: string) =>
      `⚠️ Não há lista completa para ${c || 'este país'}. Digite o nome do medicamento manualmente.`,
    rx: 'Com receita',
    otc: 'Sem receita',
  },
} as const;

export default function PageWrapper() {
  return (
    <LanguageProvider>
      <Home />
    </LanguageProvider>
  );
}

function Home() {
  const { lang } = useLanguage();
  const ui = UI[lang as keyof typeof UI] ?? UI.en;

  const [countries, setCountries] = useState<CountryOpt[]>([]);
  const [ukDrugs, setUkDrugs] = useState<string[]>([]);
  const [usDrugs, setUsDrugs] = useState<string[]>([]);

  const [originCode, setOriginCode] = useState('');
  const [targetCode, setTargetCode] = useState('');
  const [selectedDrug, setSelectedDrug] = useState('');
  const [selectedDosage, setSelectedDosage] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [conditionDetails, setConditionDetails] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNoticeOrigin, setShowNoticeOrigin] = useState(false);
  const [showNoticeTarget, setShowNoticeTarget] = useState(false);
  const [mode, setMode] = useState<Mode>('international');
  const [visits, setVisits] = useState<number | null>(null);

  const dbCountryCodes = ['GB', 'US'];

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'countries', lang }),
      });
      const data = await res.json();
      setCountries((data?.options as CountryOpt[]) || []);
    })();
  }, [lang]);

  useEffect(() => {
    fetch('/api/drugs/uk')
      .then((r) => r.json())
      .then((d) => setUkDrugs(d.map((x: any) => x.name)));
    fetch('/api/drugs/us')
      .then((r) => r.json())
      .then((d) => setUsDrugs(d.map((x: any) => x.name)));
  }, []);

  useEffect(() => {
    fetch('https://counterapi.dev/api/hit/medicea.vercel.app/visits')
      .then((res) => res.json())
      .then((data) => setVisits(data.value))
      .catch(() => setVisits(null));
  }, []);

  const getDrugsFor = (code: string) =>
    code === 'GB' ? ukDrugs : code === 'US' ? usDrugs : [];

  useEffect(
    () => setShowNoticeOrigin(!!originCode && !dbCountryCodes.includes(originCode)),
    [originCode]
  );
  useEffect(
    () => setShowNoticeTarget(!!targetCode && !dbCountryCodes.includes(targetCode)),
    [targetCode]
  );

  const englishRegion = useMemo(() => {
    // @ts-ignore
    return typeof Intl.DisplayNames !== 'undefined'
      ? new Intl.DisplayNames(['en'], { type: 'region' })
      : null;
  }, []);
  const codeToEnglish = (code: string) =>
    (englishRegion?.of(code) as string) || code;

  // ---------- helpers ----------

  // Replace Rx/OTC tokens after translation
  function localizeRxTokensMD(md: string) {
    const rx = UI[lang as keyof typeof UI]?.rx ?? UI.en.rx;
    const otc = UI[lang as keyof typeof UI]?.otc ?? UI.en.otc;
    md = md.replace(/\[(?:OTC)\]/g, `[${otc}]`).replace(/\((?:OTC)\)/g, `(${otc})`);
    md = md.replace(/\[(?:Rx)\]/g, `[${rx}]`).replace(/\((?:Rx)\)/g, `(${rx})`);
    md = md.replace(/(^|\s)OTC(\s|$)/g, `$1${otc}$2`);
    md = md.replace(/(^|\s)Rx(\s|$)/g, `$1${rx}$2`);
    return md;
  }

  // Preserve currency & percent tokens across translation
  function protectMetrics(md: string) {
    const map: string[] = [];
    const placeholder = (i: number) => `⟦M${i}⟧`;

    const patterns = [
      /[$€£]\s?\d{1,4}(?:[.,]\d{2})?/g, // currency
      /\b\d{1,3}\s?%\b/g, // percent
      /\(≈\s*[$€£]?\s?\d{1,4}(?:[.,]\d{2})?\)/g, // (≈ €x.xx)
      /\bn\/a\b/gi, // n/a
    ];

    let text = md;
    patterns.forEach((re) => {
      text = text.replace(re, (m) => {
        const id = map.push(m) - 1;
        return placeholder(id);
      });
    });

    return {
      text,
      restore(translated: string) {
        let out = translated;
        map.forEach((orig, i) => {
          out = out.replace(new RegExp(placeholder(i), 'g'), orig);
        });
        return out;
      },
    };
  }

  // Ensure the first bullet in Composition/Excipients breaks to a new line
  function improveCompositionLayout(html: string) {
    const compKeys =
      /(Active ingredient(?:s)?(?:\s*\(with strengths\))?|Principio|Sostanza|Ingr[ée]dient|Ingrediente|Wirkstoff|Excipients?|Eccipienti|Excipientes?|Hilfsstoffe|Formulation|Formulazione|Formulación|Formule|Darreichungsform)/i;

    return html.replace(/<li>([\s\S]*?)<\/li>/gi, (m, inner) => {
      if (compKeys.test(inner) && inner.includes('•') && !/br\s*\/?>\s*•/i.test(inner)) {
        // break only the FIRST bullet
        const idx = inner.indexOf('•');
        return `<li>${inner.slice(0, idx)}<br/>•${inner.slice(idx + 1)}</li>`;
      }
      return m;
    });
  }

  // Color only the warning part (post-colon) in red, across languages
  function wrapWarningsPrecisely(html: string) {
    // stems that suggest a warning/imperative guidance
    const stems = [
      // IT
      'controindicat', 'sconsigliat', 'evitar', 'non usare', 'non somministrare',
      'non raccomandat', 'uso cautel', 'cautel', 'attenzion', 'rischio di dipenden',
      'monitor', 'monitorar', 'monitorare',
      // EN
      'contraindicat', 'not recommended', 'avoid', 'do not use', 'use with caution',
      'caution', 'warning', 'risk', 'monitor',
      // FR
      'contre', 'déconseill', 'éviter', 'ne pas utiliser', 'prudence', 'risque',
      'surveill', // surveiller / surveillez
      // DE
      'kontraindik', 'nicht empfohlen', 'vermeiden', 'nicht verwenden', 'vorsicht',
      'überwach', // überwachen
      // ES/PT
      'contraindicado', 'no recomendado', 'no usar', 'evitar', 'precaución', 'cautela',
      'riesgo', 'risco', 'monitoriz', // monitorizar/monitorização
    ];
    const union =
      '(?:' +
      stems.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') +
      ')';

    return html
      // list items
      .replace(/<li>([\s\S]*?)<\/li>/gi, (_m, inner) => {
        const colon = inner.indexOf(':');
        if (colon === -1) return `<li>${inner}</li>`;
        const before = inner.slice(0, colon + 1);
        const after = inner.slice(colon + 1);
        const isWarn = new RegExp(union, 'iu').test(after);
        return isWarn
          ? `<li>${before}<span class="warn">${after}</span></li>`
          : `<li>${before}${after}</li>`;
      })
      // paragraphs
      .replace(/<p>([\s\S]*?)<\/p>/gi, (_m, inner) => {
        const colon = inner.indexOf(':');
        if (colon === -1) return `<p>${inner}</p>`;
        const before = inner.slice(0, colon + 1);
        const after = inner.slice(colon + 1);
        const isWarn = new RegExp(union, 'iu').test(after);
        return isWarn
          ? `<p>${before}<span class="warn">${after}</span></p>`
          : `<p>${before}${after}</p>`;
      });
  }

  // Un-bold metrics only inside list items
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

  // ---------- search ----------

  const actionDisabled = () => {
    if (loading) return true;
    if (mode === 'triage') return true;
    if (mode === 'international') return !(originCode && selectedDrug && targetCode);
    if (mode === 'condition') return !(selectedCondition && targetCode);
    if (mode === 'generic') return !(selectedDrug && targetCode);
    if (mode === 'leaflet') return !(selectedDrug && targetCode);
    if (mode === 'pets') return !(originCode && selectedDrug && targetCode);
    return true;
  };

  const handleMode = (m: Mode) => {
    setMode(m);
    setResult('');
    setSelectedDrug('');
    setSelectedDosage('');
    setOriginCode('');
    setTargetCode('');
    setSelectedCondition('');
    setConditionDetails('');
    setUserNotes('');
  };

  const handleSearch = async () => {
    setLoading(true);
    setResult('Searching...');

    const dose = selectedDosage ? ` at a dosage of ${selectedDosage}` : '';
    const originCountry = originCode ? codeToEnglish(originCode) : '';
    const targetCountry = targetCode ? codeToEnglish(targetCode) : '';

    let query = '';
    if (mode === 'international') {
      query =
        `A person living in ${originCountry} is looking for the equivalent name of the drug '${selectedDrug}'${dose} in ${targetCountry}. ` +
        `Return the top 5 equivalents (brand or generic) in ${targetCountry}, sorted by % equivalence, with prices in local currency and converted to ${originCountry}. ` +
        `Include: Prescription status in origin country; Drug Overview (naming variations, classification, use cases, side effects, regulatory differences); ` +
        `Exact Composition & Excipients for origin and for each equivalent (active ingredients with strengths, formulation, excipients — write “Not publicly listed” if unknown). ` +
        `Then: Why not 100% compatible (per equivalent); Interactions & Warnings (≤30 words each, imperative, safety-first); ` +
        `Special Populations & Contraindications (≤30 words each, imperative); Summary (≤75 words). Use clear section titles.`;
    } else if (mode === 'generic') {
      const d = selectedDosage ? ` at the dosage of ${selectedDosage}` : '';
      query =
        `List the top 10 generics fully equivalent to '${selectedDrug}'${d} in ${targetCountry}, with prices (local + converted). ` +
        `For each: active ingredients with strengths, formulation, excipients; and note differences that affect equivalence. ` +
        `Add “Prescription Status in ${originCountry}”, “Notes on Equivalence”, and “Composition & Excipients (per equivalent)”.`;
    } else if (mode === 'condition') {
      query =
        `User in ${targetCountry} seeks information about '${selectedCondition}'. Context: '${conditionDetails}'. Allergies/pathologies: '${userNotes}'. ` +
        `Return an educational overview only (symptoms, causes, non-drug care, general drug classes, red flags). No diagnosis.`;
    } else if (mode === 'leaflet') {
      const d = selectedDosage ? `, at the ${selectedDosage}` : '';
      query =
        `Patient Information Leaflet for ${selectedDrug}${d} in ${targetCountry}. If not available, compile contents per standard PIL (uses, warnings, interactions, pregnancy, driving, dosage, side effects, storage, exact ingredients).`;
    } else if (mode === 'pets') {
      query =
        `Veterinary equivalents for '${selectedDrug}'${dose}. List top 5 in ${targetCountry} with prices (local + converted), and include a safety summary.`;
    }

    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
      });

      let md = ((await res.json())?.result ?? '').trim();

      // Preserve metrics before translation, then restore afterward
      const keeper = protectMetrics(md);

      if (lang !== 'en' && md) {
        try {
          // only translate if it doesn't already look like the target language
          const looksItalian = /[àèéìòù]|(zione|mente|gli|che|per|con)/i.test(md);
          const looksFrench = /[àâçèéêëîïôùûüÿœ]|(tion|est|avec|pour)/i.test(md);
          const looksGerman = /(die|der|das|und|über|ä|ö|ü|ß)/i.test(md);
          const looksSpanish = /(ción|que|con|para|de|á|é|í|ó|ú|ñ)/i.test(md);
          const looksPortuguese = /(ção|que|com|para|de|á|é|í|ó|ú|ã|õ|ç)/i.test(md);

          const already =
            (lang === 'it' && looksItalian) ||
            (lang === 'fr' && looksFrench) ||
            (lang === 'de' && looksGerman) ||
            (lang === 'es' && looksSpanish) ||
            (lang === 'pt' && looksPortuguese);

          if (!already) {
            md = await translateClient(keeper.text, lang);
          } else {
            md = keeper.text; // nothing to translate
          }
        } catch {
          md = keeper.text;
        }
      } else {
        md = keeper.text;
      }

      // Restore preserved metrics and localize Rx/OTC labels
      md = keeper.restore(md);
      md = localizeRxTokensMD(md);

      setResult(md || 'No result found.');
    } catch {
      setResult('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const html = useMemo(() => {
    try {
      let parsed = marked.parse(result || '') as string;
      parsed = wrapWarningsPrecisely(parsed);     // color only post-colon warning text
      parsed = improveCompositionLayout(parsed);  // force bullet to a new line in composition/excipients
      parsed = normalizeMetrics(parsed);          // remove bolding from metrics-only
      return DOMPurify.sanitize(parsed);
    } catch {
      return '';
    }
  }, [result]);

  // ---------- UI ----------

  const btnBlue = (active: boolean): React.CSSProperties => ({
    padding: '0.5rem 1rem',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    color: active ? '#fff' : '#0b74de',
    background: active
      ? 'linear-gradient(135deg, #0b74de 0%, #69a6ff 100%)'
      : 'linear-gradient(135deg, #e6f0ff 0%, #f7fbff 100%)',
    boxShadow: active ? '0 2px 10px rgba(11,116,222,0.25)' : 'none',
  });

  const btnGreen = (active: boolean): React.CSSProperties => ({
    padding: '0.5rem 1rem',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    color: active ? '#fff' : '#0e7c3a',
    background: active
      ? 'linear-gradient(135deg, #0ea34a 0%, #5fd48b 100%)'
      : 'linear-gradient(135deg, #e8f8ef 0%, #f6fffa 100%)',
    boxShadow: active ? '0 2px 10px rgba(14,163,74,0.25)' : 'none',
  });

  const btnRed = (active: boolean): React.CSSProperties => ({
    padding: '0.5rem 1rem',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    color: active ? '#fff' : '#b30000',
    background: active
      ? 'linear-gradient(135deg, #c61a1a 0%, #ff7a7a 100%)'
      : 'linear-gradient(135deg, #ffe9e9 0%, #fff7f7 100%)',
    boxShadow: active ? '0 2px 10px rgba(198,26,26,0.25)' : 'none',
  });

  const searchLabel =
    mode === 'international'
      ? ui.searchIntl
      : mode === 'condition'
      ? ui.searchCond
      : mode === 'generic'
      ? ui.searchGen
      : mode === 'leaflet'
      ? ui.searchLeaflet
      : mode === 'pets'
      ? ui.searchPets
      : 'Search';

  return (
    <main style={{ maxWidth: 600, margin: 'auto', padding: '2rem' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <img
          src="/logo.png"
          alt="medicéa logo"
          style={{ width: '100%', maxWidth: 600, height: 'auto', marginBottom: '2rem' }}
        />

        <p
          style={{
            fontFamily:
              "'Caveat','Patrick Hand','Shadows Into Light','Comic Sans MS','Segoe UI',cursive",
            fontSize: '0.95rem',
            lineHeight: 1.55,
            color: '#333',
            textAlign: 'center',
            letterSpacing: '0.3px',
            margin: '0.6rem 0 0.9rem',
            maxWidth: '58ch',
          }}
        >
          Inspired by Panacea, the goddess of the universal cure,&nbsp;
          <strong>
            <span style={{ color: '#1E73BE' }}>medi</span>
            <span style={{ color: '#008080' }}>céa</span>™
          </strong>{' '}
          is your passport to medicine anywhere in the world — connecting people to life-saving
          treatments without borders is our mission.
        </p>

        <div style={{ marginBottom: '1.25rem' }}>
          <LanguageButton />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => handleMode('international')}
            style={btnBlue(mode === 'international')}
          >
            {ui.btnIntl}
          </button>
          <button onClick={() => handleMode('condition')} style={btnBlue(mode === 'condition')}>
            {ui.btnCond}
          </button>
          <button onClick={() => handleMode('generic')} style={btnBlue(mode === 'generic')}>
            {ui.btnGen}
          </button>
          <button onClick={() => handleMode('triage')} style={btnRed(mode === 'triage')}>
            {ui.btnTriage}
          </button>
          <button onClick={() => handleMode('leaflet')} style={btnBlue(mode === 'leaflet')}>
            {ui.btnLeaflet}
          </button>
          <button onClick={() => handleMode('pets')} style={btnGreen(mode === 'pets')}>
            {ui.btnPets}
          </button>
        </div>
      </div>

      {/* Inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {renderInputs()}

        {mode !== 'triage' && (
          <button
            onClick={handleSearch}
            disabled={actionDisabled()}
            style={{
              padding: '0.75rem',
              background:
                mode === 'pets'
                  ? 'linear-gradient(135deg, #0ea34a 0%, #5fd48b 100%)'
                  : 'linear-gradient(135deg, #0b74de 0%, #69a6ff 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              boxShadow:
                mode === 'pets'
                  ? '0 2px 10px rgba(14,163,74,0.25)'
                  : '0 2px 10px rgba(11,116,222,0.25)',
            }}
          >
            {loading ? '…' : searchLabel}
          </button>
        )}

        {mode !== 'triage' && (
          <article className="ai-result" dangerouslySetInnerHTML={{ __html: html }} />
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
            generated from large language models and are not reviewed by doctors or qualified
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

        {visits !== null && (
          <p
            style={{
              textAlign: 'center',
              fontSize: '0.8rem',
              color: '#555',
              marginTop: '1rem',
            }}
          >
            ➤ Total site visits: {visits.toLocaleString()}
          </p>
        )}

        <footer
          style={{
            textAlign: 'center',
            fontSize: '0.8rem',
            color: '#666',
            marginTop: '2rem',
            padding: '1rem',
            borderTop: '1px solid #ddd',
          }}
        >
          © {new Date().getFullYear()}{' '}
          <strong>
            <span style={{ color: '#1E73BE' }}>medi</span>
            <span style={{ color: '#008080' }}>céa</span>™
          </strong>{' '}
          by GES Consultancy Ltd. All rights reserved.
          <br />
          <a
            href="/terms"
            style={{
              color: '#0b74de',
              textDecoration: 'underline',
              marginTop: '0.5rem',
              display: 'inline-block',
            }}
          >
            Terms & Conditions
          </a>
        </footer>
      </div>

      <style jsx global>{`
        .ai-result .warn { color: #c1121f; font-weight: 700; }
      `}</style>
    </main>
  );

  // ---------- Inputs per mode ----------
  function renderInputs() {
    if (mode === 'triage') {
      return (
        <div
          style={{
            borderRadius: 12,
            padding: '1rem',
            background: 'linear-gradient(135deg, #ffe9e9 0%, #fff7f7 100%)',
            border: '1px solid #ffd1d1',
          }}
        >
          <h3 style={{ textAlign: 'center', marginTop: 0 }}>💬 {ui.btnTriage}</h3>
          <SymptomTriage />
        </div>
      );
    }

    const select = (value: string, set: (v: string) => void, ph: string) => (
      <select
        value={value}
        onChange={(e) => set(e.target.value)}
        style={{ width: '100%', padding: '0.5rem' }}
      >
        <option value="">{ph}</option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
    );

    if (mode === 'international') {
      return (
        <>
          {select(originCode, setOriginCode, ui.phHome)}
          {showNoticeOrigin && (
            <div style={{ color: '#d9534f', fontSize: '0.95rem' }}>
              {ui.noList(originCode)}
            </div>
          )}

          {dbCountryCodes.includes(originCode) ? (
            <DrugComboBox
              options={getDrugsFor(originCode)}
              value={selectedDrug}
              onChange={setSelectedDrug}
            />
          ) : (
            <input
              type="text"
              placeholder={ui.phMed}
              value={selectedDrug}
              onChange={(e) => setSelectedDrug(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          )}

          <input
            type="text"
            placeholder={ui.phDose}
            value={selectedDosage}
            onChange={(e) => setSelectedDosage(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />

          {select(targetCode, setTargetCode, ui.phTarget)}
        </>
      );
    }

    if (mode === 'condition') {
      return (
        <>
          <input
            type="text"
            list="condition-list"
            placeholder="Select or type condition"
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />
          <datalist id="condition-list">
            {groupedConditions.flatMap((group) =>
              group.conditions.map((cond) => (
                <option key={`${group.group}-${cond}`} value={cond} />
              ))
            )}
          </datalist>

          <textarea
            placeholder="Please add any further useful details"
            value={conditionDetails}
            onChange={(e) => setConditionDetails(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '0.5rem' }}
          />

          <textarea
            placeholder="Please enter any known allergies and pathologies"
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '0.5rem' }}
          />

          {select(targetCode, setTargetCode, 'Country to search')}
        </>
      );
    }

    if (mode === 'generic') {
      return (
        <>
          {select(targetCode, setTargetCode, ui.phTarget)}

          {dbCountryCodes.includes(targetCode) ? (
            <DrugComboBox
              options={getDrugsFor(targetCode)}
              value={selectedDrug}
              onChange={setSelectedDrug}
            />
          ) : (
            <input
              type="text"
              placeholder={ui.phMed}
              value={selectedDrug}
              onChange={(e) => setSelectedDrug(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          )}

          <input
            type="text"
            placeholder={ui.phDose}
            value={selectedDosage}
            onChange={(e) => setSelectedDosage(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </>
      );
    }

    if (mode === 'leaflet') {
      return (
        <>
          {select(targetCode, setTargetCode, ui.phTarget)}
          {dbCountryCodes.includes(targetCode) ? (
            <DrugComboBox
              options={getDrugsFor(targetCode)}
              value={selectedDrug}
              onChange={setSelectedDrug}
            />
          ) : (
            <input
              type="text"
              placeholder={ui.phMed}
              value={selectedDrug}
              onChange={(e) => setSelectedDrug(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          )}
          <input
            type="text"
            placeholder={ui.phDose}
            value={selectedDosage}
            onChange={(e) => setSelectedDosage(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </>
      );
    }

    if (mode === 'pets') {
      return (
        <>
          {select(originCode, setOriginCode, ui.phHome)}
          {showNoticeOrigin && (
            <div style={{ color: '#d9534f', fontSize: '0.95rem' }}>
              {ui.noList(originCode)}
            </div>
          )}

          <input
            type="text"
            placeholder={ui.phMed}
            value={selectedDrug}
            onChange={(e) => setSelectedDrug(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />

          <input
            type="text"
            placeholder={ui.phDose}
            value={selectedDosage}
            onChange={(e) => setSelectedDosage(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />

          {select(targetCode, setTargetCode, ui.phTarget)}
        </>
      );
    }

    return null;
  }
}
