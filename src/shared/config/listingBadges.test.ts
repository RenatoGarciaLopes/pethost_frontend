import { expect, it } from "vitest";
import { isListingBadge, LISTING_BADGES, listingBadgeLabel } from "./listingBadges";

it("REQ-SRCH-007 REQ-LPAGE-001 todo selo conhecido tem rótulo em português", () => {
  expect(LISTING_BADGES.map(listingBadgeLabel)).toEqual([
    "Vizinho",
    "Responde rápido",
    "Casa com quintal",
    "Experiente",
    "Bem avaliado",
  ]);
});

it("REQ-LPAGE-001 código novo da API fica de fora, nunca aparece cru", () => {
  expect(["neighbor", "selo_novo", "yard"].filter(isListingBadge)).toEqual(["neighbor", "yard"]);
});
