import type { Place } from "@/types/place";
import { mapsSearchUrl } from "./links";

export async function hydratePlaces(raw: any[]): Promise<Place[]> {
  const out: Place[] = [];
  for (const r of raw) {
    let lat = r.lat, lng = r.lng;
    if ((lat == null || lng == null) && r.address) {
      try {
        const g = await fetch(`/api/geocode?q=${encodeURIComponent(r.address)}`).then((r) => r.json());
        if (g && typeof g.lat === "number" && typeof g.lng === "number") {
          lat = g.lat;
          lng = g.lng;
        }
      } catch {
        // ignore; will fail below
      }
    }
    // If still missing coords, allow NaN and keep entry (we can still link by name/address)
    const hasNumbers = typeof lat === "number" && typeof lng === "number";
    if (!hasNumbers) {
      lat = Number.NaN;
      lng = Number.NaN;
    }

    const computedMaps =
      r.googleMapsUrl ??
      (Number.isFinite(lat) && Number.isFinite(lng)
        ? mapsSearchUrl({ lat, lng })
        : r.address
        ? mapsSearchUrl(String(r.address))
        : mapsSearchUrl(String(r.name ?? r.id)));

    out.push({
      id: String(r.id),
      name: String(r.name),
      address: r.address ?? undefined,
      lat,
      lng,
      websiteUrl: r.websiteUrl ?? undefined,
      googleMapsUrl: computedMaps,
      tags: Array.isArray(r.tags) ? r.tags.map(String) : undefined,
      notes: r.notes ?? undefined,
    });
  }
  return out;
}


