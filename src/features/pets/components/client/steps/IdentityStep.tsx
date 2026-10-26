"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormHelperText, Stack, TextField, Typography } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { fileFingerprint } from "@/shared/lib/files/fileFingerprint";
import { SegmentedControl } from "@/shared/ui/forms/SegmentedControl";
import { PhotoSlots } from "@/shared/ui/media/PhotoSlots";
import { petWizardCopy } from "../../../lib/petWizardCopy";
import { petStepSchemas } from "../../../schemas/petProfileSchema";
import { usePetWizard, usePetWizardStore } from "../../../stores/PetWizardProvider";
import { usePetStep } from "./PetStepHost";
import { StepForm } from "./StepForm";
import { usePetPreview } from "./usePetPreview";
import { useServerErrors } from "./useServerErrors";

const copy = petWizardCopy.identity;
type Values = z.input<typeof petStepSchemas.identity>;
type Accepted = z.output<typeof petStepSchemas.identity>;
const SEX_OPTIONS = (["male", "female", "unknown"] as const).map((value) => ({ value, label: copy.sexes[value] }));

/**
 * Passo 2, nome, fotos e sexo (REQ-PNEW-007, 008). No assistente, as fotos vão direto para o store (só memória,
 * nunca no rascunho). Na edição (022) a seção só tem nome e sexo: as fotos têm seção própria, ligada à API.
 *
 * @example <IdentityStep />
 */
export function IdentityStep() {
  const { values, accept, mode } = usePetStep();
  const { control, handleSubmit, setError, formState } = useForm<Values, unknown, Accepted>({
    resolver: zodResolver(petStepSchemas.identity),
    defaultValues: { name: values.name ?? "", sex: values.sex },
  });
  usePetPreview(control);
  useServerErrors(setError, ["name", "sex"]);

  return (
    <StepForm dirty={formState.isDirty} title={copy.title} onSubmit={handleSubmit((accepted) => accept(accepted))}>
      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            ref={undefined}
            inputRef={field.ref}
            label={copy.name}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
            required
            fullWidth
            autoComplete="off"
            slotProps={{ htmlInput: { maxLength: 60 } }}
          />
        )}
      />
      {mode === "wizard" && <WizardPhotos name={values.name || petWizardCopy.fallbackName} />}
      <Controller
        control={control}
        name="sex"
        render={({ field, fieldState }) => (
          <Stack
            spacing={0.5}
            ref={(node: HTMLDivElement | null) => field.ref(node?.querySelector("button[role=radio]") ?? null)}
          >
            <SegmentedControl
              label={copy.sex}
              options={SEX_OPTIONS}
              value={field.value ?? ""}
              onChange={field.onChange}
            />
            {fieldState.error && (
              <FormHelperText role="alert" error>
                {fieldState.error.message}
              </FormHelperText>
            )}
          </Stack>
        )}
      />
    </StepForm>
  );
}

/** As fotos do assistente: a mesma foto em duas vagas é recusada pela impressão do arquivo. */
function WizardPhotos({ name }: { name: string }) {
  const store = usePetWizardStore();
  const photos = usePetWizard((state) => state.photos);
  const photoErrors = usePetWizard((state) => state.photoErrors);

  async function pickPhoto(index: number, file: File) {
    const fingerprint = await fileFingerprint(file);
    const others = store.getState().photos.filter((photo, slot): photo is File => slot !== index && photo !== null);
    const repeated = (await Promise.all(others.map(fileFingerprint))).includes(fingerprint);
    if (repeated) return store.getState().setPhotoError(index, copy.duplicatePhoto);
    store.getState().setPhoto(index, file);
  }

  return (
    <Stack spacing={1}>
      <Typography sx={{ fontWeight: 700 }}>{copy.photos(name)}</Typography>
      <Typography variant="body2" color="text.secondary">
        {copy.photosHelp}
      </Typography>
      <PhotoSlots
        label={copy.photos(name)}
        files={photos}
        errors={photoErrors}
        onPick={(index, file) => void pickPhoto(index, file)}
        onRemove={(index) => store.getState().setPhoto(index, null)}
      />
    </Stack>
  );
}
