import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Nominatim = { lat: string; lon: string; display_name?: string };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q) return NextResponse.json({ error: "q required" }, { status: 400 });

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`,
    { headers: { "User-Agent": "milan-trip-planner/1.0 (contact: you@example.com)" } },
  );
  if (!res.ok) return NextResponse.json({ error: "geocode failed" }, { status: 502 });

  const data: Nominatim[] = await res.json();
  const hit = data[0];
  if (!hit) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ lat: +hit.lat, lng: +hit.lon, label: hit.display_name });
}


