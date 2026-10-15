"use client";

import { Box, Link } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { hasErrorCode, isApiError } from "@/shared/api/errors/ApiError";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { Notice } from "@/shared/ui/feedback/Notice";
import { toUpdatePetRequest } from "../../api/toUpdatePetRequest";
import { useUpdatePet } from "../../hooks/usePetMutations";
import { petEditCopy as copy } from "../../lib/petEditCopy";
import { petProfileSchema } from "../../schemas/petProfileSchema";
import type { PetWizardValues } from "../../stores/petWizardStore";
import type { PetDetail } from "../../types";
import { PetStepHostProvider, type PetStepHostValue } from "./steps/PetStepHost";

/** Quanto tempo o "Salvo." fica na tela. */
const SAVED_NOTICE_MS = 4000;

export interface EditSectionDefinition {
  /** Também o `id` da `section` (âncora do aviso de outra seção). */
  id: string;
  title: string;
  /** Campos que a seção edita: o erro da API num deles volta ao campo; nos outros, vira aviso com link. */
  fields: readonly string[];
  /** O passo da 021 que vira o formulário da seção. */
  step: ReactNode;
}

interface EditSectionProps {
  accountId: string;
  pet: PetDetail;
  section: EditSectionDefinition;
  /** Seção da qual vem cada campo, para o link do aviso de outra seção. */
  sectionOfField: (field: string) => EditSectionDefinition | undefined;
  onDirtyChange: (sectionId: string, dirty: boolean) => void;
}

type Status =
  | { kind: "saved" }
  | { kind: "nothingChanged" }
  | { kind: "error"; message: string }
  | { kind: "otherSections"; sections: EditSectionDefinition[] };

/**
 * Uma seção da edição da ficha (REQ-PEDIT-004, 005, 015): hospeda um passo da 021 com "Salvar {seção}".
 * Ao salvar, valida a ficha inteira resultante, manda só o que mudou (`toUpdatePetRequest`) e, sem mudança,
 * nem chama a API. Erro de campo da seção volta ao campo (o formulário remonta com o que foi digitado);
 * de outra seção, vira aviso com link para ela. As outras seções continuam editáveis enquanto esta salva.
 *
 * @example <EditSection accountId={user.id} pet={pet} section={health} sectionOfField={find} onDirtyChange={report} />
 */
export function EditSection({ accountId, pet, section, sectionOfField, onDirtyChange }: EditSectionProps) {
  const { mutateAsync: savePatch, isPending: saving } = useUpdatePet(accountId, pet.id);
  const [status, setStatus] = useState<Status | null>(null);
  // Remonta o formulário: depois de salvar (novos valores de origem) ou para aplicar erros de campo da API.
  const [version, setVersion] = useState(0);
  // O que a pessoa tentou salvar, para não perder o digitado quando a API recusa um campo.
  const [attempt, setAttempt] = useState<PetWizardValues | null>(null);
  const pendingErrors = useRef<Partial<Record<string, string>>>({});

  useEffect(() => {
    if (status?.kind !== "saved") return;
    const timer = setTimeout(() => setStatus(null), SAVED_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [status]);

  const dependsOnSpecies = section.fields.includes("size");
  const reportDirty = useCallback((dirty: boolean) => onDirtyChange(section.id, dirty), [onDirtyChange, section.id]);

  const showFieldErrors = useCallback(
    (errors: Record<string, string>, tried: PetWizardValues) => {
      const mine = Object.entries(errors).filter(([field]) => section.fields.includes(field));
      const others = Object.keys(errors)
        .filter((field) => !section.fields.includes(field))
        .map(sectionOfField)
        .filter((other, index, list): other is EditSectionDefinition => !!other && list.indexOf(other) === index);
      pendingErrors.current = Object.fromEntries(mine);
      if (mine.length) {
        setAttempt(tried);
        setVersion((current) => current + 1);
      }
      if (others.length) return setStatus({ kind: "otherSections", sections: others });
      // Campo que nenhuma seção edita (ou erro sem campo conhecido): a frase da API vai para o aviso da seção.
      setStatus(mine.length ? null : { kind: "error", message: Object.values(errors).join(" ") });
    },
    [section.fields, sectionOfField],
  );

  const accept = useCallback(
    async (stepValues: PetWizardValues) => {
      setStatus(null);
      const tried = { ...pet.values, ...stepValues };
      const parsed = petProfileSchema.safeParse(tried);
      if (!parsed.success)
        return showFieldErrors(
          Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])),
          tried,
        );
      const body = toUpdatePetRequest(pet.values, parsed.data);
      if (Object.keys(body).length === 0) {
        setAttempt(null);
        setVersion((current) => current + 1);
        return setStatus({ kind: "nothingChanged" });
      }
      try {
        await savePatch(body);
        setAttempt(null);
        setVersion((current) => current + 1);
        setStatus({ kind: "saved" });
      } catch (error) {
        if (isApiError(error) && Object.keys(error.fieldErrors).length > 0)
          return showFieldErrors(
            Object.fromEntries(
              Object.entries(error.fieldErrors).map(([field, messages]) => [field, messages.join(" ")]),
            ),
            tried,
          );
        if (hasErrorCode(error, "PET_MICROCHIP_ALREADY_REGISTERED"))
          return showFieldErrors({ microchip: getErrorMessage(error) }, tried);
        setStatus({ kind: "error", message: getErrorMessage(error) });
      }
    },
    [pet.values, savePatch, showFieldErrors],
  );

  const host = useMemo<PetStepHostValue>(
    () => ({
      mode: "section",
      values: attempt ?? pet.values,
      accept: (values) => void accept(values),
      takeServerErrors: (fields) => {
        const taken = Object.fromEntries(
          fields.flatMap((field) => {
            const message = pendingErrors.current[field];
            return message ? [[field, message]] : [];
          }),
        );
        pendingErrors.current = {};
        return taken;
      },
      section: {
        title: section.title,
        anchorId: section.id,
        focusSaveOnMount: version > 0,
        busy: saving,
        status: status && <SectionStatus status={status} />,
        onDirtyChange: reportDirty,
      },
    }),
    [attempt, pet.values, accept, section.title, section.id, version, saving, status, reportDirty],
  );

  return (
    <PetStepHostProvider value={host}>
      {/* A espécie e o porte salvos mudam as regras de Bicho e Corpo: só essas remontam com eles. */}
      <Box key={dependsOnSpecies ? `${version}:${pet.values.species}:${pet.values.size ?? ""}` : version}>
        {section.step}
      </Box>
    </PetStepHostProvider>
  );
}

function SectionStatus({ status }: { status: Status }) {
  if (status.kind === "saved") return <Notice tone="ok" title={copy.saved} />;
  if (status.kind === "nothingChanged") return <Notice tone="info" title={copy.nothingChanged} />;
  if (status.kind === "error") return <Notice tone="erro" title={status.message} />;
  return (
    <Notice tone="atencao" title={copy.otherSection}>
      {status.sections.map((other, index) => (
        <span key={other.id}>
          {index > 0 && " · "}
          <Link href={`#${other.id}`}>{other.title}</Link>
        </span>
      ))}
    </Notice>
  );
}
