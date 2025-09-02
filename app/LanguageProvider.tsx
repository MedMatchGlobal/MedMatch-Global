"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type SupportedLang =
  | "en"
  | "it"
  | "fr"
  | "de"
  | "es"
  | "pt"
  | "nl"
  | "af"
  | "ru"
  | "pl"
  | "tr"
  | "el"
  | "sv"
  | "no"
  | "da"
  | "fi"
  | "cs"
  | "hu"
  | "ro"
  | "he"
  | "ar"
  | "zh"
  | "hi"
  | "ja"
  | "ko";

type Ctx = { lang: SupportedLang; setLang: (l: SupportedLang) => void; };
const Ctx = createContext<Ctx | null>(null);

function getInitial(): SupportedLang {
  if (typeof window === "undefined") return "en";
  const saved = localStorage.getItem("medicea.lang") as SupportedLang | null;
  if (saved) return saved;
  const nav = navigator.language?.slice(0,2).toLowerCase();
  const supported: SupportedLang[] = ["en","it","fr","de","es","pt"];
  return supported.includes(nav as SupportedLang) ? (nav as SupportedLang) : "en";
}

export function LanguageProvider({children}:{children: React.ReactNode}) {
  const [lang, setLang] = useState<SupportedLang>(getInitial());
  useEffect(()=>{ localStorage.setItem("medicea.lang", lang); document.documentElement.lang = lang; },[lang]);
  const value = useMemo(()=>({lang, setLang}),[lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useLanguage(){ const v = useContext(Ctx); if(!v) throw new Error("useLanguage outside provider"); return v; }
