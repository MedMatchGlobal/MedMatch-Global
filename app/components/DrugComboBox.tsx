// app/components/DrugComboBox.tsx
'use client';
import { useId } from 'react';

export interface DrugComboBoxProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function DrugComboBox({
  options,
  value,
  onChange,
  placeholder = 'Select or type medicine name',
}: DrugComboBoxProps) {
  const listId = useId();

  return (
    <div style={{ width: '100%' }}>
      <input
        list={listId}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', padding: '0.5rem' }}
        autoComplete="off"
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </div>
  );
}
