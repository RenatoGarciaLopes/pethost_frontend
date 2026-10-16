import { http } from "msw";
import { randomUUID } from "node:crypto";
import { hostIsCompany, hostPayoutsEnabled } from "./accountProfile.mjs";
import { fail, ok, sessionUserOf } from "./session.mjs";

const API = "http://localhost:5099/api/v1";
const MAX_PHOTOS = 5;
const SPECIES = [
  "dog",
  "cat",
  "cockatiel",
  "parrot",
  "parakeet",
  "canary",
  "rabbit",
  "hamster",
  "guinea_pig",
  "fish",
  "turtle",
  "exotic",
];
const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Cantinhos por conta de anfitrião, só em memória. */
const byAccount = new Map();
const listingsOf = (userId) => {
  if (!byAccount.has(userId)) byAccount.set(userId, []);
  return byAccount.get(userId);
};

/** Volta todas as contas para "sem cantinho", entre jornadas. @example resetListings(); */
export function resetListings() {
  byAccount.clear();
}

function hostOf(request) {
  const user = sessionUserOf(request);
  if (!user) return { error: fail(401, "UNAUTHORIZED") };
  if (user.role !== "host") return { error: fail(403, "FORBIDDEN") };
  return { user };
}

function ownedListing(request, listingId) {
  const result = hostOf(request);
  if (result.error) return result;
  const listing = listingsOf(result.user.id).find((item) => item.id === listingId);
  return listing ? { ...result, listing } : { error: fail(404, "LISTING_NOT_FOUND") };
}

/** Regras da seção 4 de `modulo-listings.md` (todas juntas num 400), sem consultar o mapa. */
function validate(body, isCompany) {
  const errors = [];
  const reject = (field, message) => errors.push({ field, messages: [message] });
  if (!body.title?.trim() || body.title.length > 80) reject("title", "Título obrigatório, até 80.");
  if (!body.description?.trim() || body.description.length > 4000) reject("description", "Descrição obrigatória.");
  if (!isCompany && !["house", "apartment"].includes(body.homeType)) reject("homeType", "Tipo da casa obrigatório.");
  for (const field of ["hasYard", "hasDogs", "hasCats", "hasKids", "acceptsSmall", "acceptsMedium", "acceptsLarge"])
    if (typeof body[field] !== "boolean") reject(field, "Obrigatório.");
  if (
    !Array.isArray(body.acceptedSpecies) ||
    body.acceptedSpecies.length === 0 ||
    body.acceptedSpecies.some((item) => !SPECIES.includes(item))
  )
    reject("acceptedSpecies", "Ao menos um tipo.");
  const max = isCompany ? 200 : 10;
  if (!Number.isInteger(body.capacity) || body.capacity < 1 || body.capacity > max)
    reject("capacity", `De 1 a ${max}.`);
  if (!(body.nightlyRate >= 10 && body.nightlyRate <= 10000)) reject("nightlyRate", "De 10 a 10000.");
  if (!Array.isArray(body.availableWeekdays) || body.availableWeekdays.length === 0)
    reject("availableWeekdays", "Ao menos um dia.");
  if (!/^\d{8}$/.test(String(body.address?.zipCode ?? "").replace(/\D/g, "")))
    reject("address.zipCode", "CEP inválido.");
  return errors;
}

function sorted(listing) {
  const order = (list, all) => all.filter((item) => list.includes(item));
  return {
    ...listing,
    acceptedSpecies: order(listing.acceptedSpecies, SPECIES),
    availableWeekdays: order(listing.availableWeekdays, WEEKDAYS),
    photos: listing.photos.map((photo, index) => ({ ...photo, position: index + 1 })),
  };
}

function touch(listing, changes) {
  Object.assign(listing, changes, { updatedAt: new Date().toISOString() });
  return ok(sorted(listing));
}

async function photoOf(request) {
  const file = (await request.formData()).get("file");
  if (!file || !IMAGE_TYPES.includes(file.type))
    return { error: fail(400, "VALIDATION_ERROR", [{ field: "file", messages: ["Envie JPG, PNG ou WebP."] }]) };
  return {
    url: `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`,
    size: file.size,
  };
}

/**
 * `/listings*` do mock (spec 044): cadastrar (todos os erros num 400, exige o recebimento liberado, uma por pessoa
 * física), ler, alterar, pausar/reabrir e as fotos (até 5, em ordem). Não consulta mapa nem guarda imagem de verdade.
 * @example app.use(createMiddleware(...listingsHandlers));
 */
