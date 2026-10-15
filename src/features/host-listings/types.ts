import type { HOME_TYPES, LISTING_SPECIES, WEEKDAYS } from "./api/contracts";
import type { ListingFormValues } from "./schemas/listingSchema";

export type ListingSpecies = (typeof LISTING_SPECIES)[number];
export type Weekday = (typeof WEEKDAYS)[number];
export type HomeType = (typeof HOME_TYPES)[number];

/** Pessoa física (um cantinho, até 10 pets) ou empresa (um por filial, até 200). */
export type HostKind = "person" | "company";

/** Uma foto do cantinho; a primeira é a capa. */
export interface ListingPhoto {
  id: string;
  url: string;
}

/** O cantinho como a tela do dono usa (spec 044). */
export interface Listing {
  id: string;
  title: string;
  isActive: boolean;
  /** Diária por pet, em centavos. */
  nightlyRateCents: number;
  neighborhood: string;
  city: string;
  /** Na ordem; a primeira é a capa. */
  photos: ListingPhoto[];
  coverUrl: string | null;
  /** Os valores no formato do formulário (a mesma forma do rascunho). */
  values: ListingFormValues;
}

/** "Meus cantinhos": o tipo do anfitrião, se o recebimento está liberado e os cantinhos. */
export interface MyListings {
  isCompany: boolean;
  payoutsEnabled: boolean;
  listings: Listing[];
}

/** O que o cadastro precisa saber do anfitrião (`GET /hosts/me`). */
export interface HostListingProfile {
  kind: HostKind;
  firstName: string;
  /** Endereço da conta, sugestão do endereço do cantinho (pessoa física). */
  address: ListingFormValues["address"] | null;
  /** O Stripe liberou os repasses: o cantinho pode ser aberto. */
  payoutsEnabled: boolean;
  /** `not_started`, `in_progress`, `under_review`, `restricted` ou `enabled`. */
  stripeStatus: string;
}
