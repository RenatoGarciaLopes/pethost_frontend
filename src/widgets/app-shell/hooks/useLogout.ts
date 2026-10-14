"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { logoutBestEffort } from "@/shared/auth/client/logoutBestEffort";
import { LOGIN_PATH } from "@/shared/config/appRoutes";
/** Sai pelo BFF mesmo com HTTP/rede indisponíveis, limpa o cache e substitui a rota pelo login.
 * Requer QueryClientProvider e App Router. Não guarda dados de sessão no navegador.
 * @example const { logout, isPending } = useLogout(); // <button onClick={logout} disabled={isPending}>Sair</button>
 */
export function useLogout(): { logout: () => void; isPending: boolean } {
  const queryClient = useQueryClient();
  const router = useRouter();
  const active = useRef(false);
  const mutation = useMutation({
    mutationFn: () => logoutBestEffort(),
    onSuccess: () => {
      queryClient.clear();
      router.replace(LOGIN_PATH);
    },
    onSettled: () => {
      active.current = false;
    },
  });
  function logout(): void {
    if (active.current) return;
    active.current = true;
    mutation.mutate();
  }
  return { logout, isPending: mutation.isPending };
}
