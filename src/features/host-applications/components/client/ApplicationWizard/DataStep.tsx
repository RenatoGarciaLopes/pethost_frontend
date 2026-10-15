"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, FormHelperText, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Controller, FormProvider, useForm, type FieldPath } from "react-hook-form";
import type { z } from "zod";
import { ApiError, isApiError } from "@/shared/api/errors/ApiError";
import { applyFieldErrors } from "@/shared/api/errors/applyFieldErrors";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { ErrorNotice } from "@/shared/ui/feedback/ErrorNotice";
import { AddressFields } from "@/shared/ui/forms/AddressFields";
import { ChoiceCardGroup } from "@/shared/ui/forms/ChoiceCardGroup";
import { CpfField } from "@/shared/ui/forms/CpfField";
import { FormActions } from "@/shared/ui/forms/FormActions";
import { MaskedTextField } from "@/shared/ui/forms/MaskedTextField";
import { StepHeading } from "@/shared/ui/navigation/StepHeading";
import { DOCUMENT_TYPES } from "../../../api/contracts";
import { useSaveApplicationData } from "../../../hooks/useApplicationMutations";
import { verificationCopy } from "../../../lib/verificationCopy";
import { applicationDataSchema, type ApplicationDataValues } from "../../../schemas/applicationSchemas";
import type { ApplicationDraftData, PersonType } from "../../../types";

const copy = verificationCopy.data;
const DOCUMENT_OPTIONS = DOCUMENT_TYPES.map((value) => ({ value, ...copy.documentTypes[value] }));
const EMPTY_ADDRESS = { zipCode: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" };

type DataFormInput = z.input<typeof applicationDataSchema>;
type FormField = FieldPath<DataFormInput>;

/** Campos da API → campos do formulário (a empresa fica agrupada em `company`). */
const COMPANY_FIELDS: Readonly<Record<string, FormField>> = {
  cnpj: "company.cnpj",
  legalName: "company.legalName",
  tradeName: "company.tradeName",
};
const toFormField = (field: string): string =>
  field.startsWith("companyAddress.")
    ? `company.address.${field.slice("companyAddress.".length)}`
    : (COMPANY_FIELDS[field] ?? field);

/** Conflitos que pertencem a um campo (409 de CPF ou CNPJ de outra conta). */
const CONFLICT_FIELD: Readonly<Record<string, FormField>> = {
  HOST_CPF_ALREADY_REGISTERED: "cpf",
  HOST_CNPJ_ALREADY_REGISTERED: "company.cnpj",
};

function defaultsOf(personType: PersonType, draft: ApplicationDraftData | null): DataFormInput {
  const person = { cpf: draft?.cpf ?? "", documentType: draft?.documentType ?? "" } as const;
  if (personType === "pf") return { personType, ...person } as DataFormInput;
  const company = draft?.company ?? { cnpj: "", legalName: "", tradeName: "", address: EMPTY_ADDRESS };
  return { personType, ...person, company } as DataFormInput;
}

export interface DataStepProps {
  accountId: string;
  personType: PersonType;
  /** Dados do rascunho, para corrigir; `null` na primeira vez. */
  draft: ApplicationDraftData | null;
  onBack: () => void;
  onNext: () => void;
}

/**
 * "Seus dados" (REQ-HVER-004/005): CPF com máscara e dígitos conferidos e o documento em três cartões; na empresa,
 * também CNPJ (aceita o alfanumérico), razão social, nome fantasia e endereço com preenchimento por CEP. Confirmar
 * abre a solicitação na primeira vez e depois manda só o que mudou. Erro de campo da API vai para o campo, com foco.
 *
 * @example <DataStep accountId={user.id} personType="pf" draft={application?.draft ?? null} onBack={back} onNext={next} />
 */
export function DataStep({ accountId, personType, draft, onBack, onNext }: DataStepProps) {
  const save = useSaveApplicationData(accountId);
  const [notice, setNotice] = useState<string | null>(null);
  const form = useForm<DataFormInput, unknown, ApplicationDataValues>({
    resolver: zodResolver(applicationDataSchema),
    defaultValues: defaultsOf(personType, draft),
  });

  function reportError(error: unknown) {
    const conflict = isApiError(error) ? CONFLICT_FIELD[error.code] : undefined;
    if (conflict)
      return form.setError(conflict, { type: "server", message: getErrorMessage(error) }, { shouldFocus: true });
    if (isApiError(error) && Object.keys(error.fieldErrors).length > 0) {
      const fieldErrors = Object.fromEntries(
        Object.entries(error.fieldErrors).map(([field, messages]) => [toFormField(field), messages]),
      );
      applyFieldErrors(form.setError, new ApiError({ ...error.toJSON(), fieldErrors }));
      return;
    }
    setNotice(getErrorMessage(error));
  }

  const submit = form.handleSubmit(async (values) => {
    setNotice(null);
    try {
      await save.mutateAsync(values);
    } catch (error) {
      return reportError(error);
    }
    onNext();
  });

  return (
    <FormProvider {...form}>
      <Stack component="form" noValidate spacing={3} onSubmit={submit}>
        <StepHeading>{copy.heading}</StepHeading>
        <ErrorNotice message={notice} tone="erro" />
        <Controller
          control={form.control}
          name="cpf"
          render={({ field, fieldState }) => (
            <CpfField
              label={copy.cpf}
              name={field.name}
              inputRef={field.ref}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message ?? copy.cpfHelp[personType]}
              fullWidth
            />
          )}
        />
        <Controller
          control={form.control}
          name="documentType"
          render={({ field, fieldState }) => (
            // O foco do erro vai para o grupo (RHF chama `focus()` no elemento do `ref`).
            <Box ref={field.ref} tabIndex={-1} sx={{ "&:focus": { outline: "none" } }}>
              <ChoiceCardGroup
                label={copy.documentType}
                options={DOCUMENT_OPTIONS}
                value={field.value}
                onChange={field.onChange}
              />
              {fieldState.error && (
                <FormHelperText error sx={{ mx: 0 }}>
                  {fieldState.error.message}
                </FormHelperText>
              )}
            </Box>
          )}
        />
        {personType === "pj" && <CompanyFields />}
        <FormActions
          backLabel={copy.back}
          nextLabel={save.isPending ? copy.saving : copy.next}
          onBack={onBack}
          nextType="submit"
          busy={save.isPending}
        />
      </Stack>
    </FormProvider>
  );
}

