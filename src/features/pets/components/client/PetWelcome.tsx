"use client";

import { Button, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { useEffect } from "react";
import { Celebration } from "@/shared/ui/brand/Celebration";
import { useAnnounce } from "@/shared/ui/feedback/Announcer";
import { StepHeading } from "@/shared/ui/navigation/StepHeading";
import { petWizardCopy } from "../../lib/petWizardCopy";

const copy = petWizardCopy.welcome;
/** "Meus pets" (spec 020). */
const MY_PETS_PATH = "/pets";

/**
 * "Prazer, {nome}!" (REQ-PNEW-020, 022): a comemoração da marca (o `Celebration` já respeita o movimento
 * reduzido) e, para o leitor de tela, "Ficha de {nome} salva.". "Procurar um cantinho" entra com a busca (041).
 *
 * @example <PetWelcome name="Pipoca" onAnother={reset} />
 */
export function PetWelcome({ name, onAnother }: { name: string; onAnother: () => void }) {
  const announce = useAnnounce();
  useEffect(() => announce(copy.announce(name)), [announce, name]);

  return (
    <Celebration>
      <Stack spacing={3} sx={{ alignItems: "flex-start" }}>
        <StepHeading>{copy.title(name)}</StepHeading>
        <Typography color="text.secondary">{copy.announce(name)}</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button variant="contained" component={NextLink} href={MY_PETS_PATH}>
            {copy.myPets}
          </Button>
          <Button variant="outlined" onClick={onAnother}>
            {copy.another}
          </Button>
        </Stack>
      </Stack>
    </Celebration>
  );
}
