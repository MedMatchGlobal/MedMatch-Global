import { NextResponse } from 'next/server';
import countries from '@/data/countries';

export async function POST(req: Request) {
  const body = await req.json();

  if (body?.type === "countries") {
    return NextResponse.json({ options: countries });
  }

  return NextResponse.json(
    { error: "Invalid type" },
    { status: 400 }
  );
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
