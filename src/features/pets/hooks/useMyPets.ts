"use client";

import { useQuery } from "@tanstack/react-query";
import { petQueries } from "../api/queries";

/**
 * "Meus pets" da conta pelo BFF, já separados em ativos e inativos (REQ-PETS-001, 005).
 * @example const pets = useMyPets(user.id);
 */
export function useMyPets(accountId: string) {
  return useQuery(petQueries.mine(accountId));
}
