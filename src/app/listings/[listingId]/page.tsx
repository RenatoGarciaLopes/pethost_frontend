import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { compatibilityReasons } from "@/features/listing-page";
import {
  ListingPageScreen,
  getListingClosedPeriods,
  getListingPageContext,
  getListingPageDetail,
  getListingReviews,
} from "@/features/listing-page/index.server";
import { queryToSearchParams, searchParamsToQuery } from "@/features/search";
import { CompatibilityNotice } from "@/features/search/index.client";
import { prefetchCompatibility } from "@/features/search/index.server";
import { isPetId, petQueries } from "@/features/pets";
import { HouseResidents } from "@/features/pets/index.client";
import { prefetchHouseResidents } from "@/features/pets/index.server";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { getSession } from "@/shared/auth/server/getSession";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import { brasiliaToday } from "@/shared/lib/date/stayRules";
import type { SearchParams } from "@/shared/lib/url/searchParams";
import { AppShell } from "@/widgets/app-shell/index.server";

interface ListingPageProps {
  params: Promise<{ listingId: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params, searchParams }: ListingPageProps): Promise<Metadata> {
  const { listingId } = await params;
  if (!isPetId(listingId))
    return { title: "Cantinho não encontrado · PetHost", robots: { index: false, follow: false } };
  const query = searchParamsToQuery(await searchParams);
  const user = await personalSession(pathWithQuery(listingId, queryToSearchParams(query).toString()));
  const listing = await getListingPageDetail(user?.id ?? "visitor", listingId);
  return { title: `${listing.title} · PetHost`, robots: { index: false, follow: false } };
}

/**
 * Página do cantinho, aberta ao visitante (decisão de 2026-10-23): só o pedido (`/listings/{id}/request`) exige a
 * conta de tutor. Renderizada no servidor; a leitura da sessão fica sob Suspense.
 */
export default function ListingPage(props: ListingPageProps) {
  return (
    <Suspense fallback={null}>
      <ListingPageContent {...props} />
    </Suspense>
  );
}

async function ListingPageContent({ params, searchParams }: ListingPageProps) {
  const [{ listingId }, rawSearch] = await Promise.all([params, searchParams]);
  if (!isPetId(listingId)) notFound();
  const query = searchParamsToQuery(rawSearch);
  const search = queryToSearchParams(query).toString();
  const path = pathWithQuery(listingId, search);
  const user = await personalSession(path);
  const [{ listing, isOwner }, ownerPets, reviews] = await Promise.all([
    getListingPageContext(user?.id ?? "visitor", user?.role ?? "visitor", listingId),
    user?.role === "owner" ? getQueryClient().fetchQuery(petQueries.mine(user.id, await backendForRequest())) : null,
    getListingReviews(listingId),
  ]);
  const activePets = ownerPets?.active ?? [];
  const selectedPets = activePets.filter((pet) => query.pets.includes(pet.id));
  const hostName = listing.host?.name ?? "a casa";
  const stay = { checkIn: query.from, checkOut: query.to };
  const queryClient = getQueryClient();
  // Residentes, compatibilidade e a agenda do anfitrião chegam prontos: nada aparece depois empurrando a página. Os
  // três exigem conta, então o visitante não os vê (o calendário dele risca só os dias da semana).
  const [closedPeriods] = user
    ? await Promise.all([
        isOwner ? [] : getListingClosedPeriods(listing.id),
        prefetchHouseResidents(queryClient, listing.hostId),
        ...selectedPets.map((pet) => prefetchCompatibility(queryClient, user.id, listing.id, pet.id, stay)),
      ])
    : [[]];
  return (
    <AppShell user={user} returnTo={path}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ListingPageScreen
          listing={listing}
          isOwner={isOwner}
          accountRole={user?.role ?? "visitor"}
          reviews={reviews}
          stay={
            !isOwner
              ? {
                  today: brasiliaToday(),
                  search,
                  where: query.where,
                  from: query.from,
                  to: query.to,
                  petIds: selectedPets.map((pet) => pet.id),
                  count: query.count,
                  pets: activePets.map(({ id, name, coverUrl }) => ({ id, name, coverUrl })),
                  closedPeriods,
                }
              : undefined
          }
          compatibility={
            user &&
            selectedPets.map((pet) => (
              <CompatibilityNotice
                key={pet.id}
                accountId={user.id}
                listingId={listing.id}
                pet={{ id: pet.id, name: pet.name }}
                stay={stay}
                hostName={hostName}
                reasons={compatibilityReasons(listing, { species: pet.species, size: pet.size ?? null })}
              />
            ))
          }
          residents={user && <HouseResidents hostId={listing.hostId} />}
        />
      </HydrationBoundary>
    </AppShell>
  );
}

/**
 * Tutor ou anfitrião logado, ou `null` (visitante). Admin vê a página como visitante, como na home. Access vencido
 * passa pelo refresh do BFF e volta para `path`.
 */
async function personalSession(path: string) {
  await connection();
  const session = await getSession(path);
  return session && session.role !== "admin" ? { ...session, role: session.role } : null;
}

function pathWithQuery(listingId: string, query: string) {
  return `/listings/${listingId}${query ? `?${query}` : ""}`;
}
