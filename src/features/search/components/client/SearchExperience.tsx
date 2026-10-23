"use client";
import { Stack, Typography } from "@mui/material";
import { PageContainer } from "@/shared/ui/layout/PageContainer";
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
    <PageContainer width="page" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={4}>
        <Stack spacing={2} id="search-fields">
          <SearchBar
            key={queryToSearchParams(query).toString()}
            query={query}
            pets={pets}
            today={today}
            onSearch={update}
            errors={error?.fields}
          />
        </Stack>
        <Stack spacing={2}>
          <Typography variant="h1" aria-live="polite" sx={{ fontSize: { xs: 30, md: 40 } }}>
            {copy.heading(data?.pages[0]?.totalCount ?? 0, query)}
          </Typography>
          <FilterChips query={query} pets={pets} onChange={update} errors={error?.fields} />
        </Stack>
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
      </Stack>
    </PageContainer>
  );
}
