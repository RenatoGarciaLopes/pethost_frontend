"use client";
import Link from "next/link";
import { Box, Typography } from "@mui/material";
import { Sticker } from "@/shared/ui/feedback/Sticker";
import {
  ListingCardFace,
  type AttributeIconName,
  type ListingCardAttribute,
} from "@/shared/ui/data-display/ListingCardFace";
import { listingBadgeLabel } from "@/shared/config/listingBadges";
import { nightsBetween } from "@/shared/lib/date/stayRules";
import { formatBRL, fromCents, toCents } from "@/shared/lib/money";
import type { ListingSummary } from "../../../api/contracts";
import type { CompatibilityPet, SearchQuery } from "../../../types";
import { queryToSearchParams } from "../../../lib/searchParams";
import { searchCopy } from "../../../lib/searchCopy";
import { CompatibilityChip } from "./CompatibilityChip";

/** Quem está logado e qual(is) pet(s) conferir; sem isso (visitante) o card não mostra compatibilidade. */
export interface ListingCardCompatibility {
  accountId: string;
  pets: CompatibilityPet[];
}

/** Resumo público e contexto de preço. @example { listing, query, petCount: 2, compatibility: { accountId, pets } } */
export interface ListingCardProps {
  listing: ListingSummary;
  query: SearchQuery;
  petCount: number;
  compatibility?: ListingCardCompatibility;
}

const BADGE_ATTRIBUTES = [
  ["fast_responder", "fast"],
  ["experienced", "experienced"],
  ["well_rated", "rated"],
] as const satisfies readonly (readonly [ListingSummary["badges"][number], AttributeIconName])[];

/** Atributos que a API devolve no resumo: tipo de casa, quintal e selos de confiança (Vizinho vai na foto). */
function attributesOf(listing: ListingSummary): ListingCardAttribute[] {
  const copy = searchCopy.attributes;
  return [
    ...(listing.homeType ? [{ icon: listing.homeType, label: copy[listing.homeType] }] : []),
    ...(listing.hasYard ? [{ icon: "yard" as const, label: copy.yard }] : []),
    ...BADGE_ATTRIBUTES.filter(([badge]) => listing.badges.includes(badge)).map(([badge, icon]) => ({
      icon,
      label: listingBadgeLabel(badge),
    })),
  ];
}

function formatAverage(average: number): string {
  return average.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/**
 * Card do cantinho como na prancha: a cara compartilhada (`ListingCardFace`: a foto é a moldura, com o selo Vizinho
 * e o chip do anfitrião; o texto fica fora, embaixo) dentro de um único link; nota só com avaliação; chip de
 * compatibilidade só com pet escolhido; total só com período e pets.
 * @example <ListingCard listing={listing} query={query} petCount={2} compatibility={{ accountId, pets }} />
 */
export function ListingCard({ listing, query, petCount, compatibility }: ListingCardProps) {
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
  const hostName = listing.host?.name ?? searchCopy.unnamedHost;
  const stay = { checkIn: query.from, checkOut: query.to };
  return (
    <Box
      component={Link}
      href={`/listings/${listing.id}${params.size ? `?${params}` : ""}`}
      sx={{
        display: "block",
        color: "text.primary",
        textDecoration: "none",
        height: "100%",
        "&:hover h2": { textDecoration: "underline" },
      }}
    >
      <ListingCardFace
        cover={
          listing.coverPhotoUrl ? (
            <Box
              component="img"
              src={listing.coverPhotoUrl}
              alt={searchCopy.photoAlt(listing.title)}
              sx={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>{searchCopy.noPhoto}</Box>
          )
        }
        badge={
          listing.badges.includes("neighbor") && (
            <Sticker label={listingBadgeLabel("neighbor")} color="grama" tilt={4} />
          )
        }
        host={{ name: hostName, avatarUrl: listing.host?.avatarUrl }}
        title={listing.title}
        titleAside={
          listing.rating && (
            <Typography
              component="span"
              aria-label={searchCopy.rating(formatAverage(listing.rating.average), listing.rating.count)}
              sx={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}
            >
              ★ {formatAverage(listing.rating.average)} ({listing.rating.count})
            </Typography>
          )
        }
        location={
          <>
            {listing.neighborhood} ·{" "}
            {listing.distanceKm != null
              ? searchCopy.distance(listing.distanceKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 }))
              : listing.city}
          </>
        }
        attributes={attributesOf(listing)}
        price={
          <>
            <Box component="strong" sx={{ fontSize: 16 }}>
              {formatBRL(hasTotal ? fromCents(toCents(listing.nightlyRate) * nights * petCount) : listing.nightlyRate)}
            </Box>
            {hasTotal ? `${searchCopy.totalStay(nights)} · ${formatBRL(listing.nightlyRate)}` : ""}
            {searchCopy.nightly}
          </>
        }
      >
        {compatibility?.pets.map((pet) => (
          <Box key={pet.id}>
            <CompatibilityChip accountId={compatibility.accountId} listingId={listing.id} pet={pet} stay={stay} />
          </Box>
        ))}
      </ListingCardFace>
    </Box>
  );
}
