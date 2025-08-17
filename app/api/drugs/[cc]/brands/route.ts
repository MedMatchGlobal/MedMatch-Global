// app/api/drugs/[cc]/brands/route.ts
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

/**
 * GET /api/drugs/[cc]/brands?q=...&limit=20&offset=0
 *
 * NOTE: The second arg MUST be typed inline as { params: { cc: string } }
 * for Next.js App Router / Vercel to recognise it.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { cc: string } }
) {
  const url = new URL(req.url);

  const q = (url.searchParams.get("q") || "").trim();
  const limitRaw = url.searchParams.get("limit") || "20";
  const offsetRaw = url.searchParams.get("offset") || "0";

  const limit = Number(limitRaw);
  const offset = Number(offsetRaw);
  const cc = (params?.cc || "").trim().toLowerCase();

  // Basic validation
  if (!cc || cc.length < 2 || cc.length > 3) {
    return cors({ error: "Missing or invalid path param `cc` (2–3 letters)." }, { status: 400 });
  }
  if (Number.isNaN(limit) || limit < 0 || limit > 200) {
    return cors({ error: "Invalid `limit` (0–200)." }, { status: 400 });
  }
  if (Number.isNaN(offset) || offset < 0) {
    return cors({ error: "Invalid `offset` (>= 0)." }, { status: 400 });
  }

  try {
    // TODO: replace this stub with your real DB call (Prisma/SQL/etc.)
    // Example expected shape:
    // const { total, brands } = await getBrandsForCountry({ cc, q, limit, offset });

    const total = 0;
    const brands: { id: string; name: string }[] = [];

    return cors({ cc, query: q, total, brands }, { status: 200 });
  } catch (err) {
    console.error("GET /brands error:", err);
    return cors({ error: "Failed to fetch brands." }, { status: 500 });
  }
}
