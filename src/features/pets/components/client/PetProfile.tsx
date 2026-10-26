"use client";

import { Button, Link, Skeleton, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import NextLink from "next/link";
import { useState } from "react";
import { translateError } from "@/shared/api/errors/translateError";
import { visuallyHidden } from "@/shared/ui/a11y/visuallyHidden";
import { ErrorNotice } from "@/shared/ui/feedback/ErrorNotice";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { StatusPill } from "@/shared/ui/feedback/StatusPill";
import { petQueries } from "../../api/queries";
import { useReactivatePet } from "../../hooks/usePetMutations";
import { petEditCopy as copy } from "../../lib/petEditCopy";
import { PetProfileCard } from "../PetProfileCard";
import { petEditPath } from "../../lib/petPaths";
import { DeactivatePetDialog } from "./DeactivatePetDialog";

const MY_PETS_PATH = "/pets";

/**
 * A ficha do pet (REQ-PEDIT-001, 003, 016): a carteirinha completa com saúde, rotina e convivência, "Editar
 * ficha" e, no fim, o discreto "Tirar da lista". Pet fora da lista mostra o selo neutro e "Voltar pra lista"; a
 * edição continua possível. Chega hidratada do servidor. Só o dono chega aqui (a API esconde o pet dos outros).
 *
 * @example <PetProfile accountId={user.id} petId={petId} />
 */
export function PetProfile({ accountId, petId }: { accountId: string; petId: string }) {
  const query = useQuery(petQueries.detail(accountId, petId));
  const reactivate = useReactivatePet(accountId, petId);
  // A idade da carteirinha é calculada uma vez por visita.
  const [now] = useState(() => new Date());

  if (query.isPending) return <PetProfileSkeleton />;
  if (query.isError)
    return (
      <ErrorState
        title={copy.loadError}
        description={translateError(query.error)}
        onRetry={() => void query.refetch()}
      />
    );

  const pet = query.data;
  const name = pet.values.name;

  return (
    <Stack spacing={3}>
      <Typography component="h1" sx={visuallyHidden}>
        {copy.profileHeading(name)}
      </Typography>
      <Link component={NextLink} href={MY_PETS_PATH} sx={{ alignSelf: "flex-start" }}>
        {copy.backToList}
      </Link>
      {!pet.isActive && (
        <Stack spacing={1.5} sx={{ alignItems: "flex-start" }}>
          <StatusPill label={copy.inactive} />
          <Typography variant="body2" color="text.secondary">
            {copy.inactiveHelp}
          </Typography>
          <Button
            variant="outlined"
            disabled={reactivate.isPending}
            aria-busy={reactivate.isPending || undefined}
            onClick={() => reactivate.mutate()}
          >
            {copy.reactivate}
          </Button>
          <ErrorNotice message={reactivate.isError ? translateError(reactivate.error) : null} tone="erro" />
        </Stack>
      )}
      <PetProfileCard
        petId={petId}
        values={pet.values}
        coverUrl={pet.photos[0]?.url ?? null}
        now={now}
        showEmptyBlocks
      />
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <Button component={NextLink} href={petEditPath(petId)} variant="contained">
          {copy.edit}
        </Button>
        {pet.photos.length === 0 && (
          <Link component={NextLink} href={`${petEditPath(petId)}?secao=fotos`}>
            {copy.addPhoto}
          </Link>
        )}
      </Stack>
      {pet.isActive && <DeactivatePetDialog accountId={accountId} petId={petId} name={name} />}
    </Stack>
  );
}

/**
 * Esqueleto da ficha enquanto o servidor busca o pet.
 * @example <Suspense fallback={<PetProfileSkeleton />}>…</Suspense>
 */
export function PetProfileSkeleton() {
  return (
    <Stack spacing={2} aria-busy="true" aria-label={copy.loading} sx={{ maxWidth: 640, mx: "auto", py: 6, px: 2 }}>
      <Skeleton variant="rounded" height={88} />
      <Skeleton variant="rounded" height={320} />
    </Stack>
  );
}
