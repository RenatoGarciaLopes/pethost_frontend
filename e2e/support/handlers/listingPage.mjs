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
  photos: [{ id: "0199d2a0-0000-7000-8000-000000000043", url: "https://images.example.test/yard.webp", position: 1 }],
  isActive: true,
  deactivatedAt: null,
  createdAt: "2026-10-15T12:00:00Z",
  updatedAt: "2026-10-15T12:00:00Z",
  badges: ["yard", "neighbor"],
};

/** Respostas sintéticas para o detalhe, anfitrião e pets residentes da página 042. */
export const listingPageHandlers = [
  http.get(`${API}/listings/:listingId`, ({ request, params }) => {
    if (!sessionUserOf(request)) return fail(401, "UNAUTHORIZED");
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
