import Link from "next/link";
import { Avatar, Box, Button, Chip, Container, Divider, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { formatBRL } from "@/shared/lib/money";
import type { ListingDetail } from "../api/contracts";
import { petFitsListing } from "../lib/petFitsListing";
import { stayTotal } from "../lib/stayTotal";
import { listingPageCopy as copy } from "../lib/listingPageCopy";

export interface ListingPageScreenProps {
  listing: ListingDetail;
  query: { pets: string[]; count?: number; from?: string; to?: string };
  requestSearch: string;
  selectedPets: { id: string; name: string; species: string; size: string | null }[];
  selectionControl?: ReactNode;
  isOwner: boolean;
  accountRole: "owner" | "host";
  residents?: ReactNode;
}

/** Página de detalhes do cantinho. O slot `residents` recebe HouseResidents na composição da rota. */
export function ListingPageScreen({
  listing,
  query,
  requestSearch,
  selectedPets,
  selectionControl,
  isOwner,
  accountRole,
  residents,
}: ListingPageScreenProps) {
  const location = listing.address;
  const ownerNotice = isOwner && accountRole === "host";
  const petCount = query.pets.length > 0 ? selectedPets.length : (query.count ?? 0);
  const total = stayTotal(listing.nightlyRate, query.from, query.to, petCount);
  const requestHref = `/listings/${listing.id}/request${requestSearch ? `?${requestSearch}` : ""}`;
  const photos = [...listing.photos].sort((a, b) => a.position - b.position).slice(0, 5);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      {ownerNotice && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3, alignItems: { sm: "center" } }}>
          <Typography role="status">{copy.ownListing}</Typography>
          <Button component={Link} href={`/host/listings/${listing.id}/edit`} variant="outlined">
            {copy.edit}
          </Button>
        </Stack>
      )}
      <ListingGallery title={listing.title} photos={photos} />
      <Stack spacing={3} sx={{ mt: 4 }}>
        <Stack spacing={1}>
          <Typography component="h1" variant="h3">
            {listing.title}
          </Typography>
          <Typography>{copy.neighborhood(location.neighborhood, location.city, location.state)}</Typography>
          {isOwner ? (
            location.street && (
              <Typography>
                {[location.street, location.number, location.complement].filter(Boolean).join(", ")}
              </Typography>
            )
          ) : (
            <Typography variant="body2">{copy.addressPrivacy}</Typography>
          )}
          {listing.badges && listing.badges.length > 0 && (
            <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1 }}>
              {listing.badges.map((badge) => (
                <Chip key={badge} label={badge.replaceAll("_", " ")} />
              ))}
            </Stack>
          )}
        </Stack>
        <Divider />
        <Stack direction={{ xs: "column", md: "row" }} spacing={5}>
          <Stack spacing={3} sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Avatar src={listing.host?.avatarUrl ?? undefined} alt="" />
              <Box>
                <Typography variant="overline">{copy.host}</Typography>
                <Typography>{listing.host?.name ?? copy.noHost}</Typography>
              </Box>
            </Stack>
            <section>
              <Typography component="h2" variant="h5">
                {copy.description}
              </Typography>
              <Typography sx={{ whiteSpace: "pre-line", mt: 1 }}>{listing.description}</Typography>
            </section>
            <section>
              <Typography component="h2" variant="h5">
                {copy.property}
              </Typography>
              <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1, mt: 1 }}>
                {listing.hasYard && <Chip label="Quintal" />}
                {listing.hasDogs && <Chip label="Cachorros em casa" />}
                {listing.hasCats && <Chip label="Gatos em casa" />}
                {listing.hasKids && <Chip label="Crianças em casa" />}
              </Stack>
            </section>
            {listing.hostId && residents}
            <section>
              <Typography component="h2" variant="h5">
                {copy.accepted}
              </Typography>
              <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1, mt: 1 }}>
                {listing.acceptedSpecies.map((species) => (
                  <Chip key={species} label={copy.speciesLabels[species] ?? species} />
                ))}
                {listing.acceptsSmall && <Chip label="Porte pequeno" />}
                {listing.acceptsMedium && <Chip label="Porte médio" />}
                {listing.acceptsLarge && <Chip label="Porte grande" />}
                <Chip label={copy.capacity(listing.capacity)} />
              </Stack>
            </section>
            {selectedPets.length > 0 && (
              <section>
                <Typography component="h2" variant="h5">
                  Combina com
                </Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {selectedPets.map((pet) => {
                    const fit = petFitsListing(pet, listing);
                    const reason = fit.fits
                      ? null
                      : fit.reason === "species"
                        ? copy.mismatchSpecies(pet.name, copy.speciesLabels[pet.species] ?? pet.species)
                        : copy.mismatchSize(pet.name, copy.sizeLabels[pet.size ?? ""] ?? pet.size ?? "");
                    return (
                      <Typography
                        key={pet.id}
                        sx={{ border: "1px dashed", borderColor: "text.secondary", borderRadius: 1, p: 1.5 }}
                      >
                        {reason ?? copy.fit(pet.name)}
                      </Typography>
                    );
                  })}
                </Stack>
              </section>
            )}
            <section>
              <Typography component="h2" variant="h5">
                {copy.weekdays}
              </Typography>
              <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1, mt: 1 }}>
                {listing.availableWeekdays.map((day) => (
                  <Chip key={day} label={copy.weekdayLabels[day] ?? day} />
                ))}
              </Stack>
            </section>
            {listing.houseRules && (
              <section>
                <Typography component="h2" variant="h5">
                  {copy.rules}
                </Typography>
                <Typography sx={{ mt: 1, whiteSpace: "pre-line" }}>{listing.houseRules}</Typography>
              </section>
            )}
          </Stack>
          <Stack
            spacing={1.5}
            sx={{ width: { md: 320 }, flexShrink: 0, alignSelf: "flex-start", position: { md: "sticky" }, top: 24 }}
          >
            <Typography variant="h5">{copy.nightlyRate(formatBRL(listing.nightlyRate))}</Typography>
            {total && (
              <Typography aria-live="polite">
                Total para {petCount} pets: {total}
              </Typography>
            )}
            {ownerNotice ? null : accountRole === "host" ? (
              <>
                <Typography>{copy.hostAccount}</Typography>
                <Button component={Link} href="/users/switch" variant="outlined">
                  {copy.switchAccount}
                </Button>
              </>
            ) : total ? (
              <Button component={Link} href={requestHref} variant="contained">
                {copy.request}
              </Button>
            ) : (
              (selectionControl ?? (
                <Button component={Link} href={requestHref} variant="contained">
                  {copy.choose}
                </Button>
              ))
            )}
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
}

function ListingGallery({ title, photos }: { title: string; photos: ListingDetail["photos"] }) {
  if (photos.length === 0)
    return (
      <Box sx={{ minHeight: 220, display: "grid", placeItems: "center", bgcolor: "action.hover", borderRadius: 3 }}>
        {copy.noPhoto}
      </Box>
    );
  return (
    <Box
      aria-label={`Fotos de ${title}`}
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: photos.length > 1 ? "2fr 1fr 1fr" : "1fr" },
        gap: 1,
        overflow: "hidden",
        borderRadius: 3,
      }}
    >
      {photos.map((photo, index) => (
        <Box
          component="img"
          key={photo.id}
          src={photo.url}
          alt={copy.photoAlt(index + 1, title)}
          sx={{
            width: "100%",
            height: { xs: 250, md: index === 0 ? 440 : 216 },
            objectFit: "cover",
            gridRow: { md: index === 0 && photos.length > 1 ? "span 2" : undefined },
          }}
        />
      ))}
    </Box>
  );
}
