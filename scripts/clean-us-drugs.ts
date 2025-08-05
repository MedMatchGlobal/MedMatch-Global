import fs from 'fs';
import path from 'path';

type FDADrug = {
  brand_name?: string;
  product_ndc?: string;
};

const inputPath = path.join(__dirname, '../data/fda-ndc.json');
const outputPath = path.join(__dirname, '../data/cleaned.us-drugs.json');

async function main() {
  const rawData = fs.readFileSync(inputPath, 'utf-8');
  const drugs: FDADrug[] = JSON.parse(rawData);

  // Filter out entries with valid brand_name and product_ndc
  const uniqueMap = new Map<string, string>();

  drugs.forEach((d) => {
    if (
      typeof d.brand_name === 'string' &&
      d.brand_name.trim().length > 0 &&
      typeof d.product_ndc === 'string'
    ) {
      uniqueMap.set(d.brand_name.trim(), d.product_ndc);
    }
  });

  const cleaned = Array.from(uniqueMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, ndcCode]) => ({ name, ndcCode }));

  fs.writeFileSync(outputPath, JSON.stringify(cleaned, null, 2), 'utf-8');
  console.log(`✅ Saved ${cleaned.length} cleaned US drug names to ${outputPath}`);
}

main().catch((err) => {
  console.error('❌ Failed to clean US drugs:', err);
  process.exit(1);
});
