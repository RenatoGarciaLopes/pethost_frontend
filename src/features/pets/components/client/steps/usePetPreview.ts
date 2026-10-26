import { useEffect, useRef } from "react";
import { useWatch, type Control, type FieldValues } from "react-hook-form";
import type { PetWizardValues } from "../../../stores/petWizardStore";
import { usePetStep } from "./PetStepHost";

/** Publica os campos do passo para a carteirinha ao vivo da edição; cadastro continua usando seu store. */
export function usePetPreview<T extends FieldValues>(control: Control<T, unknown, T>) {
  const fields = useWatch({ control });
  const { section } = usePetStep();
  const onPreview = section?.onPreview;
  const last = useRef<string | null>(null);
  useEffect(() => {
    const signature = JSON.stringify(fields);
    if (signature === last.current) return;
    last.current = signature;
    onPreview?.(fields as PetWizardValues);
  }, [fields, onPreview]);
}
