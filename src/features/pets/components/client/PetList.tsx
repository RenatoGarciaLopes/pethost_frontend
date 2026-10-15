"use client";

import { Box, Button, Container, Skeleton, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { useState } from "react";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { useFlashMessageOnce } from "@/shared/hooks/useFlashMessage";
import { PawMark } from "@/shared/ui/brand/PawMark";
import { EmptyState } from "@/shared/ui/feedback/EmptyState";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { Notice } from "@/shared/ui/feedback/Notice";
import { useMyPets } from "../../hooks/useMyPets";
import { petsCopy } from "../../lib/petsCopy";
import { NEW_PET_PATH, NewPetTile } from "../NewPetTile";
import { PetGrid } from "../PetGrid";
import { PetIdCard } from "../PetIdCard";
import { InactivePetsSection } from "./InactivePetsSection";

/**
 * Carteirinhas da conta (REQ-PETS-001 a 008). Chega hidratada do servidor; sem dados (navegação no cliente
 * depois de um erro) mostra carteirinhas-esqueleto. Sem nenhum pet, o convite para apresentar o primeiro.
 * "Apresentar outro pet" fica no fim no computador e no topo no celular (alcance do polegar).
 *
 * @example <PetList accountId={user.id} />
 */
export function PetList({ accountId }: { accountId: string }) {
  const pets = useMyPets(accountId);
  // "A ficha de {nome} saiu da lista." vindo da ficha (REQ-PEDIT-012), uma vez.
  const flash = useFlashMessageOnce();
  // Uma data só para todas as carteirinhas, fixa durante a visita.
  const [now] = useState(() => new Date());

  if (pets.isPending) return <SkeletonGrid />;
  if (pets.isError)
    return (
      <ErrorState
        title={petsCopy.loadError}
        description={getErrorMessage(pets.error)}
        onRetry={() => void pets.refetch()}
      />
    );

  const { active, inactive } = pets.data;
  if (active.length === 0 && inactive.length === 0)
    return (
      <EmptyState
        illustration={<PawMark size={56} />}
        title={petsCopy.empty.title}
        action={
          <Button component={NextLink} href={NEW_PET_PATH} variant="contained">
            {petsCopy.empty.action}
          </Button>
        }
      />
    );

  return (
    <Stack spacing={4}>
      {flash && <Notice tone="ok" title={flash} />}
      <PetGrid>
        {active.map((pet) => (
          <li key={pet.id}>
            <PetIdCard pet={pet} now={now} />
          </li>
        ))}
        <Box component="li" sx={{ order: { xs: -1, md: 0 } }}>
          <NewPetTile />
        </Box>
      </PetGrid>
      {inactive.length > 0 && <InactivePetsSection pets={inactive} now={now} />}
    </Stack>
  );
}

/** Três carteirinhas-esqueleto do tamanho das reais. */
function SkeletonGrid() {
  return (
    <Box aria-busy="true">
      <PetGrid>
        {[0, 1, 2].map((item) => (
          <li key={item}>
            <Skeleton variant="rounded" height={88} />
          </li>
        ))}
      </PetGrid>
    </Box>
  );
}

/**
 * Fallback da página enquanto a sessão e os pets chegam: título e carteirinhas-esqueleto no lugar certo.
 * @example <Suspense fallback={<PetListSkeleton />}>…</Suspense>
 */
export function PetListSkeleton() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={3}>
        <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 40 } }}>
          {petsCopy.title}
        </Typography>
        <SkeletonGrid />
      </Stack>
    </Container>
  );
}
