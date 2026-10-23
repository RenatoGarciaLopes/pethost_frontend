"use client";
import { useId, useState, type FormEvent } from "react";
import { Box, Button, Checkbox, FormControl, FormLabel, InputBase, MenuItem, Select, Typography } from "@mui/material";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { focusRing, keyboardFocus } from "@/shared/theme/focus";
import { DOOR_TARGET_ATTR, DOOR_WARM_ATTR } from "@/shared/ui/brand/DoorScene";
import { Surface } from "@/shared/ui/layout/Surface";
import { brasiliaToday, validateStay } from "@/shared/lib/date/stayRules";
import { CalendarGlyph, stayLabel, StayCalendar } from "@/shared/ui/forms/Calendar";
import type { SearchPet, SearchQuery } from "../../../types";
import { searchCopy as copy } from "../../../lib/searchCopy";
/** Faixa única compartilhada pela home, busca e cantinho; callbacks sem transporte. */
export interface SearchBarProps {
  query: SearchQuery;
  pets: readonly Pick<SearchPet, "id" | "name" | "species">[];
  today?: string;
  onSearch: (query: SearchQuery) => void;
  onDraftChange?: (query: SearchQuery) => void;
  quantityMode?: boolean;
  errors?: Record<string, string>;
}
const PET_COUNTS = [1, 2, 3, 4, 5, 6] as const;
const cell = {
  position: "relative",
  minWidth: 0,
  minHeight: 56,
  px: { xs: 1, md: 2 },
  py: 0.5,
  // Keyboard focus wraps the whole cell (icon, label and value); no colored :focus-within ring.
  [keyboardFocus("&:has(:focus-visible)")]: { ...focusRing, borderRadius: `${quintalRadii.control}px` },
  // The cell owns this indicator; don't draw a second rectangle through its label.
  [keyboardFocus("& .MuiInputBase-root .MuiInputBase-input:focus-visible")]: { outline: "none" },
} as const;
const dateButton = {
  position: "absolute",
  inset: 0,
  opacity: 0,
  width: "100%",
  height: "100%",
  p: 0,
  border: 0,
  cursor: "pointer",
  fontSize: 16,
} as const;
const separator = { borderRight: { xs: "none", md: "1px dashed" }, borderColor: "divider" } as const;
const dateCell = { ...cell, ...separator } as const;
const label = {
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  lineHeight: "20px",
  color: "text.primary",
} as const;
const control = {
  width: "100%",
  fontSize: 14,
  lineHeight: "24px",
  "& input": { p: 0, minHeight: 28 },
  "& .MuiSelect-select": { py: 0, minHeight: "28px !important", display: "flex", alignItems: "center" },
} as const;

/** ONDE, CHEGADA, SAÍDA e PET; pílula expansível no celular e validação antes de buscar.
 * @example <SearchBar query={query} pets={pets} today={today} onSearch={search} />
 */
