'use client';

import { useEffect, useState } from 'react';

interface DrugComboBoxProps {
  country: string;
  onDrugSelect: (drug: string) => void;
}

export default function DrugComboBox({ country, onDrugSelect }: DrugComboBoxProps) {
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    const fetchDrugs = async () => {
      try {
        const res = await fetch(`/api/drugs/${country === 'United Kingdom' ? 'uk' : 'us'}`);
        const data = await res.json();
        setOptions(data || []);
      } catch (error) {
        console.error('Failed to fetch drug list:', error);
      }
    };

    fetchDrugs();
  }, [country]);

  useEffect(() => {
    onDrugSelect(selected);
  }, [selected, onDrugSelect]);

  return (
    <>
      <input
        list="drug-options"
        placeholder="Select or type drug"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        style={{ padding: '0.5rem' }}
      />
      <datalist id="drug-options">
        {(options || []).map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </>
  );
}
