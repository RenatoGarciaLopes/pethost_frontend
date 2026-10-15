import { Box, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { PawMark } from "@/shared/ui/brand/PawMark";
import { petsCopy } from "../lib/petsCopy";
import type { PersonalRole } from "@/shared/auth/contracts/session";

/** Cadastro do pet (spec 021). */
export const NEW_PET_PATH = "/pets/new";

/**
 * "Apresentar outro pet" (REQ-PETS-003): patinha no círculo tracejado, do mesmo tamanho de uma carteirinha.
 * @example <NewPetTile />
 */
export function NewPetTile({ role = "owner" }: { role?: PersonalRole }) {
  return (
    <NextLink href={NEW_PET_PATH} style={{ textDecoration: "none", color: "inherit" }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: "center",
          minHeight: 88,
          p: 2,
          border: 2,
          borderStyle: "dashed",
          borderColor: "divider",
          borderRadius: 3,
          "&:hover": { borderColor: "text.primary" },
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            flexShrink: 0,
            borderRadius: "50%",
            border: 2,
            borderStyle: "dashed",
            borderColor: "primary.main",
            color: "primary.main",
            display: "grid",
            placeItems: "center",
          }}
        >
          <PawMark size={28} />
        </Box>
        <Typography sx={{ fontWeight: 700 }}>{petsCopy[role].newPet}</Typography>
      </Stack>
    </NextLink>
  );
}
