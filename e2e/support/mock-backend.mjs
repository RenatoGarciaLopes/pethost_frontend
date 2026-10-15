import express from "express";
import { createMiddleware } from "@mswjs/http-middleware";
import { http, HttpResponse } from "msw";
import { accountSwitchHandlers } from "./handlers/accountSwitch.mjs";
import { accountProfileHandlers, resetAccountProfiles } from "./handlers/accountProfile.mjs";
import { ownersHandlers } from "./handlers/owners.mjs";
import { passwordHandlers } from "./handlers/password.mjs";
import { petsHandlers, resetPets } from "./handlers/pets.mjs";
import { stripeAccountHandlers, resetStripeAccounts } from "./handlers/stripeAccount.mjs";
import { usersHandlers } from "./handlers/users.mjs";
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
    resetStripeAccounts();
    resetAdminApplications();
    return HttpResponse.json({ ok: true });
  }),
  ...sessionHandlers,
  ...accountSwitchHandlers,
  ...accountProfileHandlers,
  ...ownersHandlers,
  ...usersHandlers,
  ...passwordHandlers,
  ...petsHandlers,
  ...stripeAccountHandlers,
  ...adminApplicationsHandlers,
];
const app = express();
app.use(createMiddleware(...handlers));
app.listen(5099, () => console.log("Mock backend listening on http://localhost:5099"));
