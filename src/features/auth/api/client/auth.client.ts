import { bffClient } from "@/shared/api/client/bffClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { sessionResultSchema, type SessionResult } from "@/shared/auth/contracts/session";
import type { LoginFormValues } from "../../schemas/loginFormSchema";

/** Corpo que a API espera no login e na reativação (`modulo-auth.md` seções 2.1 e 2.10). */
function toLoginRequest(values: LoginFormValues) {
  return { email: values.email, password: values.password, role: values.role };
}

/**
 * Entra pela rota do BFF, que grava os cookies HttpOnly e devolve só `{ user }` (spec 003).
 * @throws {ApiError} `AUTH_INVALID_CREDENTIALS`, `AUTH_ACCOUNT_DEACTIVATED`, `AUTH_ACCOUNT_SUSPENDED`, `TOO_MANY_REQUESTS`…
 */
export function login(values: LoginFormValues, transport: HttpTransport = bffClient): Promise<SessionResult> {
  return transport.request(
    { method: "POST", path: "/auth/sessions/login", body: toLoginRequest(values) },
    sessionResultSchema,
  );
}

/** Rota de reativação de cada papel (o admin não pausa a conta). */
const REACTIVATE_PATH = { owner: "/owners/reactivate", host: "/hosts/reactivate" } as const;

/**
 * Reativa a conta pausada com as mesmas credenciais e já abre a sessão (REQ-AUTH-008).
 * @throws {ApiError} `AUTH_INVALID_CREDENTIALS`, `AUTH_ACCOUNT_SUSPENDED`…
 */
export function reactivateAccount(
  values: LoginFormValues & { role: keyof typeof REACTIVATE_PATH },
  transport: HttpTransport = bffClient,
): Promise<SessionResult> {
  return transport.request(
    { method: "POST", path: REACTIVATE_PATH[values.role], body: toLoginRequest(values) },
    sessionResultSchema,
  );
}
