"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Hint } from "@/shared/ui/feedback/Hint";
import { petWizardCopy } from "../../../lib/petWizardCopy";
import { petStepSchemas } from "../../../schemas/petProfileSchema";
import { usePetWizard } from "../../../stores/PetWizardProvider";
import { StepForm } from "./StepForm";
import { useServerErrors } from "./useServerErrors";
import { YesNoField } from "./YesNoField";

const copy = petWizardCopy.social;
type Values = z.input<typeof petStepSchemas.social>;
type Accepted = z.output<typeof petStepSchemas.social>;

/**
 * Passo 6, "Com quem {nome} se dá bem?" (REQ-PNEW-012): cachorros, gatos e crianças, Sim/Não obrigatórios,
 * com a dica para a dúvida enquanto a API não aceitar "Ainda não sei".
 *
 * @example <SocialStep />
 */
export function SocialStep() {
  const values = usePetWizard((state) => state.values);
  const acceptStep = usePetWizard((state) => state.acceptStep);
  const { control, handleSubmit, setError } = useForm<Values, unknown, Accepted>({
    resolver: zodResolver(petStepSchemas.social),
    defaultValues: {
      goodWithDogs: values.goodWithDogs,
      goodWithCats: values.goodWithCats,
      goodWithKids: values.goodWithKids,
    },
  });
  useServerErrors(setError, ["goodWithDogs", "goodWithCats", "goodWithKids"]);

  return (
    <StepForm
      title={copy.title(values.name || petWizardCopy.fallbackName)}
      onSubmit={handleSubmit((accepted) => acceptStep(accepted))}
    >
      <Hint>{copy.hint}</Hint>
      <YesNoField control={control} name="goodWithDogs" label={copy.dogs} />
      <YesNoField control={control} name="goodWithCats" label={copy.cats} />
      <YesNoField control={control} name="goodWithKids" label={copy.kids} />
    </StepForm>
  );
}
