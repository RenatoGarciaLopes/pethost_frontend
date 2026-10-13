import { bffClient } from "@/shared/api/client/bffClient";
import { emptyDataSchema } from "@/shared/api/contracts/emptyData";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
/** Encerra a sessão pelo BFF, ignorando falhas de HTTP/rede; não limpa cache nem navega. @example await logoutBestEffort(); */
export async function logoutBestEffort(transport: HttpTransport = bffClient): Promise<void> {
  await transport.request({ method: "POST", path: "/auth/sessions/logout" }, emptyDataSchema).catch(() => undefined);
}
