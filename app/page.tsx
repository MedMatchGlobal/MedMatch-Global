// app/page.tsx
'use client';

import { DrugComboBox } from '@/components/DrugComboBox';
import { useEffect, useMemo, useState } from 'react';
import SymptomTriage from './components/SymptomTriage';
import { groupedConditions } from './constants/conditions';

// === NEW: language utilities (no UI refactor) ===
import LanguageButton from './components/LanguageButton';
import { LanguageProvider, useLanguage } from './LanguageProvider';
import { translateClient } from './lib/translateClient';

// === NEW: markdown rendering ===
import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Keep your Mode type as-is
type Mode = 'international' | 'condition' | 'generic' | 'triage' | 'leaflet' | 'pets';

// Wrap the page in the provider (so language choice persists & is available)
export default function PageWrapper() {
  return (
    <LanguageProvider>
      <Home />
    </LanguageProvider>
  );
}

function Home() {
  const { lang } = useLanguage(); // we only need the code to translate the result

  const [countries, setCountries] = useState<string[]>([]);
  const [ukDrugs, setUkDrugs] = useState<string[]>([]);
  const [usDrugs, setUsDrugs] = useState<string[]>([]);

  // Shared form state
  const [originCountry, setOriginCountry] = useState('');
  const [targetCountry, setTargetCountry] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(''); // legacy (not used by new modes)
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

  const countryWithDatabase = ['United Kingdom', 'United States'];

  useEffect(() => {
    fetch('/api/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'countries' }),
    })
      .then((res) => res.json())
      .then((data) => setCountries(data.options || []));
  }, []);

  useEffect(() => {
    fetch('/api/drugs/uk')
      .then((res) => res.json())
      .then((data) => setUkDrugs(data.map((d: any) => d.name)));

    fetch('/api/drugs/us')
      .then((res) => res.json())
      .then((data) => setUsDrugs(data.map((d: any) => d.name)));
  }, []);

  useEffect(() => {
    fetch('https://counterapi.dev/api/hit/medicea.vercel.app/visits')
      .then((res) => res.json())
      .then((data) => setVisits(data.value))
      .catch(() => setVisits(null));
  }, []);

  const getDrugsForCountry = (country: string) => {
    if (country === 'United Kingdom') return ukDrugs;
    if (country === 'United States') return usDrugs;
    return [];
  };

  // legacy
  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
  };

  useEffect(() => {
    setShowNoticeOrigin(!!originCountry && !countryWithDatabase.includes(originCountry));
  }, [originCountry]);

  useEffect(() => {
    setShowNoticeTarget(!!targetCountry && !countryWithDatabase.includes(targetCountry));
  }, [targetCountry]);

  // Blue gradient button (default sections)
  const gradientBtnBlue = (active: boolean) =>
    ({
      padding: '0.5rem 1rem',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      color: active ? 'white' : '#0b74de',
      background: active
        ? 'linear-gradient(135deg, #0b74de 0%, #69a6ff 100%)'
        : 'linear-gradient(135deg, #e6f0ff 0%, #f7fbff 100%)',
      boxShadow: active ? '0 2px 10px rgba(11,116,222,0.25)' : 'none',
      transition: 'transform 0.05s ease',
    } as React.CSSProperties);

  // Green gradient button (Meds 4 Pets)
  const gradientBtnGreen = (active: boolean) =>
    ({
      padding: '0.5rem 1rem',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      color: active ? 'white' : '#0e7c3a',
      background: active
        ? 'linear-gradient(135deg, #0ea34a 0%, #5fd48b 100%)'
        : 'linear-gradient(135deg, #e8f8ef 0%, #f6fffa 100%)',
      boxShadow: active ? '0 2px 10px rgba(14,163,74,0.25)' : 'none',
      transition: 'transform 0.05s ease',
    } as React.CSSProperties);

  // Red gradient button (Symptoms Triage)
  const gradientBtnRed = (active: boolean) =>
    ({
      padding: '0.5rem 1rem',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      color: active ? 'white' : '#b30000',
      background: active
        ? 'linear-gradient(135deg, #c61a1a 0%, #ff7a7a 100%)'
        : 'linear-gradient(135deg, #ffe9e9 0%, #fff7f7 100%)',
      boxShadow: active ? '0 2px 10px rgba(198,26,26,0.25)' : 'none',
      transition: 'transform 0.05s ease',
    } as React.CSSProperties);

  const clearAll = () => {
    setResult('');
    setSelectedDrug('');
    setSelectedDosage('');
    setOriginCountry('');
    setTargetCountry('');
    setSelectedCondition('');
    setConditionDetails('');
    setUserNotes('');
  };

  const handleMode = (m: Mode) => {
    setMode(m);
    clearAll();
  };

  const handleSearch = async () => {
    setLoading(true);
    setResult('Searching...');

    const dosagePart = selectedDosage ? ` at a dosage of ${selectedDosage}` : '';

    let query = '';

    if (mode === 'international') {
      query =
        `A person living in ${originCountry} is looking for the equivalent name of the drug '${selectedDrug}'` +
        `${dosagePart} in ${targetCountry}. ` +
        `Based on the API and additional components present in the '${selectedDrug}', ` +
        `please provide a list of the top 5 equivalent drugs – either branded or generic – in the ${targetCountry} ` +
        `sorting them by percentage of equivalence starting with those with the highest percentage along with the ` +
        `respective average prices in the currency of the ${targetCountry} but also converted to the currency of the ${originCountry}. ` +
        `In addition to that, provide a comprehensive overview of the drug’s typical naming variations, classification, ` +
        `use cases, potential side effects, and any known regulatory differences between the two countries. ` +
        `Finally, provide a summary of no more than 75 words that is purely language-based, informative, and publicly available. ` +
        `Don’t forget to label each section clearly.`;
    } else if (mode === 'condition') {
      query =
        `The user is currently located in ${targetCountry} and seeks information about the condition '${selectedCondition}'. ` +
        `They have provided the following context: '${conditionDetails}' and mentioned these allergies or pathologies: '${userNotes}'. ` +
        `Please return an extensive, educational, and AI-generated overview of the condition, including common symptoms, possible causes, ` +
        `typical treatments, and drug classes used globally — avoiding any clinical advice, diagnosis, or region-specific prescribing rules.`;
    } else if (mode === 'generic') {
      const dosePhrase = selectedDosage ? ` at the dosage of ${selectedDosage}` : '';
      query =
        `Please provide a list of the top 10 generic medicines that are fully equivalent to '${selectedDrug}'${dosePhrase} in ${targetCountry} and are also sold in ${targetCountry}. ` +
        (selectedDosage
          ? `Please also mention the current price the ${selectedDrug}${dosePhrase} is sold at. `
          : `Please also mention the current price the ${selectedDrug} is sold at (use the most common/typical dosage if required). `) +
        `Please recommend the generic drug that is closest to 100% equivalence and add, next to each suggested generic product, the average price it is currently sold at. Finally, if the drug is not 100% equivalent to the one indicated, please mention where the differences are ensuring to highlight if these differences are in the main API or in the other ingredients and/or components. Therefore, should these raise concerns in terms of allergy, please mention that if a person is allergic to that specific ingredients should seek medical help before using that medicine.`;
    } else if (mode === 'leaflet') {
      const doseInLeaflet = selectedDosage ? `, at the ${selectedDosage}` : '';
      query =
        `Please search the web and seek the Patient Information Leaflet of the ${selectedDrug}${doseInLeaflet} in ${targetCountry}. ` +
        `If the Patient Information Leaflet is not fully available, please gather and list the following in full:\n` +
        `- What [Medicine Name] is and what it is used for\n` +
        `  • Explains the active ingredient(s)\n` +
        `  • States what the medicine treats or prevents\n` +
        `  • Mentions if it’s for adults, children, or special patient groups\n` +
        `- What you need to know before you take [Medicine Name]\n` +
        `  • Do not take (contraindications)\n` +
        `  • Warnings and precautions (e.g., health conditions, allergies, interactions)\n` +
        `  • Other medicines and [Medicine Name] (drug interactions)\n` +
        `  • Pregnancy, breastfeeding, and fertility advice\n` +
        `  • Driving and using machines\n` +
        `  • Important information about ingredients (e.g., lactose, sodium content)\n` +
        `- How to take [Medicine Name]\n` +
        `  • Dosage instructions for different ages or conditions\n` +
        `  • How and when to take it (with/without food, water, etc.)\n` +
        `  • What to do if you miss a dose or take too much\n` +
        `  • Duration of treatment\n` +
        `- Possible side effects\n` +
        `  • Very common, common, uncommon, rare, and very rare side effects\n` +
        `  • Signs of serious allergic reactions\n` +
        `  • Guidance on what to do if side effects occur\n` +
        `- How to store [Medicine Name]\n` +
        `  • Storage conditions (temperature, light, moisture)\n` +
        `  • Keep out of reach of children\n` +
        `  • Shelf life and expiry date information\n` +
        `- Contents of the pack and other information\n` +
        `  • Full list of active and inactive ingredients\n` +
        `  • Description of the medicine (tablet colour, shape, markings)\n` +
        `  • Name and address of the manufacturer and marketing authorisation holder`;
    } else if (mode === 'pets') {
      query =
        `A person living in ${originCountry} is looking for the equivalent name of the drug '${selectedDrug}'` +
        `${dosagePart} in ${targetCountry} and exclusively for animal usage. ` +
        `Based on the API and additional components present in the '${selectedDrug}', provide a list of the top 5 equivalent drugs — ` +
        `either branded or generic — exclusively for animal usage in the ${targetCountry}, sorted by percentage of equivalence with average prices in the local currency and converted to the currency of ${originCountry}. ` +
        `Also provide naming variations, classification, use cases, potential side effects, and any known regulatory differences between the two countries, plus a ≤50-word summary.`;
    } else {
      // triage handled by its own component
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/ai-search', {
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
          debug: true, // toggle for one run if you want to see prompts in the server log
        }),
      });

      const data = await response.json();
      if (data?._debug) console.log('DEBUG system/user', data._debug);

      // Show exactly what the server returned; translate only as a fallback.
      const serverText = (data?.result ?? '').trim();
      let finalText = serverText;

      if (lang !== 'en' && serverText) {
        try {
          const looksItalian = /[àèéìòù]|(zione|mente|gli|che|per|con)/i.test(serverText);
          const looksFrench = /[àâçèéêëîïôùûüÿœ]|(tion|est|avec|pour)/i.test(serverText);
          const looksGerman = /(die|der|das|und|über|ä|ö|ü|ß)/i.test(serverText);
          const looksSpanish = /(ción|que|con|para|de|á|é|í|ó|ú|ñ)/i.test(serverText);
          const looksPortuguese = /(ção|que|com|para|de|á|é|í|ó|ú|ã|õ|ç)/i.test(serverText);

          const alreadyLang =
            (lang === 'it' && looksItalian) ||
            (lang === 'fr' && looksFrench) ||
            (lang === 'de' && looksGerman) ||
            (lang === 'es' && looksSpanish) ||
            (lang === 'pt' && looksPortuguese);

          finalText = alreadyLang ? serverText : await translateClient(serverText, lang);
        } catch {
          finalText = serverText; // fail-open
        }
      }

      setResult(finalText || 'No result found.');
    } catch {
      setResult('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const renderInputs = () => {
    if (mode === 'triage') {
      return (
        <div
          style={{
            borderRadius: '12px',
            padding: '1rem',
            background: 'linear-gradient(135deg, #ffe9e9 0%, #fff7f7 100%)',
            border: '1px solid #ffd1d1',
          }}
        >
          <h3 style={{ textAlign: 'center', marginTop: 0 }}>💬 Symptoms Triage</h3>
          <p style={{ fontSize: '0.9rem', color: '#333', marginBottom: '0.75rem', textAlign: 'center' }}>
            Describe a symptom (e.g. <i>"My ear is sore"</i> or <i>"I twisted my ankle"</i>) and{' '}
            <strong>
              <span style={{ color: '#1E73BE' }}>medi</span>
              <span style={{ color: '#008080' }}>cea</span>™
            </strong>{' '}
            will ask follow-ups to provide an AI-assisted educational summary.
          </p>
          <SymptomTriage />
        </div>
      );
    }

    if (mode === 'international') {
      return (
        <>
          <select
            value={originCountry}
            onChange={(e) => setOriginCountry(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <option value="">Please select your Home Country</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {showNoticeOrigin && (
            <div style={{ color: '#d9534f', fontSize: '0.95rem' }}>
              ⚠️ No full drug list available for {originCountry}. Please enter the drug name manually.
            </div>
          )}

          {countryWithDatabase.includes(originCountry) ? (
            <DrugComboBox
              options={getDrugsForCountry(originCountry)}
              value={selectedDrug}
              onChange={setSelectedDrug}
            />
          ) : (
            <input
              type="text"
              placeholder="Please select/enter medicine name"
              value={selectedDrug}
              onChange={(e) => setSelectedDrug(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          )}

          <input
            type="text"
            placeholder="Enter dosage (optional)"
            value={selectedDosage}
            onChange={(e) => setSelectedDosage(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />

          <select
            value={targetCountry}
            onChange={(e) => setTargetCountry(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <option value="">Please select the Country to search</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
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

          <select
            value={targetCountry}
            onChange={(e) => setTargetCountry(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <option value="">Country to search</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </>
      );
    }

    if (mode === 'generic') {
      return (
        <>
          <select
            value={targetCountry}
            onChange={(e) => setTargetCountry(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <option value="">Country to search</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {countryWithDatabase.includes(targetCountry) ? (
            <DrugComboBox
              options={getDrugsForCountry(targetCountry)}
              value={selectedDrug}
              onChange={setSelectedDrug}
            />
          ) : (
            <input
              type="text"
              placeholder="Please enter the drug name"
              value={selectedDrug}
              onChange={(e) => setSelectedDrug(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          )}

          <input
            type="text"
            placeholder="Enter dosage (optional)"
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
          <select
            value={targetCountry}
            onChange={(e) => setTargetCountry(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <option value="">Country to search</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {countryWithDatabase.includes(targetCountry) ? (
            <DrugComboBox
              options={getDrugsForCountry(targetCountry)}
              value={selectedDrug}
              onChange={setSelectedDrug}
            />
          ) : (
            <input
              type="text"
              placeholder="Please enter the drug name"
              value={selectedDrug}
              onChange={(e) => setSelectedDrug(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          )}

          <input
            type="text"
            placeholder="Enter dosage (optional)"
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
          <select
            value={originCountry}
            onChange={(e) => setOriginCountry(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <option value="">Please select your Home Country</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {showNoticeOrigin && (
            <div style={{ color: '#d9534f', fontSize: '0.95rem' }}>
              ⚠️ No full drug list available for {originCountry}. Please enter the drug name manually.
            </div>
          )}

          {/* Pets: always free-text (no DB dropdown) */}
          <input
            type="text"
            placeholder="Please enter medicine name"
            value={selectedDrug}
            onChange={(e) => setSelectedDrug(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />

          <input
            type="text"
            placeholder="Enter dosage (optional)"
            value={selectedDosage}
            onChange={(e) => setSelectedDosage(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />

          <select
            value={targetCountry}
            onChange={(e) => setTargetCountry(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <option value="">Please select the Country to search</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </>
      );
    }

    return null;
  };

  const actionDisabled = () => {
    if (loading) return true;
    if (mode === 'triage') return true;

    if (mode === 'international') return !(originCountry && selectedDrug && targetCountry);
    if (mode === 'condition') return !(selectedCondition && targetCountry);
    // dosage NO LONGER required for these two:
    if (mode === 'generic') return !(selectedDrug && targetCountry);
    if (mode === 'leaflet') return !(selectedDrug && targetCountry);
    if (mode === 'pets') return !(originCountry && selectedDrug && targetCountry);
    return true;
  };

  // === NEW: convert result (markdown) -> safe HTML for rendering ===
  const html = useMemo(() => {
    try {
      const parsed = marked.parse(result || '');
      // DOMPurify uses window; this component is client, so it's safe.
      return DOMPurify.sanitize(parsed as string);
    } catch {
      return '';
    }
  }, [result]);

  return (
    <main style={{ maxWidth: '600px', margin: 'auto', padding: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
        <img
          src="/logo.png"
          alt="medicea logo"
          style={{ maxWidth: '600px', width: '100%', height: 'auto', marginBottom: '2rem' }}
        />

        {/* Tagline */}
        <p
          style={{
            fontFamily:
              "'Caveat', 'Patrick Hand', 'Shadows Into Light', 'Comic Sans MS', 'Segoe UI', cursive",
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
          is your passport to medicine anywhere in the world — connecting people to life-saving treatments without borders is our mission.
        </p>

        {/* NEW: Language switcher directly under the tagline */}
        <div style={{ marginBottom: '1.25rem' }}>
          <LanguageButton />
        </div>

        {/* Buttons (pets in green, triage in red) */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => handleMode('international')} style={gradientBtnBlue(mode === 'international')}>
            International Medicine Search
          </button>
          <button onClick={() => handleMode('condition')} style={gradientBtnBlue(mode === 'condition')}>
            Search by Condition
          </button>
          <button onClick={() => handleMode('generic')} style={gradientBtnBlue(mode === 'generic')}>
            Search Generic
          </button>
          <button onClick={() => handleMode('triage')} style={gradientBtnRed(mode === 'triage')}>
            Symptoms Triage
          </button>
          <button onClick={() => handleMode('leaflet')} style={gradientBtnBlue(mode === 'leaflet')}>
            Medicine Leaflet
          </button>
          <button onClick={() => handleMode('pets')} style={gradientBtnGreen(mode === 'pets')}>
            Meds 4 Pets
          </button>
        </div>
      </div>

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
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              boxShadow:
                mode === 'pets'
                  ? '0 2px 10px rgba(14,163,74,0.25)'
                  : '0 2px 10px rgba(11,116,222,0.25)',
            }}
          >
            {loading
              ? 'Searching...'
              : mode === 'international'
              ? 'Search International Equivalents'
              : mode === 'condition'
              ? 'View Informational Guidance'
              : mode === 'generic'
              ? 'Find Generics'
              : mode === 'leaflet'
              ? 'Fetch Medicine Leaflet'
              : mode === 'pets'
              ? 'Search Pet Medicines'
              : 'Search'}
          </button>
        )}

        {/* === NEW: render formatted markdown instead of a plain textarea === */}
        {mode !== 'triage' && (
          <article className="ai-result" dangerouslySetInnerHTML={{ __html: html }} />
        )}

        <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '2rem' }}>
          <p style={{ textAlign: 'justify', marginBottom: '1rem' }}>
            <strong style={{ color: '#cc0000', textDecoration: 'underline' }}>DISCLAIMER</strong>
            <br />
            <br />
            <strong>
              <span style={{ color: '#1E73BE' }}>medi</span>
              <span style={{ color: '#008080' }}>céa</span>™ is a publicly accessible, AI-assisted
              informational platform
            </strong>{' '}
            that facilitates cross-referencing of medication names and health conditions across countries. It also
            offers an <strong>AI-powered Symptom Triage Assistant</strong> that generates <u>purely educational outputs</u> based on public data.
            All content is for <strong>informational purposes only</strong>.
          </p>
          <p style={{ textAlign: 'justify' }}>
            <strong>
              <span style={{ color: '#1E73BE' }}>medi</span>
              <span style={{ color: '#008080' }}>céa</span>™ is not a medical device and does not provide medical
              advice, diagnosis, or treatment.
            </strong>{' '}
            The symptom triage assistant is an AI experiment and <strong>must not be used to guide health decisions or emergencies.</strong>{' '}
            Responses are generated from large language models and are not reviewed by doctors or qualified professionals.
          </p>
          <p style={{ textAlign: 'justify' }}>
            Do not rely on this for any clinical, pharmaceutical, or legal decisions. By using this platform, you accept that
            <strong>
              {' '}
              no liability is assumed by <span style={{ color: '#1E73BE' }}>medi</span>
              <span style={{ color: '#008080' }}>céa</span>™ or its creators
            </strong>
            .
          </p>
          <p style={{ textAlign: 'justify' }}>
            <strong>
              <span style={{ color: '#1E73BE' }}>medi</span>
              <span style={{ color: '#008080' }}>céa</span>™
            </strong>{' '}
            does <strong>not collect personal medical data</strong> and does not tailor results to individual health histories.
            By using this service, you acknowledge that <strong>no information provided constitutes medical, legal, or pharmaceutical advice</strong>, and that{' '}
            <strong>
              <span style={{ color: '#1E73BE' }}>medi</span>
              <span style={{ color: '#008080' }}>céa</span>™ and its developers assume no liability
            </strong>{' '}
            for actions taken based on its content.
          </p>
        </div>

        {visits !== null && (
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#555', marginTop: '1rem' }}>
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
    </main>
  );
}
