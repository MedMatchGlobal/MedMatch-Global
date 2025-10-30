// app/api/drugs/uk/route.ts (and us/route.ts, [cc]/brands, [cc]/ingredients, etc.)
export const runtime = 'nodejs';

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const drugs = await prisma.drugUK.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(drugs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch UK drugs.' }, { status: 500 });
  }
}