export const listingsHandlers = [
  http.get(`${API}/listings/me`, ({ request }) => {
    const result = hostOf(request);
    if (result.error) return result.error;
    const { user } = result;
    return ok({
      host: {
        id: user.id,
        name: user.fullName,
        avatarUrl: null,
        isCompany: hostIsCompany(user),
        isAvailable: true,
        payoutsEnabled: hostPayoutsEnabled(user),
      },
      listings: [...listingsOf(user.id)].reverse().map(sorted),
    });
  }),
  http.post(`${API}/listings`, async ({ request }) => {
    const result = hostOf(request);
    if (result.error) return result.error;
    const { user } = result;
    const isCompany = hostIsCompany(user);
    const body = (await request.json().catch(() => null)) ?? {};
    const errors = validate(body, isCompany);
    if (errors.length) return fail(400, "VALIDATION_ERROR", errors);
    if (!hostPayoutsEnabled(user)) return fail(422, "LISTING_HOST_PAYOUTS_NOT_ENABLED");
    if (!isCompany && listingsOf(user.id).length > 0) return fail(422, "LISTING_LIMIT_REACHED");
    const now = new Date().toISOString();
    const listing = {
      id: randomUUID(),
      hostId: user.id,
      ...body,
      address: { complement: null, ...body.address, zipCode: String(body.address.zipCode).replace(/\D/g, "") },
      location: { latitude: -23.42, longitude: -51.93 },
      photos: [],
      isActive: true,
      deactivatedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    listingsOf(user.id).push(listing);
    return ok(sorted(listing), { status: 201 });
  }),
  http.get(`${API}/listings/:listingId`, ({ request, params }) => {
    const result = ownedListing(request, params.listingId);
    return result.error ?? ok(sorted(result.listing));
  }),
  http.patch(`${API}/listings/:listingId`, async ({ request, params }) => {
    const result = ownedListing(request, params.listingId);
    if (result.error) return result.error;
    const body = (await request.json().catch(() => null)) ?? {};
    const { address, ...fields } = Object.fromEntries(Object.entries(body).filter(([, value]) => value != null));
    const candidate = { ...result.listing, ...fields, address: { ...result.listing.address, ...address } };
    const errors = validate(candidate, hostIsCompany(result.user));
    if (errors.length) return fail(400, "VALIDATION_ERROR", errors);
    return touch(result.listing, { ...candidate, houseRules: candidate.houseRules || null });
  }),
  http.post(`${API}/listings/:listingId/deactivation`, ({ request, params }) => {
    const result = ownedListing(request, params.listingId);
    if (result.error) return result.error;
    return touch(result.listing, {
      isActive: false,
      deactivatedAt: result.listing.deactivatedAt ?? new Date().toISOString(),
    });
  }),
  http.delete(`${API}/listings/:listingId/deactivation`, ({ request, params }) => {
    const result = ownedListing(request, params.listingId);
    if (result.error) return result.error;
    return touch(result.listing, { isActive: true, deactivatedAt: null });
  }),
  http.post(`${API}/listings/:listingId/photos`, async ({ request, params }) => {
    const result = ownedListing(request, params.listingId);
    if (result.error) return result.error;
    if (result.listing.photos.length >= MAX_PHOTOS) return fail(422, "LISTING_PHOTO_LIMIT_REACHED");
    const photo = await photoOf(request);
    if (photo.error) return photo.error;
    if (result.listing.photos.some((item) => item.url === photo.url)) return fail(409, "LISTING_PHOTO_ALREADY_EXISTS");
    return touch(result.listing, { photos: [...result.listing.photos, { id: randomUUID(), url: photo.url }] });
  }),
  http.put(`${API}/listings/:listingId/photos/order`, async ({ request, params }) => {
    const result = ownedListing(request, params.listingId);
    if (result.error) return result.error;
    const { photoIds } = (await request.json().catch(() => null)) ?? {};
    const current = result.listing.photos;
    if (!Array.isArray(photoIds) || photoIds.length !== current.length || new Set(photoIds).size !== current.length)
      return fail(400, "VALIDATION_ERROR", [{ field: "photoIds", messages: ["Mande todas as fotos, uma vez cada."] }]);
    const reordered = photoIds.map((id) => current.find((photo) => photo.id === id));
    if (reordered.some((photo) => !photo)) return fail(404, "LISTING_PHOTO_NOT_FOUND");
    return touch(result.listing, { photos: reordered });
  }),
  http.patch(`${API}/listings/:listingId/photos/:photoId`, async ({ request, params }) => {
    const result = ownedListing(request, params.listingId);
    if (result.error) return result.error;
    const index = result.listing.photos.findIndex((photo) => photo.id === params.photoId);
    if (index < 0) return fail(404, "LISTING_PHOTO_NOT_FOUND");
    const photo = await photoOf(request);
    if (photo.error) return photo.error;
    const photos = result.listing.photos.map((item, slot) =>
      slot === index ? { id: randomUUID(), url: photo.url } : item,
    );
    return touch(result.listing, { photos });
  }),
  http.delete(`${API}/listings/:listingId/photos/:photoId`, ({ request, params }) => {
    const result = ownedListing(request, params.listingId);
    if (result.error) return result.error;
    if (!result.listing.photos.some((photo) => photo.id === params.photoId))
      return fail(404, "LISTING_PHOTO_NOT_FOUND");
    return touch(result.listing, { photos: result.listing.photos.filter((photo) => photo.id !== params.photoId) });
  }),
];
