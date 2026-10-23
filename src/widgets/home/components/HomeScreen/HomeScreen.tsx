"use client";

import { Box, Typography } from "@mui/material";
import { SearchBar, SearchResultsSection, useSearchUrl } from "@/features/search/index.client";
import { queryToSearchParams, type SearchError, type SearchQuery } from "@/features/search";
import { useState } from "react";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { DoorScene } from "@/shared/ui/brand/DoorScene";
import { GroundLine } from "@/shared/ui/brand/GroundLine";
import { Notice } from "@/shared/ui/feedback/Notice";
import { TrustList } from "@/shared/ui/data-display/TrustList";
import { PageContainer } from "@/shared/ui/layout/PageContainer";
import { NearbyListings } from "../NearbyListings";
import { homeCopy as copy } from "../../lib/homeCopy";

const EMPTY_QUERY: SearchQuery = { pets: [], species: [], sizes: [] };

export interface HomePetOption {
  id: string;
  name: string;
  species: string;
  size: string | null;
}

export interface HomeScreenProps {
  /** Sessão confirmada pela rota; visitante não consulta pets. */
  viewer: "visitor" | PersonalRole;
  /** Só id/nome/espécie dos pets ativos, sem dados privados. */
  pets: readonly HomePetOption[];
  petsUnavailable: boolean;
  /** Id da conta logada; `null` para visitante. Separa o cache da vitrine "perto de você". */
  accountId?: string | null;
  /** Busca que a URL de `/` já trazia no servidor; com ela a home mostra os resultados no lugar da vitrine. */
  initialQuery?: SearchQuery;
  /** Erro conhecido da busca inicial, para o cliente não repetir a chamada que já falhou. */
  initialError?: SearchError;
}

/**
 * Hero e faixa única de reserva da 040/T7. O AppHeader é composto pela rota, fora do único main.
 * Células mantêm rótulos, foco e seletores do sistema; o texto de datas é somente apresentação.
 * Visitante passa pelo login com next seguro; tutor seleciona ids; host informa quantidade fora da faixa.
 * @example <HomeScreen viewer="visitor" pets={[]} petsUnavailable={false} />
 */
