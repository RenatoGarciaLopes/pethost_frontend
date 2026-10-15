"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cancelApplication,
  patchApplication,
  startApplication,
  submitApplication,
  uploadDocuments,
  type DocumentFiles,
} from "../api/client/myApplication.client";
import type { HostApplicationDto } from "../api/contracts";
import { myApplicationQueries } from "../api/queries";
import { toPatchApplicationRequest, toStartApplicationRequest } from "../api/toApplicationRequest";
import { toHostApplication } from "../api/toMyApplication";
import type { ApplicationDataValues } from "../schemas/applicationSchemas";
import type { HostApplication } from "../types";

/** Grava a solicitação devolvida e relê a verificação (tentativas e "pode começar de novo" mudam no servidor). */
function useApplicationSuccess(accountId: string) {
  const client = useQueryClient();
  const { queryKey } = myApplicationQueries.mine(accountId);
  return async (dto: HostApplicationDto | HostApplication) => {
    const application = "cpfMasked" in dto ? dto : toHostApplication(dto);
    client.setQueryData(queryKey, (current) => current && { ...current, application });
    await client.invalidateQueries({ queryKey });
  };
}

/**
 * "Seus dados" (REQ-HVER-005): sem rascunho, abre a solicitação (`POST`); com rascunho, manda só o que mudou
 * (`PATCH`); nada mudou, não chama a API. Não repete sozinho.
 * @example await useSaveApplicationData(user.id).mutateAsync(values)
 */
export function useSaveApplicationData(accountId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (values: ApplicationDataValues): Promise<HostApplicationDto | HostApplication> => {
      const current = client.getQueryData(myApplicationQueries.mine(accountId).queryKey)?.application;
      if (!current?.draft) return startApplication(toStartApplicationRequest(values));
      const body = toPatchApplicationRequest(current.draft, values);
      return Object.keys(body).length === 0 ? current : patchApplication(body);
    },
    retry: false,
    onSuccess: useApplicationSuccess(accountId),
  });
}

/**
 * Fotos (REQ-HVER-008): um pedido só com as vagas preenchidas; erro de vaga volta para a tela, sem repetir.
 * @example await useUploadDocuments(user.id).mutateAsync({ front, back, selfie })
 */
export function useUploadDocuments(accountId: string) {
  return useMutation({
    mutationFn: (files: DocumentFiles) => uploadDocuments(files),
    retry: false,
    onSuccess: useApplicationSuccess(accountId),
  });
}

/**
 * "Enviar pra análise" (REQ-HVER-010).
 * @example useSubmitApplication(user.id).mutate()
 */
export function useSubmitApplication(accountId: string) {
  return useMutation({
    mutationFn: () => submitApplication(),
    retry: false,
    onSuccess: useApplicationSuccess(accountId),
  });
}

/**
 * "Desistir" (REQ-HVER-013): rascunho ou análise; as fotos são apagadas e não gasta tentativa.
 * @example useCancelApplication(user.id).mutate()
 */
export function useCancelApplication(accountId: string) {
  return useMutation({
    mutationFn: () => cancelApplication(),
    retry: false,
    onSuccess: useApplicationSuccess(accountId),
  });
}
