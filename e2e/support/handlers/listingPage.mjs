import { http } from "msw";
import { searchListing } from "./search.mjs";
import { fail, ok, sessionUserOf } from "./session.mjs";

const API = "http://localhost:5099/api/v1";
export const LISTING_ID = "0199d2a0-0000-7000-8000-000000000042";
const HOST_ID = "0199d2a0-0000-7000-8000-0000000000b1";

const detail = {
  id: LISTING_ID,
  hostId: HOST_ID,
  host: { id: HOST_ID, name: "Casa Cida", avatarUrl: null, isCompany: true, isAvailable: true, payoutsEnabled: true },
  title: "Quintal da Cida",
  description: "Um lugar tranquilo para brincar.",
  homeType: "house",
  hasYard: true,
  hasDogs: false,
  hasCats: true,
  hasKids: false,
  acceptedSpecies: ["dog", "cat"],
  acceptsSmall: true,
  acceptsMedium: true,
  acceptsLarge: false,
  capacity: 3,
  nightlyRate: 60,
  houseRules: "Traz a caminha favorita.",
  availableWeekdays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
  address: { neighborhood: "Centro", city: "Maringá", state: "PR" },
  location: null,
  // Obrigatório no contrato desde o OpenAPI da 070: ponto com 3 casas e raio de 500 m.
  approximateLocation: { latitude: -23.426, longitude: -51.938, radiusMeters: 500 },
  photos: [{ id: "0199d2a0-0000-7000-8000-000000000043", url: "https://images.example.test/yard.webp", position: 1 }],
  isActive: true,
  deactivatedAt: null,
  createdAt: "2026-10-15T12:00:00Z",
  updatedAt: "2026-10-15T12:00:00Z",
  badges: ["yard", "neighbor"],
};

const review = {
  id: "0199d2a0-0000-7000-8000-000000000044",
  authorSide: "owner",
  hostId: HOST_ID,
  listingId: LISTING_ID,
  rating: 5,
  comment: "Recebi foto todo dia.",
  author: { name: "Marina", avatarUrl: null },
  stayEndedAt: "2026-10-10T15:00:00Z",
  createdAt: "2026-10-11T12:00:00Z",
  updatedAt: "2026-10-11T12:00:00Z",
};

/** Respostas sintéticas para o detalhe, a compatibilidade e as avaliações da página 042 (revisão 078). */
export const listingPageHandlers = [
  // Só o cantinho da página; os da busca seguem para o handler da busca (resolver sem resposta passa adiante).
  http.get(`${API}/listings/:listingId/compatibility`, ({ request, params }) => {
    if (params.listingId !== LISTING_ID) return undefined;
    if (!sessionUserOf(request)) return fail(401, "UNAUTHORIZED");
    const url = new URL(request.url);
    const withDates = url.searchParams.has("checkIn") && url.searchParams.has("checkOut");
    return ok({
      listingId: LISTING_ID,
      petId: url.searchParams.get("petId"),
      petName: "Luna",
      matches: true,
      warnings: [],
      guests: withDates ? [{ name: "Mel", species: "dog", size: "small" }] : null,
    });
  }),
  // Pública, como a API real: as avaliações dos tutores do cantinho da página; os outros, sem avaliação.
  http.get(`${API}/reviews`, ({ request }) => {
    const listingId = new URL(request.url).searchParams.get("ListingId");
    const items = listingId === LISTING_ID ? [review] : [];
    return ok({ items, page: 1, pageSize: 4, totalCount: items.length });
  }),
  // Aberto, como a API real: o visitante vê o cantinho (sem a rua).
  http.get(`${API}/listings/:listingId`, ({ params }) => {
    const listing = publicListing(params.listingId);
    return listing ? ok(listing) : fail(404, "LISTING_NOT_FOUND");
  }),
];

/**
 * O cantinho público do mock: o da página (042) ou, se o id vier da busca (041), o detalhe montado do cartão dela, para
 * a jornada busca → cantinho → pedido (spec 050). Também serve ao pedido conferir regras e diária.
 * @example publicListing(id)
 */
export function publicListing(listingId) {
  if (listingId === LISTING_ID) return structuredClone(detail);
  const summary = searchListing(listingId);
  if (!summary) return null;
  const { neighborhood, city, state, distanceKm: _distance, ...rest } = summary;
  void _distance;
  return {
    ...structuredClone(detail),
    ...rest,
    description: "Um cantinho da busca.",
    address: { neighborhood, city, state },
    photos: [],
  };
}
