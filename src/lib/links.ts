import type { LatLng } from "./distance";

export function mapsSearchUrl(input: string | LatLng): string {
  if (typeof input === "string") {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(input)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${input.lat},${input.lng}`;
}

export function safeUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
}


