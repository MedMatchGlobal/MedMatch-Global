'use client';

import { useEffect, useState } from 'react';

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

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setSelectedDrug('');
    setSelectedDosage('');
    setShowNotice(!countryWithDatabase.includes(value));
  };

  const handleSearch = async () => {
    setLoading(true);
    setResult('Searching...');

    const query = `Find the equivalent of the drug ${selectedDrug} sold in ${selectedCountry}, in ${searchCountry}.`;

    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      setResult(data.result || 'No result found.');
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
      <img
        src="/Logo.png"
        alt="MedMatch Global Logo"
        style={{ maxWidth: '600px', display: 'block', margin: '0 auto 2rem' }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
          <select
            value={selectedDrug}
            onChange={(e) => setSelectedDrug(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <option value="">Select Drug</option>
            {getDrugsForSelectedCountry().map((drug) => (
              <option key={drug} value={drug}>
                {drug}
              </option>
            ))}
          </select>
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

        <select
          value={searchCountry}
          onChange={(e) => setSearchCountry(e.target.value)}
          style={{ width: '100%', padding: '0.5rem' }}
        >
          <option value="">Country to search</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <button
          onClick={handleSearch}
          disabled={loading || !selectedDrug || !searchCountry}
          style={{
            padding: '0.75rem',
            backgroundColor: '#0b74de',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          {loading ? 'Searching...' : 'Search Equivalent Drug'}
        </button>

        <textarea
          readOnly
          value={result}
          placeholder="Result will appear here..."
          rows={6}
          style={{ marginTop: '1rem', width: '100%' }}
        />

        <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '2rem' }}>
          <p style={{ textAlign: 'justify', marginBottom: '1rem' }}>
            <strong>Disclaimer:</strong> MedMatch-Global is an informational tool powered by
            artificial intelligence. It is not intended to replace professional medical advice,
            diagnosis, or treatment.
          </p>
          <p style={{ textAlign: 'justify', marginBottom: '1rem' }}>
            Always seek the guidance of your doctor, pharmacist, or other qualified healthcare
            provider with any questions you may have regarding a medical condition or treatment.
          </p>
          <p style={{ textAlign: 'justify' }}>
            MedMatch-Global does not assume any responsibility or liability for the accuracy,
            completeness, timeliness, or outcomes of the information provided. Use at your own risk.
          </p>
        </div>
      </div>
    </main>
  );
}
