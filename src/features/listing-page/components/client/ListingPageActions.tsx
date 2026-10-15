"use client";

import { Alert, Button, Stack } from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";
import { listingPageCopy as copy } from "../../lib/listingPageCopy";

/** Ações de navegação do detalhe; isoladas no cliente porque o tema ainda não integra Button com Next Link. */
export function ListingPageActions({
  listingId,
  requestHref,
  isOwnerView,
  accountRole,
  hasTotal,
  selectionControl,
  placement = "actions",
}: {
  listingId: string;
  requestHref: string;
  isOwnerView: boolean;
  accountRole: "owner" | "host";
  hasTotal: boolean;
  selectionControl?: ReactNode;
  placement?: "notice" | "actions";
}) {
  if (isOwnerView && placement === "notice")
    return (
      <Alert
        severity="info"
        role="status"
        action={
          <Button component={Link} href={`/host/listings/${listingId}/edit`} color="inherit">
            Editar
          </Button>
        }
      >
        É assim que os tutores veem seu cantinho (sem a rua)
      </Alert>
    );

  if (isOwnerView) return null;

  if (accountRole === "host")
    return (
      <Stack spacing={1.5}>
        <Alert severity="info">Pra pedir uma estadia, entra com a conta de tutor.</Alert>
        <Button component={Link} href="/users/switch" variant="outlined">
          Trocar de conta
        </Button>
      </Stack>
    );

  if (!hasTotal && selectionControl) return <>{selectionControl}</>;

  return (
    <Stack spacing={1.5}>
      <Button component={Link} href={requestHref} variant="contained">
        {hasTotal ? copy.request : copy.choose}
      </Button>
    </Stack>
  );
}
