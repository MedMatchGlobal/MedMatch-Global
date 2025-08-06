'use client';

import { useEffect, useState } from 'react';
import { DrugComboBox } from '@/components/DrugComboBox';
import { groupedConditions } from './constants/conditions';

export default function Home() {
  const [countries, setCountries] = useState<string[]>([]);
  const [ukDrugs, setUkDrugs] = useState<string[]>([]);
  const [usDrugs, setUsDrugs] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedDrug, setSelectedDrug] = useState('');
  const [selectedDosage, setSelectedDosage] = useState('');
  const [searchCountry, setSearchCountry] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [mode, setMode] = useState<'medicine' | 'condition'>('medicine');

  const [selectedCondition, setSelectedCondition] = useState('');
  const [conditionDetails, setConditionDetails] = useState('');
  const [userNotes, setUserNotes] = useState('');

  const [visits, setVisits] = useState<number | null>(null);

  const countryWithDatabase = ['United Kingdom', 'United States'];

  useEffect(() => {
    fetch('/api/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'countries' }),
    })
      .then((res) => res.json())
      .then((data) => setCountries(data.options || []))
      .catch((err) => console.error('Failed to load countries:', err));
  }, []);

  useEffect(() => {
    fetch('/api/drugs/uk')
      .then((res) => res.json())
      .then((data) => setUkDrugs(data.map((d: any) => d.name)))
      .catch((err) => console.error('Failed to load UK drugs:', err));

    fetch('/api/drugs/us')
      .then((res) => res.json())
      .then((data) => setUsDrugs(data.map((d: any) => d.name)))
      .catch((err) => console.error('Failed to load US drugs:', err));
  }, []);

  useEffect(() => {
    fetch('https://counterapi.dev/api/hit/medmatch-global.vercel.app/visits')
      .then((res) => res.json())
      .then((data) => setVisits(data.value))
      .catch(() => setVisits(null));
  }, []);

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setSelectedDrug('');
    setSelectedDosage('');
    setShowNotice(!countryWithDatabase.includes(value));
  };

  const handleSearch = async () => {
    setLoading(true);
    setResult('Searching...');

    const query =
      mode === 'medicine'
        ? `A user is in ${selectedCountry} and is looking for the international equivalent of the drug '${selectedDrug}'${selectedDosage ? ` at a dosage of ${selectedDosage}` : ''}. What is this drug known as in ${searchCountry}? Please return **purely informational**, language-based content only, suitable for a public reference tool.`
        : `A person is currently in ${searchCountry} and wants to understand more about the condition '${selectedCondition}'. They provided the following context: '${conditionDetails}'. They also have the following allergies or health conditions: '${userNotes}'. Please provide a **publicly available**, non-medical summary including general drug classes (if applicable), typical over-the-counter options (if relevant), and behavioral or country-specific public guidance that does **not constitute advice**.`;

    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      setResult(
        '🔍 Informational Summary:\n\n' +
          (data.result || 'No result found.') +
          '\n\n⚠️ This is not a diagnosis, prescription, or treatment plan.'
      );
    } catch (err) {
      console.error(err);
      setResult('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const getDrugsForSelectedCountry = () => {
    if (selectedCountry === 'United Kingdom') return ukDrugs;
    if (selectedCountry === 'United States') return usDrugs;
    return [];
  };

  return (
    <main style={{ maxWidth: '600px', margin: 'auto', padding: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
        <img
          src="/Logo.png"
          alt="MedMatch Global Logo"
          style={{ maxWidth: '600px', width: '100%', height: 'auto', marginBottom: '0.5rem' }}
        />

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setMode('medicine')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: mode === 'medicine' ? '#0b74de' : '#f5f5f5',
              color: mode === 'medicine' ? 'white' : 'black',
              border: '1px solid #ccc',
              borderRadius: '6px',
            }}
          >
            Search by Medicine
          </button>
          <button
            onClick={() => setMode('condition')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: mode === 'condition' ? '#0b74de' : '#f5f5f5',
              color: mode === 'condition' ? 'white' : 'black',
              border: '1px solid #ccc',
              borderRadius: '6px',
            }}
          >
            Search by Condition
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {mode === 'medicine' ? (
          <>
            <select
              value={selectedCountry}
              onChange={(e) => handleCountryChange(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            >
              <option value="">Select Country</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {showNotice && (
              <div style={{ color: '#d9534f', fontSize: '0.95rem' }}>
                ⚠️ No full drug list available for {selectedCountry}. Please enter the drug name manually.
              </div>
            )}

            {countryWithDatabase.includes(selectedCountry) ? (
              <DrugComboBox
                options={getDrugsForSelectedCountry()}
                value={selectedDrug}
                onChange={setSelectedDrug}
              />
            ) : (
              <input
                type="text"
                placeholder="Enter Drug Name"
                value={selectedDrug}
                onChange={(e) => setSelectedDrug(e.target.value)}
                style={{ width: '100%', padding: '0.5rem' }}
              />
            )}

            <input
              type="text"
              placeholder="Enter Dosage (optional)"
              value={selectedDosage}
              onChange={(e) => setSelectedDosage(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </>
        ) : (
          <>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            >
              <option value="">Select Condition</option>
              {groupedConditions.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.conditions.map((cond) => (
                    <option key={cond} value={`${group.group}: ${cond}`}>
                      {cond}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <textarea
              placeholder="Additional details (e.g. symptom history, triggers)"
              value={conditionDetails}
              onChange={(e) => setConditionDetails(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '0.5rem' }}
            />

            <textarea
              placeholder="Known allergies or pathologies (e.g. penicillin allergy, heart condition)"
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </>
        )}

        <select
          value={searchCountry}
          onChange={(e) => setSearchCountry(e.target.value)}
          style={{ width: '100%', padding: '0.5rem' }}
        >
          <option value="">Country to check</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <button
          onClick={handleSearch}
          disabled={loading || !searchCountry || (mode === 'medicine' && !selectedDrug) || (mode === 'condition' && !selectedCondition)}
          style={{
            padding: '0.75rem',
            backgroundColor: '#0b74de',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          {loading ? 'Searching...' : mode === 'medicine' ? 'Check International Drug Name' : 'View Informational Guidance'}
        </button>

        <textarea
          readOnly
          value={result}
          placeholder="Informational summary will appear here..."
          rows={8}
          style={{ marginTop: '1rem', width: '100%' }}
        />

        <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '2rem' }}>
          <p style={{ textAlign: 'justify', marginBottom: '1rem', marginTop: '2rem' }}>
            <strong style={{ color: '#cc0000', textDecoration: 'underline' }}>DISCLAIMER</strong><br /><br />
            <strong>MedMatch-Global is a publicly accessible, AI-assisted informational platform</strong> that facilitates cross-referencing of medication names and conditions across countries. It is <strong>not a medical device</strong>, and <strong>does not offer medical advice, diagnosis, clinical guidance, or treatment recommendations</strong> of any kind.
          </p>
          <p style={{ textAlign: 'justify', marginBottom: '1rem' }}>
            All responses generated by this platform are <strong>language-based informational outputs</strong> derived from publicly available databases and large language models. These outputs <strong>are not reviewed by licensed medical professionals</strong> and may be <strong>incomplete, outdated, or inaccurate</strong>.
          </p>
          <p style={{ textAlign: 'justify', marginBottom: '1rem' }}>
            <strong>You must not use MedMatch-Global for making decisions related to your health or treatment.</strong> Always consult your doctor, pharmacist, or other licensed healthcare provider before taking any action based on the information from this platform.
          </p>
          <p style={{ textAlign: 'justify' }}>
            MedMatch-Global does <strong>not collect personal medical data</strong> and does not tailor results to individual health histories. By using this service, you acknowledge that <strong>no information provided constitutes medical, legal, or pharmaceutical advice</strong>, and that <strong>MedMatch-Global and its developers assume no liability</strong> for actions taken based on its content.
          </p>
        </div>

        {visits !== null && (
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#555', marginTop: '1rem' }}>
            👥 Total site visits: {visits.toLocaleString()}
          </p>
        )}
      </div>
    </main>
  );
}
