"use client";

import { login, reactivateAccount } from "../api/client/auth.client";
import { useSessionStartMutation } from "./useSessionStartMutation";

/** Entrar (REQ-AUTH-004/005). Erros chegam como `ApiError` em `mutation.error`. */
export function useLoginMutation(next: string | null | undefined) {
  return useSessionStartMutation(login, next);
}

/** Reativar a conta pausada com as mesmas credenciais (REQ-AUTH-008). */
export function useReactivateMutation(next: string | null | undefined) {
  return useSessionStartMutation(reactivateAccount, next);
}
