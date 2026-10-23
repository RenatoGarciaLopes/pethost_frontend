import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { petQueries } from "@/features/pets";
import { prefetchMyPets } from "@/features/pets/index.server";
import { queryToSearchParams, searchParamsToQuery } from "@/features/search";
import { prefetchSearch } from "@/features/search/index.server";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { getSession } from "@/shared/auth/server/getSession";
import { GrassFooter } from "@/shared/ui/brand/GrassFooter";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { HomeScreen, homeCopy, type HomePetOption } from "@/widgets/home";
import { SearchFilterBar, SearchSummaryBar } from "@/features/search/index.client";
import { AppHeader } from "@/widgets/app-shell";

export const metadata: Metadata = { title: homeCopy.pageTitle };

/**
 * Início e busca (specs 040 e 041): a identidade e a lista de pets só são lidas na requisição. Sem filtros na URL
 * mostra a vitrine "perto de você"; com filtros, a primeira página de resultados já vem do servidor e hidrata no cliente.
 */
interface HomePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default function HomePage({ searchParams }: HomePageProps) {
  return (
    <Suspense
      fallback={
        <main
          id="conteudo"
          aria-busy="true"
          style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 24 }}
        >
          <SniffLoader label={homeCopy.loading} />
        </main>
      }
    >
      <HomeContent searchParams={searchParams} />
    </Suspense>
  );
}

async function HomeContent({ searchParams }: HomePageProps) {
  await connection();
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries((await searchParams) ?? {})) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.set(key, value);
  }
  const user = await getSession(params.size ? `/?${params.toString()}` : "/");
  const viewer = user?.role === "owner" || user?.role === "host" ? user.role : "visitor";
  let pets: HomePetOption[] = [];
  let petsUnavailable = false;

  const queryClient = getQueryClient();
  if (user?.role === "owner") {
    await prefetchMyPets(queryClient, user.id);
    const query = petQueries.mine(user.id);
    const list = queryClient.getQueryData(query.queryKey);
    pets = list?.active.map(({ id, name, species, size }) => ({ id, name, species, size: size ?? null })) ?? [];
    petsUnavailable = Boolean(queryClient.getQueryState(query.queryKey)?.error);
  }

  const query = searchParamsToQuery(params);
  const searching = queryToSearchParams(query).size > 0;
  const initialError = searching ? await prefetchSearch(queryClient, user?.id ?? "visitor", query, pets) : undefined;

  return (
    <>
      <AppHeader
        variant="home"
        user={viewer === "visitor" ? null : user}
        search={<SearchSummaryBar pets={pets} quantityMode={viewer === "host"} />}
        filters={<SearchFilterBar pets={pets} />}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <HomeScreen
          viewer={viewer}
          pets={pets}
          petsUnavailable={petsUnavailable}
          accountId={user?.id ?? null}
          initialQuery={query}
          initialError={initialError}
        />
      </HydrationBoundary>
      <GrassFooter />
    </>
  );
}
