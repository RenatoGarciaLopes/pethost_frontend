"use client";

import { Box, Divider, Link, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import NextLink from "next/link";
import { useCallback, useState } from "react";
import { translateError } from "@/shared/api/errors/translateError";
import { useUnsavedChangesGuard } from "@/shared/hooks/useUnsavedChangesGuard";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { petQueries } from "../../api/queries";
import { petEditCopy as copy } from "../../lib/petEditCopy";
import { petPath } from "../../lib/petPaths";
import { PetProfileCard } from "../PetProfileCard";
import { EditSection, type EditSectionDefinition } from "./EditSection";
import { PetPhotosSection } from "./PetPhotosSection";
import { PetProfileSkeleton } from "./PetProfile";
import { BodyStep } from "./steps/BodyStep";
import { HealthStep } from "./steps/HealthStep";
import { IdentityStep } from "./steps/IdentityStep";
import { RoutineStep } from "./steps/RoutineStep";
import { SocialStep } from "./steps/SocialStep";
import { SpeciesStep } from "./steps/SpeciesStep";

/** Os passos da 021 como seções (REQ-PEDIT-004), na ordem do cadastro, com os campos que cada uma edita. */
const SECTIONS: readonly EditSectionDefinition[] = [
  {
    id: "bicho",
    title: copy.sections.species,
    fields: ["species", "speciesDescription", "size"],
    step: <SpeciesStep />,
  },
  { id: "nome", title: copy.sections.identity, fields: ["name", "sex"], step: <IdentityStep /> },
  { id: "corpo", title: copy.sections.body, fields: ["breed", "size", "birthDate", "weightKg"], step: <BodyStep /> },
  {
    id: "saude",
    title: copy.sections.health,
    fields: ["isVaccinated", "isNeutered", "medicationNotes", "allergies", "vetContact", "microchip"],
    step: <HealthStep />,
  },
  { id: "rotina", title: copy.sections.routine, fields: ["feedingNotes", "notes"], step: <RoutineStep /> },
  {
    id: "convivencia",
    title: copy.sections.social,
    fields: ["goodWithDogs", "goodWithCats", "goodWithKids"],
    step: <SocialStep />,
  },
];

const sectionOfField = (field: string) => SECTIONS.find((section) => section.fields.includes(field));

/**
 * Edição da ficha (REQ-PEDIT-004 a 010, 017): fotos ligadas à API e seis seções, cada uma com "Salvar"
 * próprio, ao lado da carteirinha com o que está salvo (no celular, a carteirinha vem antes). Sair por um link
 * com seção alterada pergunta "Sair sem salvar?".
 *
 * @example <PetEditor accountId={user.id} petId={petId} />
 */
export function PetEditor({ accountId, petId }: { accountId: string; petId: string }) {
  const query = useQuery(petQueries.detail(accountId, petId));
  const [dirtySections, setDirtySections] = useState<ReadonlySet<string>>(() => new Set());
  const { dialog } = useUnsavedChangesGuard(dirtySections.size > 0);
  // A idade da carteirinha é calculada uma vez por visita.
  const [now] = useState(() => new Date());

  const reportDirty = useCallback((sectionId: string, dirty: boolean) => {
    setDirtySections((current) => {
      if (current.has(sectionId) === dirty) return current;
      const next = new Set(current);
      if (dirty) next.add(sectionId);
      else next.delete(sectionId);
      return next;
    });
  }, []);

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
      <Link component={NextLink} href={petPath(petId)} sx={{ alignSelf: "flex-start" }}>
        {copy.backToProfile(name)}
      </Link>
      <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 40 } }}>
        {copy.editTitle(name)}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: { xs: 3, md: 5 },
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) 340px" },
          alignItems: "start",
        }}
      >
        <Box sx={{ position: { md: "sticky" }, top: { md: 24 }, order: { md: 2 } }}>
          <PetProfileCard
            petId={petId}
            values={pet.values}
            coverUrl={pet.photos[0]?.url ?? null}
            now={now}
            showEmptyBlocks
          />
        </Box>
        <Stack spacing={4} divider={<Divider />} sx={{ order: { md: 1 }, minWidth: 0 }}>
          <PetPhotosSection accountId={accountId} pet={pet} />
          {SECTIONS.map((section) => (
            <EditSection
              key={section.id}
              accountId={accountId}
              pet={pet}
              section={section}
              sectionOfField={sectionOfField}
              onDirtyChange={reportDirty}
            />
          ))}
        </Stack>
      </Box>
      {dialog}
    </Stack>
  );
}
