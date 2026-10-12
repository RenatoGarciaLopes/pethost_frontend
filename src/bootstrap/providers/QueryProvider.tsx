"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { onSessionExpired } from "@/shared/auth/client/sessionEvents";
import { loginRedirectPath } from "@/shared/config/appRoutes";

export interface QueryProviderProps {
  children: ReactNode;
}

/**
 * TanStack Query do app. Quando o BFF avisa `SESSION_EXPIRED`, limpa todo o cache
 * (nada da conta anterior fica na tela) e leva ao login com `next` da página atual (REQ-HTTP-012).
 *
 * @example <QueryProvider>{children}</QueryProvider>
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getQueryClient();
  const router = useRouter();

  useEffect(
    () =>
      onSessionExpired(() => {
        queryClient.clear();
        // URL lida no momento do aviso: useSearchParams aqui exigiria Suspense no layout raiz.
        const { pathname, search } = window.location;
        router.replace(loginRedirectPath(`${pathname}${search}`));
      }),
    [queryClient, router],
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
