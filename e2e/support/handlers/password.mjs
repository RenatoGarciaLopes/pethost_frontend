import { fieldIssue } from "./fieldIssue.mjs";
import { http } from "msw";
import { isStrongPassword } from "../../../src/shared/lib/validation/password.ts";
import { fail, ok } from "./session.mjs";

const API = "http://localhost:5099/api/v1";

/**
 * Recuperação simulada (spec 013): confirmação neutra, token "expirado" e validação da senha compartilhada.
 * Não simula envio de e-mail, consumo de token ou revogação das sessões na API real.
 * Node com suporte nativo a TypeScript lê o validador puro, sem loader ou duplicação das regras.
 * @example const server = setupServer(...passwordHandlers);
 */
export const passwordHandlers = [
  http.post(`${API}/auth/password/forgot`, () => ok({})),
  http.post(`${API}/auth/password/reset`, async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    if (body?.token === "expirado") return fail(401, "AUTH_PASSWORD_RESET_TOKEN_INVALID");
    if (typeof body?.newPassword !== "string" || !isStrongPassword(body.newPassword)) {
      return fail(400, "VALIDATION_ERROR", [
        fieldIssue("newPassword", "A senha ainda não cumpre a régua.", "AUTH_PASSWORD_MISSING_DIGIT"),
      ]);
    }
    return ok({});
  }),
];
