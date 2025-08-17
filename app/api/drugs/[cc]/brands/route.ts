// app/api/drugs/[cc]/brands/route.ts
import { NextResponse } from "next/server";

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
 * GET /api/drugs/[cc]/brands?q=...&limit=20&offset=0
 * NOTE: we intentionally do NOT type the 2nd arg so Next’s validator is happy.
 */
export async function GET(req: Request, ctx: any) {
  const params = (ctx?.params ?? {}) as Record<string, string>;
  const cc = (params.cc || "").toLowerCase();

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Number(url.searchParams.get("limit") || "20");
  const offset = Number(url.searchParams.get("offset") || "0");

  // basic validation
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

  try {
    // TODO: replace with real DB call (Prisma/SQL/etc.)
    // const { total, brands } = await getBrandsForCountry({ cc, q, limit, offset });

    const total = 0;
    const brands: string[] = [];

    return NextResponse.json({ cc, query: q, total, brands }, { status: 200 });
  } catch (err) {
    console.error("brands route error:", err);
    return NextResponse.json({ error: "Failed to fetch brands." }, { status: 500 });
  }
}
