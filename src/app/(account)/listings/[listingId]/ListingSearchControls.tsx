"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Stack } from "@mui/material";
import { SearchBar } from "@/features/search/index.client";
import { queryToSearchParams, type SearchPet, type SearchQuery } from "@/features/search";

/** Reusa os campos da busca 041 para preencher o período e os pets do detalhe. */
export function ListingSearchControls({
  listingId,
  query,
  pets,
  today,
}: {
  listingId: string;
  query: SearchQuery;
  pets: SearchPet[];
  today: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <Stack spacing={2}>
      {!open && (
        <Button variant="contained" onClick={() => setOpen(true)}>
          Escolher datas e pets
        </Button>
      )}
      {open && (
        <SearchBar
          query={query}
          pets={pets}
          today={today}
          onSearch={(next) => {
            const params = queryToSearchParams(next);
            router.push(`/listings/${listingId}${params.size ? `?${params}` : ""}`);
            setOpen(false);
          }}
        />
      )}
    </Stack>
  );
}
