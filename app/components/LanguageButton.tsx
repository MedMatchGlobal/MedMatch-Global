"use client";
import { useState } from "react";
import type { SupportedLang } from "../LanguageProvider";
import { useLanguage } from "../LanguageProvider";

const options: { code: SupportedLang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "it", label: "Italiano" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: 'nl', label: 'Nederlands' },
  { code: 'af', label: 'Afrikaans' },
  { code: 'ru', label: 'Русский' },
  { code: 'pl', label: 'Polski' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'el', label: 'Ελληνικά' },
  { code: 'sv', label: 'Svenska' },
  { code: 'no', label: 'Norsk' },
  { code: 'da', label: 'Dansk' },
  { code: 'fi', label: 'Suomi' },
  { code: 'cs', label: 'Čeština' },
  { code: 'hu', label: 'Magyar' },
  { code: 'ro', label: 'Română' },
  { code: 'he', label: 'עברית' },
  { code: 'ar', label: 'العربية' },
  { code: 'zh', label: '中文' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
];

export default function LanguageButton() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{ padding: "8px 12px", borderRadius: 12, border: "1px solid #ddd", background: "#fff" }}
      >
        {options.find((o) => o.code === lang)?.label ?? "Language"}
      </button>

      {open && (
        <ul
          style={{
            position: "absolute",
            zIndex: 50,
            marginTop: 8,
            listStyle: "none",
            padding: 6,
            border: "1px solid #eee",
            borderRadius: 12,
            background: "#fff",
            maxHeight: 220,
            overflow: "auto",
          }}
        >
          {options.map((o) => (
            <li key={o.code}>
              <button
                onClick={() => {
                  setLang(o.code);
                  setOpen(false);
                }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 10px", border: "none", background: "transparent" }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
