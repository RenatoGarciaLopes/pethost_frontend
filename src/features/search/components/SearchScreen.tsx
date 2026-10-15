import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { brasiliaToday } from "@/shared/lib/date/stayRules";
import type { SearchPet, SearchQuery } from "../types";
import { prefetchSearch } from "../api/server/search.server";
import { SearchExperience } from "../index.client";

/** Busca inicial no servidor, sem loader e sem segundo fetch após hidratar. @example <SearchScreen accountId={user.id} query={query} pets={pets} /> */
export async function SearchScreen({
  accountId,
  query,
  pets,
}: {
  accountId: string;
  query: SearchQuery;
  pets: SearchPet[];
}) {
  const client = getQueryClient();
  const initialError = await prefetchSearch(client, accountId, query, pets);
  return (
    <HydrationBoundary state={dehydrate(client)}>
      <SearchExperience
        key={accountId}
        accountId={accountId}
        initialQuery={query}
        pets={pets}
        today={brasiliaToday()}
        initialError={initialError}
      />
    </HydrationBoundary>
  );
}
