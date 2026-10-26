"use client";

import { Box, Button, Link, Stack } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import NextLink from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { translateError } from "@/shared/api/errors/translateError";
import { useUnsavedChangesGuard } from "@/shared/hooks/useUnsavedChangesGuard";
import { ConfirmDialog } from "@/shared/ui/feedback/ConfirmDialog";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { StepWizard } from "@/shared/ui/navigation/StepWizard";
import { petQueries } from "../../api/queries";
import { petEditCopy as copy } from "../../lib/petEditCopy";
import { PET_EDIT_SECTION_IDS, SECTION_PARAM, sectionIndexOf, petSectionSummary } from "../../lib/petEditSections";
import { petPath } from "../../lib/petPaths";
import type { PetWizardValues } from "../../stores/petWizardStore";
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

const SECTION_EVENT = "pet-edit-section";
function subscribeSection(onChange: () => void) {
  window.addEventListener(SECTION_EVENT, onChange);
  window.addEventListener("popstate", onChange);
  window.addEventListener("hashchange", onChange);
  return () => {
    window.removeEventListener(SECTION_EVENT, onChange);
    window.removeEventListener("popstate", onChange);
    window.removeEventListener("hashchange", onChange);
  };
}
function currentSection() {
  const url = new URL(window.location.href);
  return sectionIndexOf(url.searchParams.get(SECTION_PARAM) ?? url.hash.slice(1));
}
const serverSection = () => 0;

/** Edição em sete seções navegáveis (107), com PATCH mínimo por seção e proteção de alterações. */
export function PetEditor({ accountId, petId }: { accountId: string; petId: string }) {
  const query = useQuery(petQueries.detail(accountId, petId));
  const index = useSyncExternalStore(subscribeSection, currentSection, serverSection);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<PetWizardValues | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const saveDestination = useRef<number | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const { dialog } = useUnsavedChangesGuard(dirty);
  const [now] = useState(() => new Date());
  const writeUrl = useCallback((next: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set(SECTION_PARAM, PET_EDIT_SECTION_IDS[next]);
    url.hash = "";
    window.history.replaceState(window.history.state, "", url);
    window.dispatchEvent(new Event(SECTION_EVENT));
  }, []);
  const go = useCallback(
    (next: number) => {
      setDirty(false);
      setPreview(null);
      setPending(null);
      saveDestination.current = null;
      writeUrl(next);
    },
    [writeUrl],
  );
  const request = useCallback(
    (next: number) => {
      if (saving || next === index) return;
      if (dirty) setPending(next);
      else go(next);
    },
    [dirty, index, go, saving],
  );
  useEffect(() => {
    heading.current?.focus();
  }, [index, query.isPending]);
  const reportDirty = useCallback((_id: string, value: boolean) => setDirty(value), []);
  const saved = useCallback(() => {
    setDirty(false);
    setPreview(null);
    if (saveDestination.current !== null) go(saveDestination.current);
  }, [go]);

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
  const sections = [{ id: "fotos", title: copy.sections.photos }, ...SECTIONS];
  const current = sections[index];
  const step = SECTIONS.find((section) => section.id === current.id);
  const navigation = (
    <>
      {index > 0 && (
        <Button
          type="button"
          disabled={saving}
          onClick={() => request(index - 1)}
          sx={{ display: { xs: "none", md: "inline-flex" } }}
        >
          {copy.wizard.previous(sections[index - 1].title)}
        </Button>
      )}
      {index < sections.length - 1 && (
        <Button type="button" disabled={saving} onClick={() => request(index + 1)}>
          {copy.wizard.next(sections[index + 1].title)}
        </Button>
      )}
    </>
  );
  return (
    <Stack spacing={3} sx={{ minWidth: 0 }}>
      <Link component={NextLink} href={petPath(petId)} sx={{ alignSelf: "flex-start" }}>
        {copy.backToProfile(pet.values.name)}
      </Link>
      <StepWizard
        steps={sections.map((section, position) => ({
          id: section.id,
          label: section.title,
          description: petSectionSummary(PET_EDIT_SECTION_IDS[position], pet, now),
        }))}
        currentIndex={index}
        progressTitle={copy.editTitle(pet.values.name)}
        progressLabel={copy.wizard.progressLabel}
        position={copy.wizard.position(index + 1, sections.length)}
        title={current.title}
        titleRef={heading}
        navigation={{ onSelect: request, menuLabel: copy.wizard.menu, disabled: saving }}
        aside={
          <PetProfileCard
            petId={petId}
            values={{ ...pet.values, ...preview }}
            coverUrl={pet.photos[0]?.url ?? null}
            now={now}
            showEmptyBlocks
          />
        }
      >
        {step ? (
          <EditSection
            key={current.id}
            accountId={accountId}
            pet={pet}
            section={step}
            sectionOfField={sectionOfField}
            onDirtyChange={reportDirty}
            onBusyChange={setSaving}
            formRef={form}
            actions={navigation}
            onSaved={saved}
            onPreview={setPreview}
            onNavigate={(id) => request(sectionIndexOf(id))}
          />
        ) : (
          <>
            <PetPhotosSection accountId={accountId} pet={pet} />
            <Box sx={{ mt: 3, pb: { xs: 10, md: 0 }, "& .MuiButton-root": { minHeight: 56 } }}>{navigation}</Box>
          </>
        )}
      </StepWizard>
      <ConfirmDialog
        open={pending !== null}
        title={copy.switchSection.title(current.title)}
        message={copy.switchSection.message(current.title)}
        confirmLabel={copy.switchSection.save}
        cancelLabel={copy.switchSection.stay}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          saveDestination.current = pending;
          setPending(null);
          form.current?.requestSubmit();
        }}
        alternative={{
          label: copy.switchSection.discard,
          onClick: () => {
            if (pending !== null) go(pending);
          },
        }}
      />
      {dialog}
    </Stack>
  );
}
