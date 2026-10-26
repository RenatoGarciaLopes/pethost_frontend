import { PetAvatar } from "@/shared/ui/media/PetAvatar";
import { Box, Typography } from "@mui/material";
import NextLink from "next/link";
import { visuallyHidden } from "@/shared/ui/a11y/visuallyHidden";
import { Surface } from "@/shared/ui/layout/Surface";
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
 * Carteirinha compacta do pet (REQ-PETS-001, 002): foto de capa redonda (ou avatar da espécie), nome e o resumo de
 * `describePet`. A carteirinha inteira é um link para a ficha, sem controle dentro. O nome acessível é o próprio
 * texto da carteirinha, começando por "Ficha de {nome}" (o "Ficha de" fica só para o leitor de tela): quem usa
 * comando de voz fala o que vê, e o título segue a hierarquia da página. Sem hooks: renderiza no servidor e no navegador.
 *
 * @example <PetIdCard pet={luna} now={new Date()} />
 */
export function PetIdCard({ pet, now }: PetIdCardProps) {
  return (
    <NextLink href={petPath(pet.id)} style={{ textDecoration: "none", color: "inherit" }}>
      <Surface
        interactive
        elevation="sm"
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "center",
          minHeight: 88,
          p: 2,
        }}
      >
        {/* A foto é decorativa: o nome já está no texto (alt vazio). */}
        <PetAvatar
          aria-hidden="true"
          petId={pet.id}
          name={pet.name}
          species={pet.species}
          src={pet.coverUrl}
          size={64}
        />
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
      </Surface>
    </NextLink>
  );
}
