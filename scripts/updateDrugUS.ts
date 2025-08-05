import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export default async function updateDrugUS() {
  const filePath = path.join(process.cwd(), 'data', 'cleaned.us-drugs.json');
  const data = await fs.readFile(filePath, 'utf8');
  const drugNames = JSON.parse(data);

  await prisma.drugUS.deleteMany(); // Optional: clear before inserting
  await prisma.drugUS.createMany({
    data: drugNames.map((name: string) => ({ name })),
    skipDuplicates: true
  });
}