export function SearchBar({
  query,
  pets,
  today,
  onSearch,
  onDraftChange,
  quantityMode = !pets.length,
  errors = {},
}: SearchBarProps) {
  const ids = useId();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draft, setDraft] = useState(query);
  const [calendar, setCalendar] = useState<{ anchor: HTMLElement; bar: HTMLElement } | null>(null);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const fieldErrors = { ...errors, ...localErrors };
  const where = draft.where ?? "",
    from = draft.from ?? "",
    to = draft.to ?? "",
    petIds = draft.pets,
    species = draft.species[0] ?? "",
    petCount = draft.count ?? 1;
  const isPetList = pets.length > 0,
    isHost = quantityMode;
  function change(next: SearchQuery) {
    setDraft(next);
    onDraftChange?.(next);
  }
  const setWhere = (where: string) => change({ ...draft, where, radius: undefined });
  const setPetIds = (pets: string[]) => change({ ...draft, pets });
  const setSpecies = (species: string) => change({ ...draft, species: species ? [species] : [] });
  const setPetCount = (count: number) => change({ ...draft, count });
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (today) {
      const stay = validateStay(from, to, today);
      if (stay.checkIn) next.from = stay.checkIn;
      if (stay.checkOut) next.to = stay.checkOut;
    }
    if (where.length > 80) next.where = copy.cityTooLong;
    setLocalErrors(next);
    if (!Object.keys(next).length) {
      onSearch({ ...draft, ...(isHost ? { count: petCount } : {}) });
      setMobileOpen(false);
    }
  }
  return (
    <>
      <Surface
        component="form"
        {...{ noValidate: true }}
        aria-label="Busca de cantinhos"
        onSubmit={handleSubmit}
        elevation="md"
        {...{ [DOOR_TARGET_ATTR]: "" }}
        sx={{
          p: { xs: 1, md: 1.25 },
          boxShadow: "0 5px 0 var(--mui-palette-quintal-tinta)",
          borderRadius: {
            xs: `${mobileOpen ? quintalRadii.card : quintalRadii.pill}px`,
            md: `${quintalRadii.card}px`,
          },
        }}
      >
        <Button
          type="button"
          variant="text"
          aria-expanded={mobileOpen}
          aria-controls={`${ids}-fields`}
          onClick={() => setMobileOpen((open) => !open)}
          sx={{
            minHeight: 56,
            width: "100%",
            justifyContent: "flex-start",
            px: 2,
            fontWeight: 700,
            display: { xs: "flex", md: "none" },
            mb: mobileOpen ? 1 : 0,
          }}
        >
          {mobileOpen ? copy.close : copy.edit}
        </Button>
        <Box
          id={`${ids}-fields`}
          sx={{
            display: { xs: mobileOpen ? "grid" : "none", md: "grid" },
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(0, 1.3fr) minmax(0, 1.5fr) minmax(0, 1fr) auto",
            },
            alignItems: "center",
            gap: { xs: 1, md: 0 },
          }}
        >
          <Box sx={{ ...cell, ...separator }}>
            <FormLabel htmlFor={`${ids}-where`} sx={label}>
              {copy.where}
            </FormLabel>
            <InputBase
              id={`${ids}-where`}
              inputProps={{
                "aria-invalid": Boolean(fieldErrors.where),
                "aria-describedby": fieldErrors.where ? `${ids}-where-error` : undefined,
              }}
              placeholder={copy.nearby}
              value={where}
              onChange={(event) => setWhere(event.target.value)}
              sx={control}
            />
          </Box>
          <Box sx={{ ...dateCell, display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ display: "flex", flexShrink: 0, color: "text.primary" }}>
              <CalendarGlyph />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <FormLabel htmlFor={`${ids}-dates`} sx={label}>
                {copy.dates}
              </FormLabel>
              <Typography id={`${ids}-dates-value`} sx={{ fontSize: 14, lineHeight: "28px", whiteSpace: "nowrap" }}>
                {stayLabel(from, to) || copy.datesEmpty}
              </Typography>
            </Box>
            <Box
              component="button"
              type="button"
              id={`${ids}-dates`}
              aria-haspopup="dialog"
              aria-describedby={[
                `${ids}-dates-value`,
                fieldErrors.from && `${ids}-from-error`,
                fieldErrors.to && `${ids}-to-error`,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={(event) =>
                setCalendar({ anchor: event.currentTarget.parentElement!, bar: event.currentTarget.closest("form")! })
              }
              sx={dateButton}
            />
          </Box>
          <Box sx={{ ...cell, display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              component="svg"
              viewBox="0 0 40 40"
              aria-hidden="true"
              focusable="false"
              sx={{ width: 36, height: 36, flexShrink: 0, color: "text.primary" }}
            >
              <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
              <g fill="currentColor">
                <ellipse cx="20" cy="24" rx="6" ry="5" />
                <circle cx="11" cy="17" r="2.5" />
                <circle cx="17" cy="12" r="2.5" />
                <circle cx="24" cy="12" r="2.5" />
                <circle cx="29" cy="18" r="2.5" />
              </g>
            </Box>
            <FormControl fullWidth>
              <FormLabel id={`${ids}-pet-label`} sx={label}>
                {copy.pet}
              </FormLabel>
              {isPetList ? (
                <Select<string[]>
                  variant="standard"
                  id={`${ids}-pet`}
                  labelId={`${ids}-pet-label`}
                  multiple
                  value={petIds}
                  input={<InputBase />}
                  sx={control}
                  onChange={(event) =>
                    setPetIds(
                      typeof event.target.value === "string" ? event.target.value.split(",") : event.target.value,
                    )
                  }
                  renderValue={(selected) =>
                    pets
                      .filter((pet) => selected.includes(pet.id))
                      .map((pet) => pet.name)
                      .join(", ")
                  }
                >
                  {pets.map((pet) => (
                    <MenuItem key={pet.id} value={pet.id}>
                      <Checkbox checked={petIds.includes(pet.id)} />
                      {pet.name}
                    </MenuItem>
                  ))}
                </Select>
              ) : isHost ? (
                <Select<number>
                  variant="standard"
                  id={`${ids}-pet`}
                  labelId={`${ids}-pet-label`}
                  value={petCount}
                  input={<InputBase />}
                  sx={control}
                  onChange={(event) => setPetCount(Number(event.target.value))}
                >
                  {PET_COUNTS.map((amount) => (
                    <MenuItem key={amount} value={amount}>
                      {`${amount} ${amount === 1 ? "pet" : "pets"}`}
                    </MenuItem>
                  ))}
                </Select>
              ) : (
                <Select<string>
                  variant="standard"
                  id={`${ids}-pet`}
                  labelId={`${ids}-pet-label`}
                  value={species}
                  displayEmpty
                  input={<InputBase />}
                  sx={control}
                  onChange={(event) => setSpecies(event.target.value)}
                >
                  <MenuItem value="">{copy.allPets}</MenuItem>
                  <MenuItem value="dog">{copy.dog}</MenuItem>
                  <MenuItem value="cat">{copy.cat}</MenuItem>
                </Select>
              )}
            </FormControl>
          </Box>
          <Button
            type="submit"
            variant="contained"
            {...{ [DOOR_WARM_ATTR]: "" }}
            sx={{ minHeight: 56, px: 2.5, whiteSpace: "nowrap" }}
          >
            {copy.search}
          </Button>
        </Box>
      </Surface>
      {Object.entries(fieldErrors)
        .filter(([key]) => ["where", "from", "to", "count"].includes(key))
        .map(([key, message]) => (
          <Typography key={key} id={`${ids}-${key}-error`} role="alert">
            {message}
          </Typography>
        ))}
      <StayCalendar
        open={Boolean(calendar)}
        anchorEl={calendar?.anchor ?? null}
        clearEl={calendar?.bar}
        checkIn={from}
        checkOut={to}
        today={today ?? brasiliaToday()}
        onChange={({ checkIn, checkOut }) => change({ ...draft, from: checkIn, to: checkOut })}
        onClose={() => setCalendar(null)}
      />
    </>
  );
}
