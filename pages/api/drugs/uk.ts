import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const drugs = await prisma.drugUK.findMany({
      orderBy: { name: 'asc' },
      take: 1000,
    });
    res.status(200).json(drugs);
  } catch (error) {
    console.error('❌ Error fetching UK drugs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
