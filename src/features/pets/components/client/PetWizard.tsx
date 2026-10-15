"use client";

import { Button, Stack } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { isApiError } from "@/shared/api/errors/ApiError";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { useErrorNotice } from "@/shared/hooks/useErrorNotice";
import { useSessionDraft } from "@/shared/hooks/useSessionDraft";
import { ErrorNotice } from "@/shared/ui/feedback/ErrorNotice";
import { Hint } from "@/shared/ui/feedback/Hint";
import { Notice } from "@/shared/ui/feedback/Notice";
import { WizardProgress } from "@/shared/ui/navigation/WizardProgress";
import { invalidatePetLists } from "../../api/invalidatePetLists";
import { useCreatePet } from "../../hooks/useCreatePet";
import { useUploadPetPhoto } from "../../hooks/useUploadPetPhoto";
import { petDraftKey, petDraftSchema, toPetDraft } from "../../lib/petDraft";
import { petWizardCopy as copy } from "../../lib/petWizardCopy";
import { petsCopy } from "../../lib/petsCopy";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { petProfileSchema } from "../../schemas/petProfileSchema";
import { PET_WIZARD_STEPS } from "../../stores/petWizardStore";
import { usePetWizard, usePetWizardStore } from "../../stores/PetWizardProvider";
import { PetWelcome } from "./PetWelcome";
import { WizardStepHost } from "./steps/PetStepHost";
import { BodyStep } from "./steps/BodyStep";
import { HealthStep } from "./steps/HealthStep";
import { IdentityStep } from "./steps/IdentityStep";
import { ReviewStep } from "./steps/ReviewStep";
import { RoutineStep } from "./steps/RoutineStep";
import { SocialStep } from "./steps/SocialStep";
import { SpeciesStep } from "./steps/SpeciesStep";

const STEPS = PET_WIZARD_STEPS.map((id, index) => ({ id, label: copy.stepLabels[index] }));

/** Em que passo cada campo da ficha é respondido, para levar um erro da API ao lugar certo (REQ-PNEW-017). */
const FIELD_STEP: Readonly<Record<string, number>> = {
  species: 1,
  speciesDescription: 1,
  name: 2,
  sex: 2,
  breed: 3,
  size: 3,
  birthDate: 3,
  weightKg: 3,
  isVaccinated: 4,
  isNeutered: 4,
  medicationNotes: 4,
  allergies: 4,
  vetContact: 4,
  microchip: 4,
  feedingNotes: 5,
  notes: 5,
  goodWithDogs: 6,
  goodWithCats: 6,
  goodWithKids: 6,
};

type SaveState =
  | { phase: "editing" }
  | { phase: "creating" }
  | { phase: "uploading"; index: number; current: number; total: number }
  | { phase: "photoFailed" }
  | { phase: "done"; name: string };

/**
 * O cadastro do pet (spec 021): passos 1 a 7, rascunho por conta na sessão do navegador (sem fotos nem
 * microchip, REQ-PNEW-021), e o salvar em duas etapas: cria o pet uma vez e manda as fotos uma a uma, na
 * ordem das vagas (REQ-PNEW-016). Foto que falha não recria o pet (REQ-PNEW-018). No fim, a lista de pets é
 * invalidada, o rascunho some e vem "Prazer, {nome}!".
 *
 * @example <PetWizardProvider initialSpecies="dog"><PetWizard accountId={user.id} /></PetWizardProvider>
 */
