"use client";
import { Button, Stack, TextField } from "@mui/material";
import type { SearchQuery } from "../../../types";
import { searchCopy as copy } from "../../../lib/searchCopy";

/** Filtros aplicados e escrita da URL, sem transporte. @example { query, onChange: search } */
export interface FilterChipsProps {
  query: SearchQuery;
  onChange: (query: SearchQuery) => void;
  errors?: Record<string, string>;
}
/** Filtros somados; botões anunciam estado, limpar preserva lugar/datas/pets. @example <FilterChips query={query} onChange={setQuery} /> */
export function FilterChips({ query, onChange, errors = {} }: FilterChipsProps) {
  const filters = [
    ["hasYard", true, copy.yard],
    ["hasKids", false, copy.noKids],
    ["hasDogs", false, copy.noDogs],
    ["hasCats", false, copy.noCats],
    ["homeType", "house", copy.house],
    ["homeType", "apartment", copy.apartment],
  ] as const;
  const hasFilters =
    filters.some(([key]) => query[key] !== undefined) ||
    query.maxNightlyRate !== undefined ||
    query.minNightlyRate !== undefined ||
    query.minCapacity !== undefined ||
    query.species.length > 0 ||
    query.sizes.length > 0 ||
    query.weekdays.length > 0;
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1 }}>
        {filters.map(([key, value, label]) => (
          <Button
            key={label}
            aria-pressed={query[key] === value}
            color={query[key] === value ? "success" : "inherit"}
            variant={query[key] === value ? "contained" : "outlined"}
            onClick={() => onChange({ ...query, [key]: query[key] === value ? undefined : value })}
          >
            {label}
          </Button>
        ))}
        {[
          ["species", "cat", copy.acceptsCats],
          ["sizes", "large", copy.acceptsLarge],
        ].map(([key, value, label]) => {
          const field = key as "species" | "sizes";
          return (
            <Button
              key={label}
              aria-pressed={query[field].includes(value!)}
              color={query[field].includes(value!) ? "success" : "inherit"}
              variant="outlined"
              onClick={() =>
                onChange({
                  ...query,
                  [field]: query[field].includes(value!)
                    ? query[field].filter((item) => item !== value)
                    : [...query[field], value!],
                })
              }
            >
              {label}
            </Button>
          );
        })}
      </Stack>
      <TextField
        label={copy.maxRate}
        type="number"
        value={query.maxNightlyRate ?? ""}
        error={Boolean(errors.maxNightlyRate)}
        helperText={errors.maxNightlyRate}
        slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
        onChange={(event) => {
          const value = event.target.value;
          if (!value || Number(value) >= 0) onChange({ ...query, maxNightlyRate: value ? Number(value) : undefined });
        }}
        sx={{ maxWidth: 240 }}
      />
      {query.maxNightlyRate !== undefined && (
        <Button
          aria-pressed
          variant="contained"
          color="success"
          onClick={() => onChange({ ...query, maxNightlyRate: undefined })}
        >
          {copy.rateLimit(query.maxNightlyRate)}
        </Button>
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
              maxNightlyRate: undefined,
              minNightlyRate: undefined,
              minCapacity: undefined,
              species: [],
              sizes: [],
              weekdays: [],
            })
          }
        >
          {copy.clear}
        </Button>
      )}
      {Object.entries(errors)
        .filter(([key]) => !["where", "neighborhood", "from", "to", "count", "maxNightlyRate"].includes(key))
        .map(([key, value]) => (
          <span role="alert" key={key}>
            {copy.fieldLabels[key] ? `${copy.fieldLabels[key]}: ` : ""}
            {value}
          </span>
        ))}
    </Stack>
  );
}
