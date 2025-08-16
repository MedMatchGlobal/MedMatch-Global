// app/api/drugs/[cc]/brands/route.ts
import { NextResponse } from "next/server";

/**
 * Optional: make this "edge" if you want
 * export const runtime = "edge";
 */

type Context = { params: { cc: string } };

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function ok<T>(data: T) {
  return NextResponse.json(data, { status: 200 });
}

/**
 * CORS / preflight
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
 *
 * Responds with:
 * {
 *   cc: "uk",
 *   query: "para",
 *   total: 0,
 *   brands: []
 * }
 */
export async function GET(req: Request, { params }: Context) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Number(url.searchParams.get("limit") || "20");
  const offset = Number(url.searchParams.get("offset") || "0");

  const cc = (params?.cc || "").toLowerCase();

  if (!cc || cc.length < 2 || cc.length > 3) {
    return badRequest("Missing or invalid country code `cc` path param.");
  }
  if (Number.isNaN(limit) || limit < 0 || limit > 200) {
    return badRequest("Invalid `limit` (0–200).");
  }
  if (Number.isNaN(offset) || offset < 0) {
    return badRequest("Invalid `offset` (>= 0).");
  }

  try {
    /**
     * ── Plug your real data source here ────────────────────────────────────────
     * If you already have Prisma / DB helpers, call them and return:
     *   { cc, query: q, total, brands }
     *
     * Example shape (keep this shape stable for the UI):
     *   const { total, brands } = await getBrandsForCountry({ cc, q, limit, offset });
     */

    // TEMP placeholder so the route compiles & works immediately:
    const total = 0;
    const brands: string[] = [];

    // If you want a quick in-memory demo while wiring up real data, uncomment:
    // const demo: Record<string, string[]> = {
    //   uk: ["Paracetamol", "Panadol", "Calpol", "Tylenol (US import)", "Anadin"],
    //   us: ["Acetaminophen", "Tylenol", "Excedrin", "Midol", "FeverAll"],
    // };
    // const all = (demo[cc] || []).filter((n) =>
    //   q ? n.toLowerCase().includes(q.toLowerCase()) : true
    // );
    // const total = all.length;
    // const brands = all.slice(offset, offset + limit);

    return ok({ cc, query: q, total, brands });
  } catch (err) {
    console.error("brands route error:", err);
    return NextResponse.json(
      { error: "Failed to fetch brands." },
      { status: 500 }
    );
  }
}
