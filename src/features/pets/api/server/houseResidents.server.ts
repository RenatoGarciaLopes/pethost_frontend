import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import { isApiError } from "@/shared/api/errors/ApiError";
import { petQueries } from "../queries";
/** Vitrine para HydrationBoundary em página autenticada; erros não bloqueiam o cantinho. Recebe id do perfil. @example await prefetchHouseResidents(client, host.id); */
export async function prefetchHouseResidents(client: QueryClient, hostId: string): Promise<void> {
  try {
    await client.fetchQuery(petQueries.house(hostId, await backendForRequest()));
  } catch (error) {
    if (process.env.NODE_ENV === "development")
      console.error(
        "HouseResidents",
        isApiError(error) ? { status: error.status, code: error.code } : { code: "UNKNOWN_ERROR" },
      );
  }
}
