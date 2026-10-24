"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import NextLink from "next/link";
import type { ReactNode } from "react";
import { translateError } from "@/shared/api/errors/translateError";
import { useFlashMessageOnce } from "@/shared/hooks/useFlashMessage";
import { Celebration } from "@/shared/ui/brand/Celebration";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { StatusTimeline } from "@/shared/ui/data-display/StatusTimeline";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { Notice } from "@/shared/ui/feedback/Notice";
import { StatusPill } from "@/shared/ui/feedback/StatusPill";
import { myApplicationQueries } from "../../../api/queries";
import { useCelebrateOnce } from "../../../hooks/useCelebrateOnce";
import { APPLICATION_DOCUMENTS_PATH, NEW_APPLICATION_PATH } from "../../../lib/applicationPaths";
import { applicationStatusLabel } from "../../../lib/applicationStatusLabel";
import { describeRejection } from "../../../lib/rejectionCopy";
import { verificationCopy } from "../../../lib/verificationCopy";
import type { HostApplication, MyApplication } from "../../../types";
import { CancelApplicationDialog } from "./CancelApplicationDialog";

const copy = verificationCopy.status;
const TIME_ZONE = "America/Sao_Paulo";
const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: TIME_ZONE });
const dayMonth = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: TIME_ZONE });

function LinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Box>
      <Button component={NextLink} href={href} variant="contained">
        {children}
      </Button>
    </Box>
  );
}

function Title({ children }: { children: ReactNode }) {
  return (
    <Typography variant="h2" sx={{ fontSize: { xs: 24, md: 28 } }}>
      {children}
    </Typography>
  );
}

function SupportOnly({ blocked }: { blocked: boolean }) {
  return (
    <Stack spacing={2}>
      <Title>{copy.support.title}</Title>
      <Typography>{blocked ? copy.support.blocked : copy.support.noAttempts}</Typography>
    </Stack>
  );
}

function Approved({ application }: { application: HostApplication }) {
  const celebrate = useCelebrateOnce(application.id);
  const title = <Title>{copy.approved.title}</Title>;
  return (
    <Stack spacing={2}>
      {celebrate ? (
        <Box data-testid="celebracao">
          <Celebration playKey={application.id}>{title}</Celebration>
        </Box>
      ) : (
        title
      )}
      <Typography>{copy.approved.body}</Typography>
    </Stack>
  );
}

function Closed({ application, mine }: { application: HostApplication; mine: MyApplication }) {
  const texts = application.status === "expired" ? copy.closed.expired : copy.closed.cancelled;
  return (
    <Stack spacing={2}>
      <Title>{texts.title}</Title>
      <Typography>{texts.body}</Typography>
      <Typography>{copy.closed.free}</Typography>
      {mine.canStartNew ? (
        <LinkButton href={NEW_APPLICATION_PATH}>{copy.closed.restart}</LinkButton>
      ) : (
        <SupportOnly blocked={mine.remainingAttempts > 0} />
      )}
    </Stack>
  );
}

function StatusBody({ accountId, mine }: { accountId: string; mine: MyApplication }) {
  const { application, canStartNew, remainingAttempts } = mine;
  // Sem poder começar e sem tentativas: tentativas esgotadas. Com tentativas: bloqueio por fraude.
  const support = <SupportOnly blocked={remainingAttempts > 0} />;

  if (!application)
    return canStartNew ? (
      <Stack spacing={2}>
        <Title>{copy.empty.title}</Title>
        <Typography>{copy.empty.body}</Typography>
        <LinkButton href={NEW_APPLICATION_PATH}>{copy.empty.start}</LinkButton>
      </Stack>
    ) : (
      support
    );

  switch (application.status) {
    case "draft": {
      const expires = application.draftExpiresAt ? new Date(application.draftExpiresAt) : null;
      return (
        <Stack spacing={2}>
          {expires && (
            <Notice tone="atencao" title={copy.draft.expires(weekday.format(expires), dayMonth.format(expires))} />
          )}
          <LinkButton href={APPLICATION_DOCUMENTS_PATH}>{copy.draft.continue}</LinkButton>
          <CancelApplicationDialog accountId={accountId} />
        </Stack>
      );
    }
    case "submitted":
      return (
        <Stack spacing={2}>
          <StatusTimeline
            label={copy.submitted.timeline}
            steps={copy.submitted.steps.map((label, index) => ({
              id: label,
              label,
              state: index === 0 ? "done" : index === 1 ? "current" : "todo",
            }))}
          />
          <Typography>{copy.submitted.wait}</Typography>
          <Typography color="text.secondary">{copy.submitted.meanwhile}</Typography>
          <CancelApplicationDialog accountId={accountId} />
        </Stack>
      );
    case "rejected":
      if (!canStartNew) return support;
      return (
        <Stack spacing={2}>
          <Title>{copy.rejected.title}</Title>
          <Typography>{describeRejection(application.rejectionReason)}</Typography>
          <Typography>{copy.rejected.todo}</Typography>
          <Typography sx={{ fontWeight: 700 }}>{copy.rejected.attempts(remainingAttempts)}</Typography>
          <LinkButton href={NEW_APPLICATION_PATH}>{copy.rejected.retry}</LinkButton>
        </Stack>
      );
    case "rejected_final":
      return <SupportOnly blocked />;
    case "approved":
      return <Approved application={application} />;
    case "expired":
    case "cancelled":
      return <Closed application={application} mine={mine} />;
  }
}

/**
 * "Minha verificação" (spec 030, REQ-HVER-002 e 011 a 017): uma vista por status. Sem solicitação, "Começar";
 * rascunho, o aviso da validade e o caminho de volta; em análise, a trilha e o "Desistir"; recusada, o motivo, o que
 * fazer e as tentativas, sem vermelho; definitiva ou sem tentativas, só o suporte; aprovada, a comemoração uma vez;
 * vencida ou desistida, "Começar de novo". Mostra uma vez o aviso deixado pelo envio.
 *
 * @example <ApplicationStatusView accountId={user.id} />
 */
export function ApplicationStatusView({ accountId }: { accountId: string }) {
  const query = useQuery(myApplicationQueries.mine(accountId));
  const flash = useFlashMessageOnce();

  if (query.isPending)
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
        <SniffLoader label={verificationCopy.loading} />
      </Box>
    );
  if (query.isError)
    return (
      <ErrorState
        title={verificationCopy.loadError}
        description={translateError(query.error)}
        onRetry={() => void query.refetch()}
      />
    );

  const { application } = query.data;
  return (
    <Stack spacing={3}>
      {flash && <Notice tone="ok" title={flash} />}
      {application && (
        <Box>
          <StatusPill label={applicationStatusLabel[application.status]} />
        </Box>
      )}
      <StatusBody accountId={accountId} mine={query.data} />
    </Stack>
  );
}
