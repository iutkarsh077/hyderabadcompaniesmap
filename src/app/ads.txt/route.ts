import { getAdsensePublisherId } from "@/lib/adsense";

export const dynamic = "force-dynamic";

export function GET() {
  const publisherId = getAdsensePublisherId();
  if (!publisherId) {
    return new Response(null, { status: 404 });
  }

  const body = `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
