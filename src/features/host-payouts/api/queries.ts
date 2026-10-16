import { queryOptions } from "@tanstack/react-query";
import { bffClient } from "@/shared/api/client/bffClient";
import { hasErrorCode } from "@/shared/api/errors/ApiError";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { stripeAccountSchema } from "./contracts";
import { toPayoutAccount } from "./mappers";
/** Situação por conta; perfil ausente é null, outros erros continuam erros. Segredos nunca participam das chaves/dados. @example useQuery(payoutQueries.account(user.id)) */
export const payoutQueries = {
  account: (accountId: string, transport: HttpTransport = bffClient) =>
    queryOptions({
      queryKey: [...accountQueryKey(accountId, "payouts"), "account"] as const,
      queryFn: async () => {
        try {
          return toPayoutAccount(
            await transport.request({ method: "GET", path: "/hosts/me/stripe-account" }, stripeAccountSchema),
          );
        } catch (error) {
          if (hasErrorCode(error, "HOST_NOT_FOUND")) return null;
          throw error;
        }
      },
      staleTime: 30_000,
      retry: false,
    }),
};
