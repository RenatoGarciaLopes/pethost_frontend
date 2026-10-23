"use client";
import { Button, Stack } from "@mui/material";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import type { SearchPet, SearchQuery } from "../../../types";
import { searchCopy as copy } from "../../../lib/searchCopy";
/** Filtros rápidos suportados pela API; escrita da URL delegada ao consumidor. */
export interface FilterChipsProps {
  query: SearchQuery;
  pets?: SearchPet[];
  onChange: (query: SearchQuery) => void;
  errors?: Record<string, string>;
}
/** Pílulas contornadas; limpar preserva lugar, datas e pets.
 * @example <FilterChips query={query} pets={pets} onChange={search} />
 */
export function FilterChips({ query, pets = [], onChange, errors = {} }: FilterChipsProps) {
  const filters = [
    ["hasYard", true, copy.yard],
    ["hasKids", false, copy.noKids],
    ["hasDogs", false, copy.noDogs],
    ["hasCats", false, copy.noCats],
    ["homeType", "house", copy.house],
    ["homeType", "apartment", copy.apartment],
  ] as const;
  const selected = pets.filter((pet) => query.pets.includes(pet.id));
  const hasFilters =
    filters.some(([key]) => query[key] !== undefined) || query.species.length > 0 || query.sizes.length > 0;
  const style = {
    borderRadius: `${quintalRadii.pill}px`,
    px: 2,
    py: 0.75,
    minHeight: 40,
    borderColor: "text.primary",
    color: "text.primary",
    fontSize: 14,
    fontWeight: 600,
    boxShadow: "none",
    "&:hover": { boxShadow: "none", transform: "none" },
  };
  function pill(label: string, active: boolean, click: () => void) {
    return (
      <Button
        key={label}
        aria-label={label}
        aria-pressed={active}
        variant={active ? "ok" : "outlined"}
        onClick={click}
        sx={style}
      >
        {active && <span aria-hidden="true">✓&nbsp;</span>}
        {label}
      </Button>
    );
  }
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1 }}>
        {selected.length > 0 &&
          pill(copy.matchesPet(selected.map((pet) => pet.name)), true, () => onChange({ ...query, pets: [] }))}
        {filters.map(([key, value, label]) =>
          pill(label, query[key] === value, () =>
            onChange({ ...query, [key]: query[key] === value ? undefined : value }),
          ),
        )}
        {(
          [
            ["species", "cat", copy.acceptsCats],
            ["sizes", "large", copy.acceptsLarge],
          ] as const
        ).map(([key, value, label]) =>
          pill(label, query[key].includes(value), () =>
            onChange({
              ...query,
              [key]: query[key].includes(value) ? query[key].filter((item) => item !== value) : [...query[key], value],
            }),
          ),
        )}
        {hasFilters && (
          <Button
            onClick={() =>
              onChange({
                ...query,
                hasYard: undefined,
                hasKids: undefined,
                hasDogs: undefined,
                hasCats: undefined,
                homeType: undefined,
                species: [],
                sizes: [],
              })
            }
          >
            {copy.clear}
          </Button>
        )}
      </Stack>
      {Object.entries(errors)
        .filter(([key]) => !["where", "from", "to", "count"].includes(key))
        .map(([key, value]) => (
          <span role="alert" key={key}>
            {copy.fieldLabels[key] ? copy.fieldLabels[key] + ": " : ""}
            {value}
          </span>
        ))}
    </Stack>
  );
}
