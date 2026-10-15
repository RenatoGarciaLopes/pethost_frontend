"use client";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Notice } from "@/shared/ui/feedback/Notice";
import { SniffingBanner } from "@/shared/ui/feedback/SniffingBanner";
import type { ListingSummary } from "../../../api/contracts";
import type { SearchQuery } from "../../../types";
import type { SearchError } from "../../../lib/searchErrors";
import { searchCopy as copy } from "../../../lib/searchCopy";
import { ListingCard } from "../ListingCard";

/** Estado de apresentação e ações do consumidor. @example { query, items, totalCount, petCount, onMore, onRetry, onExpand } */
export interface SearchResultsProps {
  query: SearchQuery;
  items: ListingSummary[];
  totalCount: number;
  petCount: number;
  isFetching?: boolean;
  hasNextPage?: boolean;
  error?: SearchError | null;
  onMore: () => void;
  onRetry: () => void;
  onExpand: (radius: number) => void;
}
/** Lista sem dependência de mapa; mantém cards e ações durante atualização/erro. @example <SearchResults {...props} /> */
export function SearchResults({
  query,
  items,
  totalCount,
  petCount,
  isFetching,
  hasNextPage,
  error,
  onMore,
  onRetry,
  onExpand,
}: SearchResultsProps) {
  const addressError =
    error?.code === "LISTING_SEARCH_ADDRESS_REQUIRED" || error?.code === "LISTING_SEARCH_ADDRESS_NOT_LOCATED";
  const radius = query.radius ?? (query.where || query.state || query.neighborhood ? undefined : 10);
  const bigger = radius === undefined ? undefined : radius < 10 ? 10 : radius < 20 ? 20 : radius < 50 ? 50 : undefined;
  return (
    <Stack spacing={3}>
      <Typography component="p" aria-live="polite">
        {copy.heading(totalCount, query)}
      </Typography>
      {isFetching && <SniffingBanner />}
      {error && (
        <Notice
          tone={addressError ? "atencao" : "erro"}
          title={addressError ? copy.address : copy.genericError}
          action={
            addressError ? (
              <>
                <Button href="/users/profile">{copy.profile}</Button>
                <Button href="#search-fields">{copy.citySearch}</Button>
              </>
            ) : (
              <Button onClick={onRetry}>{copy.retry}</Button>
            )
          }
        >
          {addressError ? copy.cityHelp : error.status === 400 ? copy.filterError : null}
        </Notice>
      )}
      {!items.length && !isFetching && !error && <Notice tone="info" title={copy.empty} />}
      <Box
        component="ul"
        aria-label={copy.title}
        sx={{
          listStyle: "none",
          p: 0,
          m: 0,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
          gap: 3,
        }}
      >
        {items.map((listing) => (
          <Box component="li" key={listing.id}>
            <ListingCard listing={listing} query={query} petCount={petCount} />
          </Box>
        ))}
      </Box>
      {hasNextPage ? (
        <Button variant="outlined" disabled={isFetching} onClick={onMore}>
          {copy.more}
        </Button>
      ) : (
        !error &&
        !isFetching &&
        (bigger ? (
          <Button onClick={() => onExpand(bigger)}>{copy.expand(bigger)}</Button>
        ) : (
          <Typography>{copy.end}</Typography>
        ))
      )}
    </Stack>
  );
}
