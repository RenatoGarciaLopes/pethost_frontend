"use client";

import { Box, Button, Collapse, Stack, Typography } from "@mui/material";
import { useId, useState } from "react";
import { petsCopy } from "../../lib/petsCopy";
import type { Pet } from "../../types";
import { PetGrid } from "../PetGrid";
import { PetIdCard } from "../PetIdCard";

/**
 * "Fora da lista (N)" (REQ-PETS-005): recolhida por padrão, em tom neutro, sem alerta nem motivo.
 * As fichas continuam acessíveis pelas carteirinhas.
 *
 * @example <InactivePetsSection pets={inactive} now={now} />
 */
export function InactivePetsSection({ pets, now }: { pets: Pet[]; now: Date }) {
  const listId = useId();
  const [open, setOpen] = useState(false);

  return (
    <Stack spacing={1.5}>
      <Box>
        <Button
          variant="text"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((value) => !value)}
          sx={{ px: 0, color: "text.secondary" }}
        >
          {petsCopy.inactive.title(pets.length)}
        </Button>
      </Box>
      <Collapse in={open} id={listId}>
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            {petsCopy.inactive.help}
          </Typography>
          <PetGrid>
            {pets.map((pet) => (
              <li key={pet.id}>
                <PetIdCard pet={pet} now={now} />
              </li>
            ))}
          </PetGrid>
        </Stack>
      </Collapse>
    </Stack>
  );
}
