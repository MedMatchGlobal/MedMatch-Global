// app/api/drugs/[cc]/ingredients/route.ts
import { NextResponse, type NextRequest } from "next/server";

/** Force dynamic so this route never gets statically optimized. */
export const dynamic = "force-dynamic";

/** CORS helper (used for both OPTIONS and GET). */
function cors(json: unknown, init?: ResponseInit) {
  const res = NextResponse.json(json, init);
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Max-Age", "86400");
  return res;
}

/** Preflight (CORS) */
export async function OPTIONS() {
  return cors(null, { status: 204 });
}

/** Types */
type Item = { id: string | number; name: string };
type List = { items: Item[] };

/** TEMP sample data (replace with DB) */
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

/**
 * GET /api/drugs/[cc]/ingredients?q=...&limit=20
 *
 * NOTE: The second arg MUST be typed inline as { params: { cc: string } }
 * for Next.js App Router / Vercel to recognise it.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { cc: string } }
) {
  const cc = (params.cc || "").toLowerCase() as "uk" | "us";
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") || "").trim();
  const limit = Math.max(1, Math.min(50, Number(searchParams.get("limit") || "20")));

  if (!q || q.length < 2) return cors<List>({ items: [] }, { status: 200 });

  try {
    const items = await lookup(cc, q, limit);
    return cors<List>({ items }, { status: 200 });
  } catch (err) {
    console.error("GET /ingredients error:", err);
    return cors({ error: "Failed to fetch ingredients." }, { status: 500 });
  }
}