export function PetWizard({ accountId, role = "owner" }: { accountId: string; role?: PersonalRole }) {
  const store = usePetWizardStore();
  const step = usePetWizard((state) => state.step);
  const removed = usePetWizard((state) => state.removedBySpecies);
  const name = usePetWizard((state) => state.values.name);
  const queryClient = useQueryClient();
  const createPet = useCreatePet(accountId);
  const uploadPhoto = useUploadPetPhoto();
  const notice = useErrorNotice();
  const draft = useSessionDraft(petDraftKey(accountId), petDraftSchema);
  const saveDraft = draft.save;
  const [restoredName, setRestoredName] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>({ phase: "editing" });
  const restoreChecked = useRef(false);
  // Vagas já enviadas: "Tentar de novo" só reenvia as que falharam.
  const uploaded = useRef<boolean[]>([false, false, false]);

  // Rascunho: restaura uma vez ao abrir (REQ-PNEW-021).
  useEffect(() => {
    if (restoreChecked.current || !draft.draft) return;
    restoreChecked.current = true;
    store.getState().restore(draft.draft);
    setRestoredName(draft.draft.values.name ?? copy.fallbackName);
  }, [draft.draft, store]);

  // ... e grava a cada mudança aceita (o hook espera 500 ms antes de escrever).
  useEffect(
    () =>
      store.subscribe((state, previous) => {
        if (state.values !== previous.values || state.step !== previous.step) {
          restoreChecked.current = true;
          saveDraft(toPetDraft(state.step, state.values));
        }
      }),
    [store, saveDraft],
  );

  async function sendPhotos(petId: string) {
    const photos = store.getState().photos;
    const pending = photos.flatMap((file, index) => (file && !uploaded.current[index] ? [{ file, index }] : []));
    let failed = false;
    for (const [position, { file, index }] of pending.entries()) {
      setSave({ phase: "uploading", index, current: position + 1, total: pending.length });
      try {
        await uploadPhoto.mutateAsync({ petId, file });
        uploaded.current[index] = true;
      } catch (error) {
        failed = true;
        store.getState().setPhotoError(index, getErrorMessage(error));
      }
    }
    if (failed) return setSave({ phase: "photoFailed" });
    finish();
  }

  function finish() {
    void invalidatePetLists(queryClient, accountId);
    draft.clear();
    setSave({ phase: "done", name: store.getState().values.name ?? copy.fallbackName });
  }

  async function handleSave() {
    if (save.phase !== "editing") return;
    notice.clear();
    const { petId, values } = store.getState();
    if (petId) return sendPhotos(petId);

    const parsed = petProfileSchema.safeParse(values);
    if (!parsed.success) {
      const errors = Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]));
      const first = Math.min(...Object.keys(errors).map((field) => FIELD_STEP[field] ?? 1));
      return store.getState().showServerErrors(first, errors);
    }

    setSave({ phase: "creating" });
    try {
      const pet = await createPet.mutateAsync(parsed.data);
      store.getState().markCreated(pet.id);
      await sendPhotos(pet.id);
    } catch (error) {
      setSave({ phase: "editing" });
      if (isApiError(error) && Object.keys(error.fieldErrors).length > 0) {
        const errors = Object.fromEntries(
          Object.entries(error.fieldErrors).map(([field, messages]) => [field, messages.join(" ")]),
        );
        const first = Math.min(...Object.keys(errors).map((field) => FIELD_STEP[field] ?? 7));
        return store.getState().showServerErrors(first, errors);
      }
      if (isApiError(error) && error.code === "PET_MICROCHIP_ALREADY_REGISTERED") {
        return store.getState().showServerErrors(4, { microchip: getErrorMessage(error) });
      }
      notice.report(error);
    }
  }

  function startOver() {
    store.getState().reset();
    // O reset notifica o assinante; limpar por último cancela a gravação vazia que ele agenda.
    draft.clear();
    uploaded.current = [false, false, false];
    setRestoredName(null);
    setSave({ phase: "editing" });
  }

  if (save.phase === "done") return <PetWelcome name={save.name} role={role} onAnother={startOver} />;

  const progress =
    save.phase === "creating"
      ? copy.review.saving
      : save.phase === "uploading"
        ? copy.review.uploading(save.current, save.total)
        : null;

  return (
    <Stack spacing={3}>
      <WizardProgress steps={STEPS} currentIndex={step - 1} label={copy.progressLabel} />
      {restoredName && step < 7 && (
        <Notice
          tone="info"
          action={
            <Button size="small" onClick={startOver}>
              {copy.draft.restart}
            </Button>
          }
        >
          {copy.draft.restored(name || restoredName)}
        </Notice>
      )}
      {removed.length > 0 && <Hint>{removed.map((field) => copy.species.removed[field]).join(" ")}</Hint>}
      <ErrorNotice message={notice.message} tone={notice.tone} />
      <WizardStepHost>
        {step === 1 && <SpeciesStep title={petsCopy[role].opening} />}
        {step === 2 && <IdentityStep />}
        {step === 3 && <BodyStep />}
        {step === 4 && <HealthStep />}
        {step === 5 && <RoutineStep />}
        {step === 6 && <SocialStep />}
        {step === 7 && (
          <ReviewStep
            onSave={() => void handleSave()}
            progress={progress}
            photoFailed={save.phase === "photoFailed"}
            uploadingIndex={save.phase === "uploading" ? save.index : null}
            onRetryPhotos={() => {
              const petId = store.getState().petId;
              if (petId) void sendPhotos(petId);
            }}
            onSkipPhotos={finish}
          />
        )}
      </WizardStepHost>
    </Stack>
  );
}
