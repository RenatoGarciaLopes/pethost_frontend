import { http, HttpResponse } from "msw";
import { randomUUID } from "node:crypto";
import { publicListing } from "./listingPage.mjs";
import { petsOfAccount } from "./pets.mjs";
import { fail, ok, sessionUserOf } from "./session.mjs";

const API = "http://localhost:5099/api/v1";
const BRASILIA_OFFSET_MS = -3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Reservas em memória, com o id da conta do anfitrião, o da conta do tutor e a ficha dos pets (para o anfitrião ler). */
const bookings = new Map();

const brasiliaToday = () => new Date(Date.now() + BRASILIA_OFFSET_MS).toISOString().slice(0, 10);
const addDays = (date, days) => new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/** Volta para "nenhuma reserva", entre jornadas. @example resetBookings(); */
export function resetBookings() {
  bookings.clear();
}

/** Uma ficha de pet sintética, no formato de `GET /pets/{id}`. */
function petSheet(id, name, overrides = {}) {
  return {
    id,
    species: "dog",
    speciesDescription: null,
    name,
    breed: "Vira-lata",
    size: "small",
    birthDate: "2022-03-10",
    sex: "female",
    isNeutered: true,
    isVaccinated: true,
    goodWithDogs: true,
    goodWithCats: false,
    goodWithKids: true,
    medicationNotes: null,
    feedingNotes: "Ração duas vezes ao dia",
    vetContact: "Clínica do bairro",
    notes: "Adora bolinha",
    weightKg: 8,
    microchip: null,
    allergies: null,
    photos: [],
    isActive: true,
    deactivatedAt: null,
    createdAt: "2026-10-01T12:00:00Z",
    updatedAt: "2026-10-01T12:00:00Z",
    ...overrides,
  };
}

/**
 * Semeia uma reserva entre a conta do anfitrião e, se vier, a conta do tutor (a 050, que cria pedidos, ainda não
 * existe). Padrão: pedido de 1 pet, chegada daqui a 3 dias, prazo em 20 horas. Devolve a reserva.
 * @example seedBooking(host.user.id, { status: "confirmed" });
 * @example seedBooking(null, { status: "confirmed", contact }, owner.user.id);
 */
export function seedBooking(hostUserId, overrides = {}, ownerUserId = null) {
  const now = new Date();
  const checkIn = overrides.checkIn ?? addDays(brasiliaToday(), 3);
  const checkOut = overrides.checkOut ?? addDays(checkIn, 5);
  const petId = randomUUID();
  const booking = {
    id: randomUUID(),
    status: "requested",
    listingId: randomUUID(),
    listing: null,
    ownerId: randomUUID(),
    owner: { id: randomUUID(), name: "Bruno Lima", avatarUrl: null },
    hostId: randomUUID(),
    host: null,
    pets: [{ id: petId, name: "Pipoca", species: "dog", size: "small" }],
    checkIn,
    checkOut,
    nights: Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / DAY_MS),
    petCount: 1,
    nightlyRate: 60,
    totalPrice: 300,
    requestedAt: now.toISOString(),
    responseDeadline: new Date(now.getTime() + 20 * 60 * 60 * 1000).toISOString(),
    contact: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides,
  };
  bookings.set(booking.id, { booking, hostUserId, ownerUserId, sheets: new Map([[petId, petSheet(petId, "Pipoca")]]) });
  return booking;
}

/** Lado da conta na reserva: `host`, `owner` ou `null` (reserva de outra pessoa). */
function sideOf(entry, userId) {
  if (entry.hostUserId === userId) return "host";
  if (entry.ownerUserId === userId) return "owner";
  return null;
}

/** A reserva, se a conta participa dela (com `only`, só daquele lado); senão 404, como na API. */
function ownBooking(request, bookingId, only) {
  const user = sessionUserOf(request);
  if (!user) return { error: fail(401, "UNAUTHORIZED") };
  const entry = bookings.get(bookingId);
  const side = entry ? sideOf(entry, user.id) : null;
  if (!side || (only && side !== only)) return { error: fail(404, "BOOKING_NOT_FOUND") };
  return { entry, side, booking: entry.booking };
}

/** Reembolso do tutor: total com 48 horas ou mais antes da chegada (meia-noite de Brasília), metade com menos. */
function ownerRefund(booking) {
  if (booking.status !== "confirmed") return null;
  const arrival = Date.parse(`${booking.checkIn}T00:00:00-03:00`);
  return arrival - Date.now() >= 48 * 60 * 60 * 1000 ? 100 : 50;
}

function touch(booking, changes) {
  Object.assign(booking, changes, { updatedAt: new Date().toISOString() });
  return ok(booking);
}

