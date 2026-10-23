import { http } from "msw";
import { fail, ok, sessionUserOf } from "./session.mjs";

const API = "http://localhost:5099/api/v1";
const species = ["dog", "cat"];
const MARINGA = { latitude: -23.42, longitude: -51.94 };
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
  approximateLocation: { latitude: -23.425, longitude: -51.938, radiusMeters: 500 },
  badges: index % 2 ? [] : ["yard", "neighbor", "well_rated"],
  ...(index % 3 === 0 ? { rating: { average: 4.8, count: 9 } } : {}),
}));

/** Um cantinho da busca pelo id, para a página do cantinho abrir o que a busca mostrou. @example searchListing(id) */
export function searchListing(listingId) {
  const found = listings.find((item) => item.id === listingId);
  return found ? structuredClone(found) : null;
}

/** Busca sintética determinística, filtros observáveis e paginação; não simula geocodificação real. @example server.use(...searchHandlers); */
export const searchHandlers = [
  // Como a API real: o pet do tutor contra o cantinho. Os de índice ímpar (apartamento) avisam que têm gato em casa.
  http.get(`${API}/listings/:listingId/compatibility`, ({ request, params }) => {
    if (!sessionUserOf(request)) return fail(401, "UNAUTHORIZED");
    const found = listings.findIndex((item) => item.id === params.listingId);
    if (found < 0) return fail(404, "LISTING_NOT_FOUND");
    const petId = new URL(request.url).searchParams.get("petId");
    return ok({
      listingId: params.listingId,
      petId,
      petName: "Luna",
      matches: found % 2 === 0,
      warnings: found % 2 === 0 ? [] : [{ code: "home_has_cats" }],
    });
  }),
  http.get(`${API}/listings`, ({ request }) => {
    const params = new URL(request.url).searchParams;
    const byCoordinates = params.has("latitude") && params.has("longitude");
    const visitor = !sessionUserOf(request);
    // Como a API real: visitante não tem endereço, então raio sem coordenada dá 422 e, sem coordenada nem lugar, lista todos.
    if (visitor && params.has("radiusKm") && !byCoordinates) return fail(422, "LISTING_SEARCH_ADDRESS_REQUIRED");
    const city = params.get("city");
    if (city === "Sem endereço") return fail(422, "LISTING_SEARCH_ADDRESS_REQUIRED");
    if (city === "Fora do mapa") return fail(422, "LISTING_SEARCH_ADDRESS_NOT_LOCATED");
    if (city === "Indisponível") return fail(503, "LISTING_GEOCODER_UNAVAILABLE");
    if (city === "Inválida") return fail(400, "VALIDATION_ERROR", [{ field: "city", messages: ["invalid"] }]);
    // O mapa sintético fica em Maringá: coordenada a mais de meio grau dali não tem cantinho no raio.
    const offMap =
      byCoordinates &&
      (Math.abs(Number(params.get("latitude")) - MARINGA.latitude) > 0.5 ||
        Math.abs(Number(params.get("longitude")) - MARINGA.longitude) > 0.5);
    let items = (city && city !== "Maringá") || offMap ? [] : listings;
    if (params.get("hasYard") === "true") items = items.filter((item) => item.hasYard);
    if (params.get("homeType")) items = items.filter((item) => item.homeType === params.get("homeType"));
    if (Number(params.get("pets") ?? 1) > 5) items = [];
    const page = Number(params.get("page") ?? 1);
    const pageSize = Number(params.get("pageSize") ?? 12);
    return ok({
      items: items.slice((page - 1) * pageSize, page * pageSize).map((item) => ({
        ...item,
        distanceKm: (city && !params.has("radiusKm")) || (visitor && !byCoordinates) ? undefined : item.distanceKm,
      })),
      page,
      pageSize,
      totalCount: items.length,
    });
  }),
];
