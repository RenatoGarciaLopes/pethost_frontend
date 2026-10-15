"use client";

import { Button, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { useEffect } from "react";
import { Celebration } from "@/shared/ui/brand/Celebration";
import { useAnnounce } from "@/shared/ui/feedback/Announcer";
import { StepHeading } from "@/shared/ui/navigation/StepHeading";
import { petWizardCopy } from "../../lib/petWizardCopy";
import { petsCopy } from "../../lib/petsCopy";
import type { PersonalRole } from "@/shared/auth/contracts/session";

const copy = petWizardCopy.welcome;
/** "Meus pets" (spec 020). */
const MY_PETS_PATH = "/pets";

/**
 * "Prazer, {nome}!" (REQ-PNEW-020, 022): a comemoração da marca (o `Celebration` já respeita o movimento
 * reduzido) e, para o leitor de tela, "Ficha de {nome} salva.". "Procurar um cantinho" entra com a busca (041).
 *
 * @example <PetWelcome name="Pipoca" onAnother={reset} />
 */
export function PetWelcome({
  name,
  onAnother,
  role = "owner",
}: {
  name: string;
  onAnother: () => void;
  role?: PersonalRole;
}) {
  const announce = useAnnounce();
  useEffect(() => announce(copy.announce(name)), [announce, name]);

  return (
    <Celebration>
      <Stack spacing={3} sx={{ alignItems: "flex-start" }}>
        <StepHeading>{copy.title(name)}</StepHeading>
        <Typography color="text.secondary">{copy.announce(name)}</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button variant="contained" component={NextLink} href={MY_PETS_PATH}>
            {petsCopy[role].myPets}
          </Button>
          <Button variant="outlined" onClick={onAnother}>
            {petsCopy[role].another}
          </Button>
        </Stack>
      </Stack>
    </Celebration>
  );
}
