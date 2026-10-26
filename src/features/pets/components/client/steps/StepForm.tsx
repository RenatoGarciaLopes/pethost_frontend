"use client";

import { Box, Button, Stack } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEventHandler, type ReactNode } from "react";
import { StepWizard, StepWizardActions } from "@/shared/ui/navigation/StepWizard";
import { petEditCopy } from "../../../lib/petEditCopy";
import { petWizardCopy as copy } from "../../../lib/petWizardCopy";
import { usePetWizard } from "../../../stores/PetWizardProvider";
import { PET_WIZARD_STEPS } from "../../../stores/petWizardStore";
import { LivePetCard } from "../LivePetCard";
import { usePetStep, type PetSectionChrome } from "./PetStepHost";

/** "Voltar" no primeiro passo sai do cadastro para a lista (spec 020). */
const EXIT_PATH = "/pets";

export interface StepFormProps {
  title: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
  /** Rótulo do botão de avançar (a revisão usa "Salvar a ficha de …"). */
  nextLabel?: string;
  busy?: boolean;
  /** O formulário do passo tem alteração ainda não aceita (só a seção da edição usa). */
  dirty?: boolean;
}

/**
 * Moldura de cada passo. No assistente (REQ-PNEW-001, 014): `h1` que recebe o foco quando o passo muda, um
 * `form` só do passo e "Voltar"/"Continuar"; voltar nunca valida e no passo 1 sai para "Meus pets". Na
 * edição (REQ-PEDIT-004): formulário da seção atual, sem repetir o h1 da casca, e "Salvar {seção}".
 *
 * @example <StepForm title="Saúde" onSubmit={form.handleSubmit(accept)} dirty={formState.isDirty}>…campos…</StepForm>
 */
export function StepForm(props: StepFormProps) {
  const { section } = usePetStep();
  return section ? <SectionForm {...props} section={section} /> : <WizardStepForm {...props} />;
}

function WizardStepForm({ title, onSubmit, children, nextLabel = copy.next, busy = false }: StepFormProps) {
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
    <StepWizard
      steps={PET_WIZARD_STEPS.map((id, index) => ({ id, label: copy.stepLabels[index] }))}
      currentIndex={step - 1}
      progressTitle={copy.progressTitle}
      progressLabel={copy.progressLabel}
      position={copy.position(step, PET_WIZARD_STEPS.length)}
      title={title}
      titleRef={heading}
      aside={<LivePetCard />}
    >
      <Box component="form" noValidate onSubmit={onSubmit}>
        <Stack spacing={3}>
          {children}
          <StepWizardActions
            backLabel={copy.back}
            nextLabel={nextLabel}
            nextType="submit"
            busy={busy}
            onBack={() => (step === 1 ? router.push(EXIT_PATH) : back())}
          />
        </Stack>
      </Box>
    </StepWizard>
  );
}

function SectionForm({ onSubmit, children, dirty = false, section }: StepFormProps & { section: PetSectionChrome }) {
  const { onDirtyChange, focusSaveOnMount, anchorId, title, formRef, busy, status, actions } = section;
  const save = useRef<HTMLButtonElement>(null);
  // Só na montagem: erro de campo da API foca o campo depois (os efeitos do passo rodam depois deste).
  const [focusOnMount] = useState(focusSaveOnMount);

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useEffect(() => {
    if (focusOnMount) save.current?.focus();
  }, [focusOnMount]);

  return (
    <Stack component="section" id={anchorId} aria-label={title} spacing={2}>
      <Box component="form" ref={formRef} noValidate onSubmit={onSubmit}>
        <Stack spacing={3}>
          {children}
          {status}
          <Box sx={{ pb: { xs: 20, md: 0 } }}>
            <Stack
              direction="row"
              sx={{
                position: { xs: "fixed", md: "static" },
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1100,
                bgcolor: "background.paper",
                p: { xs: 2, md: 0 },
                gap: 1,
                flexWrap: "wrap",
                pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 0 },
                "& .MuiButton-root": { minHeight: 56 },
              }}
            >
              <Button
                ref={save}
                type="submit"
                variant="contained"
                disabled={busy}
                aria-busy={busy || undefined}
                aria-label={petEditCopy.saveSection(title)}
              >
                {petEditCopy.save}
              </Button>
              {actions}
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}
