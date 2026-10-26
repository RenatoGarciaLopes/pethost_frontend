"use client";

import { Box, Checkbox, FormControlLabel, FormHelperText, Stack } from "@mui/material";
import { useId, useRef, useState, type FormEvent } from "react";
import { OkIcon } from "@/shared/ui/feedback/feedbackIcons";
import { ChoiceCardGroup } from "@/shared/ui/forms/ChoiceCardGroup";
import { StepWizardActions } from "@/shared/ui/navigation/StepWizard";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { PERSON_TYPES } from "../../../api/contracts";
import { verificationCopy } from "../../../lib/verificationCopy";
import { applicationNoticeSchema, type ApplicationNoticeValues } from "../../../schemas/applicationSchemas";
import type { PersonType } from "../../../types";

const copy = verificationCopy.notice;
const PERSON_OPTIONS = PERSON_TYPES.map((value) => ({ value, ...copy.personTypes[value] }));

export interface NoticeStepProps {
  /** Versão do aviso que a API exige (`noticeVersion`); sem texto no front, mostra o mais recente. */
  noticeVersion: string;
  personType: PersonType;
  accepted: boolean;
  /** Verificação já aberta: o tipo de pessoa não muda mais (a API fixa na abertura). */
  locked: boolean;
  onBack: () => void;
  onNext: (values: ApplicationNoticeValues) => void;
}

/**
 * Conteúdo de "Antes de começar" (REQ-HVER-003; o título é da casca): o aviso de como as fotos são usadas, em cartões curtos, antes de pedir qualquer
 * coisa; Pessoa física ou Empresa em cartões; e o "Li e concordo". Sem o aceite não segue: o erro diz o que falta e o foco vai
 * para a caixa.
 *
 * @example <NoticeStep noticeVersion={mine.noticeVersion} personType="pf" accepted={false} locked={false} onBack={back} onNext={next} />
 */
export function NoticeStep({ noticeVersion, personType, accepted, locked, onBack, onNext }: NoticeStepProps) {
  const id = useId();
  const checkboxRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<PersonType>(personType);
  const [agreed, setAgreed] = useState(accepted);
  const [error, setError] = useState<string | null>(null);
  const lines = copy.versions[noticeVersion] ?? copy.versions[copy.latestNoticeVersion] ?? [];
  const errorId = `${id}-erro`;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = applicationNoticeSchema.safeParse({ acceptNotice: agreed, personType: type });
    if (result.success) return onNext(result.data);
    setError(copy.acceptMissing);
    checkboxRef.current?.focus();
  }

  return (
    <Stack component="form" noValidate spacing={3} onSubmit={handleSubmit}>
      <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none", display: "grid", gap: 1.5 }}>
        {lines.map((line) => (
          <Box
            component="li"
            key={line}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 2,
              border: "2px solid",
              borderColor: "text.primary",
              borderRadius: `${quintalRadii.field}px`,
              bgcolor: "background.paper",
              fontWeight: 600,
              "& svg": { width: 22, height: 22, flexShrink: 0, color: "success.dark" },
            }}
          >
            <OkIcon />
            {line}
          </Box>
        ))}
      </Box>
      <ChoiceCardGroup
        label={copy.personType}
        options={PERSON_OPTIONS}
        value={type}
        onChange={(value) => setType(value as PersonType)}
        disabled={locked}
      />
      {locked && <FormHelperText sx={{ m: 0 }}>{copy.personTypeLocked}</FormHelperText>}
      <Box>
        <FormControlLabel
          control={
            <Checkbox
              checked={agreed}
              onChange={(event) => {
                setAgreed(event.target.checked);
                if (event.target.checked) setError(null);
              }}
              slotProps={{
                input: {
                  ref: checkboxRef,
                  "aria-invalid": error ? true : undefined,
                  "aria-describedby": error ? errorId : undefined,
                },
              }}
            />
          }
          label={copy.accept}
        />
        {error && (
          <FormHelperText id={errorId} error sx={{ m: 0 }}>
            {error}
          </FormHelperText>
        )}
      </Box>
      <StepWizardActions backLabel={copy.back} nextLabel={copy.next} nextType="submit" onBack={onBack} />
    </Stack>
  );
}
