import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Load your JSON file
const filePath = path.join(__dirname, '../data/cleaned.uk-drugs.json'); // ✅ make sure this path exists
const raw = fs.readFileSync(filePath, 'utf-8');
const parsed = JSON.parse(raw);

// Helper to clean weird values
const normalize = (value: string | null | undefined): string | null => {
  if (!value || value.toLowerCase() === 'not available') return null;
  return value;
};

// Use correct Prisma type here
const drugs: Prisma.DrugUKCreateManyInput[] = parsed.map((drug: any) => ({
  name: drug.name,
  form: normalize(drug.form),
  strength: normalize(drug.strength),
  dmCode: drug.dmCode,
}));

async function main() {
  await prisma.drugUK.createMany({
    data: drugs,
    skipDuplicates: true,
  });

  console.log(`✅ Inserted ${drugs.length} entries into DrugUK`);
}

main()
  .catch((e) => {
    console.error('❌ Error inserting drugs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
