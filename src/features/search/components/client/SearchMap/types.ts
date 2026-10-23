import type { GeoPoint } from "../../../lib/mapGeometry";

/** Origem da busca, com o rótulo curto do lugar ("Zona 7"). @example { latitude: -23.42, longitude: -51.93, label: "Zona 7" } */
export interface SearchMapOrigin extends GeoPoint {
  label?: string;
}
