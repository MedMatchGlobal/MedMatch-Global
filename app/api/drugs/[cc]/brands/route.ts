import { NextRequest, NextResponse } from 'next/server';

type Item = { id: string | number; name: string };
type List = { items: Item[] };

// --- TEMP sample data (replace with your DB lookups) ---
const UK_BRANDS: Item[] = [
  { id: 'panadol', name: 'Panadol' },
  { id: 'calpol', name: 'Calpol' },
  { id: 'anadin', name: 'Anadin' },
];

const US_BRANDS: Item[] = [
  { id: 'tylenol', name: 'Tylenol' },
  { id: 'advil', name: 'Advil' },
  { id: 'aleve', name: 'Aleve' },
];

function filter(list: Item[], q: string, limit: number): Item[] {
  const lo = q.toLowerCase();
  return list.filter(x => x.name.toLowerCase().includes(lo)).slice(0, limit);
}

// TODO: replace this with real DB queries
async function lookup(cc: 'uk' | 'us', q: string, limit: number): Promise<Item[]> {
  return cc === 'uk' ? filter(UK_BRANDS, q, limit)
       : cc === 'us' ? filter(US_BRANDS, q, limit)
       : [];
}

export async function GET(req: NextRequest, { params }: { params: { cc: string } }) {
  const cc = (params.cc || '').toLowerCase() as 'uk' | 'us';
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  const limit = Math.max(1, Math.min(50, Number(searchParams.get('limit') || '20')));

  if (!q || q.length < 2) return NextResponse.json<List>({ items: [] });

  const items = await lookup(cc, q, limit);
  return NextResponse.json<List>({ items });
}