const OWNER_CONTACT = { phone: "44999990000", address: null };
/** Erro de regra com a mensagem da API, que cita a data ou o pet (a tela extrai o dado dela). */
const failWith = (status, code, message) =>
  HttpResponse.json({ success: false, error: { code, message }, timestamp: new Date().toISOString() }, { status });
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Campos do corpo de `POST /bookings` (400 com todos juntos), sem as regras de negócio. */
function requestFieldErrors(body) {
  const errors = [];
  const reject = (field, message) => errors.push({ field, messages: [message] });
  const petIds = Array.isArray(body.petIds) ? body.petIds : [];
  if (petIds.length < 1 || petIds.length > 10 || new Set(petIds).size !== petIds.length)
    reject("petIds", "Escolhe de 1 a 10 pets, sem repetir.");
  if (!DATE.test(body.checkIn ?? "")) reject("checkIn", "Data de chegada inválida.");
  else if (body.checkIn < brasiliaToday()) reject("checkIn", "A chegada já passou.");
  if (!DATE.test(body.checkOut ?? "") || (DATE.test(body.checkIn ?? "") && body.checkOut <= body.checkIn))
    reject("checkOut", "A saída precisa ser depois da chegada.");
  return errors;
}

/**
 * Pedido do tutor (spec 050), nas regras da seção 4 de `modulo-bookings.md`: campos, cantinho, pets do tutor e ativos,
 * espécie e porte, outro pedido do pet nas mesmas noites, dia da semana (com a data na mensagem). Sem capacidade: o
 * mock não guarda reservas confirmadas de outros tutores.
 */
function createRequest(user, body) {
  const errors = requestFieldErrors(body);
  if (errors.length) return fail(400, "VALIDATION_ERROR", errors);
  const listing = publicListing(body.listingId);
  if (!listing) return fail(404, "BOOKING_LISTING_NOT_FOUND");
  const mine = petsOfAccount(user);
  const pets = body.petIds.map((id) => mine.find((pet) => pet.id === id));
  if (pets.some((pet) => !pet)) return fail(404, "BOOKING_PET_NOT_FOUND");
  if (pets.some((pet) => !pet.isActive)) return fail(422, "BOOKING_PET_INACTIVE");
  if (pets.some((pet) => !listing.acceptedSpecies.includes(pet.species)))
    return fail(422, "BOOKING_PET_SPECIES_NOT_ACCEPTED");
  const sizeOk = { small: listing.acceptsSmall, medium: listing.acceptsMedium, large: listing.acceptsLarge };
  if (pets.some((pet) => pet.size && !sizeOk[pet.size])) return fail(422, "BOOKING_PET_SIZE_NOT_ACCEPTED");
  const open = ["requested", "accepted", "confirmed", "in_progress"];
  const busy = pets.find((pet) =>
    [...bookings.values()].some(
      ({ booking }) =>
        open.includes(booking.status) &&
        booking.pets.some((item) => item.id === pet.id) &&
        booking.checkIn < body.checkOut &&
        body.checkIn < booking.checkOut,
    ),
  );
  if (busy) return failWith(409, "BOOKING_PET_PERIOD_CONFLICT", `Pet ${busy.id} already has a booking in this period.`);
  for (let day = body.checkIn; day <= body.checkOut; day = addDays(day, 1)) {
    const weekday = WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()];
    if (!listing.availableWeekdays.includes(weekday))
      return failWith(422, "BOOKING_WEEKDAY_NOT_AVAILABLE", `The listing does not receive on ${day}.`);
  }
  const booking = seedBooking(
    null,
    {
      listingId: listing.id,
      listing: { id: listing.id, title: listing.title, ...listing.address },
      hostId: listing.hostId,
      host: { id: listing.host.id, name: listing.host.name, avatarUrl: listing.host.avatarUrl },
      ownerId: user.id,
      owner: { id: user.id, name: user.fullName, avatarUrl: null },
      pets: pets.map(({ id, name, species, size }) => ({ id, name, species, size })),
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      petCount: pets.length,
      nightlyRate: listing.nightlyRate,
      totalPrice:
        listing.nightlyRate * pets.length * Math.round((Date.parse(body.checkOut) - Date.parse(body.checkIn)) / DAY_MS),
    },
    user.id,
  );
  return ok(booking, { status: 201 });
}

/**
 * `/bookings*` dos dois lados (specs 050, 052, 053 e 054): o pedido do tutor; lista por status e página e detalhe para quem participa; do
 * anfitrião, aceitar (já confirma e libera o telefone do tutor), recusar, chegada e volta; cancelar dos dois lados (o
 * tutor recebe `refundPercentage` pela regra das 48 horas), com os códigos de erro da API. E `GET /pets/{id}` dos
 * pets de um pedido do anfitrião (antes do mock de pets; outros pets seguem para ele).
 * @example app.use(createMiddleware(...bookingsHandlers, ...petsHandlers));
 */
