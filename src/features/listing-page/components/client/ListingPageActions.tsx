"use client";

import { Alert, Button, Stack } from "@mui/material";
import Link from "next/link";
import { listingPageCopy as copy } from "../../lib/listingPageCopy";

/**
 * Recados de quem não pede estadia, com o link de cada um; no cliente porque o tema ainda não integra Button com
 * Next Link. `owner-notice`: o anfitrião vendo o próprio cantinho (REQ-LPAGE-006); `host-switch`: outra conta de
 * anfitrião, que precisa trocar para a de tutor (REQ-LPAGE-007).
 * @example <ListingPageActions listingId={listing.id} variant="host-switch" />
 */
export function ListingPageActions({
  listingId,
  variant,
}: {
  listingId: string;
  variant: "owner-notice" | "host-switch";
}) {
  if (variant === "owner-notice")
    return (
      <Alert
        severity="info"
        role="status"
        action={
          <Button component={Link} href={`/host/listings/${listingId}/edit`} color="inherit">
            {copy.edit}
          </Button>
        }
      >
        {copy.ownListing}
      </Alert>
    );

  return (
    <Stack spacing={1.5}>
      <Alert severity="info">{copy.hostAccount}</Alert>
      <Button component={Link} href="/users/switch" variant="outlined">
        {copy.switchAccount}
      </Button>
    </Stack>
  );
}