export function HomeScreen({
  viewer,
  pets,
  petsUnavailable,
  accountId = null,
  initialQuery = EMPTY_QUERY,
  initialError,
}: HomeScreenProps) {
  const { query, update } = useSearchUrl();
  const params = queryToSearchParams(query).toString();
  const searching = params !== "";
  const [petIds, setPetIds] = useState<string[]>(
    query.pets.length ? query.pets : viewer === "owner" && pets[0] ? [pets[0].id] : [],
  );
  const [stay, setStay] = useState<{ from?: string; to?: string; count?: number }>({});
  const selectedPets = pets.filter((pet) => petIds.includes(pet.id));
  const personalized = viewer === "owner" && selectedPets.length > 0;
  const title = personalized ? copy.petsTitle(selectedPets.map((pet) => pet.name)) : copy.genericTitle;
  const isPetList = viewer === "owner" && pets.length > 0 && !petsUnavailable;
  const isHost = viewer === "host";

  return (
    <Box
      component="main"
      id="conteudo"
      tabIndex={-1}
      sx={{ color: "text.primary", bgcolor: "background.default", outline: "none" }}
    >
      {!searching && (
        <Box
          component="section"
          aria-labelledby="home-title"
          sx={(theme) => ({
            position: "relative",
            overflow: "hidden",
            backgroundImage: `url('/brand/paper-grain.png'), linear-gradient(180deg, ${theme.palette.scene.skyTop}, ${theme.palette.scene.skyMiddle} 65%, ${theme.palette.scene.skyBottom})`,
            backgroundSize: "256px 256px, cover",
            backgroundBlendMode: "multiply, normal",
          })}
        >
          <PageContainer width="page" sx={{ py: 0 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.1fr) minmax(0, 1fr)" },
                alignItems: "end",
                pt: { xs: 4, md: 5 },
                minHeight: { md: 370 },
              }}
            >
              <Box sx={{ alignSelf: "start", pb: { xs: 1, md: 5 }, position: "relative", zIndex: 1 }}>
                <Typography
                  component="h1"
                  id="home-title"
                  sx={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(44px, 5vw, 68px)",
                    lineHeight: 1.04,
                    letterSpacing: "-.025em",
                    maxWidth: "15ch",
                    m: 0,
                    mb: 2.5,
                  }}
                >
                  {title}
                </Typography>
                <Typography sx={{ fontSize: { xs: 17, md: 19 }, lineHeight: 1.65 }}>
                  <Box component="span" sx={{ display: "block" }}>
                    {personalized ? copy.supportWithPets : copy.support}
                  </Box>
                  <Box component="span" sx={{ display: "block" }}>
                    {copy.supportSecond}
                  </Box>
                </Typography>
              </Box>
              <Box
                aria-hidden="true"
                sx={{
                  width: "100%",
                  maxWidth: { xs: 390, md: 560 },
                  mx: "auto",
                  mb: -1,
                  // O chão da cena fica acima do fundo do viewBox; no computador ela desce até pousar no gramado.
                  transform: { md: "translateY(11%)" },
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <DoorScene variant="house" />
              </Box>
            </Box>
          </PageContainer>
          <Box
            sx={{
              position: "relative",
              mt: { xs: -1, md: 0 },
              bgcolor: "scene.ground",
              borderBottom: "2px solid",
              borderColor: "text.primary",
            }}
          >
            <Box sx={{ position: "absolute", top: -40, left: 0, right: 0 }}>
              <GroundLine variant="wave" height={56} />
            </Box>
            <PageContainer
              width="page"
              sx={{ pt: { xs: 2, md: 2 }, pb: { xs: 4, md: 4 }, position: "relative", zIndex: 2 }}
            >
              {petsUnavailable && (
                <Box sx={{ mb: 2 }}>
                  <Notice tone="atencao">{copy.petError}</Notice>
                </Box>
              )}
              <Box id="search-fields">
                <SearchBar
                  key={params}
                  query={{ ...query, pets: petIds }}
                  pets={isPetList ? pets : []}
                  quantityMode={isHost}
                  onSearch={update}
                  onDraftChange={(draft) => {
                    setPetIds(draft.pets);
                    setStay({ from: draft.from, to: draft.to, count: draft.count });
                  }}
                />
              </Box>
              <Typography sx={{ position: "absolute", bottom: 4, fontSize: 14 }}>
                {isHost
                  ? copy.hostHint
                  : viewer === "visitor"
                    ? copy.guestHint
                    : isPetList
                      ? copy.ownerPetsHint
                      : copy.ownerEmptyHint}
              </Typography>
            </PageContainer>
          </Box>
        </Box>
      )}
      {!searching && (
        <PageContainer width="page" id="como-funciona" sx={{ py: { xs: 3, md: 4 }, scrollMarginTop: 80 }}>
          <TrustList variant="cards" items={copy.trust} />
        </PageContainer>
      )}
      {searching ? (
        <PageContainer width="page" component="section" aria-labelledby="results-title" sx={{ pb: { xs: 4, md: 6 } }}>
          <SearchResultsSection
            key={accountId ?? "visitor"}
            accountId={accountId ?? "visitor"}
            pets={pets.map(({ id, name, species, size }) => ({ id, name, species, size }))}
            initialQuery={initialQuery}
            initialError={initialError}
          />
        </PageContainer>
      ) : (
        <NearbyListings
          scope={accountId ?? "visitor"}
          pets={personalized ? selectedPets.map(({ id, name }) => ({ id, name })) : undefined}
          from={stay.from}
          to={stay.to}
          count={stay.count}
        />
      )}
      {searching && (
        <PageContainer width="page" id="como-funciona" sx={{ py: { xs: 3, md: 4 }, scrollMarginTop: 80 }}>
          <TrustList variant="cards" items={copy.trust} />
        </PageContainer>
      )}
    </Box>
  );
}
