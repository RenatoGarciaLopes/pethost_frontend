"use client";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import Link from "next/link";
import { Avatar, Box, Stack, Typography } from "@mui/material";
import { Sticker } from "@/shared/ui/feedback/Sticker";
import { initialsOf } from "@/shared/lib/text/initials";
import { nightsBetween } from "@/shared/lib/date/stayRules";
import { formatBRL, fromCents, toCents } from "@/shared/lib/money";
import type { ListingSummary } from "../../../api/contracts";
import type { CompatibilityPet, SearchQuery } from "../../../types";
import { badgeLabel } from "../../../lib/badgeLabel";
import { queryToSearchParams } from "../../../lib/searchParams";
import { searchCopy } from "../../../lib/searchCopy";
import { AttributeIcon, type AttributeIconName } from "./AttributeIcon";
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

const AVATAR_COLORS = ["primary.main", "grama.main", "ceu.main", "gema.main"] as const;
const BADGE_ATTRIBUTES = [
  ["fast_responder", "fast"],
  ["experienced", "experienced"],
  ["well_rated", "rated"],
] as const satisfies readonly (readonly [ListingSummary["badges"][number], AttributeIconName])[];

/** Cor estável por anfitrião para o avatar de iniciais. */
function avatarColor(id: string) {
  return AVATAR_COLORS[[...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_COLORS.length];
}

/** Atributos que a API devolve no resumo: tipo de casa, quintal e selos de confiança (Vizinho vai na foto). */
function attributesOf(listing: ListingSummary): { icon: AttributeIconName; label: string }[] {
  const copy = searchCopy.attributes;
  return [
    ...(listing.homeType ? [{ icon: listing.homeType, label: copy[listing.homeType] }] : []),
    ...(listing.hasYard ? [{ icon: "yard" as const, label: copy.yard }] : []),
    ...BADGE_ATTRIBUTES.filter(([badge]) => listing.badges.includes(badge)).map(([badge, icon]) => ({
      icon,
      label: badgeLabel(badge),
    })),
  ];
}

function formatAverage(average: number): string {
  return average.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/**
 * Card do cantinho como na prancha: a foto é a moldura (contorno de tinta, sombra dura), com o selo Vizinho e o
 * chip do anfitrião; o texto fica fora, embaixo. Um único link; nota só com avaliação; chip de compatibilidade só
 * com pet escolhido; total só com período e pets.
 * @example <ListingCard listing={listing} query={query} petCount={2} compatibility={{ accountId, pets }} />
 */
export function ListingCard({ listing, query, petCount, compatibility }: ListingCardProps) {
  const nights = query.from && query.to ? nightsBetween(query.from, query.to) : 0;
  const hasTotal = nights > 0 && petCount > 0;
  const params = queryToSearchParams({
    pets: query.pets,
    species: [],
    sizes: [],
    weekdays: [],
    from: query.from,
    to: query.to,
    count: query.count,
  });
  const hostName = listing.host?.name ?? searchCopy.unnamedHost;
  const attributes = attributesOf(listing);
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
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          border: "2px solid",
          borderColor: "text.primary",
          borderRadius: `${quintalRadii.card}px`,
          boxShadow: "4px 4px 0 currentColor",
          aspectRatio: "4 / 3",
          bgcolor: "action.hover",
        }}
      >
        {listing.coverPhotoUrl ? (
          <Box
            component="img"
            src={listing.coverPhotoUrl}
            alt={searchCopy.photoAlt(listing.title)}
            sx={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>{searchCopy.noPhoto}</Box>
        )}
        {listing.badges.includes("neighbor") && (
          <Box sx={{ position: "absolute", top: 12, right: 12 }}>
            <Sticker label={badgeLabel("neighbor")} color="grama" tilt={4} />
          </Box>
        )}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            position: "absolute",
            left: 12,
            bottom: 12,
            maxWidth: "calc(100% - 24px)",
            alignItems: "center",
            bgcolor: "background.default",
            border: "2px solid",
            borderColor: "text.primary",
            borderRadius: `${quintalRadii.pill}px`,
            pl: 0.5,
            pr: 1.5,
            py: 0.5,
          }}
        >
          <Avatar
            src={listing.host?.avatarUrl ?? undefined}
            alt=""
            sx={{
              width: 28,
              height: 28,
              fontSize: 11,
              fontWeight: 800,
              color: "text.primary",
              bgcolor: avatarColor(listing.hostId),
              border: "2px solid",
              borderColor: "text.primary",
            }}
          >
            {initialsOf(hostName)}
          </Avatar>
          <Typography component="span" noWrap sx={{ fontSize: 13, fontWeight: 700 }}>
            {hostName}
          </Typography>
        </Stack>
      </Box>
      <Stack spacing={0.75} sx={{ pt: 1.5, px: 0.5 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "baseline", justifyContent: "space-between" }}>
          <Typography component="h2" sx={{ fontFamily: "var(--font-display)", fontSize: 20, lineHeight: 1.2 }}>
            {listing.title}
          </Typography>
          {listing.rating && (
            <Typography
              component="span"
              aria-label={searchCopy.rating(formatAverage(listing.rating.average), listing.rating.count)}
              sx={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}
            >
              ★ {formatAverage(listing.rating.average)} ({listing.rating.count})
            </Typography>
          )}
        </Stack>
        <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
          {listing.neighborhood} ·{" "}
          {listing.distanceKm != null
            ? searchCopy.distance(listing.distanceKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 }))
            : listing.city}
        </Typography>
        {attributes.length > 0 && (
          <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", columnGap: 2, rowGap: 0.5 }}>
            {attributes.map(({ icon, label }) => (
              <Stack key={label} direction="row" spacing={0.75} sx={{ alignItems: "center", fontSize: 13 }}>
                <AttributeIcon name={icon} />
                <Box component="span" sx={{ fontWeight: 700 }}>
                  {label}
                </Box>
              </Stack>
            ))}
          </Stack>
        )}
        {compatibility?.pets.map((pet) => (
          <Box key={pet.id}>
            <CompatibilityChip accountId={compatibility.accountId} listingId={listing.id} pet={pet} stay={stay} />
          </Box>
        ))}
        <Typography sx={{ fontSize: 14 }}>
          <Box component="strong" sx={{ fontSize: 16 }}>
            {formatBRL(hasTotal ? fromCents(toCents(listing.nightlyRate) * nights * petCount) : listing.nightlyRate)}
          </Box>
          {hasTotal ? `${searchCopy.totalStay(nights)} · ${formatBRL(listing.nightlyRate)}` : ""}
          {searchCopy.nightly}
        </Typography>
      </Stack>
    </Box>
  );
}
