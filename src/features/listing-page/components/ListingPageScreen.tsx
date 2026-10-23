import { Avatar, Box, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import type { ReactNode } from "react";
import { isListingBadge, listingBadgeLabel } from "@/shared/config/listingBadges";
import { formatMemberSince } from "@/shared/lib/date/formatMemberSince";
import { initialsOf } from "@/shared/lib/text/initials";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { StatusPill } from "@/shared/ui/feedback/StatusPill";
import { PageContainer } from "@/shared/ui/layout/PageContainer";
import { Surface } from "@/shared/ui/layout/Surface";
import type { ListingDetail, ListingReview } from "../api/contracts";
import { houseLine, houseRuleItems } from "../lib/listingFacts";
import { listingPageCopy as copy } from "../lib/listingPageCopy";
import { searchOriginHref } from "../lib/searchOrigin";
import { ListingPageActions } from "./client/ListingPageActions";
import { StayBookingCard, type StayBookingPet } from "./client/StayBookingCard";
import { ListingGallery } from "./ListingGallery";
import { NightlyPrice } from "./NightlyPrice";

/** O que o tutor já escolheu (da URL) e os pets dele. Só existe para conta de tutor. */
export interface ListingPageStay {
  /** Hoje em Brasília, para o campo de datas. */
  today: string;
  /** Parâmetros da busca de origem, serializados (vão para o "voltar" e para o pedido). */
  search: string;
  /** Lugar da busca de origem, para o texto do "voltar". */
  where?: string;
  from?: string;
  to?: string;
  petIds: string[];
  count?: number;
  pets: StayBookingPet[];
}

export interface ListingPageScreenProps {
  listing: ListingDetail;
  isOwner: boolean;
  accountRole: "owner" | "host";
  /** Avaliações mais novas dos tutores; vazio esconde a seção. */
  reviews: ListingReview[];
  /** Contexto do tutor; sem ele (anfitrião) a lateral mostra só a diária e o recado. */
  stay?: ListingPageStay;
  /** Caixa "Combina com essa casa" composta pela rota (compatibilidade vem da busca). */
  compatibility?: ReactNode;
  /** `HouseResidents` composto pela rota (pets da casa vêm da feature pets). */
  residents?: ReactNode;
}

function formatAverage(average: number) {
  return average.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/**
 * Página do cantinho fiel à prancha (spec 042, revisão 078): "voltar" para a busca de origem, galeria com moldura,
 * título display com a casa em poucas palavras, selos em pílula, caixa de compatibilidade, seções com divisória
 * tracejada (Quem cuida, Quem mora aqui, Regras da casa, O que os tutores contam) e a lateral fixa de reserva. Os
 * slots `compatibility` e `residents` são compostos pela rota, porque vêm de outras features.
 * @example <ListingPageScreen listing={listing} isOwner={false} accountRole="owner" reviews={reviews} stay={stay} />
 */
export function ListingPageScreen({
  listing,
  isOwner,
  accountRole,
  reviews,
  stay,
  compatibility,
  residents,
}: ListingPageScreenProps) {
  const address = listing.address;
  const ownerNotice = isOwner && accountRole === "host";
  const tutor = accountRole === "owner" && stay;
  const hostName = listing.host?.name ?? copy.noHost;
  const photos = [...listing.photos].sort((a, b) => a.position - b.position).slice(0, 5);
  const house = houseLine(listing);
  // Vizinho vai na foto; "Bem avaliado" só sem a pílula da nota, que já diz mais.
  const badges = (listing.badges ?? [])
    .filter(isListingBadge)
    .filter((badge) => badge !== "neighbor" && !(badge === "well_rated" && listing.rating));

  return (
    <PageContainer width="page" sx={{ py: { xs: 3, md: 4 }, pb: { xs: tutor ? 14 : 4, md: 6 } }}>
      {ownerNotice && (
        <Box sx={{ mb: 3 }}>
          <ListingPageActions listingId={listing.id} variant="owner-notice" />
        </Box>
      )}
      {tutor && (
        <Typography sx={{ mb: 2, fontWeight: 700, fontSize: "0.95rem", "& a": { color: "text.primary" } }}>
          <NextLink href={searchOriginHref(tutor.search)}>{copy.back(tutor.where)}</NextLink>
        </Typography>
      )}
      <ListingGallery title={listing.title} photos={photos} neighbor={Boolean(listing.badges?.includes("neighbor"))} />
      <Box
        sx={{
          mt: 4,
          display: "grid",
          gap: { xs: 4, md: 6 },
          alignItems: "start",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) 360px" },
          gridTemplateAreas: { xs: '"head" "aside" "body"', md: '"head aside" "body aside"' },
        }}
      >
        <Stack spacing={2} sx={{ gridArea: "head", minWidth: 0 }}>
          <Typography component="h1" variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.5rem" }, lineHeight: 1.1 }}>
            {listing.title}
          </Typography>
          <Typography color="text.secondary">
            {[copy.place(address.neighborhood, address.city, address.state), house].filter(Boolean).join(" · ")}
          </Typography>
          {isOwner && address.street && (
            <Typography>{[address.street, address.number, address.complement].filter(Boolean).join(", ")}</Typography>
          )}
          <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1 }}>
            {listing.host && <StatusPill tone="ok" size="sm" label={copy.verified} />}
            {badges.map((badge) => (
              <StatusPill key={badge} size="sm" label={listingBadgeLabel(badge)} />
            ))}
            {listing.rating && (
              <Box
                component="span"
                aria-label={copy.ratingLabel(formatAverage(listing.rating.average), listing.rating.count)}
                sx={{
                  px: 1.25,
                  py: "2px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  lineHeight: 1.5,
                  whiteSpace: "nowrap",
                  bgcolor: "quintal.luz",
                  border: "2px solid",
                  borderColor: "text.primary",
                  borderRadius: `${quintalRadii.pill}px`,
                }}
              >
                {copy.rating(formatAverage(listing.rating.average), listing.rating.count)}
              </Box>
            )}
          </Stack>
          {compatibility}
        </Stack>

        <Box sx={{ gridArea: "aside", position: { md: "sticky" }, top: { md: 24 } }}>
          <Surface component="aside" elevation="lg" sx={{ p: 3 }}>
            {tutor ? (
              <StayBookingCard
                listingId={listing.id}
                nightlyRate={listing.nightlyRate}
                hostName={hostName}
                today={tutor.today}
                search={tutor.search}
                from={tutor.from}
                to={tutor.to}
                petIds={tutor.petIds}
                count={tutor.count}
                pets={tutor.pets}
              />
            ) : (
              <Stack spacing={2}>
                <NightlyPrice nightlyRate={listing.nightlyRate} />
                {!ownerNotice && <ListingPageActions listingId={listing.id} variant="host-switch" />}
                {!isOwner && (
                  <Typography variant="body2" color="text.secondary">
                    {copy.addressPrivacy}
                  </Typography>
                )}
              </Stack>
            )}
          </Surface>
        </Box>

        <Stack spacing={3} sx={{ gridArea: "body", minWidth: 0 }}>
          <Section title={copy.sections.host}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
              <Avatar
                src={listing.host?.avatarUrl ?? undefined}
                alt=""
                sx={{
                  width: 56,
                  height: 56,
                  fontWeight: 800,
                  color: "text.primary",
                  bgcolor: "grama.main",
                  border: "2px solid",
                  borderColor: "text.primary",
                }}
              >
                {initialsOf(hostName)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700 }}>{hostName}</Typography>
                {listing.host?.isCompany && (
                  <Typography variant="body2" color="text.secondary">
                    {copy.company}
                  </Typography>
                )}
                {listing.description && (
                  <Typography sx={{ mt: 1, whiteSpace: "pre-line" }}>“{listing.description}”</Typography>
                )}
              </Box>
            </Stack>
          </Section>
          {listing.hostId && residents && (
            <Box sx={{ borderTop: "2px dashed", borderColor: "divider", pt: 3, "&:empty": { display: "none" } }}>
              {residents}
            </Box>
          )}
          <Section title={copy.sections.rules}>
            <Box component="ul" sx={{ m: 0, pl: 2.5, display: "grid", gap: 0.75 }}>
              {houseRuleItems(listing).map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </Box>
          </Section>
          {reviews.length > 0 && (
            <Section title={copy.sections.reviews}>
              <Box
                component="ul"
                sx={{
                  listStyle: "none",
                  m: 0,
                  p: 0,
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" },
                }}
              >
                {reviews.map((review) => (
                  <Box
                    component="li"
                    key={review.id}
                    sx={{
                      p: 2,
                      bgcolor: "background.paper",
                      border: "2px solid",
                      borderColor: "text.primary",
                      borderRadius: `${quintalRadii.media}px`,
                    }}
                  >
                    <Typography sx={{ fontWeight: 700 }}>{review.author?.name ?? copy.reviewer}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatMemberSince(review.stayEndedAt)} ·{" "}
                      <Box component="span" role="img" aria-label={copy.reviewStars(review.rating)}>
                        {"★".repeat(review.rating)}
                      </Box>
                    </Typography>
                    {review.comment && <Typography sx={{ mt: 1 }}>“{review.comment}”</Typography>}
                    {review.reply && (
                      <Typography
                        variant="body2"
                        sx={{ mt: 1, pl: 1.5, borderLeft: "2px solid", borderColor: "divider" }}
                      >
                        <strong>{hostName}:</strong> {review.reply.text}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Section>
          )}
        </Stack>
      </Box>
    </PageContainer>
  );
}

/** Seção da página: título display e divisória tracejada em cima, como na prancha. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box component="section" sx={{ borderTop: "2px dashed", borderColor: "divider", pt: 3 }}>
      <Typography component="h2" variant="h4" sx={{ mb: 2 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}
