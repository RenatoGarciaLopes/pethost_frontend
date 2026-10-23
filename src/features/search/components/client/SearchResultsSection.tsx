"use client";
import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import type { SearchPet, SearchQuery } from "../../types";
import type { SearchError } from "../../lib/searchErrors";
import { searchCopy as copy } from "../../lib/searchCopy";
import { useSearch } from "../../hooks/useSearch";
import { FilterChips } from "./FilterChips";
import { SearchResults } from "./SearchResults";

/** Quem busca, o que a URL já trazia (para o servidor e o cliente concordarem) e o espaço do mapa. @example { accountId, pets, initialQuery, initialError, map } */
export interface SearchResultsSectionProps {
  accountId: string;
  pets: SearchPet[];
  initialQuery: SearchQuery;
  initialError?: SearchError;
  /** Mapa ao lado da lista (a partir de `lg`); sem ele a lista ocupa a largura toda. Ponto de encaixe do SearchMap (080). */
  map?: ReactNode;
}

/**
 * Resultados da busca dentro da home: título com a contagem, chips rápidos (reaproveita `FilterChips`) e os cards,
 * com "Mostrar mais cantinhos". A URL de `/` é a fonte dos filtros; ativar um chip refaz a busca na API.
 * @example <SearchResultsSection accountId={id} pets={pets} initialQuery={query} />
 */
export function SearchResultsSection({ accountId, pets, initialQuery, initialError, map }: SearchResultsSectionProps) {
  const { query, data, error, result, update } = useSearch(accountId, pets, initialQuery, initialError);
  const selected = pets.filter((pet) => query.pets.includes(pet.id));
  const items = [...new Map(data?.pages.flatMap((page) => page.items).map((item) => [item.id, item]) ?? []).values()];
  // A barra fica fora desta seção: o erro dos campos dela aparece aqui, junto dos chips.
  const barErrors = Object.entries(error?.fields ?? {}).filter(([key]) =>
    ["where", "from", "to", "count"].includes(key),
  );
  return (
    <Stack spacing={2}>
      <Typography component="h2" variant="h2" id="results-title" aria-live="polite">
        {copy.heading(data?.pages[0]?.totalCount ?? 0, query)}
      </Typography>
      <FilterChips query={query} pets={pets} onChange={update} errors={error?.fields} />
      {barErrors.map(([key, message]) => (
        <Typography key={key} role="alert">
          {copy.fieldLabels[key]}: {message}
        </Typography>
      ))}
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: map ? { xs: "1fr", lg: "minmax(0, 1fr) minmax(0, 1fr)" } : "1fr",
          alignItems: "start",
        }}
      >
        <SearchResults
          query={query}
          items={items}
          petCount={selected.length || query.count || 0}
          compatibility={selected.length ? { accountId, pets: selected } : undefined}
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
        />
        {map && <Box sx={{ position: { lg: "sticky" }, top: { lg: 24 } }}>{map}</Box>}
      </Box>
    </Stack>
  );
}
