import { Box, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import type { ReactNode } from "react";
import { isListingBadge, listingBadgeLabel } from "@/shared/config/listingBadges";
import { formatMemberSince } from "@/shared/lib/date/formatMemberSince";
import { InitialsAvatar } from "@/shared/ui/media/InitialsAvatar";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { StatusPill } from "@/shared/ui/feedback/StatusPill";
import { PageContainer } from "@/shared/ui/layout/PageContainer";
import { Surface } from "@/shared/ui/layout/Surface";
import type { ListingDetail, ListingReview } from "../api/contracts";
import { houseLine, houseRuleItems } from "../lib/listingFacts";
import { listingPageCopy as copy } from "../lib/listingPageCopy";
import { searchOriginHref } from "../lib/searchOrigin";
import { ListingPageActions } from "./client/ListingPageActions";
import type { ListingClosedPeriod } from "../lib/listingClosedDays";
import { StayBookingCard, type StayBookingPet } from "./client/StayBookingCard";
import { ListingGallery } from "./ListingGallery";
import { NightlyPrice } from "./NightlyPrice";

/** O que já foi escolhido (da URL) e os pets do tutor. Não existe para o anfitrião dono do cantinho. */
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
  /** Pets ativos do tutor; vazio para o visitante e o anfitrião, que pedem passando pelo login ou pela troca. */
  pets: StayBookingPet[];
  /** Períodos que o anfitrião fechou na agenda (exige conta: vazio para o visitante). */
  closedPeriods: ListingClosedPeriod[];
}

export interface ListingPageScreenProps {
  listing: ListingDetail;
  isOwner: boolean;
  /** Quem vê: o visitante (sem conta) e o anfitrião veem a mesma lateral, e o pedido leva ao login ou à troca. */
  accountRole: "owner" | "host" | "visitor";
  /** Avaliações mais novas dos tutores; vazio esconde a seção. */
  reviews: ListingReview[];
  /** Contexto da lateral de reserva; sem ele (dono do cantinho) a lateral mostra só a diária. */
  stay?: ListingPageStay;
  /** Caixa "Combina com essa casa" composta pela rota (compatibilidade vem da busca). */
  compatibility?: ReactNode;
  /** `HouseResidents` composto pela rota (pets da casa vêm da feature pets). */
  residents?: ReactNode;
  /** Ação de contato com o anfitrião, composta pela rota para o tutor autenticado. */
  conversation?: ReactNode;
}

function formatAverage(average: number) {
  return average.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/**
 * Página do cantinho fiel à prancha (spec 042, revisão 078): "voltar" para a busca de origem, galeria com moldura,
 * título display com a casa em poucas palavras, selos em pílula, caixa de compatibilidade, seções com divisória
 * tracejada (Quem cuida, Quem mora aqui, Regras da casa, O que os tutores contam) e a lateral fixa de reserva.
 * A lateral sticky usa --app-header-height e 24px de respiro; o CTA móvel continua no rodapé.
 * Os slots `compatibility` e `residents` são compostos pela rota, porque vêm de outras features.
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
  conversation,
}: ListingPageScreenProps) {
  const address = listing.address;
  const ownerNotice = isOwner && accountRole === "host";
  const hostName = listing.host?.name ?? copy.noHost;
  const photos = [...listing.photos].sort((a, b) => a.position - b.position).slice(0, 5);
  const house = houseLine(listing);
  // Vizinho vai na foto; "Bem avaliado" só sem a pílula da nota, que já diz mais.
  const badges = (listing.badges ?? [])
    .filter(isListingBadge)
    .filter((badge) => badge !== "neighbor" && !(badge === "well_rated" && listing.rating));

  return (
    <PageContainer width="page" sx={{ py: { xs: 3, md: 4 }, pb: { xs: stay ? 14 : 4, md: 6 } }}>
      {ownerNotice && (
        <Box sx={{ mb: 3 }}>
          <ListingPageActions listingId={listing.id} />
        </Box>
      )}
      {stay && (
        <Typography sx={{ mb: 2, fontWeight: 700, fontSize: "0.95rem", "& a": { color: "text.primary" } }}>
          <NextLink href={searchOriginHref(stay.search)}>{copy.back(stay.where)}</NextLink>
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

        <Box
          sx={{
            gridArea: "aside",
            position: { md: "sticky" },
            top: { md: "calc(var(--app-header-height, 0px) + 24px)" },
          }}
        >
          <Surface component="aside" elevation="lg" sx={{ p: 3 }}>
            {stay ? (
              <StayBookingCard
                listingId={listing.id}
                account={accountRole}
                nightlyRate={listing.nightlyRate}
                hostName={hostName}
                today={stay.today}
                search={stay.search}
                from={stay.from}
                to={stay.to}
                petIds={stay.petIds}
                count={stay.count}
                pets={stay.pets}
                availableWeekdays={listing.availableWeekdays}
                closedPeriods={stay.closedPeriods}
              />
            ) : (
              <NightlyPrice nightlyRate={listing.nightlyRate} />
            )}
          </Surface>
        </Box>

        <Stack spacing={3} sx={{ gridArea: "body", minWidth: 0 }}>
          <Section title={copy.sections.host}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
              <InitialsAvatar
                name={hostName}
                src={listing.host?.avatarUrl}
                size={56}
                sx={{ fontWeight: 800, border: "2px solid", borderColor: "text.primary" }}
              />
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
                {!isOwner && accountRole === "owner" && conversation && <Box sx={{ mt: 2 }}>{conversation}</Box>}
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
