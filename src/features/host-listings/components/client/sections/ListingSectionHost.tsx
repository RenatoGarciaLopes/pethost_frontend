"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { FormProvider, useForm, type FieldPath } from "react-hook-form";
import type { ZodTypeAny } from "zod";
import { Notice } from "@/shared/ui/feedback/Notice";
import { listingCopy as copy } from "../../../lib/listingCopy";
import { toFieldErrors } from "../../../schemas/listingResolver";
import type { ListingFormValues, ListingSchemas, ListingSectionId } from "../../../schemas/listingSchema";
import type { HostKind } from "../../../types";

/** Como terminou o "Salvar" de uma seção. */
export type SectionSaveOutcome = "saved" | "unchanged" | "failed";

/** O que a edição do cantinho aberto oferece às seções. */
export interface ListingSectionHostValue {
  kind: HostKind;
  firstName: string;
  values: ListingFormValues;
  schemas: ListingSchemas;
  /** Guarda a seção com `PATCH` do que mudou (os valores vêm completos; só os campos da seção contam). */
  save: (section: ListingSectionId, submitted: ListingFormValues) => Promise<SectionSaveOutcome>;
  /** Seção salvando agora (as outras ficam liberadas). */
  saving: ListingSectionId | null;
  /** Erros da API por seção e campo, já em português; aviso da seção quando o campo não é dela. */
  serverErrors: Partial<Record<ListingSectionId, { fields: Record<string, string>; notice?: string }>>;
  /** Avisa se a seção tem alteração não salva (pergunta "Sair sem salvar?"). */
  reportDirty?: (section: ListingSectionId, dirty: boolean) => void;
}

const HostContext = createContext<ListingSectionHostValue | null>(null);

/**
 * Liga as seções do cantinho à edição do cantinho aberto (REQ-LIST-013). O cadastro novo é o assistente em passos
 * (104), com um formulário só; as seções ficam para a edição, em qualquer ordem.
 *
 * @example <ListingSectionHost value={host}><ListingSection id="rules">…</ListingSection></ListingSectionHost>
 */
export function ListingSectionHost({ value, children }: { value: ListingSectionHostValue; children: ReactNode }) {
  return <HostContext value={value}>{children}</HostContext>;
}

function useListingSectionHost(): ListingSectionHostValue {
  const host = use(HostContext);
  if (!host) throw new Error("A seção do cantinho precisa do ListingSectionHost");
  return host;
}

/** Âncora de cada seção na página do cantinho. */
const sectionAnchor = (section: ListingSectionId) => `secao-${section}`;

interface ListingSectionProps {
  id: ListingSectionId;
  /** Campos da seção (`fields/`), dentro do formulário (RHF) da seção. */
  children: ReactNode;
}

/**
 * Uma seção do cantinho aberto: `section` com `h2`, um formulário próprio validado pelo schema da seção, "Salvar
 * {seção}" e o retorno ("Salvo." ou "Nada mudou por aqui."). Erro da API chega aos campos da seção (REQ-LIST-013).
 *
 * @example <ListingSection id="rules"><RulesField /></ListingSection>
 */
export function ListingSection({ id, children }: ListingSectionProps) {
  const host = useListingSectionHost();
  const title = copy.sections[id];
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

  const submit = form.handleSubmit(async (values) => {
    setOutcome(null);
    setOutcome(await host.save(id, values));
  });

  const feedback = outcome === "unchanged" ? copy.unchanged : outcome === "saved" ? copy.saved : null;

  return (
    <Box component="section" id={sectionAnchor(id)} aria-labelledby={`${sectionAnchor(id)}-titulo`}>
      <FormProvider {...form}>
        <Stack component="form" noValidate spacing={2.5} onSubmit={submit}>
          <Typography id={`${sectionAnchor(id)}-titulo`} variant="h2" sx={{ fontSize: { xs: 22, md: 26 } }}>
            {title}
          </Typography>
          {serverErrors?.notice && <Notice tone="atencao" title={serverErrors.notice} />}
          {children}
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
