import { http } from "msw";
import { rejectRegistration, registerAccount } from "./registration.mjs";
import { fail, ok } from "./session.mjs";

/**
 * Cadastro de tutor simulado para o E2E (spec 011), no formato real da API: a sessão vem com o tutor
 * completo e o `user` dentro de `owner` (`modulo-owners.md` seção 3.2). Nada aqui é dado real.
 * Além das recusas comuns (`registration.mjs`), o CPF `11144477735` (válido) dá 409 `OWNER_CPF_ALREADY_REGISTERED`.
 */
const API = "http://localhost:5099/api/v1";
export const TAKEN_CPF = "11144477735";

export const ownersHandlers = [
  http.post(`${API}/owners/register`, async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    const rejection = rejectRegistration(body);
    if (rejection) return rejection;
    if (body?.cpf === TAKEN_CPF) return fail(409, "OWNER_CPF_ALREADY_REGISTERED");

    const { user, ...tokens } = registerAccount(body, "owner");
    return ok(
      {
        ...tokens,
        owner: {
          id: "0199c5a2-7f3e-7a41-9b1c-000000000011",
          userId: user.id,
          cpf: body.cpf,
          isActive: true,
          createdAt: user.createdAt,
          user,
        },
      },
      { status: 201 },
    );
  }),
];
