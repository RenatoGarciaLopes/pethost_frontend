import { http } from "msw";
import { rejectRegistration, registerAccount } from "./registration.mjs";
import { ok } from "./session.mjs";

/**
 * Cadastro de anfitrião simulado para o E2E (spec 012), no formato real da API: `201` com a sessão e o
 * `user` no topo, com `role: "host"`; `role` no corpo é ignorado (`modulo-auth.md` seção 2.7).
 * Recusas comuns em `registration.mjs`.
 */
const API = "http://localhost:5099/api/v1";

export const usersHandlers = [
  http.post(`${API}/users/register`, async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    const rejection = rejectRegistration(body);
    if (rejection) return rejection;

    return ok(registerAccount(body, "host"), { status: 201 });
  }),
];
