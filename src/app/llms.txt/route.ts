import { getLlmsText } from "@/src/lib/site-info";

export const dynamic = "force-static";

export function GET() {
  return new Response(getLlmsText(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
