"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { Celebration } from "@/shared/ui/brand/Celebration";
import { listingCopy as copy } from "../../lib/listingCopy";
import { listingPath, PHOTOS_ANCHOR } from "../../lib/listingPaths";

/**
 * "Seu cantinho está aberto!" (REQ-LIST-011): a comemoração (respeita movimento reduzido) e o próximo passo, "Pôr
 * as fotos da casa", que leva às fotos do cantinho recém-criado.
 *
 * @example <ListingOpened listingId={listing.id} />
 */
export function ListingOpened({ listingId }: { listingId: string }) {
  return (
    <Stack spacing={3} sx={{ alignItems: "flex-start" }}>
      <Celebration playKey={listingId}>
        <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 40 } }}>
          {copy.opened.title}
        </Typography>
      </Celebration>
      <Typography>{copy.opened.body}</Typography>
      <Box>
        <Button component={NextLink} href={`${listingPath(listingId)}#${PHOTOS_ANCHOR}`} variant="contained">
          {copy.opened.photos}
        </Button>
      </Box>
    </Stack>
  );
}
