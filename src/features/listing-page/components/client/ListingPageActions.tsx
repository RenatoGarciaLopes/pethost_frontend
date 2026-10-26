"use client";

import { Alert, Button } from "@mui/material";
import Link from "next/link";
import { listingPageCopy as copy } from "../../lib/listingPageCopy";

/**
 * Recado do anfitrião vendo o próprio cantinho, com o link para editar (REQ-LPAGE-006); no cliente porque o tema
 * ainda não integra Button com Next Link.
 * @example <ListingPageActions listingId={listing.id} />
 */
export function ListingPageActions({ listingId }: { listingId: string }) {
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
}
