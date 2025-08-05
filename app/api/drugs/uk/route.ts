import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
