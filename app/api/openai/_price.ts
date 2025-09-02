// /app/api/openai/_price.ts
type PriceArgs = {
  drug: string;
  country: string;
  dosage?: string;
};

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const API = 'https://api.openai.com/v1/chat/completions';

function hasPriceLine(md: string, country: string) {
  const re = new RegExp(String.raw`^\s*-\s*\*\*Price in ${country}:\*\*`, 'im');
  return re.test(md);
}

function replaceOrInsertPriceLine(md: string, country: string, newLine: string) {
  const priceRe = new RegExp(String.raw`^\s*-\s*\*\*Price in ${country}:\*\*.*$`, 'im');
  const notesRe = new RegExp(String.raw`^\s*-\s*\*\*Notes:\*\*`, 'im');

  if (priceRe.test(md)) {
    return md.replace(priceRe, newLine);
  }
  if (notesRe.test(md)) {
    return md.replace(notesRe, `${newLine}\n- **Notes:**`);
  }
  return `${md.trim()}\n${newLine}\n`;
}

/**
 * Ensures a bullet line is present:
 *   - **Price in <country>:** <value + currency + short source + (Month YYYY) | n/a>
 * If a confident price cannot be found, inserts "n/a".
 */
export async function ensurePriceLine(
  md: string,
  { drug, country, dosage }: PriceArgs
): Promise<string> {
  const existingRe = new RegExp(
    String.raw`^\s*-\s*\*\*Price in ${country}:\*\*\s*(?!n\/a\b).+`,
    'im'
  );
  if (existingRe.test(md)) return md;

  const system = [
    'Return ONE single markdown bullet line for medicine price.',
    'Do not include any extra text before or after the line.',
    'If you cannot verify a current retail/prescription price, return "n/a".',
    'If a fixed NHS/official dispensing fee applies, state it clearly.',
    'Prefer official / reputable sources and include a short source tag + (Month YYYY).',
    'Output MUST be exactly:',
    `- **Price in ${country}:** <price info OR n/a>`,
  ].join('\n');

  const user = [
    `Drug: ${drug}`,
    `Country: ${country}`,
    `Dosage/strength (optional): ${dosage || 'n/a'}`,
    'Include currency. Prefer a current per-item or per-pack figure, or the official Rx fee if applicable.',
  ].join('\n');

  try {
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

    if (!resp.ok) throw new Error(await resp.text());
    const data = await resp.json();
    const line =
      data?.choices?.[0]?.message?.content?.trim() ||
      `- **Price in ${country}:** n/a`;

    const safeLine = line.startsWith(`- **Price in ${country}:**`)
      ? line
      : `- **Price in ${country}:** ${line.replace(/^-+\s*/,'')}`;

    return replaceOrInsertPriceLine(md, country, safeLine);
  } catch {
    const fallback = `- **Price in ${country}:** n/a`;
    return hasPriceLine(md, country) ? md : replaceOrInsertPriceLine(md, country, fallback);
  }
}
