import type { ListingSummary } from "../../../api/contracts";
import type { GeoPoint } from "../../../lib/mapGeometry";

/**
 * Cantinho no mapa: o resumo da busca mais o círculo aproximado do backend (`approximateLocation`, ponto deslocado
 * e arredondado, nunca a casa). Nunca receber coordenada exata. @example { ...listing, approximateLocation: { latitude, longitude, radiusMeters: 500 } }
 */
export interface SearchMapListing extends Pick<
  ListingSummary,
  "id" | "title" | "neighborhood" | "nightlyRate" | "coverPhotoUrl" | "distanceKm"
> {
  approximateLocation: GeoPoint & { radiusMeters: number };
  rating?: { average: number; count: number } | null;
}

/** Origem da busca, com o rótulo curto do lugar ("Zona 7"). @example { latitude: -23.42, longitude: -51.93, label: "Zona 7" } */
export interface SearchMapOrigin extends GeoPoint {
  label?: string;
}
