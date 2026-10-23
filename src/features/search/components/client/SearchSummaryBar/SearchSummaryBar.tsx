"use client";
import { useState } from "react";
import { Box, Dialog } from "@mui/material";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { focusRing, keyboardFocus } from "@/shared/theme/focus";
import { stayLabel } from "@/shared/ui/forms/Calendar";
import type { SearchPet } from "../../../types";
import { useSearchUrl } from "../../../hooks/useSearchUrl";
import { queryToSearchParams } from "../../../lib/searchParams";
import { searchCopy as copy } from "../../../lib/searchCopy";
import { SearchBar } from "../SearchBar";

type Field = "where" | "dates" | "pet";

/** Pets que o tutor pode escolher e se a busca conta pets em vez de escolhê-los (anfitrião). */
export interface SearchSummaryBarProps {
  pets: readonly Pick<SearchPet, "id" | "name" | "species">[];
  quantityMode?: boolean;
}

const segment = {
  minWidth: 0,
  minHeight: 44,
  px: { xs: 1.5, md: 2 },
  border: 0,
  bgcolor: "transparent",
  color: "text.primary",
  font: "inherit",
  fontSize: 14,
  fontWeight: 600,
  textAlign: "left",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  cursor: "pointer",
  [keyboardFocus()]: { ...focusRing, borderRadius: `${quintalRadii.control}px` },
} as const;

/**
 * Busca minificada do cabeçalho: aparece só quando a URL de `/` traz uma busca, resume lugar, datas e pet em uma
 * pílula e abre a edição do campo tocado (a mesma `SearchBar`, com o campo já em foco). Buscar atualiza a URL.
 * @example <SearchSummaryBar pets={pets} />
 */
export function SearchSummaryBar({ pets, quantityMode = false }: SearchSummaryBarProps) {
  const { query, update } = useSearchUrl();
  const [editing, setEditing] = useState<Field | null>(null);
  if (queryToSearchParams(query).size === 0) return null;
  const petLabel = pets.length
    ? pets
        .filter((pet) => query.pets.includes(pet.id))
        .map((pet) => pet.name)
        .join(", ") || copy.whichPet
    : quantityMode
      ? copy.petCount(query.count ?? 1)
      : ({ dog: copy.dog, cat: copy.cat }[query.species[0] as "dog" | "cat"] ?? copy.allPets);
  const segments: [Field, string][] = [
    ["where", query.where || copy.nearby],
    ["dates", stayLabel(query.from ?? "", query.to ?? "").split(" · ")[0] || copy.datesEmpty],
    ["pet", petLabel],
  ];
  return (
    <Box
      role="group"
      aria-label={copy.summary}
      sx={{
        order: { xs: 3, md: 0 },
        flex: { xs: "1 1 100%", md: "0 1 600px" },
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        bgcolor: "background.paper",
        border: 2,
        borderColor: "text.primary",
        borderRadius: `${quintalRadii.pill}px`,
        boxShadow: "0 3px 0 var(--mui-palette-quintal-tinta)",
        pl: 0.5,
        pr: 0.75,
        py: 0.5,
      }}
    >
      {segments.map(([field, text], index) => (
        <Box
          key={field}
          component="button"
          type="button"
          aria-label={`${copy.editField[field]}: ${text}`}
          onClick={() => setEditing(field)}
          sx={{
            ...segment,
            flex: index === 0 ? "1 1 40%" : "0 1 auto",
            borderLeft: index === 0 ? 0 : "1px dashed",
            borderColor: "divider",
          }}
        >
          {text}
        </Box>
      ))}
      <Box
        component="button"
        type="button"
        aria-label={copy.editSearch}
        onClick={() => setEditing("where")}
        sx={{
          ml: 0.5,
          flexShrink: 0,
          width: 40,
          height: 40,
          display: "grid",
          placeItems: "center",
          border: 2,
          borderColor: "text.primary",
          borderRadius: "50%",
          bgcolor: "primary.main",
          color: "text.primary",
          cursor: "pointer",
          [keyboardFocus()]: focusRing,
        }}
      >
        <Box component="svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false" sx={{ width: 20, height: 20 }}>
          <circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" strokeWidth="2.4" />
          <path d="m15 15 5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </Box>
      </Box>
      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        fullWidth
        maxWidth="md"
        aria-label={copy.editSearch}
        sx={{ "& .MuiDialog-container": { alignItems: { xs: "flex-end", md: "flex-start" } } }}
        slotProps={{ paper: { sx: { m: { xs: 0, md: 3 }, p: 1.5, width: { xs: "100%", md: undefined } } } }}
      >
        {editing && (
          <SearchBar
            key={editing}
            autoFocus={editing}
            query={query}
            pets={pets}
            quantityMode={quantityMode}
            onSearch={(next) => {
              update(next);
              setEditing(null);
            }}
          />
        )}
      </Dialog>
    </Box>
  );
}
