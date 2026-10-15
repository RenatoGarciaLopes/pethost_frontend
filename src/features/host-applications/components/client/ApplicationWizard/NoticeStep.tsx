"use client";

import { Box, Button, Checkbox, FormControlLabel, FormHelperText, Stack, Typography } from "@mui/material";
import { useId, useRef, useState, type FormEvent } from "react";
import { SegmentedControl } from "@/shared/ui/forms/SegmentedControl";
import { StepHeading } from "@/shared/ui/navigation/StepHeading";
import { PERSON_TYPES } from "../../../api/contracts";
import { verificationCopy } from "../../../lib/verificationCopy";
import { applicationNoticeSchema, type ApplicationNoticeValues } from "../../../schemas/applicationSchemas";
import type { PersonType } from "../../../types";

const copy = verificationCopy.notice;
const PERSON_OPTIONS = PERSON_TYPES.map((value) => ({ value, label: copy.personTypes[value] }));

export interface NoticeStepProps {
  /** Versão do aviso que a API exige (`noticeVersion`); sem texto no front, mostra o mais recente. */
  noticeVersion: string;
  personType: PersonType;
  accepted: boolean;
  /** Verificação já aberta: o tipo de pessoa não muda mais (a API fixa na abertura). */
  locked: boolean;
  onNext: (values: ApplicationNoticeValues) => void;
}

/**
 * "Antes de começar" (REQ-HVER-003): o aviso de como as fotos são usadas, em linhas curtas, antes de pedir qualquer
 * coisa; Pessoa física ou Empresa; e o "Li e concordo". Sem o aceite não segue: o erro diz o que falta e o foco vai
 * para a caixa.
 *
 * @example <NoticeStep noticeVersion={mine.noticeVersion} personType="pf" accepted={false} locked={false} onNext={next} />
 */
export function NoticeStep({ noticeVersion, personType, accepted, locked, onNext }: NoticeStepProps) {
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
      <StepHeading>{copy.heading}</StepHeading>
      <Box
        component="ul"
        sx={{ m: 0, pl: 3, display: "grid", gap: 1, fontSize: "1.06rem", "& li::marker": { color: "text.secondary" } }}
      >
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </Box>
      <Stack spacing={1}>
        <SegmentedControl
          label={copy.personType}
          options={PERSON_OPTIONS}
          value={type}
          onChange={(value) => setType(value as PersonType)}
          disabled={locked}
        />
        {locked && (
          <Typography variant="body2" color="text.secondary">
            {copy.personTypeLocked}
          </Typography>
        )}
      </Stack>
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
      <Box>
        <Button type="submit" variant="contained">
          {copy.next}
        </Button>
      </Box>
    </Stack>
  );
}
