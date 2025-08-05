import { NextResponse } from 'next/server';
import updateDrugUK from '@/scripts/updateDrugUK'
import updateDrugUS from '@/scripts/updateDrugUS';

export async function GET() {
  try {
    await updateDrugUK();
    await updateDrugUS();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('CRON Error:', err);
    return NextResponse.json({ ok: false, error: err }, { status: 500 });
  }
}
