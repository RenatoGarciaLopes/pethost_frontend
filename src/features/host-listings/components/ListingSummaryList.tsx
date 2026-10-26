import { quintalRadii } from "@/shared/theme/tokens/radii";
import { Box, Button, Stack, Typography } from "@mui/material";
import { formatBRL, fromCents } from "@/shared/lib/money";
import { StatusPill } from "@/shared/ui/feedback/StatusPill";
import { listingCopy } from "../lib/listingCopy";
import { listingPath, NEW_LISTING_PATH } from "../lib/listingPaths";
import type { Listing, MyListings } from "../types";

const copy = listingCopy.summary;

function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Stack
      component="article"
      aria-label={listing.title}
      spacing={1.5}
      sx={{ p: 2, border: "2px solid", borderRadius: `${quintalRadii.card}px`, bgcolor: "background.paper" }}
    >
      {listing.coverUrl ? (
        <Box
          component="img"
          src={listing.coverUrl}
          alt={copy.cover(listing.title)}
          sx={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: `${quintalRadii.control}px` }}
        />
      ) : (
        <Box
          sx={{
            aspectRatio: "4 / 3",
            borderRadius: `${quintalRadii.control}px`,
            border: "2px dashed",
            borderColor: "divider",
            display: "grid",
            placeItems: "center",
            color: "text.secondary",
          }}
        >
          {copy.noCover}
        </Box>
      )}
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
        <Typography component="h3" sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
          {listing.title}
        </Typography>
        <StatusPill
          label={listing.isActive ? listingCopy.editor.active : listingCopy.editor.paused}
          tone={listing.isActive ? "ok" : "neutro"}
          size="sm"
        />
      </Stack>
      <Typography>{copy.perNight(formatBRL(fromCents(listing.nightlyRateCents)))}</Typography>
      <Box>
        <Button href={listingPath(listing.id)} variant="outlined" aria-label={copy.editLabel(listing.title)}>
          {copy.edit}
        </Button>
      </Box>
    </Stack>
  );
}

/**
 * O resumo dos cantinhos no painel do anfitrião (REQ-LIST-001): capa, "Aberto" ou "Pausado", diária e "Ver e editar".
 * Empresa pode abrir outro (um por filial). Sem cantinho, não mostra nada (a etapa 3 do painel leva ao cadastro).
 *
 * @example <ListingSummaryList mine={await getMyListings(user.id)} />
 */
export function ListingSummaryList({ mine }: { mine: MyListings }) {
  if (mine.listings.length === 0) return null;
  return (
    <Stack component="section" aria-labelledby="meus-cantinhos" spacing={2}>
      <Typography id="meus-cantinhos" variant="h2" sx={{ fontSize: { xs: 22, md: 24 } }}>
        {mine.listings.length > 1 ? copy.headingMany : copy.heading}
      </Typography>
      <Box
        sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" } }}
      >
        {mine.listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </Box>
      {mine.isCompany && (
        <Box>
          <Button href={NEW_LISTING_PATH} variant="quiet">
            {copy.another}
          </Button>
        </Box>
      )}
    </Stack>
  );
}
