import type { Metadata } from "next";
import { Suspense } from "react";
import { petQueries } from "@/features/pets";
import { queryToSearchParams, searchParamsToQuery } from "@/features/search";
import { SearchScreen } from "@/features/search/index.server";
import { requirePersonalUser } from "@/shared/auth/server/requirePersonalUser";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import { getQueryClient } from "@/shared/api/query/queryClient";
import type { SearchParams } from "@/shared/lib/url/searchParams";

export const metadata: Metadata = { title: "Buscar cantinhos", robots: { index: false, follow: false } };

/** Rota privada; Suspense sem loader visual mantém a primeira lista no servidor. */
export default function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <Suspense>
      <SearchContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = searchParamsToQuery(await searchParams);
  const params = queryToSearchParams(query);
  const user = await requirePersonalUser(`/search${params.size ? `?${params}` : ""}`);
  const pets =
    user.role === "owner"
      ? (await getQueryClient().fetchQuery(petQueries.mine(user.id, await backendForRequest()))).active.map(
          ({ id, name, species, size }) => ({ id, name, species, size }),
        )
      : [];
  return <SearchScreen accountId={user.id} query={query} pets={pets} />;
}
