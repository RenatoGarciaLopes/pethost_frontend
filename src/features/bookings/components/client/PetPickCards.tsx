"use client";

import { Avatar, Box, ButtonBase, Checkbox, FormHelperText, Typography } from "@mui/material";
import { useId } from "react";
import { focusRing, keyboardFocus } from "@/shared/theme/focus";
import { quintalColors as c } from "@/shared/theme/tokens/colors";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { hardShadow } from "@/shared/theme/tokens/shadows";
import { bookingCopy } from "../../lib/bookingCopy";

const copy = bookingCopy.request;

/** Um pet do tutor no pedido, com o resultado de "combina com o cantinho" já calculado por quem compõe. */
export interface PickablePet {
  id: string;
  name: string;
  species: string;
  size: string | null;
  coverUrl: string | null;
  fit: { fits: true } | { fits: false; reason: "species" | "size" };
}

export interface PetPickCardsProps {
  /** Nome do grupo ("Quem vai se hospedar?"). */
  label: string;
  pets: readonly PickablePet[];
  value: readonly string[];
  onChange: (petIds: string[]) => void;
  error?: string;
  disabled?: boolean;
}

/** "Combina" ou o motivo: "Esse cantinho não recebe gato" / "...porte grande". */
function fitText(pet: PickablePet): string {
  if (pet.fit.fits) return copy.fits;
  return pet.fit.reason === "species"
    ? copy.notSpecies(bookingCopy.species[pet.species] ?? pet.species)
    : copy.notSize(bookingCopy.sizes[pet.size ?? ""] ?? pet.size ?? "");
}

/**
 * Os pets do tutor como cartões marcáveis (REQ-REQST-002): cada um diz se combina com o cantinho; o que não combina
 * fica travado, com o motivo visível. Checkbox nativo dentro do cartão: o nome acessível é o próprio texto do cartão.
 *
 * @example <PetPickCards label="Quem vai se hospedar?" pets={pets} value={petIds} onChange={setPetIds} />
 */
export function PetPickCards({ label, pets, value, onChange, error, disabled = false }: PetPickCardsProps) {
  const id = useId();
  const errorId = `${id}-erro`;
  const toggle = (petId: string, checked: boolean) =>
    onChange(pets.map((pet) => pet.id).filter((item) => (item === petId ? checked : value.includes(item))));

  return (
    <Box
      component="fieldset"
      aria-describedby={error ? errorId : undefined}
      sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}
    >
      <Typography component="legend" variant="h2" sx={{ fontSize: 22, mb: 1.5, p: 0 }}>
        {label}
      </Typography>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
        {pets.map((pet) => {
          const checked = value.includes(pet.id);
          const locked = disabled || !pet.fit.fits;
          return (
            <ButtonBase
              key={pet.id}
              component="label"
              role={undefined}
              tabIndex={-1}
              disabled={locked}
              sx={{
                p: 2,
                gap: 2,
                justifyContent: "flex-start",
                textAlign: "left",
                border: `2px solid ${c.tinta}`,
                borderRadius: `${quintalRadii.card}px`,
                backgroundColor: checked ? c.grama : "#fff",
                color: c.tinta,
                boxShadow: hardShadow(checked ? 0 : 3),
                opacity: pet.fit.fits ? 1 : 0.75,
                [keyboardFocus("&:has(input:focus-visible)")]: focusRing,
              }}
            >
              <Checkbox
                checked={checked}
                disabled={locked}
                onChange={(event) => toggle(pet.id, event.target.checked)}
                sx={{ p: 0 }}
              />
              <Avatar
                src={pet.coverUrl ?? undefined}
                alt=""
                sx={{ width: 48, height: 48, bgcolor: c.gema, color: c.tinta }}
              >
                {pet.name.slice(0, 1).toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography component="span" sx={{ display: "block", fontWeight: 800 }}>
                  {pet.name}
                </Typography>
                <Typography component="span" sx={{ display: "block", fontWeight: pet.fit.fits ? 400 : 700 }}>
                  {fitText(pet)}
                </Typography>
              </Box>
            </ButtonBase>
          );
        })}
      </Box>
      {error && (
        <FormHelperText id={errorId} error sx={{ mt: 1 }}>
          {error}
        </FormHelperText>
      )}
    </Box>
  );
}
