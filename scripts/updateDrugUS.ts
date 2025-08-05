import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const inputPath = path.join(__dirname, '../data/cleaned.us-drugs.json');

async function main() {
  const rawData = fs.readFileSync(inputPath, 'utf-8');
  const drugs = JSON.parse(rawData);

  await prisma.drugUS.deleteMany(); // optional: clear old entries

  const result = await prisma.drugUS.createMany({
    data: drugs,
    skipDuplicates: true,
  });

  console.log(`✅ Inserted ${result.count} entries into DrugUS`);
}

main().catch((err) => {
  console.error('❌ Error inserting drugs:', err);
  process.exit(1);
});
