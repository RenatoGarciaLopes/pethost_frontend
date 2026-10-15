import { Avatar, Box, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { visuallyHidden } from "@/shared/ui/a11y/visuallyHidden";
import { PawMark } from "@/shared/ui/brand/PawMark";
import { describePet } from "../lib/describePet";
import { petPath } from "../lib/petPaths";
import { petsCopy } from "../lib/petsCopy";
import type { Pet } from "../types";

export interface PetIdCardProps {
  pet: Pet;
  /** Data de referência da idade (a lista passa a mesma para todas as carteirinhas). */
  now: Date;
}

/**
 * Carteirinha compacta do pet (REQ-PETS-001, 002): foto de capa redonda (ou patinha), nome e o resumo de
 * `describePet`. A carteirinha inteira é um link para a ficha, sem controle dentro. O nome acessível é o próprio
 * texto da carteirinha, começando por "Ficha de {nome}" (o "Ficha de" fica só para o leitor de tela): quem usa
 * comando de voz fala o que vê, e o título segue a hierarquia da página. Sem hooks: renderiza no servidor e no navegador.
 *
 * @example <PetIdCard pet={luna} now={new Date()} />
 */
export function PetIdCard({ pet, now }: PetIdCardProps) {
  return (
    <NextLink href={petPath(pet.id)} style={{ textDecoration: "none", color: "inherit" }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: "center",
          minHeight: 88,
          p: 2,
          bgcolor: "background.paper",
          border: 2,
          borderColor: "divider",
          borderRadius: 3,
          transition: "border-color 120ms",
          "&:hover": { borderColor: "text.primary" },
        }}
      >
        {/* A foto é decorativa: o nome já está no texto (alt vazio). */}
        <Avatar
          src={pet.coverUrl ?? undefined}
          alt=""
          sx={{ width: 64, height: 64, flexShrink: 0, bgcolor: "quintal.cartao", color: "text.secondary" }}
        >
          <PawMark size={32} />
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h2" variant="h3" sx={{ fontSize: 20 }}>
            <Box component="span" sx={visuallyHidden}>
              {petsCopy.cardPrefix}
            </Box>
            {/* O espaço fica fora do trecho escondido: no fim dele, o cálculo do nome acessível o descarta. */}{" "}
            {pet.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {describePet(pet, now)}
          </Typography>
        </Box>
      </Stack>
    </NextLink>
  );
}
