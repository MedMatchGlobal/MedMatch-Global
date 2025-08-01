import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const drugs = await prisma.drugUS.findMany({
      orderBy: { name: 'asc' },
      take: 1000,
    });

    return NextResponse.json(drugs);
  } catch (error) {
    console.error('❌ Error fetching US drugs:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
    