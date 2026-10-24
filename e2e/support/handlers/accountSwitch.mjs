import { fieldIssue } from "./fieldIssue.mjs";
import { http } from "msw";
import { fail, issueSession, ok, sessionUserOf } from "./session.mjs";
import { switchAccounts } from "./switchAccounts.mjs";

const API = "http://localhost:5099/api/v1";

/**
 * Lista e troca ligadas à conta do token, com erro neutro para senha, ausência e pausa (spec 014).
 * Não revoga o refresh anterior aqui: essa responsabilidade é do BFF já entregue em T1.
 * @example app.use(createMiddleware(...accountSwitchHandlers));
 */
export const accountSwitchHandlers = [
  http.get(`${API}/users/me/accounts`, ({ request }) => {
    const current = sessionUserOf(request);
    if (!current) return fail(401, "UNAUTHORIZED");
    const linked = switchAccounts.filter((account) => account.user.email === current.email);
    const users = linked.length ? linked.map((account) => account.user) : [current];
    return ok(users.map((user) => ({ role: user.role, isActive: user.isActive, isCurrent: user.id === current.id })));
  }),
  http.post(`${API}/auth/sessions/switch`, async ({ request }) => {
    const current = sessionUserOf(request);
    if (!current) return fail(401, "UNAUTHORIZED");
    const body = await request.json().catch(() => null);
    if (body?.role !== "owner" && body?.role !== "host")
      return fail(400, "VALIDATION_ERROR", [fieldIssue("role", "Escolha tutor ou anfitrião.", "AUTH_ROLE_INVALID")]);
    if (typeof body?.password !== "string" || !body.password.trim())
      return fail(400, "VALIDATION_ERROR", [fieldIssue("password", "Falta a senha.", "AUTH_PASSWORD_REQUIRED")]);
    const destination = switchAccounts.find(
      (account) =>
        account.user.email === current.email &&
        account.user.role === body.role &&
        account.user.isActive &&
        account.password === body.password,
    );
    if (body.role === current.role || !destination) return fail(404, "AUTH_LINKED_ACCOUNT_NOT_FOUND");
    return ok(issueSession(destination.user));
  }),
];
