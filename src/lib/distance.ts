export type LatLng = { lat: number; lng: number };

const R_KM = 6371;

export function distanceKm(from: LatLng, to: LatLng): number {
  if (!isFinite(from.lat) || !isFinite(from.lng) || !isFinite(to.lat) || !isFinite(to.lng)) return NaN;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R_KM * c).toFixed(3);
}

export function walkingMinutes(distanceKmValue: number, kmPerHour = 5): number {
  if (!isFinite(distanceKmValue) || distanceKmValue < 0) return NaN;
  return Math.round((distanceKmValue / kmPerHour) * 60);
}

function toRad(v: number): number {
  return (v * Math.PI) / 180;
}


