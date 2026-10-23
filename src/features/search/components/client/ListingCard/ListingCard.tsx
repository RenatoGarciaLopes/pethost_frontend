"use client";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import Link from "next/link";
import { Avatar, Box, Chip, Stack, Typography } from "@mui/material";
import { nightsBetween } from "@/shared/lib/date/stayRules";
import { formatBRL, fromCents, toCents } from "@/shared/lib/money";
import type { ListingSummary } from "../../../api/contracts";
import type { SearchQuery } from "../../../types";
import { badgeLabel } from "../../../lib/badgeLabel";
import { queryToSearchParams } from "../../../lib/searchParams";
import { searchCopy } from "../../../lib/searchCopy";

/** Resumo público e contexto de preço. @example { listing, query, petCount: 2 } */
export interface ListingCardProps {
  listing: ListingSummary;
  query: SearchQuery;
  petCount: number;
}
/** Card com um único link e total calculado em centavos; sem ações aninhadas. @example <ListingCard listing={listing} query={query} petCount={2} /> */
export function ListingCard({ listing, query, petCount }: ListingCardProps) {
  const nights = query.from && query.to ? nightsBetween(query.from, query.to) : 0;
  const hasTotal = nights > 0 && petCount > 0;
  const params = queryToSearchParams({
    pets: query.pets,
    species: [],
    sizes: [],
    from: query.from,
    to: query.to,
    count: query.count,
  });
  const price = hasTotal
    ? searchCopy.totalPrice(formatBRL(fromCents(toCents(listing.nightlyRate) * nights * petCount)), nights)
    : searchCopy.nightlyPrice(formatBRL(listing.nightlyRate));
  return (
    <Box
      component={Link}
      href={`/listings/${listing.id}${params.size ? `?${params}` : ""}`}
      sx={{
        display: "block",
        color: "text.primary",
        textDecoration: "none",
        border: "2px solid",
        borderColor: "text.primary",
        borderRadius: `${quintalRadii.card}px`,
        overflow: "hidden",
        height: "100%",
        boxShadow: "4px 4px 0 currentColor",
        "&:hover": { backgroundColor: "action.hover" },
      }}
    >
      {listing.coverPhotoUrl ? (
        <Box
          component="img"
          src={listing.coverPhotoUrl}
          alt={searchCopy.photoAlt(listing.title)}
          sx={{ display: "block", width: "100%", aspectRatio: "4 / 3", objectFit: "cover" }}
        />
      ) : (
        <Box sx={{ aspectRatio: "4 / 3", bgcolor: "action.hover", display: "grid", placeItems: "center" }}>
          {searchCopy.noPhoto}
        </Box>
      )}
      <Stack spacing={1.5} sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Avatar src={listing.host?.avatarUrl ?? undefined} alt="" sx={{ width: 36, height: 36 }} />
          <Typography sx={{ fontWeight: 700 }}>{listing.host?.name ?? searchCopy.unnamedHost}</Typography>
        </Stack>
        <Typography component="h2" variant="h6">
          {listing.title}
        </Typography>
        <Typography>
          {listing.neighborhood} · {listing.city}
        </Typography>
        {listing.distanceKm != null && (
          <Typography>
            {searchCopy.distance(listing.distanceKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 }))}
          </Typography>
        )}
        <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1 }}>
          {listing.badges.map((badge) => (
            <Chip key={badge} size="small" label={badgeLabel(badge)} />
          ))}
        </Stack>
        <Typography sx={{ fontWeight: 700 }}>{price}</Typography>
        {hasTotal && (
          <Typography variant="body2">
            {searchCopy.priceBreakdown(formatBRL(listing.nightlyRate), nights, petCount)}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
