"use client";
import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { DateRangeField } from "@/shared/ui/forms/DateRangeField";
import { validateStay } from "@/shared/lib/date/stayRules";
import type { SearchPet, SearchQuery } from "../../../types";
import { searchCopy as copy } from "../../../lib/searchCopy";

/** Estado aplicado, pets ativos, dia SSR, envio e erros externos. @example { query, pets, today, onSearch: search } */
export interface SearchBarProps {
  query: SearchQuery;
  pets: SearchPet[];
  today: string;
  onSearch: (query: SearchQuery) => void;
  errors?: Record<string, string>;
}
/** Campos com rótulos visíveis; no celular a pílula abre diálogo com foco gerenciado. @example <SearchBar query={query} pets={pets} today={today} onSearch={search} /> */
export function SearchBar(props: SearchBarProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outlined"
        onClick={() => setOpen(true)}
        sx={{ display: { xs: "flex", md: "none" }, borderRadius: 8 }}
      >
        {copy.edit}
      </Button>
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <SearchForm {...props} />
      </Box>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>{copy.title}</DialogTitle>
        <DialogContent>
          <SearchForm
            {...props}
            onSearch={(query) => {
              props.onSearch(query);
              setOpen(false);
            }}
          />
          <Button onClick={() => setOpen(false)}>{copy.close}</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SearchForm({ query, pets, today, onSearch, errors = {} }: SearchBarProps) {
  const [draft, setDraft] = useState({ ...query, count: pets.length ? query.count : (query.count ?? 1) });
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const fieldErrors = { ...errors, ...localErrors };
  return (
    <Stack
      component="form"
      noValidate
      spacing={2}
      sx={{ pt: 1 }}
      onSubmit={(event) => {
        event.preventDefault();
        const stay = validateStay(draft.from ?? "", draft.to ?? "", today);
        const nextErrors: Record<string, string> = {};
        if (stay.checkIn) nextErrors.from = stay.checkIn;
        if (stay.checkOut) nextErrors.to = stay.checkOut;
        if ((draft.where?.length ?? 0) > 80) nextErrors.where = copy.cityTooLong;
        if ((draft.neighborhood?.length ?? 0) > 80) nextErrors.neighborhood = copy.neighborhoodTooLong;
        if (draft.count !== undefined && (!Number.isInteger(draft.count) || draft.count < 1 || draft.count > 200))
          nextErrors.count = copy.invalidCount;
        setLocalErrors(nextErrors);
        if (!Object.keys(nextErrors).length) onSearch(draft);
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 2fr)" },
          gap: 2,
        }}
      >
        <TextField
          label={copy.where}
          placeholder={copy.nearby}
          value={draft.where ?? ""}
          error={Boolean(fieldErrors.where)}
          helperText={fieldErrors.where}
          onChange={(event) => setDraft({ ...draft, where: event.target.value, radius: undefined })}
        />
        <TextField
          label={copy.neighborhood}
          value={draft.neighborhood ?? ""}
          error={Boolean(fieldErrors.neighborhood)}
          helperText={fieldErrors.neighborhood}
          onChange={(event) => setDraft({ ...draft, neighborhood: event.target.value })}
        />
        <DateRangeField
          checkIn={draft.from ?? ""}
          checkOut={draft.to ?? ""}
          today={today}
          errors={{ checkIn: fieldErrors.from, checkOut: fieldErrors.to }}
          onChange={(value) => setDraft({ ...draft, from: value.checkIn, to: value.checkOut })}
        />
      </Box>
      <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
        <legend>{copy.pet}</legend>
        {pets.length ? (
          pets.map((pet) => (
            <FormControlLabel
              key={pet.id}
              label={pet.name}
              control={
                <Checkbox
                  checked={draft.pets.includes(pet.id)}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      pets: event.target.checked ? [...draft.pets, pet.id] : draft.pets.filter((id) => id !== pet.id),
                    })
                  }
                />
              }
            />
          ))
        ) : (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              select
              label={copy.species}
              value={draft.species[0] ?? ""}
              onChange={(event) => setDraft({ ...draft, species: event.target.value ? [event.target.value] : [] })}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">{copy.allPets}</MenuItem>
              <MenuItem value="dog">{copy.dog}</MenuItem>
              <MenuItem value="cat">{copy.cat}</MenuItem>
            </TextField>
            <TextField
              label={copy.count}
              type="number"
              value={draft.count ?? 1}
              error={Boolean(fieldErrors.count)}
              helperText={fieldErrors.count}
              slotProps={{ htmlInput: { min: 1, max: 200 } }}
              onChange={(event) => setDraft({ ...draft, count: Number(event.target.value) })}
            />
          </Stack>
        )}
      </Box>
      <Button type="submit" variant="contained" sx={{ alignSelf: "flex-start" }}>
        {copy.search}
      </Button>
    </Stack>
  );
}
