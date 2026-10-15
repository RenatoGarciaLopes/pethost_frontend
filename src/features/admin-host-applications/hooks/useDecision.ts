"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { hasErrorCode } from "@/shared/api/errors/ApiError";
import { adminApplicationQueries } from "../api/queries";
import { approveApplication, rejectApplication } from "../api/client/adminApplications.client";
import type { commonRejectionSchema } from "../api/contracts";

type Decision = { reason: string; rejectionReason?: z.output<typeof commonRejectionSchema> | "suspected_fraud" };
/** Decisão sem otimismo; atualiza detalhe, invalida filas e recarrega em conflito.
 * @example const decision = useDecision(accountId, applicationId); decision.mutate({ reason: "Conferido" });
 */
export function useDecision(accountId: string, id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: [...adminApplicationQueries.all(accountId), "decision", id],
    mutationFn: (body: Decision) =>
      body.rejectionReason
        ? rejectApplication(id, { reason: body.reason, rejectionReason: body.rejectionReason })
        : approveApplication(id, { reason: body.reason }),
    onSuccess: async (data) => {
      client.setQueryData(adminApplicationQueries.detail(accountId, id).queryKey, data);
      await client.invalidateQueries({ queryKey: [...adminApplicationQueries.all(accountId), "queue"] });
      await client.invalidateQueries({ queryKey: adminApplicationQueries.detail(accountId, id).queryKey });
    },
    onError: async (error) => {
      if (
        hasErrorCode(error, "HOST_APPLICATION_CONFLICT") ||
        hasErrorCode(error, "HOST_APPLICATION_NOT_UNDER_REVIEW")
      ) {
        await client.invalidateQueries({ queryKey: adminApplicationQueries.detail(accountId, id).queryKey });
        await client.invalidateQueries({ queryKey: [...adminApplicationQueries.all(accountId), "queue"] });
      }
    },
  });
}
