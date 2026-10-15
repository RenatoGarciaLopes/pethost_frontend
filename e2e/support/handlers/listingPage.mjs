import { http } from "msw";
import { fail, ok, sessionUserOf } from "./session.mjs";

const API = "http://localhost:5099/api/v1";
export const LISTING_ID = "0199d2a0-0000-7000-8000-000000000042";
const HOST_ID = "0199d2a0-0000-7000-8000-000000000042";

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
  availableWeekdays: ["monday", "friday"],
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
    if (params.listingId !== LISTING_ID) return fail(404, "LISTING_NOT_FOUND");
    return ok(structuredClone(detail));
  }),
];
