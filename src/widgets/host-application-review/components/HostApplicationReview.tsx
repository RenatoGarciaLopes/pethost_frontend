"use client";
import Link from "next/link";
import { Box, Stack, Typography, useMediaQuery } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import {
  adminApplicationQueries,
  adminReviewCopy as copy,
  getDocumentLink,
  type AdminApplication,
} from "@/features/admin-host-applications";
import { useDecision } from "@/features/admin-host-applications/index.client";
import { hasErrorCode, isApiError } from "@/shared/api/errors/ApiError";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { Notice } from "@/shared/ui/feedback/Notice";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { StatusPill } from "@/shared/ui/feedback/StatusPill";
import { ApplicantComparison } from "./ApplicantComparison";
import { SignedDocumentViewer } from "./SignedDocumentViewer";
import { DecisionPanel } from "./DecisionPanel";

/** Detalhe administrativo: comparação, fotos sob ação, decisão ou resumo; não recebe links assinados do servidor.
 * @example <HostApplicationReview accountId={user.id} applicationId={id} />
 */
export function HostApplicationReview({ accountId, applicationId }: { accountId: string; applicationId: string }) {
  const detail = useQuery(adminApplicationQueries.detail(accountId, applicationId));
  const decision = useDecision(accountId, applicationId);
  const next = useQuery({ ...adminApplicationQueries.queue(accountId, "submitted"), enabled: decision.isSuccess });
  const wide = useMediaQuery("(min-width:900px)");
  if (detail.isPending) return <SniffLoader />;
  if (detail.isError) return <ErrorState title={getErrorMessage(detail.error)} onRetry={() => void detail.refetch()} />;
  const app = detail.data;
  const conflict =
    hasErrorCode(decision.error, "HOST_APPLICATION_CONFLICT") ||
    hasErrorCode(decision.error, "HOST_APPLICATION_NOT_UNDER_REVIEW");
  const following = next.data
    ?.filter((item) => item.id !== app.id)
    .sort((a, b) => (a.submittedAt ?? a.createdAt).localeCompare(b.submittedAt ?? b.createdAt))[0];
  return (
    <Stack spacing={3} sx={{ py: 3 }}>
      <Link href="/admin/host-applications">{copy.back}</Link>
      <Typography component="h1" variant="h4">
        {copy.reviewTitle}: {app.user?.fullName ?? copy.unavailable}
      </Typography>
      <StatusPill label={copy.status[app.status]} />
      {decision.isSuccess && (
        <Notice
          tone="ok"
          title={copy.success}
          action={
            following ? (
              <Link href={`/admin/host-applications/${following.id}`}>{copy.next}</Link>
            ) : next.isError ? (
              <ErrorState onRetry={() => void next.refetch()} />
            ) : (
              <Typography>{next.isPending ? copy.loading : copy.noNext}</Typography>
            )
          }
        />
      )}
      {conflict ? (
        <Notice tone="info" title={copy.conflict} />
      ) : (
        decision.isError && <Notice tone="erro" title={getErrorMessage(decision.error, { adminReview: true })} />
      )}
      <ApplicantComparison key={app.id} application={app} />
      <Box component="section">
        <Typography component="h2" variant="h5">
          {copy.photos}
        </Typography>
        {app.documentsPurgedAt ? (
          <Typography>
            {copy.purged} {new Date(app.documentsPurgedAt).toLocaleString("pt-BR")}
          </Typography>
        ) : (
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            {(["front", "back", "selfie"] as const).map((kind) =>
              app.documents.some((doc) => doc.kind === kind) ? (
                <SignedDocumentViewer
                  key={`${app.id}-${kind}`}
                  label={copy.photo[kind]}
                  load={(signal) => getDocumentLink(app.id, kind, undefined, signal)}
                />
              ) : (
                <Typography key={kind}>
                  {copy.photo[kind]}: {copy.missing}
                </Typography>
              ),
            )}
          </Stack>
        )}
      </Box>
      {app.status === "submitted" ? (
        wide ? (
          <DecisionPanel
            key={app.id}
            personType={app.personType}
            busy={decision.isPending}
            onDecide={decision.mutate}
            fieldErrors={isApiError(decision.error) ? decision.error.fieldErrors : undefined}
          />
        ) : (
          <Notice tone="info">{copy.mobile}</Notice>
        )
      ) : (
        <DecisionSummary application={app} />
      )}
    </Stack>
  );
}

/** Resumo somente leitura para solicitação fora de análise. @example <DecisionSummary application={application} /> */
function DecisionSummary({ application: app }: { application: AdminApplication }) {
  return (
    <Box component="section" aria-label={copy.decision}>
      <Typography component="h2" variant="h5">
        {copy.decision}
      </Typography>
      <Typography>{copy.status[app.status]}</Typography>
      {app.rejectionReason && <Typography>{copy.rejection[app.rejectionReason]}</Typography>}
      <Typography>
        {copy.reason}: {app.reviewNotes ?? copy.unavailable}
      </Typography>
      <Typography>
        {copy.reviewedBy}: {app.reviewedBy ?? copy.unavailable}
      </Typography>
      <Typography>
        {copy.reviewedAt}: {app.reviewedAt ? new Date(app.reviewedAt).toLocaleString("pt-BR") : copy.unavailable}
      </Typography>
    </Box>
  );
}
