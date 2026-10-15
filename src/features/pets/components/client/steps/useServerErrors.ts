"use client";

import { useEffect } from "react";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { usePetStep } from "./PetStepHost";

/**
 * Aplica no formulário do passo os erros de campo que a API devolveu ao salvar (REQ-PNEW-017, REQ-PEDIT-015) e
 * foca o primeiro. Cada erro é tomado de quem hospeda o passo uma vez só.
 *
 * @example useServerErrors(setError, ["microchip", "vetContact"]);
 */
export function useServerErrors<T extends FieldValues>(setError: UseFormSetError<T>, fields: readonly Path<T>[]) {
  const { takeServerErrors } = usePetStep();
  useEffect(() => {
    const taken = Object.entries(takeServerErrors(fields));
    taken.forEach(([field, message], index) =>
      setError(field as Path<T>, { type: "server", message }, { shouldFocus: index === 0 }),
    );
    // Só ao montar o passo: os campos do passo não mudam.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
