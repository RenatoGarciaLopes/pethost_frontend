import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { compatibilityReasons } from "@/features/listing-page";
import {
  ListingPageScreen,
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
import { requirePersonalUser } from "@/shared/auth/server/requirePersonalUser";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import { brasiliaToday } from "@/shared/lib/date/stayRules";
import type { SearchParams } from "@/shared/lib/url/searchParams";

interface ListingPageProps {
  params: Promise<{ listingId: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params, searchParams }: ListingPageProps): Promise<Metadata> {
  const { listingId } = await params;
  if (!isPetId(listingId))
    return { title: "Cantinho não encontrado · PetHost", robots: { index: false, follow: false } };
  const query = searchParamsToQuery(await searchParams);
  const user = await requirePersonalUser(pathWithQuery(listingId, queryToSearchParams(query).toString()));
  const listing = await getListingPageDetail(user.id, listingId);
  return { title: `${listing.title} · PetHost`, robots: { index: false, follow: false } };
}

/** Detalhe de cantinho protegido, renderizado no servidor. A leitura da sessão fica sob Suspense. */
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
  const user = await requirePersonalUser(pathWithQuery(listingId, search));
  const [{ listing, isOwner }, ownerPets, reviews] = await Promise.all([
    getListingPageContext(user.id, user.role, listingId),
    user.role === "owner" ? getQueryClient().fetchQuery(petQueries.mine(user.id, await backendForRequest())) : null,
    getListingReviews(listingId),
  ]);
  const activePets = ownerPets?.active ?? [];
  const selectedPets = activePets.filter((pet) => query.pets.includes(pet.id));
  const hostName = listing.host?.name ?? "a casa";
  const stay = { checkIn: query.from, checkOut: query.to };
  const queryClient = getQueryClient();
  // Residentes e compatibilidade chegam hidratados: nada aparece depois empurrando a página.
  await Promise.all([
    prefetchHouseResidents(queryClient, listing.hostId),
    ...selectedPets.map((pet) => prefetchCompatibility(queryClient, user.id, listing.id, pet.id, stay)),
  ]);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ListingPageScreen
        listing={listing}
        isOwner={isOwner}
        accountRole={user.role}
        reviews={reviews}
        stay={
          user.role === "owner" && !isOwner
            ? {
                today: brasiliaToday(),
                search,
                where: query.where,
                from: query.from,
                to: query.to,
                petIds: selectedPets.map((pet) => pet.id),
                count: query.count,
                pets: activePets.map(({ id, name, coverUrl }) => ({ id, name, coverUrl })),
              }
            : undefined
        }
        compatibility={selectedPets.map((pet) => (
          <CompatibilityNotice
            key={pet.id}
            accountId={user.id}
            listingId={listing.id}
            pet={{ id: pet.id, name: pet.name }}
            stay={stay}
            hostName={hostName}
            reasons={compatibilityReasons(listing, { species: pet.species, size: pet.size ?? null })}
          />
        ))}
        residents={<HouseResidents hostId={listing.hostId} />}
      />
    </HydrationBoundary>
  );
}

function pathWithQuery(listingId: string, query: string) {
  return `/listings/${listingId}${query ? `?${query}` : ""}`;
}
