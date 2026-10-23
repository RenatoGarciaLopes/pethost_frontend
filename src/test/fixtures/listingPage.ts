import type { z } from "zod";
import type { ListingDetail } from "@/features/listing-page";
import type { GetApiV1ReviewsResponse } from "@/shared/api/generated/reviews/reviews.zod";

/**
 * Fixtures da página do cantinho (spec 042, revisão 078): a visão pública do detalhe e as avaliações dos tutores.
 * Dados sintéticos, sem endereço nem pessoa real.
 */

type Review = z.infer<typeof GetApiV1ReviewsResponse>["data"]["items"][number];

/** Paisagem em SVG, para stories e prints não dependerem de rede. */
export const listingPhotoFixture = (sky = "#7FC4E0", grass = "#7BA05B") =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="190" fill="${sky}"/><rect y="190" width="400" height="110" fill="${grass}"/><circle cx="320" cy="60" r="28" fill="#FFC93C"/></svg>`,
  )}`;

/** Detalhe como o tutor vê (`GET /listings/{id}`, sem rua). Padrão: casa com quintal, um cão, sem fotos nem nota. @example listingDetailFixture({ rating: { average: 4.9, count: 18 } }) */
export function listingDetailFixture(overrides: Partial<ListingDetail> = {}): ListingDetail {
  return {
    id: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c",
    hostId: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1d",
    host: {
      id: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1d",
      name: "Dona Cida",
      avatarUrl: null,
      isCompany: false,
      isAvailable: true,
      payoutsEnabled: true,
    },
    title: "Casa da Dona Cida",
    description: "Aqui o pet fica solto no quintal e dorme dentro de casa. Passeio de manhã e no fim da tarde.",
    homeType: "house",
    hasYard: true,
    hasDogs: true,
    hasCats: false,
    hasKids: false,
    acceptedSpecies: ["dog", "cat"],
    acceptsSmall: true,
    acceptsMedium: true,
    acceptsLarge: false,
    capacity: 2,
    nightlyRate: 60,
    houseRules: "Pode subir no sofá, não na cama\nBuscar até as 18h",
    availableWeekdays: ["monday", "friday", "saturday"],
    address: { neighborhood: "Jd. Alvorada", city: "Maringá", state: "PR" },
    approximateLocation: { latitude: -23.42, longitude: -51.93, radiusMeters: 500 },
    photos: [],
    isActive: true,
    deactivatedAt: null,
    createdAt: "2026-10-15T12:00:00Z",
    updatedAt: "2026-10-15T12:00:00Z",
    badges: ["neighbor", "fast_responder", "yard", "experienced"],
    ...overrides,
  };
}

/** Três fotos sintéticas na ordem da API (a 1 é a capa). */
export const listingPhotosFixture: ListingDetail["photos"] = [
  { id: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b21", url: listingPhotoFixture(), position: 1 },
  { id: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b22", url: listingPhotoFixture("#D7ECF1", "#9DBF6A"), position: 2 },
  { id: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b23", url: listingPhotoFixture("#F5F0DD", "#C5DB4F"), position: 3 },
];

/** Avaliação pública de tutor. @example listingReviewFixture({ rating: 4 }) */
export function listingReviewFixture(overrides: Partial<Review> = {}): Review {
  return {
    id: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b31",
    authorSide: "owner",
    hostId: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1d",
    listingId: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c",
    rating: 5,
    comment: "Recebi foto todo dia. O Thor voltou cansado e feliz.",
    author: { name: "Marina", avatarUrl: null },
    stayEndedAt: "2026-11-10T15:00:00Z",
    createdAt: "2026-11-11T12:00:00Z",
    updatedAt: "2026-11-11T12:00:00Z",
    ...overrides,
  };
}
