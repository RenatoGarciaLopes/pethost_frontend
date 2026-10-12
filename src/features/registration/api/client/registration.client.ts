import { bffClient } from "@/shared/api/client/bffClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { sessionResultSchema, type SessionResult } from "@/shared/auth/contracts/session";
import type { RegisterBody } from "../contracts/registerBodies";

/** Rotas do BFF de cada cadastro: tutor (spec 011) e anfitrião (spec 012). */
export type RegisterPath = "/owners/register" | "/users/register";

/**
 * Cria a conta pela rota do BFF, que grava os cookies HttpOnly e devolve só `{ user }` (spec 003).
 * O corpo já sai pronto do mapper da variante (`REGISTRATION_VARIANTS`).
 * @throws {ApiError} `VALIDATION_ERROR`, `AUTH_EMAIL_ALREADY_REGISTERED`, `OWNER_CPF_ALREADY_REGISTERED`, `TOO_MANY_REQUESTS`…
 * @example registerAccount("/users/register", toHostRegisterBody(values))
 */
export function registerAccount(
  path: RegisterPath,
  body: RegisterBody,
  transport: HttpTransport = bffClient,
): Promise<SessionResult> {
  return transport.request({ method: "POST", path, body }, sessionResultSchema);
}
