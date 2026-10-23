import { describe, expect, it } from "vitest";
import { boundsOf, circleRing, distanceKm, pointAt, radiusKmFromBounds } from "./mapGeometry";

const zona7 = { latitude: -23.4205, longitude: -51.9331 };

describe("geometria do mapa", () => {
  it("REQ-SRCH-013 pointAt e distanceKm concordam: 2 km a leste ficam a 2 km", () => {
    expect(distanceKm(zona7, pointAt(zona7, 90, 2))).toBeCloseTo(2, 2);
    expect(distanceKm(zona7, zona7)).toBe(0);
  });

  it("REQ-SRCH-013 o círculo aproximado fecha o anel e todo vértice fica no raio de 500 m", () => {
    const ring = circleRing(zona7, 500);
    expect(ring[0]).toEqual(ring.at(-1));
    for (const [longitude, latitude] of ring) expect(distanceKm(zona7, { latitude, longitude })).toBeCloseTo(0.5, 2);
  });

  it("REQ-SRCH-013 o raio da busca é a metade do lado menor do recorte", () => {
    const east = pointAt(zona7, 90, 3);
    const north = pointAt(zona7, 0, 2);
    const south = pointAt(zona7, 180, 2);
    const west = pointAt(zona7, 270, 3);
    const radius = radiusKmFromBounds({
      west: west.longitude,
      east: east.longitude,
      north: north.latitude,
      south: south.latitude,
    });
    expect(radius).toBe(2);
  });

  it("REQ-SRCH-013 boundsOf cobre todos os pontos e não inventa recorte sem eles", () => {
    expect(boundsOf([])).toBeUndefined();
    expect(
      boundsOf([
        { latitude: -23.4, longitude: -51.9 },
        { latitude: -23.5, longitude: -52 },
      ]),
    ).toEqual({ west: -52, east: -51.9, south: -23.5, north: -23.4 });
  });
});
