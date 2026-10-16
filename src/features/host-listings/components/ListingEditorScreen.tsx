import { Container } from "@mui/material";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { listingQueries } from "../api/queries";
import { getHostListingProfile, getListingDetail } from "../api/server/listings.server";
import { HOST_HOME_PATH } from "../lib/listingPaths";
import { ListingEditor } from "./client/ListingEditor";

/**
 * `/host/listings/{id}` no servidor (spec 044): busca o cantinho antes de responder (de outra conta ou inexistente
 * vira o 404 da casca) e entrega o cache hidratado, sem loader no primeiro acesso.
 *
 * @example <ListingEditorScreen accountId={user.id} listingId={id} />
 */
export async function ListingEditorScreen({ accountId, listingId }: { accountId: string; listingId: string }) {
  const profile = await getHostListingProfile(accountId);
  if (!profile) redirect(HOST_HOME_PATH);
  const queryClient = getQueryClient();
  queryClient.setQueryData(
    listingQueries.detail(accountId, listingId).queryKey,
    await getListingDetail(accountId, listingId),
  );
  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ListingEditor accountId={accountId} listingId={listingId} kind={profile.kind} firstName={profile.firstName} />
      </HydrationBoundary>
    </Container>
  );
}
