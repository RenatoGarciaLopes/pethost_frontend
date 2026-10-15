"use client";

import { Box, Button, ButtonBase, Collapse, Stack, Typography, useMediaQuery, type Theme } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEventHandler, type ReactNode } from "react";
import { FormActions } from "@/shared/ui/forms/FormActions";
import { StepHeading } from "@/shared/ui/navigation/StepHeading";
import { petEditCopy } from "../../../lib/petEditCopy";
import { petWizardCopy as copy } from "../../../lib/petWizardCopy";
import { usePetWizard } from "../../../stores/PetWizardProvider";
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
 * edição (REQ-PEDIT-004): `section` com `h2` e "Salvar {seção}".
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

function SectionForm({ onSubmit, children, dirty = false, section }: StepFormProps & { section: PetSectionChrome }) {
  const headingId = useId();
  const contentId = useId();
  const { onDirtyChange } = section;
  // No celular as seções empilham e recolhem; começam abertas e o formulário fica montado ao recolher.
  const mobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(true);
  const save = useRef<HTMLButtonElement>(null);
  // Só na montagem: erro de campo da API foca o campo depois (os efeitos do passo rodam depois deste).
  const focusOnMount = useRef(section.focusSaveOnMount);

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useEffect(() => {
    if (focusOnMount.current) save.current?.focus();
  }, []);

  return (
    <Stack component="section" id={section.anchorId} aria-labelledby={headingId} spacing={2}>
      <Typography id={headingId} component="h2" variant="h3" sx={{ fontSize: 22 }}>
        {mobile ? (
          <ButtonBase
            aria-expanded={open}
            aria-controls={contentId}
            onClick={() => setOpen((current) => !current)}
            sx={{ width: "100%", minHeight: 48, justifyContent: "space-between", font: "inherit", textAlign: "left" }}
          >
            {section.title}
            <Chevron open={open} />
          </ButtonBase>
        ) : (
          section.title
        )}
      </Typography>
      <Collapse in={!mobile || open} id={contentId}>
        <Box component="form" noValidate onSubmit={onSubmit}>
          <Stack spacing={3}>
            {children}
            <Box>
              <Button
                ref={save}
                type="submit"
                variant="contained"
                disabled={section.busy}
                aria-busy={section.busy || undefined}
                aria-label={petEditCopy.saveSection(section.title)}
              >
                {petEditCopy.save}
              </Button>
            </Box>
            {section.status}
          </Stack>
        </Box>
      </Collapse>
    </Stack>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      aria-hidden
      sx={{
        width: 24,
        height: 24,
        flexShrink: 0,
        transition: "transform 160ms",
        transform: open ? "rotate(180deg)" : "none",
      }}
    >
      <path
        d="M6 9l6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  );
}
