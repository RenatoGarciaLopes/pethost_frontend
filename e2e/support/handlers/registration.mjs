import { randomUUID } from "node:crypto";
import { DEMO, fail, issueSession } from "./session.mjs";

/**
 * Regras comuns aos cadastros simulados de tutor (`owners.mjs`) e anfitrião (`users.mjs`). Nada aqui é dado real.
 * - e-mail da conta de demonstração: 409 `AUTH_EMAIL_ALREADY_REGISTERED`;
 * - CEP `00000000`: 400 `VALIDATION_ERROR` em `address.zipCode`.
 */
export const INVALID_ZIP = "00000000";

/** Resposta de erro do cadastro, ou `undefined` quando o corpo passa. */
export function rejectRegistration(body) {
  if (body?.email === DEMO.email) return fail(409, "AUTH_EMAIL_ALREADY_REGISTERED");
  if (body?.address?.zipCode === INVALID_ZIP) {
    return fail(400, "VALIDATION_ERROR", [{ field: "address.zipCode", messages: ["CEP não existe."] }]);
  }
  return undefined;
}

/** Conta nova com o nome e o e-mail do corpo, já com a sessão aberta (tokens + `user`). */
export function registerAccount(body, role) {
  const user = { id: randomUUID(), fullName: body.fullName, email: body.email, role, isActive: true };
  return issueSession({ ...user, createdAt: new Date().toISOString() });
}
