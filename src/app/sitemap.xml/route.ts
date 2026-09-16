import { getSitemapResponse } from "@/src/lib/api/sitemap";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return getSitemapResponse("index");
}
