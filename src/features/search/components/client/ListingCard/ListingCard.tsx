"use client";
import Link from "next/link";
import { Box, Typography, useMediaQuery } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePrefersReducedMotion } from "@/shared/lib/motion/usePrefersReducedMotion";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { searchQueries } from "../../../api/queries";
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
  const reducedMotion = usePrefersReducedMotion();
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");
  const [hovered, setHovered] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [failedPhotos, setFailedPhotos] = useState<string[]>([]);
  const [loadedPhotos, setLoadedPhotos] = useState<string[]>([]);
  const active = hovered && canHover && !reducedMotion;
  const gallery = useQuery({ ...searchQueries.photos(listing.id), enabled: active });
  const photos = useMemo(
    () =>
      [
        ...new Set([
          ...(listing.coverPhotoUrl ? [listing.coverPhotoUrl] : []),
          ...[...(gallery.data ?? [])].sort((a, b) => a.position - b.position).map((photo) => photo.url),
        ]),
      ]
        .filter((url) => !failedPhotos.includes(url))
        .slice(0, 5),
    [listing.coverPhotoUrl, gallery.data, failedPhotos],
  );
  const currentPhoto = active && photos.length ? photoIndex % photos.length : 0;
  const frames = active ? photos : photos.slice(0, 1);
  useEffect(() => {
    if (!active || photos.length < 2) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const updateTimer = () => {
      clearInterval(timer);
      if (!document.hidden)
        timer = setInterval(
          () =>
            setPhotoIndex((index) => {
              const next = (index + 1) % photos.length;
              return loadedPhotos.includes(photos[next]) ? next : index;
            }),
          2200,
        );
    };
    updateTimer();
    document.addEventListener("visibilitychange", updateTimer);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", updateTimer);
    };
  }, [active, photos, loadedPhotos]);
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
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={() => {
        setHovered(false);
        setPhotoIndex(0);
      }}
      onBlur={() => {
        setHovered(false);
        setPhotoIndex(0);
      }}
      sx={{
        position: "relative",
        transition: "transform 180ms ease",
        transformOrigin: "center center",
        "@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)": {
          "&:hover": { transform: "scale(1.025)", zIndex: 1 },
        },
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        display: "block",
        color: "text.primary",
        textDecoration: "none",
        height: "100%",
        "&:hover h2": { textDecoration: "underline" },
      }}
    >
      <ListingCardFace
        cover={
          photos.length ? (
            <Box sx={{ position: "absolute", inset: 0 }}>
              {frames.map((url, index) => (
                <Box
                  key={url}
                  component="img"
                  src={url}
                  alt={index === currentPhoto ? searchCopy.photoAlt(listing.title) : ""}
                  aria-hidden={index !== currentPhoto}
                  onLoad={() => setLoadedPhotos((loaded) => (loaded.includes(url) ? loaded : [...loaded, url]))}
                  onError={() => setFailedPhotos((failed) => (failed.includes(url) ? failed : [...failed, url]))}
                  sx={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: index === currentPhoto ? 1 : 0,
                    transition: active ? "opacity 300ms ease" : "none",
                  }}
                />
              ))}
              {active && photos.length > 1 && (
                <Box
                  aria-hidden="true"
                  sx={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    display: "flex",
                    gap: 0.5,
                    p: 0.75,
                    borderRadius: `${quintalRadii.pill}px`,
                    bgcolor: "rgba(0,0,0,.5)",
                    pointerEvents: "none",
                  }}
                >
                  {photos.map((url, index) => (
                    <Box
                      key={url}
                      component="span"
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: "#fff",
                        opacity: index === currentPhoto ? 1 : 0.4,
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
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
