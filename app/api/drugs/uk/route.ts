import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const drugs = await prisma.drugUK.findMany({
      orderBy: { name: 'asc' },
      take: 1000,
    });

    return NextResponse.json(drugs);
  } catch (error) {
    console.error('❌ Error fetching UK drugs:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}
