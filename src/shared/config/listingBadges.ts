/**
 * Selos automáticos do cantinho, calculados pela API (`badges` da busca e do detalhe). Fonte única dos códigos e dos
 * rótulos: o card da busca e a página do cantinho leem daqui. Selo é informação, nunca filtro.
 */
export const LISTING_BADGES = ["neighbor", "fast_responder", "yard", "experienced", "well_rated"] as const;

export type ListingBadge = (typeof LISTING_BADGES)[number];

const LABELS: Record<ListingBadge, string> = {
  neighbor: "Vizinho",
  fast_responder: "Responde rápido",
  yard: "Casa com quintal",
  experienced: "Experiente",
  well_rated: "Bem avaliado",
};

/**
 * Rótulo em português do selo.
 * @example listingBadgeLabel("neighbor") // "Vizinho"
 */
export function listingBadgeLabel(badge: ListingBadge): string {
  return LABELS[badge];
}

/**
 * Confere se o código veio da lista conhecida; o detalhe tipa `badges` como texto livre e código novo da API fica de
 * fora até ganhar rótulo (nunca aparece cru na tela).
 * @example ["neighbor", "x"].filter(isListingBadge) // ["neighbor"]
 */
export function isListingBadge(value: string): value is ListingBadge {
  return (LISTING_BADGES as readonly string[]).includes(value);
}
