import type { HostListingProfile, MyListings } from "../types";
import { HOST_HOME_PATH, listingPath } from "./listingPaths";

export type NewListingGate = { kind: "open" } | { kind: "noPayouts" } | { kind: "redirect"; to: string };

/**
 * Se o cadastro do cantinho pode abrir (REQ-LIST-002): sem anfitrião verificado, volta ao painel; sem recebimento
 * liberado (`stripePayoutsEnabled`), mostra o aviso; pessoa física com cantinho vai para ele (um só); empresa abre um
 * por filial.
 *
 * @example const gate = newListingGate(await getHostListingProfile(id), await getMyListings(id));
 */
export function newListingGate(profile: HostListingProfile | null, mine: MyListings): NewListingGate {
  if (!profile) return { kind: "redirect", to: HOST_HOME_PATH };
  if (!profile.payoutsEnabled) return { kind: "noPayouts" };
  const [existing] = mine.listings;
  if (profile.kind === "person" && existing) return { kind: "redirect", to: listingPath(existing.id) };
  return { kind: "open" };
}
