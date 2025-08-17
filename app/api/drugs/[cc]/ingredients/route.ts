// app/api/drugs/[cc]/ingredients/route.ts
import { NextResponse } from "next/server";

type Item = { id: string | number; name: string };
type List = { items: Item[] };

// --- TEMP sample data (replace with your DB lookups) ---
const UK_ING: Item[] = [
  { id: "paracetamol", name: "Paracetamol" },
  { id: "ibuprofen", name: "Ibuprofen" },
  { id: "co-codamol", name: "Co-codamol" },
];

const US_ING: Item[] = [
  { id: "acetaminophen", name: "Acetaminophen" },
  { id: "ibuprofen", name: "Ibuprofen" },
  { id: "naproxen", name: "Naproxen" },
];

function filter(list: Item[], q: string, limit: number): Item[] {
  const lo = q.toLowerCase();
  return list.filter(x => x.name.toLowerCase().includes(lo)).slice(0, limit);
}

// TODO: replace this with real DB queries
async function lookup(cc: "uk" | "us", q: string, limit: number): Promise<Item[]> {
  return cc === "uk" ? filter(UK_ING, q, limit)
       : cc === "us" ? filter(US_ING, q, limit)
       : [];
}

/** Preflight / CORS (optional) */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

/**
 * GET /api/drugs/[cc]/ingredients?q=...&limit=20
 * NOTE: we intentionally do NOT type the 2nd arg so Next’s validator is happy.
 */
export async function GET(req: Request, ctx: any) {
  const params = (ctx?.params ?? {}) as Record<string, string>;
  const cc = (params.cc || "").toLowerCase() as "uk" | "us";

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.max(1, Math.min(50, Number(searchParams.get("limit") || "20")));

  if (!q || q.length < 2) {
    return NextResponse.json<List>({ items: [] }, { status: 200 });
  }

  const items = await lookup(cc, q, limit);
  return NextResponse.json<List>({ items }, { status: 200 });
}
