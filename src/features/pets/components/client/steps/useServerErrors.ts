"use client";

import { useEffect } from "react";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { usePetWizardStore } from "../../../stores/PetWizardProvider";

/**
 * Aplica no formulário do passo os erros de campo que a API devolveu ao salvar (REQ-PNEW-017) e foca o
 * primeiro. Cada erro é tomado do store uma vez só.
 *
 * @example useServerErrors(setError, ["microchip", "vetContact"]);
 */
export function useServerErrors<T extends FieldValues>(setError: UseFormSetError<T>, fields: readonly Path<T>[]) {
  const store = usePetWizardStore();
  useEffect(() => {
    const taken = Object.entries(store.getState().takeServerErrors(fields));
    taken.forEach(([field, message], index) =>
      setError(field as Path<T>, { type: "server", message }, { shouldFocus: index === 0 }),
    );
    // Só ao montar o passo: os campos do passo não mudam.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
