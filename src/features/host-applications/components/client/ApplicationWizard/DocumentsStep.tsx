"use client";

import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { useState, type Dispatch, type SetStateAction } from "react";
import { isApiError } from "@/shared/api/errors/ApiError";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { ImagePreparationError, prepareImageForUpload } from "@/shared/lib/image/prepareImageForUpload";
import { Hint } from "@/shared/ui/feedback/Hint";
import { Notice } from "@/shared/ui/feedback/Notice";
import { DocumentSlot } from "@/shared/ui/media/DocumentSlot";
import { StepWizardActions } from "@/shared/ui/navigation/StepWizard";
import { DOCUMENT_KINDS } from "../../../api/contracts";
import type { DocumentFiles } from "../../../api/client/myApplication.client";
import { useUploadDocuments } from "../../../hooks/useApplicationMutations";
import { documentKindLabel, verificationCopy } from "../../../lib/verificationCopy";
import type { DocumentKind, HostApplication } from "../../../types";
import { documentDrawings } from "../../DocumentDrawings";

const copy = verificationCopy.photos;
const list = new Intl.ListFormat("pt-BR", { type: "conjunction" });

/** Fotos escolhidas nesta visita, já preparadas, só em memória; `sent` = a API já recebeu. */
export type PhotoState = Partial<Record<DocumentKind, { file: File; sent: boolean }>>;
type SlotErrors = Partial<Record<DocumentKind, string>>;

export interface DocumentsStepProps {
  accountId: string;
  /** O rascunho: diz quais fotos a API já tem. */
  application: HostApplication;
  photos: PhotoState;
  onPhotosChange: Dispatch<SetStateAction<PhotoState>>;
  onBack: () => void;
  onNext: () => void;
}

const isDocumentKind = (field: string): field is DocumentKind => (DOCUMENT_KINDS as readonly string[]).includes(field);

/** Erro do envio → erro de cada vaga (`field` da API) e/ou aviso do passo. */
function readUploadError(error: unknown): { slots: SlotErrors; notice: string | null } {
  if (!isApiError(error)) return { slots: {}, notice: getErrorMessage(error) };
  if (error.status === 413) return { slots: {}, notice: copy.errors.tooLarge };
  const fields = Object.keys(error.fieldErrors);
  const slots = Object.fromEntries(fields.filter(isDocumentKind).map((kind) => [kind, copy.errors.rejected]));
  const unplaced = error.code !== "VALIDATION_ERROR" || fields.some((field) => !isDocumentKind(field));
  return { slots, notice: unplaced ? getErrorMessage(error) : null };
}

/**
 * Conteúdo de "Fotos" (REQ-HVER-006 a 009; título e frase de apoio são da casca): três vagas (frente, verso, selfie) com o desenho do que se espera e as dicas.
 * Cada foto é preparada no navegador antes de qualquer envio (tipo, tamanho até 5 MB, sem metadados); falha fica na
 * vaga. "Continuar" manda só as fotos novas num pedido só; recusa da API aparece na vaga certa e nenhuma conta como
 * enviada. Fotos só em memória, nas mãos do assistente.
 *
 * @example <DocumentsStep accountId={user.id} application={draft} photos={photos} onPhotosChange={setPhotos} onBack={back} onNext={next} />
 */
export function DocumentsStep({ accountId, application, photos, onPhotosChange, onBack, onNext }: DocumentsStepProps) {
  const upload = useUploadDocuments(accountId);
  const [preparing, setPreparing] = useState<Partial<Record<DocumentKind, boolean>>>({});
  const [slotErrors, setSlotErrors] = useState<SlotErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const missing = DOCUMENT_KINDS.filter((kind) => !photos[kind] && !application.uploadedKinds.includes(kind));

  async function pick(kind: DocumentKind, file: File) {
    setPreparing((current) => ({ ...current, [kind]: true }));
    setSlotErrors((current) => ({ ...current, [kind]: undefined }));
    try {
      const prepared = await prepareImageForUpload(file);
      onPhotosChange((current) => ({ ...current, [kind]: { file: prepared, sent: false } }));
    } catch (error) {
      const message = error instanceof ImagePreparationError ? copy.errors[error.code] : copy.errors.IMAGE_UNREADABLE;
      setSlotErrors((current) => ({ ...current, [kind]: message }));
    } finally {
      setPreparing((current) => ({ ...current, [kind]: false }));
    }
  }

  async function handleNext() {
    const pending = DOCUMENT_KINDS.filter((kind) => photos[kind] && !photos[kind].sent);
    if (pending.length === 0) return onNext();
    setNotice(null);
    const files: DocumentFiles = Object.fromEntries(pending.map((kind) => [kind, photos[kind]!.file]));
    try {
      await upload.mutateAsync(files);
    } catch (error) {
      const { slots, notice: message } = readUploadError(error);
      setSlotErrors(slots);
      return setNotice(message);
    }
    onPhotosChange((current) =>
      Object.fromEntries(Object.entries(current).map(([kind, photo]) => [kind, { ...photo, sent: true }])),
    );
    onNext();
  }

  const busy = upload.isPending;

  return (
    <Stack spacing={3}>
      <Hint title={copy.tipsTitle}>{copy.tips}</Hint>
      <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" } }}>
        {DOCUMENT_KINDS.map((kind) => (
          <DocumentSlot
            key={kind}
            label={documentKindLabel[kind]}
            hint={copy.hints[kind]}
            illustration={documentDrawings[kind]}
            camera={kind === "selfie" ? "user" : "environment"}
            file={photos[kind]?.file ?? null}
            uploaded={application.uploadedKinds.includes(kind)}
            error={slotErrors[kind]}
            busy={preparing[kind]}
            disabled={busy}
            onPick={(file) => void pick(kind, file)}
          />
        ))}
      </Box>
      {busy && (
        <Stack spacing={1} role="status">
          <Typography>{copy.sending}</Typography>
          <LinearProgress aria-label={copy.sending} />
        </Stack>
      )}
      {notice && <Notice tone="erro" title={notice} />}
      <StepWizardActions
        backLabel={copy.back}
        nextLabel={copy.next}
        onBack={onBack}
        onNext={() => void handleNext()}
        busy={busy}
        disabledReason={
          missing.length > 0 ? copy.missing(list.format(missing.map((kind) => copy.missingShort[kind]))) : undefined
        }
      />
    </Stack>
  );
}
