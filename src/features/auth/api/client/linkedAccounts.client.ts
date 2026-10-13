import { bffClient } from "@/shared/api/client/bffClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import type { LinkedAccount } from "../../types/linkedAccount";
import { linkedAccountsSchema } from "../contracts/linkedAccounts";

/**
 * Lista contas pessoais pelo BFF, validando o contrato e descartando papéis desconhecidos (REQ-SWITCH-003).
 * @example const accounts = await getLinkedAccounts();
 */
export function getLinkedAccounts(transport: HttpTransport = bffClient): Promise<LinkedAccount[]> {
  return transport.request({ method: "GET", path: "/users/me/accounts" }, linkedAccountsSchema);
}
