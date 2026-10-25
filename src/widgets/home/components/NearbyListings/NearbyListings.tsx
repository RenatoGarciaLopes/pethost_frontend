"use client";
import { Box, Button, Typography } from "@mui/material";
import { ListingCard, useAllListings, useNearbyListings } from "@/features/search/index.client";
import type { CompatibilityPet, SearchQuery } from "@/features/search";
import { useGeolocation } from "@/shared/hooks/useGeolocation";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { Notice } from "@/shared/ui/feedback/Notice";
import { PageContainer } from "@/shared/ui/layout/PageContainer";
import { Surface } from "@/shared/ui/layout/Surface";
import { homeCopy } from "../../lib/homeCopy";

const copy = homeCopy.nearby;
/** Base dos cards: sem datas nem pets eles mostram a diária. */
const CARD_QUERY: SearchQuery = { pets: [], species: [], sizes: [] };

export interface NearbyListingsProps {
  /** `visitor` ou o id da conta: os selos dependem de quem vê, então o cache é separado. */
  scope: string;
  /** Pets escolhidos na busca da home (só tutor logado); com eles os cards mostram a compatibilidade e o total. */
  pets?: CompatibilityPet[];
  /** Período da busca da home (AAAA-MM-DD); com ele e com pets os cards mostram o total da estadia. */
  from?: string;
  to?: string;
  /** Quantidade de pets da busca de anfitrião (sem pets cadastrados); entra no total dos cards. */
  count?: number;
}

/**
 * Vitrine "perto de você" da home (spec 060): pede a localização ao gesto, busca por raio e mostra seis cards.
 * Se o raio vier vazio, ou se a posição for negada, indisponível ou falhar, mostra os cantinhos sem filtro de lugar
 * (`useAllListings`); só sem nenhum deles volta aos avisos. A posição vive só em memória; nada vai para URL, storage
 * ou log. Sem permissão, a busca por cidade segue valendo.
 *
 * @example <NearbyListings scope="visitor" />
 */
export function NearbyListings({ scope, pets = [], from, to, count }: NearbyListingsProps) {
  const cardQuery: SearchQuery = {
    ...CARD_QUERY,
    pets: pets.map(({ id }) => id),
    from: from || undefined,
    to: to || undefined,
    count,
  };
  const compatibility = scope !== "visitor" && pets.length > 0 ? { accountId: scope, pets } : undefined;
  const location = useGeolocation();
  const nearby = useNearbyListings(scope, location.coords);
  const failure = nearby.error;

  const located = location.status === "granted";
  const nearbyEmpty = located && nearby.data?.items.length === 0;
  /** Por que a vitrine cai nos cantinhos sem filtro de lugar; `null` enquanto o raio pode responder. */
  const fallback: keyof typeof copy.allReason | null = nearbyEmpty
    ? "empty"
    : location.status === "denied" || location.status === "unavailable" || location.status === "failed"
      ? location.status
      : null;
  const all = useAllListings(scope, fallback !== null);
  /** A reserva ainda responde: os avisos esperam por ela para não piscar antes dos cards. */
  const waitingAll = fallback !== null && all.isPending;

  const shown =
    nearby.data && nearby.data.items.length > 0
      ? nearby.data
      : fallback && all.data && all.data.items.length > 0
        ? all.data
        : null;

  return (
    <PageContainer width="page" component="section" aria-labelledby="nearby-title" sx={{ pb: { xs: 4, md: 6 } }}>
      {shown ? (
        <>
          <Typography component="h2" variant="h2" id="nearby-title" sx={{ mb: fallback ? 1 : 2.5 }}>
            {fallback ? copy.allTitle(shown.totalCount) : copy.title(shown.totalCount)}
          </Typography>
          {fallback && (
            <Box sx={{ mb: 2.5, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
              <Typography sx={{ maxWidth: "56ch" }}>{copy.allReason[fallback]}</Typography>
              {fallback === "failed" && (
                <Button variant="text" onClick={location.request}>
                  {copy.retry}
                </Button>
              )}
            </Box>
          )}
          <Box
            component="ul"
            sx={{
              listStyle: "none",
              m: 0,
              p: 0,
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            }}
          >
            {shown.items.map((listing) => (
              <Box component="li" key={listing.id}>
                <ListingCard
                  listing={listing}
                  query={cardQuery}
                  petCount={pets.length || count || 0}
                  compatibility={compatibility}
                />
              </Box>
            ))}
          </Box>
        </>
      ) : (
        <Surface elevation="md" sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Typography component="h2" variant="h3" id="nearby-title" sx={{ mb: 1 }}>
            {copy.askTitle}
          </Typography>
          {((located && nearby.isPending) || waitingAll) && <SniffLoader label={copy.finding} />}
          {nearbyEmpty && !waitingAll && <Notice tone="info">{copy.empty}</Notice>}
          {located && failure && (
            <Notice
              tone="erro"
              action={
                <Button variant="outlined" onClick={() => void nearby.refetch()}>
                  {copy.retry}
                </Button>
              }
            >
              {copy.error}
            </Notice>
          )}
          {location.status === "denied" && !waitingAll && <Notice tone="atencao">{copy.denied}</Notice>}
          {location.status === "unavailable" && !waitingAll && <Notice tone="atencao">{copy.unavailable}</Notice>}
          {(location.status === "idle" ||
            location.status === "asking" ||
            (location.status === "failed" && !waitingAll)) && (
            <>
              <Typography sx={{ mb: 2, maxWidth: "56ch" }}>
                {location.status === "failed" ? copy.failed : copy.askBody}
              </Typography>
              <Button
                variant="contained"
                disabled={location.status === "asking"}
                aria-busy={location.status === "asking"}
                onClick={location.request}
              >
                {location.status === "asking"
                  ? copy.asking
                  : location.status === "failed"
                    ? copy.retry
                    : copy.useLocation}
              </Button>
            </>
          )}
        </Surface>
      )}
    </PageContainer>
  );
}
