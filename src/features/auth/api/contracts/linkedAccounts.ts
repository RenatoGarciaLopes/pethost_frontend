import { unwrapData } from "@/shared/api/contracts/unwrapData";
import { GetApiV1UsersMeAccountsResponse } from "@/shared/api/generated/users/users.zod";
import type { LinkedAccount } from "../../types/linkedAccount";

/** Contrato gerado validado antes de descartar papéis não pessoais. @example linkedAccountsSchema.parse([]) */
export const linkedAccountsSchema = unwrapData(GetApiV1UsersMeAccountsResponse).transform((accounts) =>
  accounts.filter((account): account is LinkedAccount => account.role === "owner" || account.role === "host"),
);

/** Frescor compartilhado entre SSR e hook, em milissegundos. */
export const LINKED_ACCOUNTS_STALE_TIME = 60_000;
