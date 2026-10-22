"use client";
import { Container, Stack, Typography } from "@mui/material";
import type { SearchPet, SearchQuery } from "../../types";
import type { SearchError } from "../../lib/searchErrors";
import { searchCopy as copy } from "../../lib/searchCopy";
import { queryToSearchParams } from "../../lib/searchParams";
import { useSearch } from "../../hooks/useSearch";
import { SearchBar } from "./SearchBar";
import { FilterChips } from "./FilterChips";
import { SearchResults } from "./SearchResults";

/** Ilha da busca hidratada, com cache por conta e histórico. @example <SearchExperience accountId={id} pets={pets} initialQuery={query} today={today} /> */
export function SearchExperience({
  accountId,
  pets,
  initialQuery,
  today,
  initialError,
}: {
  accountId: string;
  pets: SearchPet[];
  initialQuery: SearchQuery;
  today: string;
  initialError?: SearchError;
}) {
  const { query, data, error, result, update } = useSearch(accountId, pets, initialQuery, initialError);
  const selected = pets.filter((pet) => query.pets.includes(pet.id));
  const items = [...new Map(data?.pages.flatMap((page) => page.items).map((item) => [item.id, item]) ?? []).values()];
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={4}>
        <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 40 } }}>
          {selected.length ? copy.petsHeading(selected.map((pet) => pet.name)) : copy.title}
        </Typography>
        <Stack spacing={2} id="search-fields">
          <SearchBar
            key={queryToSearchParams(query).toString()}
            query={query}
            pets={pets}
            today={today}
            onSearch={update}
            errors={error?.fields}
          />
          <Typography>{copy.guarantees}</Typography>
        </Stack>
        <FilterChips query={query} onChange={update} errors={error?.fields} />
        <SearchResults
          query={query}
          items={items}
          totalCount={data?.pages[0]?.totalCount ?? 0}
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
      </Stack>
    </Container>
  );
}
