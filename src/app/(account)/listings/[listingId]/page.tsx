import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingPageScreen, getListingPageContext, getListingPageDetail } from "@/features/listing-page/index.server";
import { queryToSearchParams, searchParamsToQuery } from "@/features/search";
import { isPetId, petQueries } from "@/features/pets";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { requirePersonalUser } from "@/shared/auth/server/requirePersonalUser";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import { brasiliaToday } from "@/shared/lib/date/stayRules";
import { ListingSearchControls } from "./ListingSearchControls";
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

/** Detalhe de cantinho protegido, renderizado no servidor. */
export default async function ListingPage({ params, searchParams }: ListingPageProps) {
  const [{ listingId }, rawSearch] = await Promise.all([params, searchParams]);
  if (!isPetId(listingId)) notFound();
  const query = searchParamsToQuery(rawSearch);
  const user = await requirePersonalUser(pathWithQuery(listingId, queryToSearchParams(query).toString()));
  const [{ listing, isOwner }, ownerPets] = await Promise.all([
    getListingPageContext(user.id, user.role, listingId),
    user.role === "owner" ? getQueryClient().fetchQuery(petQueries.mine(user.id, await backendForRequest())) : null,
  ]);
  const selectedPets =
    ownerPets?.active
      .filter((pet) => query.pets.includes(pet.id))
      .map(({ id, name, species, size }) => ({ id, name, species, size: size ?? null })) ?? [];
  const activePets =
    ownerPets?.active.map(({ id, name, species, size }) => ({ id, name, species, size: size ?? null })) ?? [];
  return (
    <ListingPageScreen
      listing={listing}
      query={query}
      requestSearch={queryToSearchParams(query).toString()}
      selectedPets={selectedPets}
      selectionControl={
        user.role === "owner" && !isOwner ? (
          <ListingSearchControls listingId={listingId} query={query} pets={activePets} today={brasiliaToday()} />
        ) : undefined
      }
      isOwner={isOwner}
      accountRole={user.role}
    />
  );
}

function pathWithQuery(listingId: string, query: string) {
  return `/listings/${listingId}${query ? `?${query}` : ""}`;
}
