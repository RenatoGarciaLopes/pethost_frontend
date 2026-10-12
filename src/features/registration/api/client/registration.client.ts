import { bffClient } from "@/shared/api/client/bffClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { sessionResultSchema, type SessionResult } from "@/shared/auth/contracts/session";
import type { OwnerRegistrationValues } from "../../schemas/ownerRegistrationSchema";
import { toOwnerRegisterBody } from "../mappers/toOwnerRegisterBody";

/**
 * Cria a conta de tutor pela rota do BFF, que grava os cookies HttpOnly e devolve só `{ user }` (spec 003).
 * @throws {ApiError} `VALIDATION_ERROR`, `AUTH_EMAIL_ALREADY_REGISTERED`, `OWNER_CPF_ALREADY_REGISTERED`, `TOO_MANY_REQUESTS`…
 */
export function registerOwner(
  values: OwnerRegistrationValues,
  transport: HttpTransport = bffClient,
): Promise<SessionResult> {
  return transport.request(
    { method: "POST", path: "/owners/register", body: toOwnerRegisterBody(values) },
    sessionResultSchema,
  );
}
