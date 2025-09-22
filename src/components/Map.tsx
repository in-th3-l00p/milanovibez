"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Place } from "@/types/place";

function loadGoogleMaps(apiKey: string): Promise<typeof google> {
  const existing = (window as any)._gmapsPromise as Promise<typeof google> | undefined;
  if (existing) return existing;
  const p = new Promise<typeof google>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve((window as any).google as typeof google);
    script.onerror = () => reject(new Error("google maps failed to load"));
    document.head.appendChild(script);
  });
  (window as any)._gmapsPromise = p;
  return p;
}

export type MapProps = {
  places: Place[];
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
};

export default function Map({ places, center, zoom = 13, className }: MapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const ref = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const coords = useMemo(
    () => places.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)),
    [places],
  );

  useEffect(() => {
    if (!ref.current) return;
    if (!apiKey) {
      setError("missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
      return;
    }
    let map: google.maps.Map | null = null;
    let markers: google.maps.Marker[] = [];
    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then((g) => {
        if (!ref.current || cancelled) return;
        const defaultCenter = center ?? { lat: 45.4642, lng: 9.19 }; // Milan
        map = new g.maps.Map(ref.current, {
          center: defaultCenter,
          zoom,
          mapId: undefined,
          disableDefaultUI: true,
        });
        markers = coords.map((p) =>
          new g.maps.Marker({ position: { lat: p.lat, lng: p.lng }, map, title: p.name }),
        );
        if (markers.length > 0) {
          const bounds = new g.maps.LatLngBounds();
          for (const m of markers) bounds.extend(m.getPosition()!);
          map.fitBounds(bounds, 32);
        }
      })
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => {
        // noop
      });
    return () => {
      cancelled = true;
      markers.forEach((m) => m.setMap(null));
      map = null;
    };
  }, [apiKey, center, zoom, coords]);

  if (!apiKey) {
    return (
      <div className={className ?? ""}>
        <div className="w-full h-full grid place-items-center text-sm border border-black lowercase">
          add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to show the map
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className ?? ""}>
        <div className="w-full h-full grid place-items-center text-sm border border-black lowercase">
          map error: {error}
        </div>
      </div>
    );
  }

  return <div ref={ref} className={className} />;
}


