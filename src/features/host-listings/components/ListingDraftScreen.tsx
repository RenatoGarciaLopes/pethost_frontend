import { Box, Button, Stack, Typography } from "@mui/material";
import { redirect } from "next/navigation";
import { Notice } from "@/shared/ui/feedback/Notice";
import { getHostListingProfile, getMyListings } from "../api/server/listings.server";
import { listingCopy as copy } from "../lib/listingCopy";
import { PAYMENTS_PATH } from "../lib/listingPaths";
import { newListingGate } from "../lib/newListingGate";
import { ListingDraft } from "./client/ListingDraft";

/**
 * `/host/listings/new` no servidor (spec 044, REQ-LIST-002): confere o perfil e os cantinhos antes de responder. Sem
 * recebimento liberado, mostra o aviso com "Ver como eu recebo"; pessoa física com cantinho vai para ele; senão, o
 * cadastro em passos (104), na grade do cabeçalho (1200 px): cabem a trilha, o passo e o card ao vivo.
 *
 * @example <ListingDraftScreen accountId={user.id} />
 */
export async function ListingDraftScreen({ accountId }: { accountId: string }) {
  const profile = await getHostListingProfile(accountId);
  const gate = newListingGate(
    profile,
    profile ? await getMyListings(accountId) : { isCompany: false, payoutsEnabled: false, listings: [] },
  );
  if (gate.kind === "redirect") redirect(gate.to);
  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>
      {gate.kind === "noPayouts" || !profile ? (
        <Stack spacing={3} sx={{ maxWidth: 640 }}>
          <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 40 } }}>
            {copy.draft.heading}
          </Typography>
          <Notice tone="info" title={copy.gate.noPayouts} />
          <Box>
            <Button href={PAYMENTS_PATH} variant="contained">
              {copy.gate.seePayouts}
            </Button>
          </Box>
        </Stack>
      ) : (
        <ListingDraft accountId={accountId} profile={profile} />
      )}
    </Box>
  );
}