export const bookingsHandlers = [
  http.post(`${API}/bookings`, async ({ request }) => {
    const user = sessionUserOf(request);
    if (!user) return fail(401, "UNAUTHORIZED");
    if (user.role !== "owner") return fail(404, "BOOKING_OWNER_NOT_FOUND");
    return createRequest(user, (await request.json().catch(() => null)) ?? {});
  }),
  http.get(`${API}/bookings/me`, ({ request }) => {
    const user = sessionUserOf(request);
    if (!user) return fail(401, "UNAUTHORIZED");
    const url = new URL(request.url);
    const statuses = url.searchParams.getAll("status").flatMap((value) => value.split(","));
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 20);
    const items = [...bookings.values()]
      .filter((entry) => sideOf(entry, user.id) !== null)
      .map((entry) => entry.booking)
      .filter((booking) => statuses.length === 0 || statuses.includes(booking.status))
      .sort((a, b) => b.checkIn.localeCompare(a.checkIn));
    return ok({
      items: items.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      totalCount: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
    });
  }),
  http.get(`${API}/bookings/:bookingId`, ({ request, params }) => {
    const result = ownBooking(request, params.bookingId);
    return result.error ?? ok(result.booking);
  }),
  http.post(`${API}/bookings/:bookingId/acceptance`, ({ request, params }) => {
    const result = ownBooking(request, params.bookingId, "host");
    if (result.error) return result.error;
    if (result.booking.status !== "requested") return fail(422, "BOOKING_NOT_AWAITING_RESPONSE");
    const now = new Date().toISOString();
    return touch(result.booking, {
      status: "confirmed",
      respondedAt: now,
      confirmedAt: now,
      responseDeadline: null,
      contact: OWNER_CONTACT,
    });
  }),
  http.post(`${API}/bookings/:bookingId/refusal`, async ({ request, params }) => {
    const result = ownBooking(request, params.bookingId, "host");
    if (result.error) return result.error;
    if (result.booking.status !== "requested") return fail(422, "BOOKING_NOT_AWAITING_RESPONSE");
    const body = (await request.json().catch(() => null)) ?? {};
    return touch(result.booking, {
      status: "declined",
      declineReason: body.reason ?? null,
      respondedAt: new Date().toISOString(),
      responseDeadline: null,
    });
  }),
  http.post(`${API}/bookings/:bookingId/cancellation`, async ({ request, params }) => {
    const result = ownBooking(request, params.bookingId);
    if (result.error) return result.error;
    const { status } = result.booking;
    if (status === "cancelled") return fail(422, "BOOKING_ALREADY_CANCELLED");
    if (status === "declined" || status === "expired") return fail(422, "BOOKING_ALREADY_CLOSED");
    if (status === "in_progress" || status === "completed") return fail(422, "BOOKING_CANNOT_CANCEL_AFTER_CHECK_IN");
    const body = (await request.json().catch(() => null)) ?? {};
    return touch(result.booking, {
      status: "cancelled",
      cancelledBy: result.side,
      cancelledAt: new Date().toISOString(),
      cancellationReason: body.reason ?? null,
      refundPercentage: result.side === "owner" ? ownerRefund(result.booking) : 100,
      responseDeadline: null,
      contact: null,
    });
  }),
  http.post(`${API}/bookings/:bookingId/check-in`, ({ request, params }) => {
    const result = ownBooking(request, params.bookingId, "host");
    if (result.error) return result.error;
    const { booking } = result;
    if (booking.status !== "confirmed") return fail(422, "BOOKING_NOT_CONFIRMED");
    const today = brasiliaToday();
    if (today < booking.checkIn) return fail(422, "BOOKING_CHECK_IN_TOO_EARLY");
    if (today >= booking.checkOut) return fail(422, "BOOKING_CHECK_IN_WINDOW_CLOSED");
    return touch(booking, { status: "in_progress", checkedInAt: new Date().toISOString() });
  }),
  http.post(`${API}/bookings/:bookingId/check-out`, ({ request, params }) => {
    const result = ownBooking(request, params.bookingId, "host");
    if (result.error) return result.error;
    if (result.booking.status !== "in_progress") return fail(422, "BOOKING_NOT_IN_PROGRESS");
    return touch(result.booking, { status: "completed", checkedOutAt: new Date().toISOString() });
  }),
  http.get(`${API}/pets/:petId`, ({ request, params }) => {
    const user = sessionUserOf(request);
    if (!user || user.role !== "host") return undefined;
    for (const entry of bookings.values())
      if (entry.hostUserId === user.id && entry.sheets.has(params.petId)) return ok(entry.sheets.get(params.petId));
    return undefined;
  }),
];
