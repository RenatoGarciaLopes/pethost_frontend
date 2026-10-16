import type { z } from "zod";
import { PatchApiV1ListingsListingIdBody, PostApiV1ListingsBody } from "@/shared/api/generated/listings/listings.zod";
import { fromCents, toCents } from "@/shared/lib/money";
import { diffPatch } from "@/shared/lib/patch/diffPatch";
import type { ListingFormValues, ListingValues } from "../schemas/listingSchema";
import type { HostListingProfile, Listing, MyListings } from "../types";
import type { HostMeDto, ListingDto, MyListingsDto } from "./contracts";

export type CreateListingRequest = z.input<typeof PostApiV1ListingsBody>;
export type UpdateListingRequest = z.input<typeof PatchApiV1ListingsListingIdBody>;
type Address = ListingFormValues["address"];

const rateText = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function toAddress(address: Partial<Record<keyof Address, string | null | undefined>>): Address {
  return {
    zipCode: address.zipCode ?? "",
    street: address.street ?? "",
    number: address.number ?? "",
    complement: address.complement ?? "",
    neighborhood: address.neighborhood ?? "",
    city: address.city ?? "",
    state: address.state ?? "",
  };
}

/** DTO → valores do formulário (REQ-LIST-013): nulos viram vazio e a diária vira texto ("60,00"). */
function toListingValues(dto: ListingDto): ListingFormValues {
  return {
    homeType: dto.homeType ?? "",
    hasYard: dto.hasYard,
    title: dto.title,
    description: dto.description,
    hasDogs: dto.hasDogs,
    hasCats: dto.hasCats,
    hasKids: dto.hasKids,
    acceptedSpecies: [...dto.acceptedSpecies],
    acceptsSmall: dto.acceptsSmall,
    acceptsMedium: dto.acceptsMedium,
    acceptsLarge: dto.acceptsLarge,
    capacity: dto.capacity,
    address: toAddress(dto.address),
    houseRules: dto.houseRules ?? "",
    availableWeekdays: [...dto.availableWeekdays],
    nightlyRate: rateText.format(dto.nightlyRate),
  };
}

/**
 * Um cantinho da API para a tela do dono: fotos na ordem (a primeira é a capa), diária em centavos e os valores do
 * formulário.
 * @example const listing = toListing(listingDtoSchema.parse(data));
 */
export function toListing(dto: ListingDto): Listing {
  const photos = [...dto.photos].sort((a, b) => a.position - b.position).map(({ id, url }) => ({ id, url }));
  return {
    id: dto.id,
    title: dto.title,
    isActive: dto.isActive,
    nightlyRateCents: toCents(dto.nightlyRate),
    neighborhood: dto.address.neighborhood,
    city: dto.address.city,
    photos,
    coverUrl: photos[0]?.url ?? null,
    values: toListingValues(dto),
  };
}

/**
 * "Meus cantinhos" para a tela.
 * @example const mine = toMyListings(myListingsSchema.parse(data));
 */
export function toMyListings(dto: MyListingsDto): MyListings {
  return {
    isCompany: dto.host?.isCompany ?? false,
    payoutsEnabled: dto.host?.payoutsEnabled ?? false,
    listings: dto.listings.map(toListing),
  };
}

/**
 * O que o cadastro usa do perfil (`GET /hosts/me`): tipo, primeiro nome (sugestão do título), endereço da conta
 * (sugestão do endereço, só pessoa física) e o recebimento.
 * @example const profile = toHostListingProfile(hostMeSchema.parse(data));
 */
export function toHostListingProfile(dto: HostMeDto): HostListingProfile {
  const kind = dto.personType.toLowerCase() === "pj" ? "company" : "person";
  const address = dto.user?.address;
  return {
    kind,
    firstName: dto.user?.fullName.trim().split(/\s+/)[0] ?? "",
    address: kind === "person" && address ? toAddress(address) : null,
    payoutsEnabled: dto.stripePayoutsEnabled,
    stripeStatus: dto.stripeStatus,
  };
}

/** Corpo completo no formato da API; textos opcionais vazios ficam como `""`. */
function toBody(values: ListingValues) {
  const hasCatOrDog = values.acceptedSpecies.includes("dog") || values.acceptedSpecies.includes("cat");
  return {
    ...(values.homeType ? { homeType: values.homeType } : {}),
    title: values.title,
    description: values.description,
    hasYard: values.hasYard,
    hasDogs: values.hasDogs,
    hasCats: values.hasCats,
    hasKids: values.hasKids,
    acceptedSpecies: values.acceptedSpecies,
    // Sem cachorro nem gato, porte não se aplica: vai como não.
    acceptsSmall: hasCatOrDog && values.acceptsSmall,
    acceptsMedium: hasCatOrDog && values.acceptsMedium,
    acceptsLarge: hasCatOrDog && values.acceptsLarge,
    capacity: values.capacity,
    nightlyRate: fromCents(values.nightlyRateCents),
    houseRules: values.houseRules,
    availableWeekdays: values.availableWeekdays,
    address: values.address,
  };
}

/**
 * Corpo do `POST /listings` (REQ-LIST-011): tudo de uma vez, diária em reais; opcional vazio não vai.
 * @example await createListing(toCreateListingRequest(listingSchema.parse(values)));
 */
export function toCreateListingRequest(values: ListingValues): CreateListingRequest {
  const { houseRules, address, ...body } = toBody(values);
  const { complement, ...required } = address;
  return {
    ...body,
    ...(houseRules ? { houseRules } : {}),
    address: complement ? address : required,
  };
}

const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Corpo do `PATCH /listings/{id}` (REQ-LIST-013): só o que mudou; lista vai inteira (a API substitui), endereço vai
 * campo a campo (a API recalcula a coordenada), texto opcional apagado vai como `""`. Nada mudou → `{}`.
 * @example const body = toUpdateListingRequest(original, edited);
 */
export function toUpdateListingRequest(original: ListingValues, edited: ListingValues): UpdateListingRequest {
  const { address: before, ...beforeFields } = toBody(original);
  const { address: after, ...afterFields } = toBody(edited);
  const patch = diffPatch<Record<string, unknown>>(beforeFields, afterFields, {
    clearable: ["houseRules"],
    equals: sameJson,
  }) as UpdateListingRequest;
  const addressPatch = diffPatch<Record<string, string>>({ ...before }, { ...after }, { clearable: ["complement"] });
  return Object.keys(addressPatch).length > 0 ? { ...patch, address: addressPatch } : patch;
}
