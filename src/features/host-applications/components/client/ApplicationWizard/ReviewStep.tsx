"use client";

import { quintalRadii } from "@/shared/theme/tokens/radii";
import { Box, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { translateError } from "@/shared/api/errors/translateError";
import { useFlashMessage } from "@/shared/hooks/useFlashMessage";
import { useObjectUrl } from "@/shared/hooks/useObjectUrl";
import { ErrorNotice } from "@/shared/ui/feedback/ErrorNotice";
import { FormActions } from "@/shared/ui/forms/FormActions";
import { StepHeading } from "@/shared/ui/navigation/StepHeading";
import { DOCUMENT_KINDS } from "../../../api/contracts";
import { useSubmitApplication } from "../../../hooks/useApplicationMutations";
import { APPLICATION_PATH } from "../../../lib/applicationPaths";
import { documentKindLabel, verificationCopy } from "../../../lib/verificationCopy";
import type { DocumentKind, HostApplication } from "../../../types";
import type { PhotoState } from "./DocumentsStep";

const copy = verificationCopy.review;

export interface ReviewStepProps {
  accountId: string;
  application: HostApplication;
  /** Fotos desta visita (miniaturas da memória); as enviadas em outro dia aparecem como "enviada ✓". */
  photos: PhotoState;
  onBack: () => void;
}

function Thumbnail({ file, label }: { file: File; label: string }) {
  const url = useObjectUrl(file);
  return (
    <Box
      component="img"
      src={url ?? undefined}
      alt={label}
      sx={{
        width: "100%",
        aspectRatio: "3 / 2",
        objectFit: "cover",
        borderRadius: `${quintalRadii.control}px`,
        border: "2px solid",
      }}
    />
  );
}

function PhotoSummary({
  kind,
  application,
  photos,
}: { kind: DocumentKind } & Pick<ReviewStepProps, "application" | "photos">) {
  const label = documentKindLabel[kind];
  const photo = photos[kind];
  if (photo) return <Thumbnail file={photo.file} label={label} />;
  if (!application.uploadedKinds.includes(kind)) return null;
  return <Typography sx={{ fontWeight: 700 }}>{copy.sentPhoto(label)}</Typography>;
}

/**
 * "Confere e envia" (REQ-HVER-010): as três fotos (miniatura da memória ou "enviada ✓"), o CPF mascarado, o
 * documento e, na empresa, o nome fantasia. "Enviar pra análise" só habilita sem foto faltando; depois de enviar,
 * volta ao status com o aviso "Pronto, enviada!".
 *
 * @example <ReviewStep accountId={user.id} application={draft} photos={photos} onBack={back} />
 */
export function ReviewStep({ accountId, application, photos, onBack }: ReviewStepProps) {
  const submit = useSubmitApplication(accountId);
  const flash = useFlashMessage();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const tradeName = application.draft?.company?.tradeName;

  async function handleSubmit() {
    setError(null);
    try {
      await submit.mutateAsync();
    } catch (caught) {
      return setError(translateError(caught));
    }
    flash.show(copy.sent);
    router.push(APPLICATION_PATH);
  }

  return (
    <Stack spacing={3}>
      <StepHeading>{copy.heading}</StepHeading>
      <Typography>{copy.intro}</Typography>
      <ErrorNotice message={error} tone="erro" />
      <Box component="section" aria-label={copy.photos}>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" } }}>
          {DOCUMENT_KINDS.map((kind) => (
            <PhotoSummary key={kind} kind={kind} application={application} photos={photos} />
          ))}
        </Box>
      </Box>
      <Box
        component="dl"
        sx={{
          m: 0,
          display: "grid",
          gridTemplateColumns: "max-content 1fr",
          columnGap: 3,
          rowGap: 1,
          "& dd": { m: 0 },
        }}
      >
        <dt>{copy.cpf}</dt>
        <dd>{application.cpfMasked}</dd>
        <dt>{copy.documentType}</dt>
        <dd>{verificationCopy.data.documentTypes[application.documentType].label}</dd>
        {tradeName && (
          <>
            <dt>{copy.company}</dt>
            <dd>{tradeName}</dd>
          </>
        )}
      </Box>
      <FormActions
        backLabel={copy.back}
        nextLabel={submit.isPending ? copy.submitting : copy.submit}
        onBack={onBack}
        onNext={() => void handleSubmit()}
        busy={submit.isPending}
        disabledReason={application.missingDocuments.length > 0 ? copy.missing : undefined}
      />
    </Stack>
  );
}
