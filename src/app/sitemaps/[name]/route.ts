import { getSitemapResponse } from "@/src/lib/api/sitemap";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  return getSitemapResponse((await params).name);
}
