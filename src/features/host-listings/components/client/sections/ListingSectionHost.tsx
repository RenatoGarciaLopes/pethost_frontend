"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import { createContext, use, useEffect, useRef, useState, type ReactNode } from "react";
import { FormProvider, useForm, type FieldErrors, type FieldPath, type UseFormReturn } from "react-hook-form";
import type { ZodError, ZodTypeAny } from "zod";
import { Notice } from "@/shared/ui/feedback/Notice";
import { listingCopy as copy } from "../../../lib/listingCopy";
import type { ListingFormValues, ListingSchemas, ListingSectionId } from "../../../schemas/listingSchema";
import type { HostKind } from "../../../types";

/** Como terminou o "Salvar" de uma seção. */
export type SectionSaveOutcome = "saved" | "unchanged" | "failed";

/** O que o rascunho (044) e a edição oferecem às seções. */
export interface ListingSectionHostValue {
  kind: HostKind;
  firstName: string;
  values: ListingFormValues;
  schemas: ListingSchemas;
  /** Rascunho: a seção fica "pronta" sem falar com a API; edição: `PATCH` com o que mudou. */
  mode: "draft" | "edit";
  /** Guarda a seção (os valores vêm completos; só os campos da seção contam). */
  save: (section: ListingSectionId, submitted: ListingFormValues) => Promise<SectionSaveOutcome>;
  /** Seção salvando agora (as outras ficam liberadas). */
  saving: ListingSectionId | null;
  /** Erros da API por seção e campo, já em português; aviso da seção quando o campo não é dela. */
  serverErrors: Partial<Record<ListingSectionId, { fields: Record<string, string>; notice?: string }>>;
  /** Seção que deve receber o foco (erro devolvido pela API). */
  focusSection: ListingSectionId | null;
  /** Avisa se a seção tem alteração não salva (pergunta "Sair sem salvar?"). */
  reportDirty?: (section: ListingSectionId, dirty: boolean) => void;
}

const HostContext = createContext<ListingSectionHostValue | null>(null);

/**
 * Liga as seções do cantinho a quem as guarda: o rascunho do cadastro ou a edição do cantinho aberto (REQ-LIST-003 e
 * 013). As seções não sabem qual dos dois é.
 *
 * @example <ListingSectionHost value={host}><HomeSection /></ListingSectionHost>
 */
export function ListingSectionHost({ value, children }: { value: ListingSectionHostValue; children: ReactNode }) {
  return <HostContext value={value}>{children}</HostContext>;
}

/**
 * O anfitrião da seção, para as seções que precisam do tipo de anfitrião ou do nome.
 * @throws {Error} fora do `ListingSectionHost`
 * @example const { kind, firstName } = useListingSectionHost();
 */
export function useListingSectionHost(): ListingSectionHostValue {
  const host = use(HostContext);
  if (!host) throw new Error("A seção do cantinho precisa do ListingSectionHost");
  return host;
}

/** Problemas do Zod no formato aninhado do RHF (`address.zipCode` vira `{ address: { zipCode } }`); o primeiro de cada campo. */
function toFieldErrors(error: ZodError): FieldErrors<ListingFormValues> {
  const errors: Record<string, unknown> = {};
  for (const issue of error.issues) {
    let node = errors;
    issue.path.forEach((part, index) => {
      const key = String(part);
      if (index === issue.path.length - 1) node[key] ??= { type: issue.code, message: issue.message };
      else node = (node[key] ??= {}) as Record<string, unknown>;
    });
  }
  return errors as FieldErrors<ListingFormValues>;
}

/** Âncora de cada seção no painel. */
export const sectionAnchor = (section: ListingSectionId) => `secao-${section}`;

interface ListingSectionProps {
  id: ListingSectionId;
  /** Campos da seção; recebem o formulário (RHF) da seção. */
  children: (form: UseFormReturn<ListingFormValues>) => ReactNode;
}

/**
 * Uma seção do cantinho: `section` com `h2`, um formulário próprio validado pelo schema da seção, "Salvar {seção}" e o
 * retorno ("Pronto.", "Salvo." ou "Nada mudou por aqui."). Erro da API chega aos campos da seção, e a seção recebe o
 * foco (REQ-LIST-012).
 *
 * @example <ListingSection id="rules">{(form) => <RulesFields form={form} />}</ListingSection>
 */
export function ListingSection({ id, children }: ListingSectionProps) {
  const host = useListingSectionHost();
  const title = copy.sections[id];
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [outcome, setOutcome] = useState<SectionSaveOutcome | null>(null);
  const form = useForm<ListingFormValues>({
    // O schema da seção confere só os campos dela; a saída fica com os valores do formulário.
    resolver: (values) => {
      const result = (host.schemas.sections[id] as ZodTypeAny).safeParse(values);
      return result.success ? { values, errors: {} } : { values: {}, errors: toFieldErrors(result.error) };
    },
    values: host.values,
    resetOptions: { keepDirtyValues: false },
  });
  const { isDirty } = form.formState;
  const serverErrors = host.serverErrors[id];
  const { reportDirty } = host;

  useEffect(() => reportDirty?.(id, isDirty), [reportDirty, id, isDirty]);

  useEffect(() => {
    for (const [field, message] of Object.entries(serverErrors?.fields ?? {}))
      form.setError(field as FieldPath<ListingFormValues>, { type: "server", message });
  }, [serverErrors, form]);

  useEffect(() => {
    if (host.focusSection === id) headingRef.current?.focus();
  }, [host.focusSection, id]);

  const submit = form.handleSubmit(async (values) => {
    setOutcome(null);
    setOutcome(await host.save(id, values));
  });

  const feedback =
    outcome === "unchanged"
      ? copy.unchanged
      : outcome === "saved"
        ? host.mode === "draft"
          ? copy.sectionSaved
          : copy.saved
        : null;

  return (
    <Box component="section" id={sectionAnchor(id)} aria-labelledby={`${sectionAnchor(id)}-titulo`}>
      <FormProvider {...form}>
        <Stack component="form" noValidate spacing={2.5} onSubmit={submit}>
          <Typography
            ref={headingRef}
            id={`${sectionAnchor(id)}-titulo`}
            variant="h2"
            tabIndex={-1}
            sx={{ fontSize: { xs: 22, md: 26 }, "&:focus": { outline: "none" } }}
          >
            {title}
          </Typography>
          {serverErrors?.notice && <Notice tone="atencao" title={serverErrors.notice} />}
          {children(form)}
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
            <Button
              type="submit"
              variant="outlined"
              disabled={host.saving === id}
              aria-busy={host.saving === id || undefined}
            >
              {host.saving === id ? copy.saving : copy.save(title)}
            </Button>
            <Typography role="status" sx={{ fontWeight: 700 }}>
              {feedback}
            </Typography>
          </Stack>
        </Stack>
      </FormProvider>
    </Box>
  );
}
