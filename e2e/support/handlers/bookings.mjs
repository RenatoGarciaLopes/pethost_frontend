import { http } from "msw";
import { randomUUID } from "node:crypto";
import { fail, ok, sessionUserOf } from "./session.mjs";

const API = "http://localhost:5099/api/v1";
const BRASILIA_OFFSET_MS = -3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Reservas em memória, com o id da conta do anfitrião e a ficha dos pets (para o anfitrião ler). */
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
 * Semeia uma reserva para o anfitrião de uma conta (a 050, que cria pedidos, ainda não existe). Padrão: pedido de 1 pet,
 * chegada daqui a 3 dias, prazo em 20 horas. Devolve a reserva.
 * @example seedBooking(host.user.id, { status: "confirmed" });
 */
export function seedBooking(hostUserId, overrides = {}) {
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
  bookings.set(booking.id, { booking, hostUserId, sheets: new Map([[petId, petSheet(petId, "Pipoca")]]) });
  return booking;
}

function ownBooking(request, bookingId) {
  const user = sessionUserOf(request);
  if (!user) return { error: fail(401, "UNAUTHORIZED") };
  const entry = bookings.get(bookingId);
  if (!entry || entry.hostUserId !== user.id) return { error: fail(404, "BOOKING_NOT_FOUND") };
  return { entry, booking: entry.booking };
}

function touch(booking, changes) {
  Object.assign(booking, changes, { updatedAt: new Date().toISOString() });
  return ok(booking);
}

const OWNER_CONTACT = { phone: "44999990000", address: null };

/**
 * `/bookings*` do lado do anfitrião (specs 053 e 054): lista por status e página, detalhe, aceitar (já confirma e
 * libera o telefone do tutor), recusar, cancelar, chegada e volta, com os códigos de erro da API. E `GET /pets/{id}` dos
 * pets de um pedido do anfitrião (antes do mock de pets; outros pets seguem para ele).
 * @example app.use(createMiddleware(...bookingsHandlers, ...petsHandlers));
 */
export const bookingsHandlers = [
  http.get(`${API}/bookings/me`, ({ request }) => {
    const user = sessionUserOf(request);
    if (!user) return fail(401, "UNAUTHORIZED");
    const url = new URL(request.url);
    const statuses = url.searchParams.getAll("status").flatMap((value) => value.split(","));
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 20);
    const items = [...bookings.values()]
      .filter((entry) => entry.hostUserId === user.id)
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
    const result = ownBooking(request, params.bookingId);
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
    const result = ownBooking(request, params.bookingId);
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
  http.post(`${API}/bookings/:bookingId/cancellation`, ({ request, params }) => {
    const result = ownBooking(request, params.bookingId);
    if (result.error) return result.error;
    const { status } = result.booking;
    if (status === "cancelled") return fail(422, "BOOKING_ALREADY_CANCELLED");
    if (status === "declined" || status === "expired") return fail(422, "BOOKING_ALREADY_CLOSED");
    if (status === "in_progress" || status === "completed") return fail(422, "BOOKING_CANNOT_CANCEL_AFTER_CHECK_IN");
    return touch(result.booking, {
      status: "cancelled",
      cancelledBy: "host",
      cancelledAt: new Date().toISOString(),
      refundPercentage: 100,
      responseDeadline: null,
      contact: null,
    });
  }),
  http.post(`${API}/bookings/:bookingId/check-in`, ({ request, params }) => {
    const result = ownBooking(request, params.bookingId);
    if (result.error) return result.error;
    const { booking } = result;
    if (booking.status !== "confirmed") return fail(422, "BOOKING_NOT_CONFIRMED");
    const today = brasiliaToday();
    if (today < booking.checkIn) return fail(422, "BOOKING_CHECK_IN_TOO_EARLY");
    if (today >= booking.checkOut) return fail(422, "BOOKING_CHECK_IN_WINDOW_CLOSED");
    return touch(booking, { status: "in_progress", checkedInAt: new Date().toISOString() });
  }),
  http.post(`${API}/bookings/:bookingId/check-out`, ({ request, params }) => {
    const result = ownBooking(request, params.bookingId);
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
