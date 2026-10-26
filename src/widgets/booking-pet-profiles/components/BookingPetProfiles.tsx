"use client";

import { Box, Button, Skeleton, Stack, Typography } from "@mui/material";
import { useQueries } from "@tanstack/react-query";
import { useId, useState } from "react";
import { petQueries } from "@/features/pets";
import { PetProfileCard } from "@/features/pets/index.client";
import { Notice } from "@/shared/ui/feedback/Notice";
import { bookingPetProfilesCopy as copy } from "../lib/bookingPetProfilesCopy";

export interface BookingPetProfilesProps {
  /** Conta de quem lê (a chave do cache fica sob ela). */
  accountId: string;
  /** Os pets do pedido: id e nome (o nome serve para o aviso quando a ficha não abre). */
  pets: readonly { id: string; name: string | null }[];
}

/**
 * A ficha completa de cada pet de um pedido (spec 053, REQ-HREQ-003): saúde, rotina, manias e convivência, lidas de
 * `GET /pets/{id}` (a API libera ao anfitrião a ficha dos pets do pedido). Compõe a carteirinha da feature de pets com a
 * reserva, sem a feature de reservas importar a de pets. Uma ficha que falha não impede as outras nem a decisão.
 *
 * @example <BookingPetProfiles accountId={user.id} pets={booking.pets} />
 */
export function BookingPetProfiles({ accountId, pets }: BookingPetProfilesProps) {
  const headingId = useId();
  // A idade na carteirinha é calculada uma vez por visita.
  const [now] = useState(() => new Date());
  const results = useQueries({ queries: pets.map((pet) => petQueries.detail(accountId, pet.id)) });

  return (
    <Stack component="section" aria-labelledby={headingId} spacing={2}>
      <Typography id={headingId} variant="h2" sx={{ fontSize: { xs: 22, md: 26 } }}>
        {copy.heading}
      </Typography>
      {pets.map((pet, index) => {
        const result = results[index]!;
        if (result.isPending) return <Skeleton key={pet.id} variant="rounded" height={280} />;
        if (result.isError)
          return (
            <Notice
              key={pet.id}
              tone="info"
              title={copy.failed(pet.name ?? copy.thisPet)}
              action={
                <Button size="small" onClick={() => void result.refetch()}>
                  {copy.retry}
                </Button>
              }
            />
          );
        return (
          <Box key={pet.id}>
            <PetProfileCard
              petId={pet.id}
              values={result.data.values}
              coverUrl={result.data.photos[0]?.url ?? null}
              now={now}
              showEmptyBlocks
            />
          </Box>
        );
      })}
    </Stack>
  );
}
