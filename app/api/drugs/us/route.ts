import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const drugs = await prisma.drugUS.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(drugs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch US drugs.' }, { status: 500 });
  }
}
