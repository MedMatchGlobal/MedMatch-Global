// scripts/loadDrugUK.ts

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, '../data/uk-drugs.json');
  const data = await fs.readFile(filePath, 'utf-8');
  const drugNames: string[] = JSON.parse(data);

  console.log(`💥 Deleting all existing DrugUK entries...`);
  await prisma.drugUK.deleteMany({});

  console.log(`🚀 Inserting ${drugNames.length} new drugs into DrugUK...`);
  for (let i = 0; i < drugNames.length; i += 1000) {
    const chunk = drugNames.slice(i, i + 1000);
    await prisma.drugUK.createMany({
      data: chunk.map(name => ({ name })),
      skipDuplicates: true,
    });
    console.log(`✅ Inserted ${Math.min(i + 1000, drugNames.length)} of ${drugNames.length}`);
  }

  console.log('🎉 UK drug list update complete!');
}

main()
  .catch(e => {
    console.error('❌ Error loading DrugUK:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
