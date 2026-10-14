"use client";

import { Box, Stack } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type FormEventHandler, type ReactNode } from "react";
import { FormActions } from "@/shared/ui/forms/FormActions";
import { StepHeading } from "@/shared/ui/navigation/StepHeading";
import { petWizardCopy as copy } from "../../../lib/petWizardCopy";
import { usePetWizard } from "../../../stores/PetWizardProvider";

/** "Voltar" no primeiro passo sai do cadastro para a lista (spec 020). */
const EXIT_PATH = "/pets";

export interface StepFormProps {
  title: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
  /** Rótulo do botão de avançar (a revisão usa "Salvar a ficha de …"). */
  nextLabel?: string;
  busy?: boolean;
}

/**
 * Moldura de cada passo (REQ-PNEW-001, 014): `h1` que recebe o foco quando o passo muda, um `form` só do
 * passo e "Voltar"/"Continuar". Voltar nunca valida; no passo 1 sai para "Meus pets".
 *
 * @example <StepForm title="Saúde" onSubmit={form.handleSubmit(accept)}>…campos…</StepForm>
 */
export function StepForm({ title, onSubmit, children, nextLabel = copy.next, busy = false }: StepFormProps) {
  const router = useRouter();
  const step = usePetWizard((state) => state.step);
  const back = usePetWizard((state) => state.back);
  const navigated = usePetWizard((state) => state.navigated);
  const heading = useRef<HTMLHeadingElement>(null);

  // Cada passo monta o seu StepForm: foco no título quando a pessoa chegou aqui trocando de passo.
  useEffect(() => {
    if (navigated) heading.current?.focus();
  }, [navigated]);

  return (
    <Stack spacing={3}>
      <StepHeading ref={heading}>{title}</StepHeading>
      <Box component="form" noValidate onSubmit={onSubmit}>
        <Stack spacing={3}>
          {children}
          <FormActions
            backLabel={copy.back}
            nextLabel={nextLabel}
            nextType="submit"
            busy={busy}
            onBack={() => (step === 1 ? router.push(EXIT_PATH) : back())}
          />
        </Stack>
      </Box>
    </Stack>
  );
}
