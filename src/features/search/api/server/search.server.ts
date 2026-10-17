import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import type { SearchPet, SearchQuery } from "../../types";
import { toSearchError } from "../../lib/searchErrors";
import { searchQueries } from "../queries";

/** Prefetch hidratável; erros conhecidos se tornam estado serializável sem exception na página. @example await prefetchSearch(client, accountId, query, pets) */
export async function prefetchSearch(client: QueryClient, accountId: string, query: SearchQuery, pets: SearchPet[]) {
  try {
    await client.fetchInfiniteQuery(searchQueries.infinite(accountId, query, pets, await backendForRequest()));
  } catch (error) {
    return toSearchError(error);
  }
}
