import { Container } from "@mui/material";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { z } from "zod";
import { bookingCopy } from "@/features/bookings";
import { RequestStayHostNotice } from "@/features/bookings/index.server";
import { getListingPageDetail } from "@/features/listing-page/index.server";
import { petQueries } from "@/features/pets";
import { queryToSearchParams, searchParamsToQuery } from "@/features/search";

import { getQueryClient } from "@/shared/api/query/queryClient";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import { requirePersonalUser } from "@/shared/auth/server/requirePersonalUser";
import { brasiliaToday } from "@/shared/lib/date/stayRules";
import type { SearchParams } from "@/shared/lib/url/searchParams";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { RequestStayComposer } from "./RequestStayComposer";

export const metadata: Metadata = { title: bookingCopy.pageTitles.request, robots: { index: false, follow: false } };

interface RequestStayPageProps {
  params: Promise<{ listingId: string }>;
  searchParams: Promise<SearchParams>;
}

/** `/listings/{id}/request` (spec 050): o pedido de estadia do tutor, com datas e pets da URL (`from`, `to`, `pets`). */
export default function RequestStayPage(props: RequestStayPageProps) {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      <Suspense fallback={<SniffLoader label={bookingCopy.loading} />}>
        <RequestStayContent {...props} />
      </Suspense>
    </Container>
  );
}

async function RequestStayContent({ params, searchParams }: RequestStayPageProps) {
  const [{ listingId }, raw] = await Promise.all([params, searchParams]);
  // Id que não é UUID vira 404 sem chamar a API.
  if (!z.string().uuid().safeParse(listingId).success) notFound();
  // Espera a requisição antes de ler a sessão: o prerender não pode tocar o relógio dela.
  await connection();
  const query = searchParamsToQuery(raw);
  const search = queryToSearchParams(query).toString();
  const user = await requirePersonalUser(`/listings/${listingId}/request${search ? `?${search}` : ""}`);
  // Anfitrião vê o recado com a troca de conta, não o 403 (REQ-REQST-001).
  if (user.role === "host") return <RequestStayHostNotice />;

  const [listing, myPets] = await Promise.all([
    getListingPageDetail(user.id, listingId),
    getQueryClient().fetchQuery(petQueries.mine(user.id, await backendForRequest())),
  ]);
  const cover = [...listing.photos].sort((a, b) => a.position - b.position)[0];
  return (
    <RequestStayComposer
      accountId={user.id}
      listing={{
        id: listing.id,
        title: listing.title,
        neighborhood: listing.address.neighborhood,
        city: listing.address.city,
        coverUrl: cover?.url ?? null,
        nightlyRate: listing.nightlyRate,
        hostName: listing.host?.name ?? null,
      }}
      rules={{
        acceptedSpecies: listing.acceptedSpecies,
        acceptsSmall: listing.acceptsSmall,
        acceptsMedium: listing.acceptsMedium,
        acceptsLarge: listing.acceptsLarge,
      }}
      pets={myPets.active.map(({ id, name, species, size, coverUrl }) => ({
        id,
        name,
        species,
        size: size ?? null,
        coverUrl,
      }))}
      today={brasiliaToday()}
      initial={{ checkIn: query.from ?? "", checkOut: query.to ?? "", petIds: query.pets }}
    />
  );
}
