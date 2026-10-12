import { http } from "msw";
import { DEMO, fail, issueSession, ok } from "./session.mjs";

/**
 * Cadastro de tutor simulado para o E2E (spec 011), no formato real da API: a sessão vem com o tutor
 * completo e o `user` dentro de `owner` (`modulo-owners.md` seção 3.2). Nada aqui é dado real.
 * - e-mail da conta de demonstração: 409 `AUTH_EMAIL_ALREADY_REGISTERED`;
 * - CPF `11144477735` (válido): 409 `OWNER_CPF_ALREADY_REGISTERED`;
 * - CEP `00000000`: 400 `VALIDATION_ERROR` em `address.zipCode`.
 */
const API = "http://localhost:5099/api/v1";
export const TAKEN_CPF = "11144477735";
export const INVALID_ZIP = "00000000";

export const ownersHandlers = [
  http.post(`${API}/owners/register`, async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    if (body?.email === DEMO.email) return fail(409, "AUTH_EMAIL_ALREADY_REGISTERED");
    if (body?.cpf === TAKEN_CPF) return fail(409, "OWNER_CPF_ALREADY_REGISTERED");
    if (body?.address?.zipCode === INVALID_ZIP) {
      return fail(400, "VALIDATION_ERROR", [{ field: "address.zipCode", messages: ["CEP não existe."] }]);
    }

    const { user, ...tokens } = issueSession();
    const now = new Date().toISOString();
    return ok(
      {
        ...tokens,
        owner: {
          id: "0199c5a2-7f3e-7a41-9b1c-000000000011",
          userId: user.id,
          cpf: body.cpf,
          isActive: true,
          createdAt: now,
          user: { ...user, fullName: body.fullName, email: body.email, createdAt: now },
        },
      },
      { status: 201 },
    );
  }),
];
