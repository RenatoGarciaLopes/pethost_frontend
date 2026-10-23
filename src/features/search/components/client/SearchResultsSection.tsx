"use client";
import { useState } from "react";
import { Box, Button, Dialog, Stack, Typography, useMediaQuery } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { SearchPet, SearchQuery } from "../../types";
import type { SearchError } from "../../lib/searchErrors";
import { mapCopy } from "../../lib/mapCopy";
import { searchCopy as copy } from "../../lib/searchCopy";
import { useSearch } from "../../hooks/useSearch";
import { SearchMap } from "./SearchMap";
import { SearchResults } from "./SearchResults";

/** Quem busca e o que a URL já trazia (para o servidor e o cliente concordarem). @example { accountId, pets, initialQuery, initialError } */
export interface SearchResultsSectionProps {
  accountId: string;
  pets: SearchPet[];
  initialQuery: SearchQuery;
  initialError?: SearchError;
}

/**
 * Resultados da busca dentro da home: título com a contagem, chips rápidos (reaproveita `FilterChips`) e os cards,
 * com "Mostrar mais cantinhos". A URL de `/` é a fonte dos filtros; ativar um chip refaz a busca na API.
 * Com região na busca (`where` ou `state`) e resultados, o mapa (`SearchMap`) entra à direita da lista no computador
 * e, no celular, abre em tela cheia pelo botão "Ver mapa".
 * @example <SearchResultsSection accountId={id} pets={pets} initialQuery={query} />
 */
export function SearchResultsSection({ accountId, pets, initialQuery, initialError }: SearchResultsSectionProps) {
  const { query, data, error, result, update } = useSearch(accountId, pets, initialQuery, initialError);
  const desktop = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const selected = pets.filter((pet) => query.pets.includes(pet.id));
  const items = [...new Map(data?.pages.flatMap((page) => page.items).map((item) => [item.id, item]) ?? []).values()];
  // A barra e os chips ficam no cabeçalho: o erro de qualquer campo aparece aqui, junto da lista.
  const fieldErrors = Object.entries(error?.fields ?? {});
  const compatibility = selected.length ? { accountId, pets: selected } : undefined;
  const hasMap = Boolean(query.where || query.state) && items.length > 0;
  const map = (
    <SearchMap
      listings={items}
      selectedId={selectedId}
      onSelect={setSelectedId}
      query={query}
      petCount={selected.length || query.count || 0}
      compatibility={compatibility}
    />
  );
  return (
    <Stack spacing={2}>
      <Typography component="h1" variant="h2" id="results-title" aria-live="polite">
        {copy.heading(data?.pages[0]?.totalCount ?? 0, query)}
      </Typography>
      {fieldErrors.map(([key, message]) => (
        <Typography key={key} role="alert">
          {copy.fieldLabels[key] ? `${copy.fieldLabels[key]}: ` : ""}
          {message}
        </Typography>
      ))}
      {hasMap && !desktop && (
        <Button variant="outlined" onClick={() => setMapOpen(true)} sx={{ alignSelf: "flex-start" }}>
          {copy.showMap}
        </Button>
      )}
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: hasMap && desktop ? "minmax(0, 1fr) minmax(0, 1fr)" : "1fr",
          alignItems: "start",
        }}
      >
        <SearchResults
          query={query}
          items={items}
          petCount={selected.length || query.count || 0}
          compatibility={compatibility}
          isFetching={result.isFetching}
          hasNextPage={!result.isPlaceholderData && result.hasNextPage}
          error={error}
          onMore={() => {
            void result.fetchNextPage();
          }}
          onRetry={() => {
            void result.refetch();
          }}
          onExpand={(radius) => update({ ...query, radius })}
          withMap={hasMap && desktop}
        />
        {hasMap && desktop && (
          <Box sx={{ position: "sticky", top: 24, height: "calc(100vh - 48px)", maxHeight: 760, minHeight: 480 }}>
            {map}
          </Box>
        )}
      </Box>
      {hasMap && !desktop && (
        <Dialog fullScreen open={mapOpen} onClose={() => setMapOpen(false)} aria-label={mapCopy.region}>
          <Box sx={{ position: "relative", flex: 1, p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Button variant="outlined" onClick={() => setMapOpen(false)} sx={{ alignSelf: "flex-start" }}>
              {copy.showList}
            </Button>
            <Box sx={{ flex: 1, minHeight: 0 }}>{map}</Box>
          </Box>
        </Dialog>
      )}
    </Stack>
  );
}
