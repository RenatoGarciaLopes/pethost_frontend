import express from "express";
import { createMiddleware } from "@mswjs/http-middleware";
import { http, HttpResponse } from "msw";
import { bookingsHandlers, resetBookings, seedBooking } from "./handlers/bookings.mjs";
import { accountSwitchHandlers } from "./handlers/accountSwitch.mjs";
import { accountProfileHandlers, resetAccountProfiles, setHostPayouts } from "./handlers/accountProfile.mjs";
import { ownersHandlers } from "./handlers/owners.mjs";
import { hostApplicationsHandlers, resetHostApplications, seedHostApplication } from "./handlers/hostApplications.mjs";
import { listingsHandlers, resetListings } from "./handlers/listings.mjs";
import { passwordHandlers } from "./handlers/password.mjs";
import { petsHandlers, resetPets } from "./handlers/pets.mjs";
import { usersHandlers } from "./handlers/users.mjs";
import { searchHandlers } from "./handlers/search.mjs";
import { listingPageHandlers } from "./handlers/listingPage.mjs";
import { seedRefreshToken, sessionHandlers } from "./handlers/session.mjs";
import { adminApplicationsHandlers, resetAdminApplications } from "./handlers/adminApplications.mjs";

/**
 * Backend HTTP mínimo para E2E simulado; não representa a API .NET.
 * Os handlers de src/test/msw serão reaproveitados quando houver loader TS.
 */
const handlers = [
  http.get("http://localhost:5099/health", () => HttpResponse.json({ ok: true })),
  // Só no mock: semeia um refresh token para o E2E testar o refresh sem login.
  http.post("http://localhost:5099/__e2e/refresh-token", () => HttpResponse.json({ refreshToken: seedRefreshToken() })),
  http.post("http://localhost:5099/__e2e/account/reset", () => {
    resetAccountProfiles();
    resetPets();
    resetHostApplications();
    resetListings();
    resetBookings();
    resetAdminApplications();
    return HttpResponse.json({ ok: true });
  }),
  // Só no mock: semeia uma reserva entre um anfitrião e, se vier, um tutor (a 050, que cria pedidos, ainda não existe).
  http.post("http://localhost:5099/__e2e/bookings", async ({ request }) => {
    const { hostUserId = null, ownerUserId = null, booking } = await request.json();
    return HttpResponse.json(seedBooking(hostUserId, booking, ownerUserId));
  }),
  // Só no mock: libera (ou não) o recebimento de um anfitrião, para a jornada do cantinho (spec 044).
  http.post("http://localhost:5099/__e2e/host-payouts", async ({ request }) => {
    const { userId, enabled } = await request.json();
    setHostPayouts(userId, enabled);
    return HttpResponse.json({ ok: true });
  }),
  // Só no mock: semeia a verificação de uma conta (ex.: recusa com tentativas) para a jornada da spec 030.
  http.post("http://localhost:5099/__e2e/host-application", async ({ request }) => {
    const { userId, application, remainingAttempts } = await request.json();
    seedHostApplication(userId, application, remainingAttempts);
    return HttpResponse.json({ ok: true });
  }),
  ...sessionHandlers,
  ...accountSwitchHandlers,
  ...accountProfileHandlers,
  ...ownersHandlers,
  ...usersHandlers,
  ...passwordHandlers,
  // Antes dos pets: o anfitrião lê a ficha dos pets dos pedidos dele.
  ...bookingsHandlers,
  ...petsHandlers,
  ...hostApplicationsHandlers,
  ...listingsHandlers,
  ...searchHandlers,
  ...listingPageHandlers,
  ...adminApplicationsHandlers,
];
const app = express();
app.use(createMiddleware(...handlers));
app.listen(5099, () => console.log("Mock backend listening on http://localhost:5099"));
