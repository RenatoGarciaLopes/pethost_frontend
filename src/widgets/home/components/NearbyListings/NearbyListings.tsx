"use client";
import { Box, Button, Typography } from "@mui/material";
import { ListingCard, useNearbyListings } from "@/features/search/index.client";
import type { SearchQuery } from "@/features/search";
import { isApiError } from "@/shared/api/errors/ApiError";
import { loginRedirectPath } from "@/shared/config/appRoutes";
import { useGeolocation } from "@/shared/hooks/useGeolocation";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { Notice } from "@/shared/ui/feedback/Notice";
import { PageContainer } from "@/shared/ui/layout/PageContainer";
import { Surface } from "@/shared/ui/layout/Surface";
import { homeCopy } from "../../lib/homeCopy";

const copy = homeCopy.nearby;
/** Sem datas nem pets: os cards mostram a diária. */
const CARD_QUERY: SearchQuery = { pets: [], species: [], sizes: [], weekdays: [] };

export interface NearbyListingsProps {
  /** `visitor` ou o id da conta: os selos dependem de quem vê, então o cache é separado. */
  scope: string;
}

/**
 * Vitrine "perto de você" da home (spec 060): pede a localização ao gesto, busca por raio e mostra seis cards.
 * A posição vive só em memória; nada vai para URL, storage ou log. Sem permissão, a busca por cidade segue valendo.
 *
 * @example <NearbyListings scope="visitor" />
 */
export function NearbyListings({ scope }: NearbyListingsProps) {
  const location = useGeolocation();
  const nearby = useNearbyListings(scope, location.coords);
  const failure = nearby.error;
  const needsLogin = isApiError(failure) && failure.status === 401;

  return (
    <PageContainer width="page" component="section" aria-labelledby="nearby-title" sx={{ pb: { xs: 4, md: 6 } }}>
      {nearby.data && nearby.data.items.length > 0 ? (
        <>
          <Typography component="h2" variant="h2" id="nearby-title" sx={{ mb: 2.5 }}>
            {copy.title(nearby.data.totalCount)}
          </Typography>
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
            {nearby.data.items.map((listing) => (
              <Box component="li" key={listing.id}>
                <ListingCard listing={listing} query={CARD_QUERY} petCount={0} />
              </Box>
            ))}
          </Box>
          <Button href="/search" variant="outlined" sx={{ mt: 3 }}>
            {copy.seeAll}
          </Button>
        </>
      ) : (
        <Surface elevation="md" sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Typography component="h2" variant="h3" id="nearby-title" sx={{ mb: 1 }}>
            {copy.askTitle}
          </Typography>
          {location.status === "granted" && nearby.isPending && <SniffLoader label={copy.finding} scale={0.8} />}
          {location.status === "granted" && nearby.data?.items.length === 0 && (
            <Notice tone="info">{copy.empty}</Notice>
          )}
          {location.status === "granted" && needsLogin && (
            <Notice
              tone="info"
              action={
                <Button href={loginRedirectPath("/")} variant="contained">
                  {copy.signInAction}
                </Button>
              }
            >
              {copy.signIn}
            </Notice>
          )}
          {location.status === "granted" && failure && !needsLogin && (
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
          {location.status === "denied" && <Notice tone="atencao">{copy.denied}</Notice>}
          {location.status === "unavailable" && <Notice tone="atencao">{copy.unavailable}</Notice>}
          {(location.status === "idle" || location.status === "asking" || location.status === "failed") && (
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
