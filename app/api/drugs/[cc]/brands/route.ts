// app/api/drugs/[cc]/brands/route.ts
import { NextResponse } from "next/server";

/**
 * Preflight / CORS (optional but harmless)
 */
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
 * Second arg **must** be typed inline as { params: { ... } } — no aliases.
 */
export async function GET(
  req: Request,
  { params }: { params: { cc: string } }
) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Number(url.searchParams.get("limit") || "20");
  const offset = Number(url.searchParams.get("offset") || "0");

  const cc = (params?.cc || "").toLowerCase();

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
    // ── TODO: replace with your real data fetch (Prisma/SQL/etc.) ─────────────
    // const { total, brands } = await getBrandsForCountry({ cc, q, limit, offset });

    // Temporary placeholder so route works:
    const total = 0;
    const brands: string[] = [];

    return NextResponse.json({ cc, query: q, total, brands }, { status: 200 });
  } catch (err) {
    console.error("brands route error:", err);
    return NextResponse.json({ error: "Failed to fetch brands." }, { status: 500 });
  }
}
