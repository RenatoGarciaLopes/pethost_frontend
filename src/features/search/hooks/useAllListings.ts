"use client";
import { useQuery } from "@tanstack/react-query";
import { searchQueries } from "../api/queries";

/**
 * Cantinhos sem filtro de lugar, a reserva da vitrine da home. Só consulta quando `enabled`; sem isso fica parada.
 * @example const all = useAllListings("visitor", nearbyCameEmpty);
 */
export function useAllListings(scope: string, enabled: boolean) {
  return useQuery({ ...searchQueries.all(scope), enabled });
}
