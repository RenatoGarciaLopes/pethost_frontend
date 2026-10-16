import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { petQueries } from "@/features/pets";
import { prefetchMyPets } from "@/features/pets/index.server";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { getSession } from "@/shared/auth/server/getSession";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { HomeScreen, homeCopy, type HomePetOption } from "@/widgets/home";

export const metadata: Metadata = { title: homeCopy.pageTitle };

/**
 * Início público (spec 040): a identidade e a lista de pets só são lidas na requisição. A página não busca
 * disponibilidade; entrega os filtros preparados para `/search` (spec 041).
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

  if (user?.role === "owner") {
    const queryClient = getQueryClient();
    await prefetchMyPets(queryClient, user.id);
    const query = petQueries.mine(user.id);
    const list = queryClient.getQueryData(query.queryKey);
    pets = list?.active.map(({ id, name, species }) => ({ id, name, species })) ?? [];
    petsUnavailable = Boolean(queryClient.getQueryState(query.queryKey)?.error);
  }

  return <HomeScreen viewer={viewer} pets={pets} petsUnavailable={petsUnavailable} />;
}
