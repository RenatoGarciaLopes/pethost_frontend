import { bffClient } from "@/shared/api/client/bffClient";
import { PostApiV1AuthSessionsSwitchBody } from "@/shared/api/generated/sessions/sessions.zod";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { sessionResultSchema, type PersonalRole, type SessionResult } from "@/shared/auth/contracts/session";

/**
 * Troca pelo BFF; senha só no corpo e tokens só no servidor (REQ-SWITCH-005/010).
 * @example const session = await switchAccount({ role: "host", password: passwordInput });
 */
export function switchAccount(
  body: { role: PersonalRole; password: string },
  transport: HttpTransport = bffClient,
): Promise<SessionResult> {
  return transport.request(
    { method: "POST", path: "/auth/sessions/switch", body: PostApiV1AuthSessionsSwitchBody.parse(body) },
    sessionResultSchema,
  );
}
