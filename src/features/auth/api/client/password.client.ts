import { bffClient } from "@/shared/api/client/bffClient";
import { emptyDataSchema } from "@/shared/api/contracts/emptyData";
import {
  PostApiV1AuthPasswordForgotBody,
  PostApiV1AuthPasswordResetBody,
} from "@/shared/api/generated/password/password.zod";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import type { ForgotPasswordValues } from "../../schemas/forgotPasswordSchema";

/**
 * Pede o link pelo BFF sem distinguir contas existentes (REQ-PWD-002/003).
 * @example await requestPasswordReset({ email: "pessoa@exemplo.test", role: "owner" });
 */
export async function requestPasswordReset(
  values: ForgotPasswordValues,
  transport: HttpTransport = bffClient,
): Promise<void> {
  const body = PostApiV1AuthPasswordForgotBody.parse({ email: values.email, role: values.role });
  await transport.request({ method: "POST", path: "/auth/password/forgot", body }, emptyDataSchema);
}

/**
 * Troca a senha pelo BFF, enviando o token só no corpo (REQ-PWD-008/013).
 * @example await resetPassword({ token: "token-do-link", newPassword: "Abcdef1!" });
 */
export async function resetPassword(
  body: { token: string; newPassword: string },
  transport: HttpTransport = bffClient,
): Promise<void> {
  await transport.request(
    { method: "POST", path: "/auth/password/reset", body: PostApiV1AuthPasswordResetBody.parse(body) },
    emptyDataSchema,
  );
}
