import { http } from "msw";
import { validateImageFile } from "../../../src/shared/lib/files/validateImageFile.ts";
import { isStrongPassword } from "../../../src/shared/lib/validation/password.ts";
import { fail, ok, sessionUserOf, revokeUserSessions, issueSession } from "./session.mjs";
import { switchAccounts } from "./switchAccounts.mjs";
import { TAKEN_CPF } from "./owners.mjs";

const API = "http://localhost:5099/api/v1";
const baseline = structuredClone(switchAccounts);
const profiles = new Map();
/** Restaura apenas fixtures sintéticas e revoga suas sessões, isolando jornadas repetidas.
 * @example resetAccountProfiles(); // antes de cada teste mocked da conta
 */
export function resetAccountProfiles() {
  profiles.clear();
  photoVersion = 0;
  switchAccounts.forEach((account, index) => {
    revokeUserSessions(account.user.id);
    for (const key of Object.keys(account.user)) delete account.user[key];
    Object.assign(account.user, structuredClone(baseline[index].user));
    account.password = baseline[index].password;
  });
}
let photoVersion = 0;
const address = {
  zipCode: "01001000",
  street: "Rua de Teste",
  number: "10",
  complement: "",
  neighborhood: "Centro",
  city: "São Paulo",
  state: "SP",
};
const accountOf = (user) => switchAccounts.find((account) => account.user.id === user.id);
const initialCpfOf = (user) =>
  accountOf(user)?.scenario === "single"
    ? "16899535009"
    : accountOf(user)?.scenario === "paused"
      ? TAKEN_CPF
      : "52998224725";
function profileOf(user) {
  const account = accountOf(user);
  if (user.role === "host" && (!account || account.scenario === "unverified")) return null;
  let profile = profiles.get(user.id);
  if (!profile) {
    Object.assign(user, {
      phone: user.phone ?? "11987654321",
      birthDate: user.birthDate ?? "1990-05-03",
      address: user.address ?? { ...address },
      avatarUrl: user.avatarUrl ?? null,
      createdAt: user.createdAt ?? "2026-10-10T12:00:00Z",
    });
    profile = {
      id: user.id,
      userId: user.id,
      cpf: initialCpfOf(user),
      isActive: user.isActive,
      createdAt: user.createdAt,
      user,
    };
    if (user.role === "host")
      Object.assign(profile, {
        personType: "individual",
        company: null,
        verifiedAt: "2026-10-12T12:00:00Z",
        stripeConnected: false,
        stripePayoutsEnabled: false,
        stripeStatus: "not_started",
      });
    profiles.set(user.id, profile);
  } else {
    Object.assign(user, { ...profile.user, isActive: user.isActive });
    profile.user = user;
    profile.isActive = user.isActive;
  }
  return profile;
}
const fieldError = (field, message) => fail(400, "VALIDATION_ERROR", [{ field, messages: [message] }]);
function authorized(request, role) {
  const user = sessionUserOf(request);
  return !user
    ? { error: fail(401, "UNAUTHORIZED") }
    : user.role !== role
      ? { error: fail(403, "FORBIDDEN") }
      : { user };
}
function handlersFor(role) {
  const path = `${API}/${role}s/me`;
  return [
    http.get(path, ({ request }) => {
      const { user, error } = authorized(request, role);
      if (error) return error;
      const profile = profileOf(user);
      return profile ? ok(profile) : fail(404, "HOST_NOT_FOUND");
    }),
    http.patch(path, async ({ request }) => {
      const { user, error } = authorized(request, role);
      if (error) return error;
      const profile = profileOf(user);
      if (!profile) return fail(404, "HOST_NOT_FOUND");
      const body = await request.json().catch(() => null);
      if (!body || typeof body !== "object") return fieldError("fullName", "Confira os dados.");
      const changed = (field, current) => body[field] !== undefined && body[field] !== current;
      const cpfChanged = changed("cpf", profile.cpf);
      const birthChanged = changed("birthDate", user.birthDate);
      if (role === "owner") {
        const paid = accountOf(user)?.scenario === "both";
        if (paid && cpfChanged) return fail(422, "OWNER_CPF_LOCKED");
        if (paid && birthChanged) return fail(422, "OWNER_BIRTH_DATE_LOCKED");
        if ((cpfChanged || birthChanged) && body.currentPassword !== accountOf(user)?.password)
          return fieldError("currentPassword", "Confere sua senha atual.");
        if (
          cpfChanged &&
          (body.cpf === TAKEN_CPF ||
            switchAccounts.some(
              (other) =>
                other.user.role === "owner" &&
                other.user.id !== user.id &&
                (profiles.get(other.user.id)?.cpf ?? initialCpfOf(other.user)) === body.cpf,
            ))
        )
          return fail(409, "OWNER_CPF_ALREADY_REGISTERED");
      } else {
        if (
          changed("fullName", user.fullName) ||
          birthChanged ||
          cpfChanged ||
          changed("cnpj", profile.company?.cnpj) ||
          changed("legalName", profile.company?.legalName)
        )
          return fail(422, "HOST_IDENTITY_LOCKED");
        if (!profile.company && (body.tradeName !== undefined || body.companyAddress !== undefined))
          return fail(422, "HOST_NOT_A_COMPANY");
      }
      for (const field of ["fullName", "phone", "birthDate"]) if (body[field] !== undefined) user[field] = body[field];
      if (body.address) user.address = { ...user.address, ...body.address };
      if (body.cpf !== undefined) profile.cpf = body.cpf;
      if (profile.company) {
        if (body.tradeName !== undefined) profile.company.tradeName = body.tradeName;
        if (body.companyAddress) profile.company.address = { ...profile.company.address, ...body.companyAddress };
      }
      return ok(profile);
    }),
    http.put(`${path}/avatar`, async ({ request }) => {
      const { user, error } = authorized(request, role);
      if (error) return error;
      const profile = profileOf(user);
      if (!profile) return fail(404, "HOST_NOT_FOUND");
      if (Number(request.headers.get("content-length")) > 8 * 1024 * 1024) return fail(413, "PAYLOAD_TOO_LARGE");
      const body = await request.formData().catch(() => null);
      const file = body?.get("file");
      if (!(file instanceof File)) return fieldError("file", "Essa foto não serve: use JPG, PNG ou WebP de até 5 MB.");
      if (file.size > 8 * 1024 * 1024) return fail(413, "PAYLOAD_TOO_LARGE");
      if (!validateImageFile(file).ok)
        return fieldError("file", "Essa foto não serve: use JPG, PNG ou WebP de até 5 MB.");
      user.avatarUrl = `https://images.example.test/${user.id}-${++photoVersion}.png`;
      return ok(profile);
    }),
    http.delete(`${path}/avatar`, ({ request }) => {
      const { user, error } = authorized(request, role);
      if (error) return error;
      const profile = profileOf(user);
      if (!profile) return fail(404, "HOST_NOT_FOUND");
      user.avatarUrl = null;
      return ok(profile);
    }),
    http.post(`${path}/deactivate`, ({ request }) => {
      const { user, error } = authorized(request, role);
      if (error) return error;
      user.isActive = false;
      const account = accountOf(user);
      if (account) account.user.isActive = false;
      const profile = profiles.get(user.id);
      if (profile) {
        profile.isActive = false;
        profile.user.isActive = false;
      }
      revokeUserSessions(user.id);
      return ok({});
    }),
  ];
}
/**
 * Backend simulado da 015: demo owner já pagou; single ainda pode trocar identidade;
 * demo host é PF verificado e unverified não tem perfil. Estado só em memória.
 * @example app.use(createMiddleware(...accountProfileHandlers));
 */
