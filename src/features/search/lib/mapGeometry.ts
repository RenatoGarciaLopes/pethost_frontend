/** Ponto no mapa em graus. @example { latitude: -23.42, longitude: -51.93 } */
export interface GeoPoint {
  latitude: number;
  longitude: number;
}
/** Recorte visível do mapa em graus. @example { west: -52, south: -23.5, east: -51.8, north: -23.3 } */
export interface GeoBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

const EARTH_RADIUS_KM = 6371.0088;
const toRad = (degrees: number) => (degrees * Math.PI) / 180;
const toDeg = (radians: number) => (radians * 180) / Math.PI;

/** Distância em linha reta, em km. @example distanceKm(a, b) // 1.4 */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Ponto a `km` do centro, no rumo `bearingDegrees` (0 = norte, 90 = leste). @example pointAt(center, 90, 2) */
export function pointAt(center: GeoPoint, bearingDegrees: number, km: number): GeoPoint {
  const angular = km / EARTH_RADIUS_KM;
  const bearing = toRad(bearingDegrees);
  const lat1 = toRad(center.latitude);
  const lon1 = toRad(center.longitude);
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing));
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
    );
  return { latitude: toDeg(lat2), longitude: toDeg(lon2) };
}

/** Anel fechado (GeoJSON `[lng, lat]`) de raio `radiusMeters`. @example circleRing(center, 500) */
export function circleRing(center: GeoPoint, radiusMeters: number, steps = 64): [number, number][] {
  const ring = Array.from({ length: steps }, (_, step) => {
    const point = pointAt(center, (step / steps) * 360, radiusMeters / 1000);
    return [point.longitude, point.latitude] as [number, number];
  });
  return [...ring, ring[0]];
}

/**
 * Raio, em km, que o recorte cobre a partir do centro: a metade do lado menor, para a busca nunca trazer
 * mais do que a pessoa enxerga. Uma casa decimal. @example radiusKmFromBounds(bounds) // 2.4
 */
export function radiusKmFromBounds(bounds: GeoBounds): number {
  const centerLat = (bounds.north + bounds.south) / 2;
  const centerLon = (bounds.east + bounds.west) / 2;
  const halfHeight =
    distanceKm({ latitude: bounds.south, longitude: centerLon }, { latitude: bounds.north, longitude: centerLon }) / 2;
  const halfWidth =
    distanceKm({ latitude: centerLat, longitude: bounds.west }, { latitude: centerLat, longitude: bounds.east }) / 2;
  return Math.round(Math.min(halfHeight, halfWidth) * 10) / 10;
}

/** Menor retângulo que cobre os pontos; `undefined` sem pontos. @example boundsOf([a, b]) */
export function boundsOf(points: GeoPoint[]): GeoBounds | undefined {
  if (!points.length) return undefined;
  return {
    west: Math.min(...points.map((point) => point.longitude)),
    east: Math.max(...points.map((point) => point.longitude)),
    south: Math.min(...points.map((point) => point.latitude)),
    north: Math.max(...points.map((point) => point.latitude)),
  };
}
