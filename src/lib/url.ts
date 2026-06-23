const ALLOWED_OUTBOUND_PROTOCOLS = new Set(["http:", "https:"]);

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ALLOWED_OUTBOUND_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

export function withUtmSource(value: string, source = "dutyit.net"): string {
  if (!isHttpUrl(value)) {
    throw new TypeError("Only http and https URLs are allowed.");
  }

  const url = new URL(value);
  url.searchParams.set("utm_source", source);
  return url.toString();
}