export const accountProfileHandlers = [
  ...handlersFor("owner"),
  ...handlersFor("host"),
  http.post(`${API}/users/me/password`, async ({ request }) => {
    const user = sessionUserOf(request);
    if (!user) return fail(401, "UNAUTHORIZED");
    const body = await request.json().catch(() => null);
    const account = accountOf(user);
    if (!account || body?.currentPassword !== account.password)
      return fieldError("currentPassword", "Confere sua senha atual.");
    if (
      typeof body?.newPassword !== "string" ||
      !isStrongPassword(body.newPassword) ||
      body.newPassword === account.password
    )
      return fieldError("newPassword", "A senha ainda não cumpre a régua.");
    account.password = body.newPassword;
    revokeUserSessions(user.id);
    return ok(issueSession(user));
  }),
];

/**
 * Liga ou desliga o recebimento (Stripe) de um anfitrião verificado no mock, para as jornadas do cantinho (spec 044).
 * @example setHostPayouts(user.id, true);
 */
export function setHostPayouts(userId, enabled) {
  const account = switchAccounts.find((item) => item.user.id === userId);
  const profile = account && profileOf(account.user);
  if (profile)
    Object.assign(profile, {
      stripeConnected: enabled,
      stripePayoutsEnabled: enabled,
      stripeStatus: enabled ? "enabled" : "not_started",
    });
}

/**
 * O anfitrião da sessão tem o recebimento liberado? (o cadastro do cantinho exige, como na API)
 * @example if (!hostPayoutsEnabled(user)) return fail(422, "LISTING_HOST_PAYOUTS_NOT_ENABLED");
 */
export function hostPayoutsEnabled(user) {
  return Boolean(profileOf(user)?.stripePayoutsEnabled);
}

/**
 * Pessoa física ou empresa, como o perfil do anfitrião diz.
 * @example const isCompany = hostIsCompany(user);
 */
export function hostIsCompany(user) {
  return ["pj", "company"].includes(String(profileOf(user)?.personType ?? "").toLowerCase());
}
