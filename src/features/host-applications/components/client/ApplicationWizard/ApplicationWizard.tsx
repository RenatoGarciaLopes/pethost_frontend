"use client";

import { Box } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { useUnsavedChangesGuard } from "@/shared/hooks/useUnsavedChangesGuard";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { StepWizard } from "@/shared/ui/navigation/StepWizard";
import { myApplicationQueries } from "../../../api/queries";
import { APPLICATION_PATH } from "../../../lib/applicationPaths";
import { verificationCopy } from "../../../lib/verificationCopy";
import type { MyApplication, PersonType, WizardEntry } from "../../../types";
import { DataStep } from "./DataStep";
import { DocumentsStep, type PhotoState } from "./DocumentsStep";
import { NoticeStep } from "./NoticeStep";
import { ReviewStep } from "./ReviewStep";

const copy = verificationCopy;
const STEPS = ["notice", "data", "photos", "review"] as const;
const PROGRESS = STEPS.map((id, index) => ({
  id,
  label: copy.wizard.stepLabels[index]!,
  description: copy.wizard.stepDescriptions[index]!,
}));
const TITLES = [copy.notice.heading, copy.data.heading, copy.photos.heading, copy.review.heading] as const;
/** Frase de apoio sob o título; "Antes de começar" e "Seus dados" explicam no próprio conteúdo. */
const INTROS = [undefined, undefined, copy.photos.intro, copy.review.intro] as const;
type StepIndex = 0 | 1 | 2 | 3;

export interface ApplicationWizardProps {
  accountId: string;
  entry: WizardEntry;
}

/**
 * O assistente da verificação (spec 030, REQ-HVER-002 a 010): Antes de começar → Seus dados → Fotos → Confere. O
 * passo vem do estado do servidor, nunca de storage: quem para no meio volta outro dia (ou em outro aparelho) direto
 * no passo que falta. As fotos ficam só em memória; sair com foto escolhida e não enviada pergunta antes.
 *
 * @example <ApplicationWizard accountId={user.id} entry="start" />
 */
export function ApplicationWizard({ accountId, entry }: ApplicationWizardProps) {
  const query = useQuery(myApplicationQueries.mine(accountId));
  if (query.isPending)
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
        <SniffLoader label={copy.loading} />
      </Box>
    );
  if (query.isError)
    return (
      <ErrorState
        title={copy.loadError}
        description={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  return <WizardFlow accountId={accountId} entry={entry} mine={query.data} />;
}

function firstStep(entry: WizardEntry, mine: MyApplication): StepIndex {
  const draft = mine.application?.status === "draft" ? mine.application : null;
  if (entry === "start" || !draft) return 0;
  return draft.missingDocuments.length > 0 ? 2 : 3;
}

function WizardFlow({ accountId, entry, mine }: ApplicationWizardProps & { mine: MyApplication }) {
  const draft = mine.application?.status === "draft" ? mine.application : null;
  const [step, setStep] = useState<StepIndex>(() => firstStep(entry, mine));
  const [personType, setPersonType] = useState<PersonType>(draft?.personType ?? "pf");
  const [photos, setPhotos] = useState<PhotoState>({});
  const { dialog } = useUnsavedChangesGuard(Object.values(photos).some((photo) => photo && !photo.sent));
  const router = useRouter();
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  // Troca de passo: o foco vai para o título novo (o leitor de tela anuncia onde está). Não na abertura.
  useEffect(() => {
    if (moved.current) heading.current?.focus();
  }, [step]);

  function go(next: StepIndex) {
    moved.current = true;
    setStep(next);
  }

  function renderStep() {
    if (step === 0)
      return (
        <NoticeStep
          noticeVersion={mine.noticeVersion}
          personType={personType}
          accepted={draft !== null}
          locked={draft !== null}
          onBack={() => router.push(APPLICATION_PATH)}
          onNext={(values) => {
            setPersonType(values.personType);
            go(1);
          }}
        />
      );
    if (step === 1)
      return (
        <DataStep
          accountId={accountId}
          personType={personType}
          draft={draft?.draft ?? null}
          onBack={() => go(0)}
          onNext={() => go(2)}
        />
      );
    // Fotos e conferência só existem com o rascunho aberto.
    if (!draft) return null;
    if (step === 2)
      return (
        <DocumentsStep
          accountId={accountId}
          application={draft}
          photos={photos}
          onPhotosChange={setPhotos}
          onBack={() => go(1)}
          onNext={() => go(3)}
        />
      );
    return <ReviewStep accountId={accountId} application={draft} photos={photos} onBack={() => go(2)} />;
  }

  return (
    <>
      <StepWizard
        steps={PROGRESS}
        currentIndex={step}
        progressTitle={copy.wizard.progressTitle}
        progressLabel={copy.wizard.progressLabel}
        position={copy.wizard.position(step + 1, PROGRESS.length)}
        title={TITLES[step]}
        titleRef={heading}
        intro={INTROS[step]}
      >
        {renderStep()}
      </StepWizard>
      {dialog}
    </>
  );
}