/** Dados da empresa: CNPJ, razão social, nome fantasia e endereço (só pessoa jurídica). */
function CompanyFields() {
  const text = (name: "company.legalName" | "company.tradeName", label: string, help?: string) => (
    <Controller
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          name={field.name}
          inputRef={field.ref}
          value={field.value ?? ""}
          onChange={field.onChange}
          onBlur={field.onBlur}
          label={label}
          autoComplete="organization"
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? help}
          fullWidth
        />
      )}
    />
  );

  return (
    <Stack component="fieldset" spacing={2} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
      <Typography component="legend" variant="h2" sx={{ fontSize: 22, mb: 1 }}>
        {copy.company.heading}
      </Typography>
      <Controller
        name="company.cnpj"
        render={({ field, fieldState }) => (
          <MaskedTextField
            label={copy.company.cnpj}
            mask="cnpj"
            name={field.name}
            inputRef={field.ref}
            value={field.value ?? ""}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            autoComplete="off"
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message ?? copy.company.cnpjHelp}
            fullWidth
          />
        )}
      />
      {text("company.legalName", copy.company.legalName)}
      {text("company.tradeName", copy.company.tradeName, copy.company.tradeNameHelp)}
      <Typography sx={{ fontWeight: 700 }}>{copy.company.address}</Typography>
      <AddressFields name="company.address" />
    </Stack>
  );
}
