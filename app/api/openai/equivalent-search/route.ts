// /app/api/openai/equivalent_search/route.ts
import type { NextRequest } from 'next/server';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const API = 'https://api.openai.com/v1/chat/completions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const originRaw = (body?.originRaw || '').trim(); // original origin profile text (anchor)
    const originCountry = (body?.originCountry || '').trim();
    const targetCountry = (body?.targetCountry || '').trim();
    const drug = (body?.drug || '').trim();
    const dosage = (body?.dosage || '').trim();
    const currencySymbols: Record<string, string> = {
  "Afghanistan": "؋",              // Afghani
  "Albania": "L",                  // Lek
  "Algeria": "DZD",                // Algerian Dinar
  "Andorra": "€",
  "Angola": "Kz",                  // Kwanza
  "Argentina": "ARS",
  "Armenia": "֏",                 // Dram
  "Australia": "AUD",
  "Austria": "€",
  "Azerbaijan": "₼",              // Manat
  "Bahamas": "BSD",                // Bahamian Dollar
  "Bahrain": "BD",                 // Bahraini Dinar
  "Bangladesh": "৳",
  "Barbados": "BBD",               // Barbados Dollar
  "Belarus": "Br",                 // Belarusian Ruble
  "Belgium": "€",
  "Belize": "BZD",                 // Belize Dollar
  "Benin": "CFA",                  // West African CFA Franc
  "Bolivia": "BOB",
  "Brazil": "R$",
  "Bulgaria": "лв",
  "Cameroon": "XAF",
  "Canada": "CAD",
  "Chile": "CLP$",
  "China": "¥",
  "Colombia": "COL$",
  "Côte d’Ivoire": "XOF",
  "Croatia": "€",
  "Czech Republic": "Kč",
  "Denmark": "kr",
  "Ecuador": "USD",                 // (DKK)
  "Egypt": "E£",
  "Ethiopia": "Br",
  "Eurozone": "€",
  "Finland": "€",
  "France": "€",
  "Gabon": "XAF",
  "Germany": "€",
  "Ghana": "₵",
  "Hong Kong": "HK$",
  "Hungary": "Ft",
  "Iceland": "kr",                 // (ISK)
  "India": "₹",
  "Indonesia": "Rp",
  "Ireland": "€",
  "Israel": "₪",
  "Italy": "€",
  "Iran": "IRR",
  "Jamaica": "JMD",
  "Japan": "¥",
  "Kenya": "KSh",
  "Malaysia": "RM",
  "Luxembourg": "€",
  "Mexico": "MX$",
  "Monaco": "€",
  "Morocco": "MAD",
  "Netherlands": "€",
  "New Zealand": "NZD",
  "Nigeria": "₦",
  "Norway": "kr",                  // (NOK)
  "Pakistan": "₨",
  "Paraguay": "PYG",
  "Peru": "S/",
  "Philippines": "₱",
  "Poland": "zł",
  "Portugal": "€",
  "Romania": "lei",
  "Russia": "₽",
  "San Marino": "€",
  "Saudi Arabia": "SAR",
  "Senegal": "XOF",
  "Singapore": "S$",
  "South Africa": "R",
  "South Korea": "₩",
  "Spain": "€",
  "Sri Lanka": "Rs",
  "Sweden": "kr",                  // (SEK)
  "Switzerland": "CHF",
  "Thailand": "฿",
  "Trinidad & Tobago": "TTD",
  "Tunisia": "DT",
  "Turkey": "₺",
  "Ukraine": "₴",
  "United Arab Emirates": "AED",
  "United Kingdom": "£",
  "United States": "$",
  "Uruguay": "UYU",
  "Uzbekistan": "UZS",
  "Vatican City": "€",
  "Venezuela": "VES",
  "Vietnam": "₫",
  "Yemen": "YER",
  "Zambia": "ZMW",
  "Zimbabwe": "ZWL",
   };

    const originCurrencySymbol = currencySymbols[originCountry] || originCountry;

    if (!process.env.OPENAI_API_KEY) {
      return new Response('Missing OPENAI_API_KEY', { status: 500 });
    }
    if (!originRaw || !targetCountry) {
      return new Response('Missing required fields: originRaw, targetCountry', { status: 400 });
    }

    const system = [
      'You are a multilingual pharmaceutical expert comparing medicines across countries.',
      'Using the origin profile as a clinical reference (originRaw), find up to 5 equivalent or similar drugs available in the TARGET COUNTRY.',
      'You MUST return exactly 5 entries, even if similarity is partial or uncertain.',
      'It’s acceptable to include drugs with low similarity or incomplete info; just write "n/a" where data is missing.',
      'For each medicine, output all of the following fields in markdown, following the structure below exactly:',
      'Sort the proposed equivalence on the basis of their similarity level, first the most similar and last the least similar',
      '',
      '1. **Name:**',
      '   - **Active Ingredients:**',
      '   - **Formulation/Dosage:**',
      '   - **Legal Classification (Rx/OTC):**',
      '   - **Manufacturer:**',
      '   - **Estimated Similarity % to original:**',
      '   - **Therapeutic indications and posology:**',
      '   - **Side effects:**',
      '   - **Contraindications and precautions:**',
      '   - **Interactions with other medications:**',
      `   - **Price in ${targetCountry}:** (e.g. "£5.30 from NHS UK – Aug 2025" or "n/a")`,
      `               - **Converted Price in ${originCurrencySymbol}:** (approximate value converted from target currency using current exchange rates OR "n/a")`,
      '   - **Reimbursability from National Healthcare System:**',
      '   - **Notes on any differences:**',
      '',
    'Keep responses clear, concise, and clinically useful.',
    ].join('\n');

    const user = [
      `Origin country: ${originCountry || 'n/a'}`,
      `Target country: ${targetCountry}`,
      `Original drug: ${drug || 'n/a'}`,
      `Requested dosage (optional): ${dosage || 'n/a'}`,
      '',
      'Origin profile text (verbatim anchor):',
      '"""',
      originRaw,
      '"""',
    ].join('\n');

    const resp = await fetch(API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!resp.ok) {
      const errTxt = await resp.text();
      return new Response(errTxt || 'OpenAI error', { status: 500 });
    }

    const data = await resp.json();
    const content =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      '';

    // Your page.tsx renders this markdown as-is under the Equivalents header
    return Response.json({ response: content });
  } catch (e: any) {
    return new Response(e?.message || 'Server error', { status: 500 });
  }
}
