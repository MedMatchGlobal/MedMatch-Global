// app/api/drugs/[cc]/brands/route.ts
import { NextResponse } from "next/server";

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
export async function GET(req: Request, context: { params: any }) {
  const { params } = context;
  const cc = (params?.cc || "").toLowerCase();

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Number(url.searchParams.get("limit") || "20");
  const offset = Number(url.searchParams.get("offset") || "0");

  // Validation
  if (!cc || cc.length < 2 || cc.length > 3) {
    return NextResponse.json(
      { error: "Missing or invalid country code `cc` path param." },
      { status: 400 }
    );
  }

  if (Number.isNaN(limit) || limit < 0 || limit > 200) {
    return NextResponse.json({ error: "Invalid `limit` (0–200)." }, { status: 400 });
  }

  if (Number.isNaN(offset) || offset < 0) {
    return NextResponse.json({ error: "Invalid `offset` (>= 0)." }, { status: 400 });
  }

  // Placeholder response
  return NextResponse.json(
    { cc, query: q, total: 0, brands: [] },
    { status: 200 }
  );
}