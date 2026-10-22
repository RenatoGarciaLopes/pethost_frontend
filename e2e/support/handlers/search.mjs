import { http } from "msw";
import { fail, ok, sessionUserOf } from "./session.mjs";

const API = "http://localhost:5099/api/v1";
const species = ["dog", "cat"];
const listings = Array.from({ length: 13 }, (_, index) => ({
  id: `0199d2a0-0000-7000-8000-${String(4100 + index).padStart(12, "0")}`,
  hostId: "0199d2a0-0000-7000-8000-000000000042",
  host: {
    id: "0199d2a0-0000-7000-8000-000000000042",
    name: "Casa Cida",
    isCompany: true,
    isAvailable: true,
    payoutsEnabled: true,
  },
  title: `Quintal ${index + 1}`,
  neighborhood: "Zona 7",
  city: "Maringá",
  state: "PR",
  nightlyRate: 60,
  capacity: 5,
  homeType: index % 2 ? "apartment" : "house",
  hasYard: index % 2 === 0,
  acceptedSpecies: species,
  acceptsSmall: true,
  acceptsMedium: true,
  acceptsLarge: true,
  availableWeekdays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
  distanceKm: 1 + index / 10,
  badges: index % 2 ? [] : ["yard", "neighbor"],
}));

/** Um cantinho da busca pelo id, para a página do cantinho abrir o que a busca mostrou. @example searchListing(id) */
export function searchListing(listingId) {
  const found = listings.find((item) => item.id === listingId);
  return found ? structuredClone(found) : null;
}

/** Busca sintética determinística, filtros observáveis e paginação; não simula geocodificação real. @example server.use(...searchHandlers); */
export const searchHandlers = [
  http.get(`${API}/listings`, ({ request }) => {
    const params = new URL(request.url).searchParams;
    // Visitante só busca por coordenada (a vitrine "perto de você" da home); sem ela a API continua pedindo conta.
    const byCoordinates = params.has("latitude") && params.has("longitude");
    if (!sessionUserOf(request) && !byCoordinates) return fail(401, "UNAUTHORIZED");
    const city = params.get("city");
    if (city === "Sem endereço") return fail(422, "LISTING_SEARCH_ADDRESS_REQUIRED");
    if (city === "Fora do mapa") return fail(422, "LISTING_SEARCH_ADDRESS_NOT_LOCATED");
    if (city === "Indisponível") return fail(503, "LISTING_GEOCODER_UNAVAILABLE");
    if (city === "Inválida") return fail(400, "VALIDATION_ERROR", [{ field: "city", messages: ["invalid"] }]);
    let items = city && city !== "Maringá" ? [] : listings;
    if (params.get("hasYard") === "true") items = items.filter((item) => item.hasYard);
    if (params.get("homeType")) items = items.filter((item) => item.homeType === params.get("homeType"));
    if (params.has("maxNightlyRate"))
      items = items.filter((item) => item.nightlyRate <= Number(params.get("maxNightlyRate")));
    if (Number(params.get("pets") ?? 1) > 5) items = [];
    const page = Number(params.get("page") ?? 1);
    const pageSize = Number(params.get("pageSize") ?? 12);
    return ok({
      items: items
        .slice((page - 1) * pageSize, page * pageSize)
        .map((item) => ({ ...item, distanceKm: city && !params.has("radiusKm") ? undefined : item.distanceKm })),
      page,
      pageSize,
      totalCount: items.length,
    });
  }),
];
