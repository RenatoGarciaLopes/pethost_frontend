"use client";
import { useQuery } from "@tanstack/react-query";
import type { Coordinates } from "@/shared/hooks/useGeolocation";
import { searchQueries } from "../api/queries";

/**
 * Cantinhos perto de um ponto. Só consulta quando há coordenada; sem ela fica parada.
 * @example const nearby = useNearbyListings("visitor", coords);
 */
export function useNearbyListings(scope: string, coords: Coordinates | null) {
  return useQuery({
    ...searchQueries.nearby(scope, coords ?? { latitude: 0, longitude: 0 }),
    enabled: coords !== null,
  });
}
