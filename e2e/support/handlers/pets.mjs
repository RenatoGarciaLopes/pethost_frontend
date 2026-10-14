import { http } from "msw";
import { fail, ok, sessionUserOf } from "./session.mjs";
import { switchAccounts } from "./switchAccounts.mjs";

const API = "http://localhost:5099/api/v1";

function pet(id, name, overrides = {}) {
  return {
    id,
    species: "dog",
    speciesDescription: null,
    name,
    breed: "Vira-lata",
    size: "medium",
    birthDate: "2022-03-10",
    sex: "female",
    isNeutered: true,
    isVaccinated: true,
    goodWithDogs: true,
    goodWithCats: true,
    goodWithKids: true,
    photos: [],
    isActive: true,
    createdAt: "2026-10-01T12:00:00Z",
    updatedAt: "2026-10-01T12:00:00Z",
    ...overrides,
  };
}

/** Pets sintéticos da tutora "both" (spec 020): dois na lista e um fora dela. As outras contas não têm pet. */
const OWNER_PETS = [
  pet("0199d2a0-0000-7000-8000-0000000000e1", "Luna"),
  pet("0199d2a0-0000-7000-8000-0000000000e2", "Thor", { species: "cat", breed: null, size: null, sex: "male" }),
  pet("0199d2a0-0000-7000-8000-0000000000e3", "Mel", { isActive: false, deactivatedAt: "2026-09-01T12:00:00Z" }),
];

/**
 * `GET /pets/me` do mock: o dono uma vez e os pets da conta do token (spec 020).
 * @example app.use(createMiddleware(...petsHandlers));
 */
export const petsHandlers = [
  http.get(`${API}/pets/me`, ({ request }) => {
    const user = sessionUserOf(request);
    if (!user) return fail(401, "UNAUTHORIZED");
    if (user.role === "admin") return fail(403, "FORBIDDEN");
    const scenario = switchAccounts.find((account) => account.user.id === user.id)?.scenario;
    const pets = scenario === "both" && user.role === "owner" ? OWNER_PETS : [];
    return ok({ keeper: { id: user.id, type: user.role, name: user.fullName, avatarUrl: null }, pets });
  }),
];
