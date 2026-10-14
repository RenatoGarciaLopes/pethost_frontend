import { bffClient } from "./bffClient";
import type { HttpTransport } from "../transport/HttpTransport";
import { ApiError, hasErrorCode, isApiError } from "../errors/ApiError";
import { sessionResultSchema } from "@/shared/auth/contracts/session";
import { notifySessionExpired } from "@/shared/auth/client/sessionEvents";
/**
 * Refaz operação uma única vez após 401 UNAUTHORIZED. O callback recria o corpo multipart em memória.
 * Renovação falhando sinaliza SESSION_EXPIRED, como o BFF; demais erros preservam o contrato.
 * @example await withSessionRetry(() => transport.request(request, schema));
 */
export async function withSessionRetry<T>(send: () => Promise<T>, transport: HttpTransport = bffClient): Promise<T> {
  try {
    return await send();
  } catch (error) {
    if (!isApiError(error) || error.status !== 401 || error.code !== "UNAUTHORIZED") throw error;
    try {
      await transport.request({ method: "POST", path: "/auth/sessions/refresh" }, sessionResultSchema);
    } catch (refreshError) {
      if (hasErrorCode(refreshError, "SESSION_EXPIRED")) throw refreshError;
      notifySessionExpired();
      throw new ApiError({ status: 401, code: "SESSION_EXPIRED", message: "Session expired", cause: refreshError });
    }
    return send();
  }
}
